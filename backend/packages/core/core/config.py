from __future__ import annotations

from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

# Single-element list used as a mutable cell to avoid a module-level `global` statement.
_cache: list[Config] = []


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: PostgresDsn
    jwt_secret_key: str = Field(alias="jwt_secret", min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    app_title: str = "Markdown Editor API"
    debug: bool = False


def get_config() -> Config:
    if not _cache:
        _cache.append(Config())  # type: ignore[call-arg]
    return _cache[0]
