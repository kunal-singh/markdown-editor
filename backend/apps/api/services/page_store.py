"""Concrete DocumentStore implementation backed by the persistence layer."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from collaboration import DocumentStore
from core.schemas import PageUpdate
from core.security import sanitize_content
from persistence.database import get_session
from persistence.repository import PageRepository


class PageDocumentStore:
    """Satisfies the collaboration.DocumentStore protocol using PageRepository."""

    # Verify protocol compliance at import time (runtime_checkable).
    def __init__(self) -> None:
        assert isinstance(self, DocumentStore)

    async def load_document(self, room_id: str) -> bytes | None:
        page_id = uuid.UUID(room_id)
        session: AsyncSession
        async for session in get_session():
            return await PageRepository.get_binary(session, page_id)
        return None

    async def save_document(self, room_id: str, binary: bytes, plain_text: str) -> None:
        page_id = uuid.UUID(room_id)
        session: AsyncSession
        async for session in get_session():
            await PageRepository.update_binary(session, page_id, binary)
            await PageRepository.update(
                session, page_id, PageUpdate(content_text=sanitize_content(plain_text))
            )
