"""CRDT merging logic using pycrdt."""

from __future__ import annotations

import asyncio
import logging
from functools import partial
from typing import Any

import y_py as Y
from ypy_websocket.yroom import YRoom

from .protocols import DocumentStore

_log = logging.getLogger(__name__)

# The key under which the editor stores the main text in the Yjs document.
# Update this to match the frontend editor's shared type key once confirmed.
_TEXT_KEY = "content"

_DEFAULT_DEBOUNCE_SECONDS: float = 5.0


class CollaborationManager:
    """Manages active YDoc rooms and orchestrates persistence."""

    def __init__(
        self,
        store: DocumentStore,
        debounce_seconds: float = _DEFAULT_DEBOUNCE_SECONDS,
    ) -> None:
        self._store = store
        self._debounce_seconds = debounce_seconds
        self._rooms: dict[str, YRoom] = {}
        self._room_tasks: dict[str, asyncio.Task[None]] = {}
        self._lock = asyncio.Lock()
        self._pending_tasks: dict[str, asyncio.Task[None]] = {}

    async def get_or_create_room(self, room_id: str) -> YRoom:
        """Return the cached room for *room_id*, creating and starting it if needed."""
        async with self._lock:
            if room_id in self._rooms:
                return self._rooms[room_id]
            room = self._build_room(room_id)
            binary = await self._store.load_document(room_id)
            if binary is not None:
                Y.apply_update(room.ydoc, binary)
            self._rooms[room_id] = room
            # start() blocks for the room's lifetime — run as a background task.
            self._room_tasks[room_id] = asyncio.get_running_loop().create_task(room.start())
            await room.started.wait()
            return room

    def get_plain_text(self, room_id: str) -> str:
        """Extract plain text from the room's Yjs document."""
        room = self._rooms.get(room_id)
        if room is None:
            return ""
        ytext: Y.YText = room.ydoc.get_text(_TEXT_KEY)
        return str(ytext)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_room(self, room_id: str) -> YRoom:
        room: YRoom = YRoom(ready=True)
        room.ydoc.observe_after_transaction(partial(self._on_update, room_id))
        return room

    def _on_update(self, room_id: str, _event: Any) -> None:
        # Called synchronously inside y_py's transaction commit — must not be async.
        self._schedule_save(room_id)

    def _schedule_save(self, room_id: str) -> None:
        """Cancel any in-flight debounce task and start a fresh one."""
        old = self._pending_tasks.pop(room_id, None)
        if old is not None:
            old.cancel()
        task = asyncio.get_running_loop().create_task(self._debounced_save(room_id))
        self._pending_tasks[room_id] = task

    async def _debounced_save(self, room_id: str) -> None:
        try:
            await asyncio.sleep(self._debounce_seconds)
            await self._flush_save(room_id)
        except asyncio.CancelledError:
            pass  # Superseded by a newer edit — intentional, do not re-raise.
        finally:
            self._pending_tasks.pop(room_id, None)

    async def _flush_save(self, room_id: str) -> None:
        room = self._rooms.get(room_id)
        if room is None:
            return
        binary: bytes = Y.encode_state_as_update(room.ydoc)
        plain_text = self.get_plain_text(room_id)
        await self._store.save_document(room_id, binary, plain_text)
        _log.debug("Saved room %s (%d bytes)", room_id, len(binary))
