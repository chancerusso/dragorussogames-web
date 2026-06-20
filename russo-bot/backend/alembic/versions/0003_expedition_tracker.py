"""add expedition tracker

Revision ID: 0003_expedition_tracker
Revises: 0002_character_status
Create Date: 2026-06-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0003_expedition_tracker"
down_revision: Union[str, None] = "0002_character_status"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "expedition_trackers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("guild_id", sa.String(length=32), nullable=False),
        sa.Column("channel_id", sa.String(length=32), nullable=False),
        sa.Column("active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("day", sa.Integer(), server_default="1", nullable=False),
        sa.Column("turn", sa.Integer(), server_default="0", nullable=False),
        sa.Column("move_rate", sa.Integer(), server_default="120", nullable=False),
        sa.Column("oil_pints", sa.Integer(), server_default="0", nullable=False),
        sa.Column("rations", sa.Integer(), server_default="0", nullable=False),
        sa.Column("active_lights", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("combat_rest_required", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("notes", sa.String(length=1000), nullable=True),
        sa.Column("created_by_discord_id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("guild_id", "channel_id", name="uq_expedition_tracker_scope"),
    )
    op.create_table(
        "marching_orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("guild_id", sa.String(length=32), nullable=False),
        sa.Column("channel_id", sa.String(length=32), nullable=False),
        sa.Column("positions", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("notes", sa.String(length=1000), nullable=True),
        sa.Column("updated_by_discord_id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("guild_id", "channel_id", name="uq_marching_order_scope"),
    )


def downgrade() -> None:
    op.drop_table("marching_orders")
    op.drop_table("expedition_trackers")
