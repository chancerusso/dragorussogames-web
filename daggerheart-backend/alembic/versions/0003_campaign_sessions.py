"""add campaign session planning

Revision ID: 0003_campaign_sessions
Revises: 0002_gm_content_records
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_campaign_sessions"
down_revision: Union[str, None] = "0002_gm_content_records"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("dh_campaigns")}
    if "session_number" not in columns:
        op.add_column("dh_campaigns", sa.Column("session_number", sa.Integer(), server_default="1", nullable=False))
    if "next_session_at" not in columns:
        op.add_column("dh_campaigns", sa.Column("next_session_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("dh_campaigns")}
    if "next_session_at" in columns: op.drop_column("dh_campaigns", "next_session_at")
    if "session_number" in columns: op.drop_column("dh_campaigns", "session_number")
