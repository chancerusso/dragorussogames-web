"""add dm portal phase 1 metadata

Revision ID: 0007_dm_portal_phase1
Revises: 0006_vault_campaign_membership
Create Date: 2026-07-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007_dm_portal_phase1"
down_revision: Union[str, None] = "0006_vault_campaign_membership"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def has_table(name: str) -> bool:
    return name in sa.inspect(op.get_bind()).get_table_names()


def has_column(table: str, column: str) -> bool:
    if not has_table(table):
        return False
    return column in {item["name"] for item in sa.inspect(op.get_bind()).get_columns(table)}


def upgrade() -> None:
    if not has_column("campaigns", "setting"):
        op.add_column("campaigns", sa.Column("setting", sa.String(length=40), server_default="greyhawk", nullable=False))
    if not has_column("campaigns", "schedule"):
        op.add_column("campaigns", sa.Column("schedule", sa.String(length=160), nullable=True))
    if not has_column("campaigns", "next_session_date"):
        op.add_column("campaigns", sa.Column("next_session_date", sa.String(length=40), nullable=True))
    if not has_column("campaigns", "session_number"):
        op.add_column("campaigns", sa.Column("session_number", sa.Integer(), server_default="1", nullable=False))
    if not has_column("players", "status"):
        op.add_column("players", sa.Column("status", sa.String(length=40), server_default="active", nullable=False))


def downgrade() -> None:
    if has_column("players", "status"):
        op.drop_column("players", "status")
    if has_column("campaigns", "session_number"):
        op.drop_column("campaigns", "session_number")
    if has_column("campaigns", "next_session_date"):
        op.drop_column("campaigns", "next_session_date")
    if has_column("campaigns", "schedule"):
        op.drop_column("campaigns", "schedule")
    if has_column("campaigns", "setting"):
        op.drop_column("campaigns", "setting")
