"""add vault campaign membership hardening

Revision ID: 0006_vault_campaign_membership
Revises: 0005_character_vault
Create Date: 2026-06-21
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0006_vault_campaign_membership"
down_revision: Union[str, None] = "0005_character_vault"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def has_table(name: str) -> bool:
    return name in sa.inspect(op.get_bind()).get_table_names()


def has_column(table: str, column: str) -> bool:
    if not has_table(table):
        return False
    return column in {item["name"] for item in sa.inspect(op.get_bind()).get_columns(table)}


def upgrade() -> None:
    if not has_column("equipment_catalog", "campaign_id"):
        op.add_column("equipment_catalog", sa.Column("campaign_id", sa.Integer(), nullable=True))
        if op.get_bind().dialect.name != "sqlite":
            op.create_foreign_key("fk_equipment_catalog_campaign_id", "equipment_catalog", "campaigns", ["campaign_id"], ["id"], ondelete="SET NULL")
    if not has_column("equipment_catalog", "notes"):
        op.add_column("equipment_catalog", sa.Column("notes", sa.Text(), nullable=True))
    if not has_column("equipment_catalog", "archived"):
        op.add_column("equipment_catalog", sa.Column("archived", sa.Boolean(), server_default=sa.false(), nullable=False))

    if not has_table("safe_storage_locations"):
        op.create_table(
            "safe_storage_locations",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False),
            sa.Column("name", sa.String(length=160), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=40), server_default="active", nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint("campaign_id", "name", name="uq_safe_storage_campaign_name"),
        )


def downgrade() -> None:
    if has_table("safe_storage_locations"):
        op.drop_table("safe_storage_locations")
    if has_column("equipment_catalog", "archived"):
        op.drop_column("equipment_catalog", "archived")
    if has_column("equipment_catalog", "notes"):
        op.drop_column("equipment_catalog", "notes")
    if has_column("equipment_catalog", "campaign_id"):
        if op.get_bind().dialect.name != "sqlite":
            op.drop_constraint("fk_equipment_catalog_campaign_id", "equipment_catalog", type_="foreignkey")
        op.drop_column("equipment_catalog", "campaign_id")
