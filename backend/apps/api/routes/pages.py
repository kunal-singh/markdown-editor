"""Page REST and WebSocket routes."""

from __future__ import annotations

import uuid
from collections.abc import Callable

from fastapi import APIRouter, Depends, WebSocket, status
from sqlalchemy.ext.asyncio import AsyncSession
from websocket import StarletteAdapter

from collaboration import CollaborationManager, handle_connection
from core.schemas import PageCreate, PageRead, PageSearchResult, PageUpdate
from persistence.database import get_session
from services.page_service import PageService


def build_pages_router(
    get_service: Callable[[], PageService],
    get_collab: Callable[[], CollaborationManager],
) -> APIRouter:
    router = APIRouter()

    # ------------------------------------------------------------------ REST

    @router.post("/", response_model=PageRead, status_code=status.HTTP_201_CREATED)
    async def create_page(
        payload: PageCreate,
        session: AsyncSession = Depends(get_session),  # noqa: B008
        service: PageService = Depends(get_service),  # noqa: B008
    ) -> PageRead:
        return await service.create(session, payload)

    @router.get("/search", response_model=list[PageSearchResult])
    async def search_pages(
        q: str,
        session: AsyncSession = Depends(get_session),  # noqa: B008
        service: PageService = Depends(get_service),  # noqa: B008
    ) -> list[PageSearchResult]:
        return await service.search(session, q)

    @router.get("/by-slug/{slug}", response_model=PageRead)
    async def get_page_by_slug(
        slug: str,
        session: AsyncSession = Depends(get_session),  # noqa: B008
        service: PageService = Depends(get_service),  # noqa: B008
    ) -> PageRead:
        return await service.get_by_slug(session, slug)

    @router.get("/{page_id}", response_model=PageRead)
    async def get_page(
        page_id: uuid.UUID,
        session: AsyncSession = Depends(get_session),  # noqa: B008
        service: PageService = Depends(get_service),  # noqa: B008
    ) -> PageRead:
        return await service.get_by_id(session, page_id)

    @router.get("/{page_id}/children", response_model=list[PageRead])
    async def get_children(
        page_id: uuid.UUID,
        session: AsyncSession = Depends(get_session),  # noqa: B008
        service: PageService = Depends(get_service),  # noqa: B008
    ) -> list[PageRead]:
        return await service.get_children(session, page_id)

    @router.patch("/{page_id}", response_model=PageRead)
    async def update_page(
        page_id: uuid.UUID,
        payload: PageUpdate,
        session: AsyncSession = Depends(get_session),  # noqa: B008
        service: PageService = Depends(get_service),  # noqa: B008
    ) -> PageRead:
        return await service.update(session, page_id, payload)

    # -------------------------------------------------------------- WebSocket

    @router.websocket("/{page_id}/ws")
    async def collab_room(
        ws: WebSocket,
        page_id: uuid.UUID,
        manager: CollaborationManager = Depends(get_collab),  # noqa: B008
    ) -> None:
        await ws.accept()
        room = await manager.get_or_create_room(str(page_id))
        await handle_connection(StarletteAdapter(ws), room)

    return router
