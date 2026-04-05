from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from jose import JWTError  # type: ignore[import-untyped]
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import Config
from core.schemas import LoginRequest, TokenResponse, UserCreate, UserRead
from core.security import create_access_token, decode_token, hash_password, verify_password
from persistence.repository import UserRepository


class AuthService:
    def __init__(self, config: Config, user_repo: UserRepository) -> None:
        self._config = config
        self._user_repo = user_repo

    async def signup(self, session: AsyncSession, payload: UserCreate) -> TokenResponse:
        existing = await self._user_repo.get_by_email(session, payload.email)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        hashed = hash_password(payload.password)
        user = await self._user_repo.create(
            session,
            email=payload.email,
            display_name=payload.display_name,
            hashed_password=hashed,
        )
        token = create_access_token(
            {"sub": str(user.id)},
            secret=self._config.jwt_secret_key,
            algorithm=self._config.jwt_algorithm,
            expire_minutes=self._config.jwt_expire_minutes,
        )
        return TokenResponse(access_token=token, user=user)

    async def login(self, session: AsyncSession, payload: LoginRequest) -> TokenResponse:
        raw_user = await self._user_repo.get_raw_by_email(session, payload.email)
        if raw_user is None or not verify_password(payload.password, raw_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        token = create_access_token(
            {"sub": str(raw_user.id)},
            secret=self._config.jwt_secret_key,
            algorithm=self._config.jwt_algorithm,
            expire_minutes=self._config.jwt_expire_minutes,
        )
        user_read = UserRead.model_validate(raw_user)
        return TokenResponse(access_token=token, user=user_read)

    async def get_current_user(self, session: AsyncSession, token: str) -> UserRead:
        try:
            claims = decode_token(
                token,
                secret=self._config.jwt_secret_key,
                algorithm=self._config.jwt_algorithm,
            )
        except JWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            ) from exc
        sub = claims.get("sub")
        if not isinstance(sub, str):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        user = await self._user_repo.get_by_id(session, uuid.UUID(sub))
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return user
