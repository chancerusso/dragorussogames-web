"""add structured campaign session notes

Revision ID: 0004_campaign_session_notes
Revises: 0003_campaign_sessions
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_campaign_session_notes"
down_revision: Union[str, None] = "0003_campaign_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("dh_campaigns")}
    if "session_notes" not in columns:
        op.add_column("dh_campaigns", sa.Column("session_notes", sa.JSON(), server_default="[]", nullable=False))


def downgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("dh_campaigns")}
    if "session_notes" in columns:
        op.drop_column("dh_campaigns", "session_notes")
