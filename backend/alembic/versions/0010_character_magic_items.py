"""add character magic items

Revision ID: 0010_character_magic_items
Revises: 0009_character_temp_hp
Create Date: 2026-07-13
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0010_character_magic_items"
down_revision: Union[str, None] = "0009_character_temp_hp"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def json_type():
    return sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")


def upgrade() -> None:
    op.add_column("vault_characters", sa.Column("magic_items", json_type(), server_default=sa.text("'[]'"), nullable=False))


def downgrade() -> None:
    op.drop_column("vault_characters", "magic_items")
