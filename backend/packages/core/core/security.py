"""JWT handling and content sanitization (XSS protection)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import nh3
from jose import jwt  # type: ignore[import-untyped]
from passlib.context import CryptContext

# Tags allowed in markdown-rendered HTML. Script, style, and form elements are excluded.
_ALLOWED_TAGS: frozenset[str] = frozenset(
    {
        "a",
        "b",
        "blockquote",
        "br",
        "code",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hr",
        "i",
        "img",
        "li",
        "ol",
        "p",
        "pre",
        "s",
        "strong",
        "table",
        "tbody",
        "td",
        "th",
        "thead",
        "tr",
        "ul",
    }
)

# Per-tag attribute allowlist. Only href/src/alt/title kept; no event handlers.
_ALLOWED_ATTRIBUTES: dict[str, frozenset[str]] = {
    "a": frozenset({"href", "title"}),
    "img": frozenset({"src", "alt", "title"}),
}


def sanitize_content(html: str) -> str:
    """Strip dangerous tags and attributes from markdown-rendered HTML.

    Uses an allowlist approach: only known-safe tags and attributes survive.
    All event handler attributes (onerror, onclick, etc.) and <script>/<style>
    elements are removed unconditionally.
    """
    return nh3.clean(
        html,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRIBUTES,
        strip_comments=True,
        link_rel="noopener noreferrer",
    )


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
