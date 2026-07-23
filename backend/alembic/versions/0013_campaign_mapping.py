"""Add persistent campaign mapping state.

Revision ID: 0013_campaign_mapping
Revises: 0012_campaign_table_state
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0013_campaign_mapping"
down_revision: Union[str, None] = "0012_campaign_table_state"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("campaigns", sa.Column("table_mode", sa.String(length=40), server_default="mapping", nullable=False))
    op.add_column("campaigns", sa.Column("active_map_id", sa.Integer(), nullable=True))

    op.create_table(
        "campaign_maps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("map_type", sa.String(length=40), server_default="square", nullable=False),
        sa.Column("status", sa.String(length=40), server_default="active", nullable=False),
        sa.Column("mapper_user_id", sa.Integer(), sa.ForeignKey("players.id", ondelete="SET NULL"), nullable=True),
        sa.Column("width", sa.Integer(), server_default="80", nullable=False),
        sa.Column("height", sa.Integer(), server_default="80", nullable=False),
        sa.Column("active_level", sa.String(length=80), server_default="Level 1", nullable=False),
        sa.Column("drawing_state", sa.JSON(), nullable=False),
        sa.Column("viewport", sa.JSON(), nullable=False),
        sa.Column("revision", sa.Integer(), server_default="1", nullable=False),
        sa.Column("updated_by_user_id", sa.Integer(), sa.ForeignKey("players.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("campaign_id", "name", name="uq_campaign_maps_campaign_name"),
    )
    op.create_index("ix_campaign_maps_campaign_id", "campaign_maps", ["campaign_id"])

    op.create_table(
        "campaign_map_revisions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("map_id", sa.Integer(), sa.ForeignKey("campaign_maps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("drawing_state", sa.JSON(), nullable=False),
        sa.Column("viewport", sa.JSON(), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("players.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("map_id", "revision", name="uq_campaign_map_revision"),
    )
    op.create_index("ix_campaign_map_revisions_map_id", "campaign_map_revisions", ["map_id"])


def downgrade() -> None:
    op.drop_index("ix_campaign_map_revisions_map_id", table_name="campaign_map_revisions")
    op.drop_table("campaign_map_revisions")
    op.drop_index("ix_campaign_maps_campaign_id", table_name="campaign_maps")
    op.drop_table("campaign_maps")
    op.drop_column("campaigns", "active_map_id")
    op.drop_column("campaigns", "table_mode")
