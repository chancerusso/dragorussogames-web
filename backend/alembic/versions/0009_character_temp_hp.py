"""add temporary hit points

Revision ID: 0009_character_temp_hp
Revises: 0008_player_auth
Create Date: 2026-07-13
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0009_character_temp_hp"
down_revision: Union[str, None] = "0008_player_auth"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("character_combat_stats", sa.Column("temporary_hp", sa.Integer(), server_default="0", nullable=False))


def downgrade() -> None:
    op.drop_column("character_combat_stats", "temporary_hp")
