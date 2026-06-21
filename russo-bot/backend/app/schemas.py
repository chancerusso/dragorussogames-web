from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    ok: bool = True


class CharacterCreateRequest(BaseModel):
    character_name: str = Field(min_length=1, max_length=120)
    player_name: str = Field(min_length=1, max_length=120)
    race: str = Field(min_length=1, max_length=80)
    class_name: str = Field(min_length=1, max_length=80)
    level: int = Field(ge=1)
    alignment: Optional[str] = Field(default=None, max_length=80)
    hp_max: Optional[int] = Field(default=None)
    hp_current: Optional[int] = Field(default=None)
    armor_class: Optional[int] = Field(default=None)
    movement: Optional[str] = Field(default=None, max_length=80)
    thac0: Optional[int] = Field(default=None)
    xp: int = Field(default=0, ge=0)
    coins: dict[str, int] = Field(default_factory=dict)
    languages: list[str] = Field(default_factory=list)
    saves: dict[str, int] = Field(default_factory=dict)
    notes: Optional[str] = Field(default=None, max_length=1000)
    strength: Optional[int] = Field(default=None, ge=1, le=25)
    intelligence: Optional[int] = Field(default=None, ge=1, le=25)
    wisdom: Optional[int] = Field(default=None, ge=1, le=25)
    dexterity: Optional[int] = Field(default=None, ge=1, le=25)
    constitution: Optional[int] = Field(default=None, ge=1, le=25)
    charisma: Optional[int] = Field(default=None, ge=1, le=25)
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
    actor_discord_user_id: Optional[str] = Field(default=None, max_length=32)
    actor_is_admin: bool = False
    audit_action: str = Field(default="ledger.update", max_length=120)


class CharacterQuery(BaseModel):
    actor_discord_user_id: str = Field(min_length=1, max_length=32)
    actor_is_admin: bool = False
    character_name: Optional[str] = Field(default=None, min_length=1, max_length=120)


class ActivateCharacterRequest(BaseModel):
    actor_discord_user_id: str = Field(min_length=1, max_length=32)
    actor_is_admin: bool = False


class EquipmentAddRequest(BaseModel):
    actor_discord_user_id: str = Field(min_length=1, max_length=32)
    actor_is_admin: bool = False
    item_name: str = Field(min_length=1, max_length=120)
    quantity: int = Field(default=1, ge=1)
    weight: float = Field(default=0, ge=0)
    damage: Optional[str] = Field(default=None, max_length=80)
    value: Optional[str] = Field(default=None, max_length=80)
    equipped: bool = False
    location: str = Field(default="carried", max_length=40)
    notes: Optional[str] = Field(default=None, max_length=500)


class EquipmentRemoveRequest(BaseModel):
    actor_discord_user_id: str = Field(min_length=1, max_length=32)
    actor_is_admin: bool = False
    item_name: str = Field(min_length=1, max_length=120)
    quantity: int = Field(default=1, ge=1)


class EquipmentMoveRequest(BaseModel):
    actor_discord_user_id: str = Field(min_length=1, max_length=32)
    actor_is_admin: bool = False
    item_name: str = Field(min_length=1, max_length=120)


class TrackerScope(BaseModel):
    guild_id: str = Field(min_length=1, max_length=32)
    channel_id: str = Field(min_length=1, max_length=32)
    actor_discord_user_id: str = Field(min_length=1, max_length=32)
    actor_is_admin: bool = False


class TrackerStartRequest(TrackerScope):
    move_rate: int = Field(default=120)
    rations: int = Field(default=0, ge=0)
    oil_pints: int = Field(default=0, ge=0)
    notes: Optional[str] = Field(default=None, max_length=1000)


class TrackerUpdateRequest(TrackerScope):
    action: str = Field(max_length=40)
    amount: Optional[int] = None
    move_rate: Optional[int] = None
    holder: Optional[str] = Field(default=None, max_length=120)
    advance_turn: bool = False


class TrackerResponse(BaseModel):
    guild_id: str
    channel_id: str
    active: bool
    day: int
    turn: int
    move_rate: int
    oil_pints: int
    rations: int
    active_lights: list[dict[str, Any]]
    combat_rest_required: bool
    notes: Optional[str] = None
    reminders: list[str] = Field(default_factory=list)


class MarchingOrderRequest(TrackerScope):
    positions: dict[str, Optional[str]] = Field(default_factory=dict)
    notes: Optional[str] = Field(default=None, max_length=1000)


class MarchingOrderResponse(BaseModel):
    guild_id: str
    channel_id: str
    positions: dict[str, Optional[str]]
    notes: Optional[str] = None


class StoreItemPayload(BaseModel):
    item_name: str = Field(min_length=1, max_length=120)
    quantity: int = Field(default=1, ge=1)
    weight: float = Field(default=0, ge=0)
    damage: Optional[str] = Field(default=None, max_length=80)
    value: Optional[str] = Field(default=None, max_length=80)
    notes: Optional[str] = Field(default=None, max_length=500)
    custom: bool = False


class GroupStoreRequest(TrackerScope):
    channel_name_snapshot: Optional[str] = Field(default=None, max_length=120)
    action: str = Field(default="status", max_length=40)
    item: Optional[StoreItemPayload] = None
    coin: Optional[str] = Field(default=None, max_length=2)
    amount: Optional[int] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class GroupStoreResponse(BaseModel):
    guild_id: str
    channel_id: str
    channel_name_snapshot: Optional[str] = None
    items: list[dict[str, Any]]
    coins: dict[str, int]
    xp_bank: int
    notes: Optional[str] = None
    reminders: list[str] = Field(default_factory=list)
