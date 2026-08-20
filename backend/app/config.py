"""Application settings, loaded from environment variables / .env file."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://localhost:5432/postgres"
    max_rows: int = 5000
    statement_timeout_ms: int = 30000
    connect_timeout_s: int = 10
    static_dir: str = "static"


@lru_cache
def get_settings() -> Settings:
    return Settings()
