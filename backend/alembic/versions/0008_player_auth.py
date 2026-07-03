"""add player authentication fields

Revision ID: 0008_player_auth
Revises: 0007_dm_portal_phase1
Create Date: 2026-07-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0008_player_auth"
down_revision: Union[str, None] = "0007_dm_portal_phase1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def has_table(name: str) -> bool:
    return name in sa.inspect(op.get_bind()).get_table_names()


def has_column(table: str, column: str) -> bool:
    if not has_table(table):
        return False
    return column in {item["name"] for item in sa.inspect(op.get_bind()).get_columns(table)}


def has_index(table: str, index_name: str) -> bool:
    if not has_table(table):
        return False
    return index_name in {item["name"] for item in sa.inspect(op.get_bind()).get_indexes(table)}


def upgrade() -> None:
    if not has_column("players", "username"):
        op.add_column("players", sa.Column("username", sa.String(length=80), nullable=True))
    if not has_column("players", "password_hash"):
        op.add_column("players", sa.Column("password_hash", sa.String(length=240), nullable=True))
    if not has_column("players", "active"):
        op.add_column("players", sa.Column("active", sa.Boolean(), server_default=sa.true(), nullable=False))
        op.execute("UPDATE players SET active = CASE WHEN status = 'inactive' THEN false ELSE true END")
    if not has_index("players", "ix_players_username"):
        op.create_index("ix_players_username", "players", ["username"], unique=True)


def downgrade() -> None:
    if has_index("players", "ix_players_username"):
        op.drop_index("ix_players_username", table_name="players")
    if has_column("players", "active"):
        op.drop_column("players", "active")
    if has_column("players", "password_hash"):
        op.drop_column("players", "password_hash")
    if has_column("players", "username"):
        op.drop_column("players", "username")
