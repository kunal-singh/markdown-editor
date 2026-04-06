from __future__ import annotations

from routes.auth import build_auth_router
from routes.pages import build_pages_router

__all__ = ["build_auth_router", "build_pages_router"]
