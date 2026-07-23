"""Add class-specific Player's Handbook spell mechanics.

Revision ID: 0019_phb_spell_mechanics
Revises: 0018_archive_legacy_spells
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.services.vault_rules import spell_seed


revision: str = "0019_phb_spell_mechanics"
down_revision: Union[str, None] = "0018_archive_legacy_spells"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def spell_table() -> sa.TableClause:
    return sa.table(
        "spells_catalog",
        sa.column("name", sa.String()),
        sa.column("mechanics_by_class", sa.JSON()),
        sa.column("range", sa.String()),
        sa.column("duration", sa.String()),
        sa.column("area_of_effect", sa.String()),
        sa.column("components", sa.String()),
        sa.column("casting_time", sa.String()),
        sa.column("saving_throw", sa.String()),
        sa.column("school", sa.String()),
        sa.column("reversible", sa.Boolean()),
        sa.column("source_page", sa.Integer()),
        sa.column("verification", sa.String()),
        sa.column("effect_verification", sa.String()),
    )


def upgrade() -> None:
    op.add_column("spells_catalog", sa.Column("mechanics_by_class", sa.JSON(), nullable=False, server_default=sa.text("'{}'")))
    op.add_column("spells_catalog", sa.Column("casting_time", sa.String(length=120), nullable=True))
    op.add_column("spells_catalog", sa.Column("saving_throw", sa.String(length=120), nullable=True))
    op.add_column("spells_catalog", sa.Column("school", sa.String(length=160), nullable=True))
    op.add_column("spells_catalog", sa.Column("reversible", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column(
        "spells_catalog",
        sa.Column(
            "effect_verification",
            sa.String(length=80),
            nullable=False,
            server_default="pending_semantic_review",
        ),
    )

    bind = op.get_bind()
    spells = spell_table()
    for seed in spell_seed():
        values = {
            key: seed.get(key)
            for key in (
                "mechanics_by_class",
                "range",
                "duration",
                "area_of_effect",
                "components",
                "casting_time",
                "saving_throw",
                "school",
                "reversible",
                "source_page",
                "verification",
                "effect_verification",
            )
        }
        bind.execute(
            spells.update()
            .where(spells.c.name == seed["name"])
            .values(**values)
        )


def downgrade() -> None:
    op.drop_column("spells_catalog", "effect_verification")
    op.drop_column("spells_catalog", "reversible")
    op.drop_column("spells_catalog", "school")
    op.drop_column("spells_catalog", "saving_throw")
    op.drop_column("spells_catalog", "casting_time")
    op.drop_column("spells_catalog", "mechanics_by_class")
