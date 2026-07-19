"""add GM content records

Revision ID: 0002_gm_content_records
Revises: 0001_daggerheart_core
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_gm_content_records"
down_revision: Union[str, None] = "0001_daggerheart_core"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Revision 0001 used live metadata, so a brand-new installation may already
    # contain this table. Existing installations still need it created here.
    if sa.inspect(op.get_bind()).has_table("dh_content_records"):
        return
    op.create_table(
        "dh_content_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("dh_users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("kind", sa.String(length=30), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("source", sa.String(length=180), server_default="Custom", nullable=False),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("archived", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_dh_content_records_created_by_id", "dh_content_records", ["created_by_id"])
    op.create_index("ix_dh_content_records_kind", "dh_content_records", ["kind"])
    op.create_index("ix_dh_content_records_name", "dh_content_records", ["name"])


def downgrade() -> None:
    op.drop_index("ix_dh_content_records_name", table_name="dh_content_records")
    op.drop_index("ix_dh_content_records_kind", table_name="dh_content_records")
    op.drop_index("ix_dh_content_records_created_by_id", table_name="dh_content_records")
    op.drop_table("dh_content_records")
