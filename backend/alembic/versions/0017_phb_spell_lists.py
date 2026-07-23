"""Synchronize Player's Handbook spell lists and provenance.

Revision ID: 0017_phb_spell_lists
Revises: 0016_phb_equipment_catalog
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.services.vault_rules import PHB_SPELL_LEGACY_NAMES, spell_seed


revision: str = "0017_phb_spell_lists"
down_revision: Union[str, None] = "0016_phb_equipment_catalog"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def spell_table() -> sa.TableClause:
    return sa.table(
        "spells_catalog",
        sa.column("name", sa.String()),
        sa.column("class_list", sa.JSON()),
        sa.column("levels_by_class", sa.JSON()),
        sa.column("spell_level", sa.Integer()),
        sa.column("range", sa.String()),
        sa.column("duration", sa.String()),
        sa.column("area_of_effect", sa.String()),
        sa.column("components", sa.String()),
        sa.column("description", sa.Text()),
        sa.column("rules_reference", sa.String()),
        sa.column("source", sa.String()),
        sa.column("source_page", sa.Integer()),
        sa.column("verification", sa.String()),
    )


def upgrade() -> None:
    op.add_column("spells_catalog", sa.Column("levels_by_class", sa.JSON(), nullable=False, server_default=sa.text("'{}'")))
    op.add_column("spells_catalog", sa.Column("source", sa.String(length=120), nullable=False, server_default="Player's Handbook"))
    op.add_column("spells_catalog", sa.Column("source_page", sa.Integer(), nullable=True))
    op.add_column("spells_catalog", sa.Column("verification", sa.String(length=80), nullable=False, server_default="spell_list_verified"))

    bind = op.get_bind()
    spells = spell_table()
    existing_names = set(bind.execute(sa.select(spells.c.name)).scalars())

    for seed in spell_seed():
        canonical_name = seed["name"]
        legacy_name = PHB_SPELL_LEGACY_NAMES.get(canonical_name, canonical_name)
        values = dict(seed)
        if legacy_name in existing_names:
            bind.execute(spells.update().where(spells.c.name == legacy_name).values(**values))
            existing_names.discard(legacy_name)
            existing_names.add(canonical_name)
        elif canonical_name in existing_names:
            bind.execute(spells.update().where(spells.c.name == canonical_name).values(**values))
        else:
            bind.execute(spells.insert().values(**values))
            existing_names.add(canonical_name)


def downgrade() -> None:
    op.drop_column("spells_catalog", "verification")
    op.drop_column("spells_catalog", "source_page")
    op.drop_column("spells_catalog", "source")
    op.drop_column("spells_catalog", "levels_by_class")
