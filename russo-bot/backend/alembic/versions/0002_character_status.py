"""add character status

Revision ID: 0002_character_status
Revises: 0001_initial
Create Date: 2026-06-19
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_character_status"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "characters",
        sa.Column("status", sa.String(length=40), server_default="Inactive", nullable=False),
    )
    op.alter_column("characters", "is_active", server_default=sa.false())
    op.execute("UPDATE characters SET status = CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END")


def downgrade() -> None:
    op.alter_column("characters", "is_active", server_default=sa.true())
    op.drop_column("characters", "status")
