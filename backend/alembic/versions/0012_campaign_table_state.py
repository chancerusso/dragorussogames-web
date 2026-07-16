"""add campaign table state

Revision ID: 0012_campaign_table_state
Revises: 0011_monster_catalog
Create Date: 2026-07-16
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision: str = "0012_campaign_table_state"
down_revision: str | None = "0011_monster_catalog"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column("campaigns", sa.Column("table_state", sa.JSON(), server_default="{}", nullable=False))


def downgrade() -> None:
    op.drop_column("campaigns", "table_state")
