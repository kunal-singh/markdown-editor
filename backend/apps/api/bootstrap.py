from __future__ import annotations

from collections.abc import AsyncGenerator, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI

from collaboration import CollaborationManager
from container import Container
from core.config import get_config
from core.schemas import HealthResponse
from persistence.database import create_tables
from routes.auth import build_auth_router
from routes.pages import build_pages_router
from services.auth_service import AuthService
from services.page_service import PageService


@asynccontextmanager
async def _lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    await create_tables()
    yield


def _make_auth_service_dep(container: Container) -> Callable[[], AuthService]:
    def get_auth_service() -> AuthService:
        return container.auth_service()

    return get_auth_service


def _make_page_service_dep(container: Container) -> Callable[[], PageService]:
    def get_page_service() -> PageService:
        return container.page_service()

    return get_page_service


def _make_collab_dep(container: Container) -> Callable[[], CollaborationManager]:
    def get_collab() -> CollaborationManager:
        return container.collab_manager()

    return get_collab


def create_app() -> FastAPI:
    config = get_config()
    container = Container(config=config)
    app = FastAPI(title=config.app_title, lifespan=_lifespan)

    auth_dep = _make_auth_service_dep(container)
    page_dep = _make_page_service_dep(container)
    collab_dep = _make_collab_dep(container)

    app.include_router(build_auth_router(auth_dep), prefix="/auth", tags=["auth"])
    app.include_router(
        build_pages_router(page_dep, auth_dep, collab_dep), prefix="/pages", tags=["pages"]
    )

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(status="ok")

    return app
