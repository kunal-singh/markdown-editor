from __future__ import annotations

from collections.abc import AsyncGenerator, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI

from container import Container
from core.config import get_config
from core.schemas import HealthResponse
from persistence.database import create_tables
from routes.auth import build_auth_router
from services.auth_service import AuthService


@asynccontextmanager
async def _lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    await create_tables()
    yield


def _make_auth_service_dep(container: Container) -> Callable[[], AuthService]:
    def get_auth_service() -> AuthService:
        return container.auth_service()

    return get_auth_service


def create_app() -> FastAPI:
    config = get_config()
    container = Container(config=config)
    app = FastAPI(title=config.app_title, lifespan=_lifespan)

    auth_dep = _make_auth_service_dep(container)
    app.include_router(build_auth_router(auth_dep), prefix="/auth", tags=["auth"])

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(status="ok")

    return app
