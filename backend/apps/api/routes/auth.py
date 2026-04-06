from __future__ import annotations

import uuid
from collections.abc import Callable

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from core.schemas import LoginRequest, TokenResponse, UserCreate, UserRead
from persistence.database import get_session
from persistence.repository import UserRepository
from services.auth_service import AuthService


def build_auth_router(get_service: Callable[[], AuthService]) -> APIRouter:
    router = APIRouter()
    bearer = HTTPBearer()

    @router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
    async def signup(
        payload: UserCreate,
        session: AsyncSession = Depends(get_session),  # noqa: B008
        service: AuthService = Depends(get_service),  # noqa: B008
    ) -> TokenResponse:
        return await service.signup(session, payload)

    @router.post("/login", response_model=TokenResponse)
    async def login(
        payload: LoginRequest,
        session: AsyncSession = Depends(get_session),  # noqa: B008
        service: AuthService = Depends(get_service),  # noqa: B008
    ) -> TokenResponse:
        return await service.login(session, payload)

    @router.get("/me", response_model=UserRead)
    async def me(
        session: AsyncSession = Depends(get_session),  # noqa: B008
        service: AuthService = Depends(get_service),  # noqa: B008
        credentials: HTTPAuthorizationCredentials = Depends(bearer),  # noqa: B008
    ) -> UserRead:
        return await service.get_current_user(session, credentials.credentials)

    @router.get("/users/{user_id}", response_model=UserRead)
    async def get_user(
        user_id: uuid.UUID,
        session: AsyncSession = Depends(get_session),  # noqa: B008
    ) -> UserRead:
        user = await UserRepository.get_by_id(session, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    return router
