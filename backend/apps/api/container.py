from __future__ import annotations

from core.config import Config
from persistence.repository import UserRepository
from services.auth_service import AuthService


class Container:
    def __init__(self, config: Config) -> None:
        self._config = config
        self._user_repo: UserRepository = UserRepository()

    def auth_service(self) -> AuthService:
        return AuthService(config=self._config, user_repo=self._user_repo)
