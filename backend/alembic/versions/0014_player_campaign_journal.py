"""Add private player campaign journals.

Revision ID: 0014_player_campaign_journal
Revises: 0013_campaign_mapping
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0014_player_campaign_journal"
down_revision: Union[str, None] = "0013_campaign_mapping"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("campaign_players", sa.Column("journal", sa.Text(), server_default="", nullable=False))


def downgrade() -> None:
    op.drop_column("campaign_players", "journal")
