from __future__ import annotations

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    app_name: str = "Drago Table"
    runtime_profile: str = "vps"
    russo_default_campaign: str = "DRG"
    secret_key: str = "change-me-in-production"
    admin_password: Optional[str] = None
    canonical_content_enabled: bool = False
    site_root: Optional[str] = None
    cookie_secure: bool = True
    cookie_samesite: str = "lax"
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


def static_site_root() -> Path:
    if settings.site_root:
        return Path(settings.site_root).expanduser().resolve()
    return Path(__file__).resolve().parents[2]
