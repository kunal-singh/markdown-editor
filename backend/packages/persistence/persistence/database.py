from __future__ import annotations

import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from persistence.models import Base


def _get_database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if url is None:
        raise RuntimeError("DATABASE_URL environment variable is not set")
    return url.replace("postgresql://", "postgresql+asyncpg://", 1)


# Lazy singletons held in a namespace object to avoid module-level globals and
# the PLW0603 lint rule while keeping mypy-strict-compatible return types.
class _DB:
    engine: AsyncEngine | None = None
    factory: async_sessionmaker[AsyncSession] | None = None


def _engine() -> AsyncEngine:
    if _DB.engine is None:
        _DB.engine = create_async_engine(_get_database_url(), echo=False, pool_pre_ping=True)
    return _DB.engine


def _session_factory() -> async_sessionmaker[AsyncSession]:
    if _DB.factory is None:
        _DB.factory = async_sessionmaker(_engine(), class_=AsyncSession, expire_on_commit=False)
    return _DB.factory


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with _session_factory()() as session:
        yield session


async def create_tables() -> None:
    async with _engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
