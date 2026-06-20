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
    alignment: str | None = Field(default=None, max_length=80)
    hp_max: int | None = Field(default=None)
    hp_current: int | None = Field(default=None)
    armor_class: int | None = Field(default=None)
    strength: int | None = Field(default=None, ge=1, le=25)
    intelligence: int | None = Field(default=None, ge=1, le=25)
    wisdom: int | None = Field(default=None, ge=1, le=25)
    dexterity: int | None = Field(default=None, ge=1, le=25)
    constitution: int | None = Field(default=None, ge=1, le=25)
    charisma: int | None = Field(default=None, ge=1, le=25)
    discord_username: str = Field(min_length=1, max_length=120)
    discord_user_id: str = Field(min_length=1, max_length=32)


class CharacterResponse(BaseModel):
    id: int
    character_name: str
    player_name: str
    discord_username: str
    discord_user_id: str
    is_active: bool
    status: str
    ledger: dict[str, Any]

    model_config = {"from_attributes": True}


class LedgerPatchRequest(BaseModel):
    patch: dict[str, Any] = Field(default_factory=dict)
    actor_discord_user_id: str | None = Field(default=None, max_length=32)
    actor_is_admin: bool = False
    audit_action: str = Field(default="ledger.update", max_length=120)


class CharacterQuery(BaseModel):
    actor_discord_user_id: str = Field(min_length=1, max_length=32)
    actor_is_admin: bool = False
    character_name: str | None = Field(default=None, min_length=1, max_length=120)


class ActivateCharacterRequest(BaseModel):
    actor_discord_user_id: str = Field(min_length=1, max_length=32)
    actor_is_admin: bool = False


class EquipmentAddRequest(BaseModel):
    actor_discord_user_id: str = Field(min_length=1, max_length=32)
    actor_is_admin: bool = False
    item_name: str = Field(min_length=1, max_length=120)
    quantity: int = Field(default=1, ge=1)
    weight: float = Field(default=0, ge=0)
    damage: str | None = Field(default=None, max_length=80)
    location: str = Field(default="carried", max_length=40)
    notes: str | None = Field(default=None, max_length=500)


class EquipmentRemoveRequest(BaseModel):
    actor_discord_user_id: str = Field(min_length=1, max_length=32)
    actor_is_admin: bool = False
    item_name: str = Field(min_length=1, max_length=120)
    quantity: int = Field(default=1, ge=1)


class EquipmentMoveRequest(BaseModel):
    actor_discord_user_id: str = Field(min_length=1, max_length=32)
    actor_is_admin: bool = False
    item_name: str = Field(min_length=1, max_length=120)
