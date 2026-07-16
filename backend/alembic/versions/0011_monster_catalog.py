"""add monster catalog

Revision ID: 0011_monster_catalog
Revises: 0010_character_magic_items
Create Date: 2026-07-16
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0011_monster_catalog"
down_revision: Union[str, None] = "0010_character_magic_items"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "monster_catalog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False, unique=True),
        sa.Column("source", sa.String(length=120), server_default="OSRIC Core Rules", nullable=False),
        sa.Column("source_pdf_page", sa.Integer(), nullable=True),
        sa.Column("rules_reference", sa.String(length=240), nullable=True),
        sa.Column("frequency", sa.String(length=160), nullable=True),
        sa.Column("number_encountered", sa.String(length=160), nullable=True),
        sa.Column("size", sa.String(length=160), nullable=True),
        sa.Column("movement", sa.String(length=240), nullable=True),
        sa.Column("armor_class", sa.String(length=160), nullable=True),
        sa.Column("hit_dice", sa.String(length=160), nullable=True),
        sa.Column("attacks", sa.String(length=240), nullable=True),
        sa.Column("damage", sa.String(length=240), nullable=True),
        sa.Column("special_attacks", sa.Text(), nullable=True),
        sa.Column("special_defences", sa.Text(), nullable=True),
        sa.Column("magic_resistance", sa.String(length=160), nullable=True),
        sa.Column("lair_probability", sa.String(length=160), nullable=True),
        sa.Column("intelligence", sa.String(length=160), nullable=True),
        sa.Column("alignment", sa.String(length=160), nullable=True),
        sa.Column("level_xp", sa.String(length=240), nullable=True),
        sa.Column("treasure", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("source_text", sa.Text(), nullable=False),
        sa.Column("search_text", sa.Text(), nullable=False),
        sa.Column("is_core_osric", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("archived", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("monster_catalog")
