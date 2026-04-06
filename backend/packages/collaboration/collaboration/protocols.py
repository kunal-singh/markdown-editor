"""Persistence adapter protocol for the collaboration engine."""

from __future__ import annotations

from typing import Protocol, runtime_checkable


@runtime_checkable
class DocumentStore(Protocol):
    async def load_document(self, room_id: str) -> bytes | None:
        """Return the stored Yjs binary state, or None if the document is new."""
        ...

    async def save_document(self, room_id: str, binary: bytes, plain_text: str) -> None:
        """Persist the full Yjs binary state and the extracted plain text."""
        ...
