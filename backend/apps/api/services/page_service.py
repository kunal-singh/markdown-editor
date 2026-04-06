"""Page CRUD business logic."""

from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.schemas import PageCreate, PageRead, PageSearchResult, PageTreeNode, PageUpdate
from core.security import sanitize_content
from persistence.repository import PageRepository


class PageService:
    def __init__(self, page_repo: PageRepository) -> None:
        self._page_repo = page_repo

    async def create(
        self,
        session: AsyncSession,
        payload: PageCreate,
        user_id: uuid.UUID | None = None,
    ) -> PageRead:
        existing = await self._page_repo.get_by_slug(session, payload.slug)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Page with slug '{payload.slug}' already exists",
            )
        if payload.parent_id is not None:
            parent = await self._page_repo.get_by_id(session, payload.parent_id)
            if parent is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent page not found",
                )
        payload.created_by_id = user_id
        if payload.content_text is not None:
            payload.content_text = sanitize_content(payload.content_text)
        return await self._page_repo.create(session, payload)

    async def get_by_slug(self, session: AsyncSession, slug: str) -> PageRead:
        page = await self._page_repo.get_by_slug(session, slug)
        if page is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
        return page

    async def get_by_id(self, session: AsyncSession, page_id: uuid.UUID) -> PageRead:
        page = await self._page_repo.get_by_id(session, page_id)
        if page is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
        return page

    async def get_children(self, session: AsyncSession, parent_id: uuid.UUID) -> list[PageRead]:
        return await self._page_repo.get_children(session, parent_id)

    async def update(
        self,
        session: AsyncSession,
        page_id: uuid.UUID,
        payload: PageUpdate,
        user_id: uuid.UUID | None = None,
    ) -> PageRead:
        if payload.parent_id is not None:
            if payload.parent_id == page_id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="A page cannot be its own parent",
                )
            if await self._page_repo.would_create_cycle(session, page_id, payload.parent_id):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Setting this parent would create a cycle in the page hierarchy",
                )
        if payload.content_text is not None:
            payload.content_text = sanitize_content(payload.content_text)
        page = await self._page_repo.update(session, page_id, payload, edited_by_id=user_id)
        if page is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
        return page

    async def delete(self, session: AsyncSession, page_id: uuid.UUID) -> None:
        found = await self._page_repo.delete(session, page_id)
        if not found:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    async def get_tree(self, session: AsyncSession) -> list[PageTreeNode]:
        return await self._page_repo.get_all_shallow(session)

    async def search(self, session: AsyncSession, query: str) -> list[PageSearchResult]:
        if not query.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Search query must not be empty",
            )
        return await self._page_repo.search(session, query)
