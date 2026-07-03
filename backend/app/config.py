from __future__ import annotations

from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    russo_default_campaign: str = "DRG"
    secret_key: str = "change-me-in-production"
    admin_password: Optional[str] = None
    cors_origins: str = (
        "https://www.dragorussogames.com,"
        "https://dragorussogames.com,"
        "https://russo.dragorussogames.com,"
        "https://dm.dragorussogames.com,"
        "https://classic.dragorussogames.com"
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()


def cors_origin_list() -> list[str]:
    return [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
