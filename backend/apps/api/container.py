from __future__ import annotations

from collaboration import CollaborationManager
from core.config import Config
from persistence.repository import PageRepository, UserRepository
from services.auth_service import AuthService
from services.page_service import PageService
from services.page_store import PageDocumentStore


class Container:
    def __init__(self, config: Config) -> None:
        self._config = config
        self._user_repo = UserRepository()
        self._page_repo = PageRepository()
        self._page_store = PageDocumentStore()
        self._collab_manager = CollaborationManager(store=self._page_store)

    def auth_service(self) -> AuthService:
        return AuthService(config=self._config, user_repo=self._user_repo)

    def page_service(self) -> PageService:
        return PageService(page_repo=self._page_repo)

    def collab_manager(self) -> CollaborationManager:
        return self._collab_manager
