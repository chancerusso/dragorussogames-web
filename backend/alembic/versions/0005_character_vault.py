"""add DRG1e character vault

Revision ID: 0005_character_vault
Revises: 0004_group_store
Create Date: 2026-06-21
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0005_character_vault"
down_revision: Union[str, None] = "0004_group_store"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def json_type():
    return sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")


def upgrade() -> None:
    op.add_column("campaigns", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("campaigns", sa.Column("dm_user_id", sa.Integer(), nullable=True))
    op.add_column("campaigns", sa.Column("current_campaign_day", sa.Integer(), server_default="1", nullable=False))
    op.add_column("campaigns", sa.Column("default_location", sa.String(length=160), server_default="Town", nullable=False))
    op.add_column("campaigns", sa.Column("status", sa.String(length=40), server_default="active", nullable=False))
    op.add_column("players", sa.Column("display_name", sa.String(length=120), nullable=True))
    op.add_column("players", sa.Column("email", sa.String(length=180), nullable=True))
    op.add_column("players", sa.Column("role", sa.String(length=40), server_default="player", nullable=False))
    if op.get_bind().dialect.name != "sqlite":
        op.alter_column("players", "discord_username", nullable=True)
        op.alter_column("players", "discord_user_id", nullable=True)

    op.create_table(
        "campaign_players",
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("players.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role", sa.String(length=40), server_default="player", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("campaign_id", "user_id", name="uq_campaign_players_user"),
    )
    op.create_table(
        "equipment_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False, unique=True),
        sa.Column("type", sa.String(length=60), nullable=False),
        sa.Column("subtype", sa.String(length=80), nullable=True),
        sa.Column("cost_amount", sa.Float(), nullable=True),
        sa.Column("cost_coin", sa.String(length=12), nullable=True),
        sa.Column("weight", sa.Float(), server_default="0", nullable=False),
        sa.Column("damage_small_medium", sa.String(length=80), nullable=True),
        sa.Column("damage_large", sa.String(length=80), nullable=True),
        sa.Column("rate_of_fire", sa.String(length=40), nullable=True),
        sa.Column("range", sa.String(length=80), nullable=True),
        sa.Column("armor_class_value", sa.Integer(), nullable=True),
        sa.Column("armor_class_adjustment", sa.Integer(), nullable=True),
        sa.Column("properties", json_type(), nullable=False),
        sa.Column("rules_reference", sa.String(length=240), nullable=True),
        sa.Column("is_core_osric", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("is_dm_created", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("players.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "spells_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False, unique=True),
        sa.Column("class_list", json_type(), nullable=False),
        sa.Column("spell_level", sa.Integer(), server_default="1", nullable=False),
        sa.Column("range", sa.String(length=120), nullable=True),
        sa.Column("duration", sa.String(length=120), nullable=True),
        sa.Column("area_of_effect", sa.String(length=160), nullable=True),
        sa.Column("components", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("rules_reference", sa.String(length=240), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "vault_characters",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("players.id", ondelete="CASCADE"), nullable=False),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("race", sa.String(length=80), nullable=False),
        sa.Column("class_name", sa.String(length=80), nullable=False),
        sa.Column("subclass_or_specialty", sa.String(length=120), nullable=True),
        sa.Column("alignment", sa.String(length=80), nullable=False),
        sa.Column("level", sa.Integer(), server_default="1", nullable=False),
        sa.Column("xp", sa.Integer(), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=40), server_default="active", nullable=False),
        sa.Column("life_status", sa.String(length=40), server_default="alive", nullable=False),
        sa.Column("campaign_day", sa.Integer(), server_default="1", nullable=False),
        sa.Column("current_location", sa.String(length=160), server_default="Town", nullable=False),
        sa.Column("safe_storage_location", sa.String(length=160), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("original_rolls", json_type(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "character_ability_scores",
        sa.Column("character_id", sa.Integer(), sa.ForeignKey("vault_characters.id", ondelete="CASCADE"), primary_key=True),
        *[sa.Column(name, sa.Integer(), nullable=False) for name in ("strength", "intelligence", "wisdom", "dexterity", "constitution", "charisma")],
        sa.Column("exceptional_strength", sa.Integer(), nullable=True),
        *[sa.Column(f"racial_adjusted_{name}", sa.Integer(), nullable=False) for name in ("strength", "intelligence", "wisdom", "dexterity", "constitution", "charisma")],
    )
    op.create_table(
        "character_combat_stats",
        sa.Column("character_id", sa.Integer(), sa.ForeignKey("vault_characters.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("max_hp", sa.Integer(), server_default="1", nullable=False),
        sa.Column("current_hp", sa.Integer(), server_default="1", nullable=False),
        sa.Column("armor_class", sa.Integer(), server_default="10", nullable=False),
        sa.Column("unarmored_ac", sa.Integer(), server_default="10", nullable=False),
        sa.Column("shield_bonus", sa.Integer(), server_default="0", nullable=False),
        sa.Column("dex_adjustment", sa.Integer(), server_default="0", nullable=False),
        sa.Column("movement_rate", sa.Integer(), server_default="120", nullable=False),
        sa.Column("carried_weight", sa.Float(), server_default="0", nullable=False),
        sa.Column("encumbrance_band", sa.String(length=80), server_default="Unencumbered", nullable=False),
        sa.Column("surprise_adjustment", sa.String(length=120), nullable=True),
        sa.Column("initiative_adjustment", sa.String(length=120), nullable=True),
        sa.Column("saving_throws", json_type(), nullable=False),
    )
    op.create_table(
        "character_coins",
        sa.Column("character_id", sa.Integer(), sa.ForeignKey("vault_characters.id", ondelete="CASCADE"), primary_key=True),
        *[sa.Column(name, sa.Integer(), server_default="0", nullable=False) for name in ("platinum", "gold", "electrum", "silver", "copper")],
    )
    op.create_table(
        "character_inventory",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("character_id", sa.Integer(), sa.ForeignKey("vault_characters.id", ondelete="CASCADE"), nullable=False),
        sa.Column("equipment_id", sa.Integer(), sa.ForeignKey("equipment_catalog.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("quantity", sa.Integer(), server_default="1", nullable=False),
        sa.Column("status", sa.String(length=40), server_default="carried", nullable=False),
        sa.Column("container_id", sa.Integer(), nullable=True),
        sa.Column("storage_location", sa.String(length=160), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "weapon_proficiencies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("character_id", sa.Integer(), sa.ForeignKey("vault_characters.id", ondelete="CASCADE"), nullable=False),
        sa.Column("equipment_id", sa.Integer(), sa.ForeignKey("equipment_catalog.id", ondelete="CASCADE"), nullable=False),
        sa.Column("proficient", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("specialization", sa.String(length=120), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("character_id", "equipment_id", name="uq_weapon_proficiency_item"),
    )
    op.create_table(
        "character_spells",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("character_id", sa.Integer(), sa.ForeignKey("vault_characters.id", ondelete="CASCADE"), nullable=False),
        sa.Column("spell_id", sa.Integer(), sa.ForeignKey("spells_catalog.id", ondelete="CASCADE"), nullable=False),
        sa.Column("known", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("in_spellbook", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("prepared", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("memorized_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("character_id", "spell_id", name="uq_character_spell"),
    )


def downgrade() -> None:
    op.drop_table("character_spells")
    op.drop_table("weapon_proficiencies")
    op.drop_table("character_inventory")
    op.drop_table("character_coins")
    op.drop_table("character_combat_stats")
    op.drop_table("character_ability_scores")
    op.drop_table("vault_characters")
    op.drop_table("spells_catalog")
    op.drop_table("equipment_catalog")
    op.drop_table("campaign_players")
    op.drop_column("players", "role")
    op.drop_column("players", "email")
    op.drop_column("players", "display_name")
    op.drop_column("campaigns", "status")
    op.drop_column("campaigns", "default_location")
    op.drop_column("campaigns", "current_campaign_day")
    op.drop_column("campaigns", "dm_user_id")
    op.drop_column("campaigns", "description")
