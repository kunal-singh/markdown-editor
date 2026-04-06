"""Page CRUD business logic."""

from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.schemas import PageCreate, PageRead, PageSearchResult, PageTreeNode, PageUpdate
from persistence.repository import PageRepository


class PageService:
    def __init__(self, page_repo: PageRepository) -> None:
        self._page_repo = page_repo

    async def create(self, session: AsyncSession, payload: PageCreate) -> PageRead:
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
        self, session: AsyncSession, page_id: uuid.UUID, payload: PageUpdate
    ) -> PageRead:
        page = await self._page_repo.update(session, page_id, payload)
        if page is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
        return page

    async def get_tree(self, session: AsyncSession) -> list[PageTreeNode]:
        return await self._page_repo.get_all_shallow(session)

    async def search(self, session: AsyncSession, query: str) -> list[PageSearchResult]:
        if not query.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Search query must not be empty",
            )
        return await self._page_repo.search(session, query)
