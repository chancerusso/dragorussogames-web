"""add group store

Revision ID: 0004_group_store
Revises: 0003_expedition_tracker
Create Date: 2026-06-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004_group_store"
down_revision: Union[str, None] = "0003_expedition_tracker"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "group_stores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("guild_id", sa.String(length=32), nullable=False),
        sa.Column("channel_id", sa.String(length=32), nullable=False),
        sa.Column("channel_name_snapshot", sa.String(length=120), nullable=True),
        sa.Column("items", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("coins", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("xp_bank", sa.Integer(), server_default="0", nullable=False),
        sa.Column("notes", sa.String(length=1000), nullable=True),
        sa.Column("updated_by_discord_id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("guild_id", "channel_id", name="uq_group_store_scope"),
    )


def downgrade() -> None:
    op.drop_table("group_stores")
