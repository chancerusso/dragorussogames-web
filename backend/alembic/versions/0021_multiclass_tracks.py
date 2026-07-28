"""Add persistent multi-class tracks.

Revision ID: 0021_multiclass_tracks
Revises: 0020_monster_manual_catalog
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

JSONType = sa.JSON().with_variant(JSONB, "postgresql")


revision: str = "0021_multiclass_tracks"
down_revision: Union[str, None] = "0020_monster_manual_catalog"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "vault_characters",
        sa.Column("class_tracks", JSONType, nullable=False, server_default="[]"),
    )
    connection = op.get_bind()
    characters = sa.table(
        "vault_characters",
        sa.column("id", sa.Integer()),
        sa.column("class_tracks", JSONType),
    )
    rows = connection.execute(
        sa.text("SELECT id, class_name, level, xp FROM vault_characters")
    ).mappings()
    for row in rows:
        connection.execute(
            sa.update(characters)
            .where(characters.c.id == row["id"])
            .values(class_tracks=[{
                "class_name": row["class_name"],
                "level": int(row["level"] or 1),
                "xp": int(row["xp"] or 0),
                "state": "active",
            }])
        )


def downgrade() -> None:
    op.drop_column("vault_characters", "class_tracks")
