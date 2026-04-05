"""JWT handling and content sanitization (XSS protection)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from jose import jwt  # type: ignore[import-untyped]
from passlib.context import CryptContext

_ctx = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _ctx.verify(plain, hashed)


def create_access_token(
    data: dict[str, object], secret: str, algorithm: str, expire_minutes: int
) -> str:
    payload = dict(data)
    payload["exp"] = datetime.now(UTC) + timedelta(minutes=expire_minutes)
    return jwt.encode(payload, secret, algorithm=algorithm)  # type: ignore[no-any-return]


def decode_token(token: str, secret: str, algorithm: str) -> dict[str, object]:
    return jwt.decode(token, secret, algorithms=[algorithm])  # type: ignore[no-any-return]
