from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

JSONType = JSON().with_variant(JSONB, "postgresql")


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Campaign(TimestampMixin, Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dm_user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    current_campaign_day: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    default_location: Mapped[str] = mapped_column(String(160), default="Town", server_default="Town", nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="active", server_default="active", nullable=False)

    parties: Mapped[list["Party"]] = relationship(back_populates="campaign")
    characters: Mapped[list["Character"]] = relationship(back_populates="campaign")
    safe_locations: Mapped[list["SafeStorageLocation"]] = relationship(back_populates="campaign", cascade="all, delete-orphan")


class Player(TimestampMixin, Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    player_name: Mapped[str] = mapped_column(String(120), nullable=False)
    display_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    discord_username: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    discord_user_id: Mapped[Optional[str]] = mapped_column(String(32), unique=True, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(180), nullable=True)
    role: Mapped[str] = mapped_column(String(40), default="player", server_default="player", nullable=False)

    characters: Mapped[list["Character"]] = relationship(back_populates="player")


class Party(TimestampMixin, Base):
    __tablename__ = "parties"
    __table_args__ = (UniqueConstraint("campaign_id", "name", name="uq_parties_campaign_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)

    campaign: Mapped[Campaign] = relationship(back_populates="parties")
    characters: Mapped[list["Character"]] = relationship(back_populates="party")


class Character(TimestampMixin, Base):
    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[Optional[int]] = mapped_column(ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    party_id: Mapped[Optional[int]] = mapped_column(ForeignKey("parties.id", ondelete="SET NULL"), nullable=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    character_name: Mapped[str] = mapped_column(String(120), nullable=False)
    player_name: Mapped[str] = mapped_column(String(120), nullable=False)
    discord_username: Mapped[str] = mapped_column(String(120), nullable=False)
    discord_user_id: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    ledger: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="Inactive", server_default="Inactive", nullable=False)

    campaign: Mapped[Optional[Campaign]] = relationship(back_populates="characters")
    party: Mapped[Optional[Party]] = relationship(back_populates="characters")
    player: Mapped[Player] = relationship(back_populates="characters")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_discord_user_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ExpeditionTracker(TimestampMixin, Base):
    __tablename__ = "expedition_trackers"
    __table_args__ = (UniqueConstraint("guild_id", "channel_id", name="uq_expedition_tracker_scope"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    guild_id: Mapped[str] = mapped_column(String(32), nullable=False)
    channel_id: Mapped[str] = mapped_column(String(32), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    day: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    turn: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    move_rate: Mapped[int] = mapped_column(Integer, default=120, server_default="120", nullable=False)
    oil_pints: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    rations: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    active_lights: Mapped[list[dict[str, Any]]] = mapped_column(JSONType, nullable=False)
    combat_rest_required: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    created_by_discord_id: Mapped[str] = mapped_column(String(32), nullable=False)


class MarchingOrder(TimestampMixin, Base):
    __tablename__ = "marching_orders"
    __table_args__ = (UniqueConstraint("guild_id", "channel_id", name="uq_marching_order_scope"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    guild_id: Mapped[str] = mapped_column(String(32), nullable=False)
    channel_id: Mapped[str] = mapped_column(String(32), nullable=False)
    positions: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    updated_by_discord_id: Mapped[str] = mapped_column(String(32), nullable=False)


class GroupStore(TimestampMixin, Base):
    __tablename__ = "group_stores"
    __table_args__ = (UniqueConstraint("guild_id", "channel_id", name="uq_group_store_scope"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    guild_id: Mapped[str] = mapped_column(String(32), nullable=False)
    channel_id: Mapped[str] = mapped_column(String(32), nullable=False)
    channel_name_snapshot: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    items: Mapped[list[dict[str, Any]]] = mapped_column(JSONType, nullable=False)
    coins: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)
    xp_bank: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    updated_by_discord_id: Mapped[str] = mapped_column(String(32), nullable=False)


class CampaignPlayer(TimestampMixin, Base):
    __tablename__ = "campaign_players"
    __table_args__ = (UniqueConstraint("campaign_id", "user_id", name="uq_campaign_players_user"),)

    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), primary_key=True)
    role: Mapped[str] = mapped_column(String(40), default="player", server_default="player", nullable=False)


class SafeStorageLocation(TimestampMixin, Base):
    __tablename__ = "safe_storage_locations"
    __table_args__ = (UniqueConstraint("campaign_id", "name", name="uq_safe_storage_campaign_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="active", server_default="active", nullable=False)

    campaign: Mapped[Campaign] = relationship(back_populates="safe_locations")


class VaultCharacter(TimestampMixin, Base):
    __tablename__ = "vault_characters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    campaign_id: Mapped[Optional[int]] = mapped_column(ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    race: Mapped[str] = mapped_column(String(80), nullable=False)
    class_name: Mapped[str] = mapped_column(String(80), nullable=False)
    subclass_or_specialty: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    alignment: Mapped[str] = mapped_column(String(80), nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    xp: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="active", server_default="active", nullable=False)
    life_status: Mapped[str] = mapped_column(String(40), default="alive", server_default="alive", nullable=False)
    campaign_day: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    current_location: Mapped[str] = mapped_column(String(160), default="Town", server_default="Town", nullable=False)
    safe_storage_location: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    original_rolls: Mapped[list[int]] = mapped_column(JSONType, default=list, nullable=False)

    abilities: Mapped["CharacterAbilityScores"] = relationship(back_populates="character", cascade="all, delete-orphan")
    combat: Mapped["CharacterCombatStats"] = relationship(back_populates="character", cascade="all, delete-orphan")
    coins: Mapped["CharacterCoins"] = relationship(back_populates="character", cascade="all, delete-orphan")
    inventory: Mapped[list["CharacterInventory"]] = relationship(back_populates="character", cascade="all, delete-orphan")
    spells: Mapped[list["CharacterSpell"]] = relationship(back_populates="character", cascade="all, delete-orphan")
    proficiencies: Mapped[list["WeaponProficiency"]] = relationship(back_populates="character", cascade="all, delete-orphan")
    player: Mapped[Player] = relationship()


class CharacterAbilityScores(Base):
    __tablename__ = "character_ability_scores"

    character_id: Mapped[int] = mapped_column(ForeignKey("vault_characters.id", ondelete="CASCADE"), primary_key=True)
    strength: Mapped[int] = mapped_column(Integer, nullable=False)
    intelligence: Mapped[int] = mapped_column(Integer, nullable=False)
    wisdom: Mapped[int] = mapped_column(Integer, nullable=False)
    dexterity: Mapped[int] = mapped_column(Integer, nullable=False)
    constitution: Mapped[int] = mapped_column(Integer, nullable=False)
    charisma: Mapped[int] = mapped_column(Integer, nullable=False)
    exceptional_strength: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    racial_adjusted_strength: Mapped[int] = mapped_column(Integer, nullable=False)
    racial_adjusted_intelligence: Mapped[int] = mapped_column(Integer, nullable=False)
    racial_adjusted_wisdom: Mapped[int] = mapped_column(Integer, nullable=False)
    racial_adjusted_dexterity: Mapped[int] = mapped_column(Integer, nullable=False)
    racial_adjusted_constitution: Mapped[int] = mapped_column(Integer, nullable=False)
    racial_adjusted_charisma: Mapped[int] = mapped_column(Integer, nullable=False)

    character: Mapped[VaultCharacter] = relationship(back_populates="abilities")


class CharacterCombatStats(Base):
    __tablename__ = "character_combat_stats"

    character_id: Mapped[int] = mapped_column(ForeignKey("vault_characters.id", ondelete="CASCADE"), primary_key=True)
    max_hp: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    current_hp: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    armor_class: Mapped[int] = mapped_column(Integer, default=10, server_default="10", nullable=False)
    unarmored_ac: Mapped[int] = mapped_column(Integer, default=10, server_default="10", nullable=False)
    shield_bonus: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    dex_adjustment: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    movement_rate: Mapped[int] = mapped_column(Integer, default=120, server_default="120", nullable=False)
    carried_weight: Mapped[float] = mapped_column(Float, default=0, server_default="0", nullable=False)
    encumbrance_band: Mapped[str] = mapped_column(String(80), default="Unencumbered", server_default="Unencumbered", nullable=False)
    surprise_adjustment: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    initiative_adjustment: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    saving_throws: Mapped[dict[str, Any]] = mapped_column(JSONType, default=dict, nullable=False)

    character: Mapped[VaultCharacter] = relationship(back_populates="combat")


class EquipmentCatalog(TimestampMixin, Base):
    __tablename__ = "equipment_catalog"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String(60), nullable=False)
    subtype: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    cost_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cost_coin: Mapped[Optional[str]] = mapped_column(String(12), nullable=True)
    weight: Mapped[float] = mapped_column(Float, default=0, server_default="0", nullable=False)
    damage_small_medium: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    damage_large: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    rate_of_fire: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    range: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    armor_class_value: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    armor_class_adjustment: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    properties: Mapped[dict[str, Any]] = mapped_column(JSONType, default=dict, nullable=False)
    rules_reference: Mapped[Optional[str]] = mapped_column(String(240), nullable=True)
    is_core_osric: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    is_dm_created: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    created_by_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("players.id", ondelete="SET NULL"), nullable=True)
    campaign_id: Mapped[Optional[int]] = mapped_column(ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)


class CharacterInventory(TimestampMixin, Base):
    __tablename__ = "character_inventory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    character_id: Mapped[int] = mapped_column(ForeignKey("vault_characters.id", ondelete="CASCADE"), nullable=False)
    equipment_id: Mapped[int] = mapped_column(ForeignKey("equipment_catalog.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="carried", server_default="carried", nullable=False)
    container_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    storage_location: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    character: Mapped[VaultCharacter] = relationship(back_populates="inventory")
    equipment: Mapped[EquipmentCatalog] = relationship()


class CharacterCoins(Base):
    __tablename__ = "character_coins"

    character_id: Mapped[int] = mapped_column(ForeignKey("vault_characters.id", ondelete="CASCADE"), primary_key=True)
    platinum: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    gold: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    electrum: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    silver: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    copper: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)

    character: Mapped[VaultCharacter] = relationship(back_populates="coins")


class WeaponProficiency(TimestampMixin, Base):
    __tablename__ = "weapon_proficiencies"
    __table_args__ = (UniqueConstraint("character_id", "equipment_id", name="uq_weapon_proficiency_item"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    character_id: Mapped[int] = mapped_column(ForeignKey("vault_characters.id", ondelete="CASCADE"), nullable=False)
    equipment_id: Mapped[int] = mapped_column(ForeignKey("equipment_catalog.id", ondelete="CASCADE"), nullable=False)
    proficient: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    specialization: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    character: Mapped[VaultCharacter] = relationship(back_populates="proficiencies")
    equipment: Mapped[EquipmentCatalog] = relationship()


class SpellsCatalog(TimestampMixin, Base):
    __tablename__ = "spells_catalog"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    class_list: Mapped[list[str]] = mapped_column(JSONType, default=list, nullable=False)
    spell_level: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    range: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    duration: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    area_of_effect: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    components: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rules_reference: Mapped[Optional[str]] = mapped_column(String(240), nullable=True)


class CharacterSpell(TimestampMixin, Base):
    __tablename__ = "character_spells"
    __table_args__ = (UniqueConstraint("character_id", "spell_id", name="uq_character_spell"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    character_id: Mapped[int] = mapped_column(ForeignKey("vault_characters.id", ondelete="CASCADE"), nullable=False)
    spell_id: Mapped[int] = mapped_column(ForeignKey("spells_catalog.id", ondelete="CASCADE"), nullable=False)
    known: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    in_spellbook: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    prepared: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    memorized_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    character: Mapped[VaultCharacter] = relationship(back_populates="spells")
    spell: Mapped[SpellsCatalog] = relationship()
