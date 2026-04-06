"""WebSocket sync entry point — framework-agnostic."""

from __future__ import annotations

from ypy_websocket.websocket import Websocket
from ypy_websocket.yroom import YRoom


async def handle_connection(ws: Websocket, room: YRoom) -> None:
    """Serve *ws* through *room* until the connection closes.

    *ws* must satisfy the ypy-websocket ``Websocket`` protocol:
    a ``path`` property, ``send(bytes)``, ``recv() -> bytes``, and
    async-iteration (``__aiter__`` / ``__anext__``).

    The room must already be started (``CollaborationManager.get_or_create_room``
    does this automatically).
    """
    await room.serve(ws)
