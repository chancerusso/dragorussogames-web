"""Add DM campaign workspace records.

Revision ID: 0022_dm_campaign_workspace
Revises: 0021_multiclass_tracks
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0022_dm_campaign_workspace"
down_revision: Union[str, None] = "0021_multiclass_tracks"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "campaign_handouts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("content_type", sa.String(120), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("file_data", sa.LargeBinary(), nullable=False),
        sa.Column("shared_with_players", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_campaign_handouts_campaign_id", "campaign_handouts", ["campaign_id"])
    op.create_table(
        "campaign_npcs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_campaign_npcs_campaign_id", "campaign_npcs", ["campaign_id"])
    op.create_table(
        "campaign_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("session_number", sa.Integer(), nullable=False),
        sa.Column("session_date", sa.String(40), nullable=True),
        sa.Column("live_notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("campaign_id", "session_number", name="uq_campaign_session_number"),
    )
    op.create_index("ix_campaign_sessions_campaign_id", "campaign_sessions", ["campaign_id"])
    op.create_table(
        "session_planning_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("campaign_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(40), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("forwarded_from_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_session_planning_items_session_id", "session_planning_items", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_session_planning_items_session_id", table_name="session_planning_items")
    op.drop_table("session_planning_items")
    op.drop_index("ix_campaign_sessions_campaign_id", table_name="campaign_sessions")
    op.drop_table("campaign_sessions")
    op.drop_index("ix_campaign_npcs_campaign_id", table_name="campaign_npcs")
    op.drop_table("campaign_npcs")
    op.drop_index("ix_campaign_handouts_campaign_id", table_name="campaign_handouts")
    op.drop_table("campaign_handouts")
