"""Add single-use player onboarding invitations.

Revision ID: 0023_player_invites
Revises: 0022_dm_campaign_workspace
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0023_player_invites"
down_revision: Union[str, None] = "0022_dm_campaign_workspace"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "player_invites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("player_id", sa.Integer(), sa.ForeignKey("players.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_player_invites_player_id", "player_invites", ["player_id"])
    op.create_index("ix_player_invites_token_hash", "player_invites", ["token_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_player_invites_token_hash", table_name="player_invites")
    op.drop_index("ix_player_invites_player_id", table_name="player_invites")
    op.drop_table("player_invites")
