from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    ok: bool = True


class CharacterCreateRequest(BaseModel):
    character_name: str = Field(min_length=1, max_length=120)
    player_name: str = Field(min_length=1, max_length=120)
    race: str = Field(min_length=1, max_length=80)
    class_name: str = Field(min_length=1, max_length=80)
    level: int = Field(ge=1)
    discord_username: str = Field(min_length=1, max_length=120)
    discord_user_id: str = Field(min_length=1, max_length=32)


class CharacterResponse(BaseModel):
    id: int
    character_name: str
    player_name: str
    discord_username: str
    discord_user_id: str
    ledger: dict[str, Any]

    model_config = {"from_attributes": True}
