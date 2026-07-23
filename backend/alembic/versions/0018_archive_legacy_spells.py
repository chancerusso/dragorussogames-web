"""Archive spell records absent from the Player's Handbook tables.

Revision ID: 0018_archive_legacy_spells
Revises: 0017_phb_spell_lists
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.services.vault_rules import spell_seed


revision: str = "0018_archive_legacy_spells"
down_revision: Union[str, None] = "0017_phb_spell_lists"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "spells_catalog",
        sa.Column("archived", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    phb_names = [seed["name"] for seed in spell_seed()]
    spells = sa.table(
        "spells_catalog",
        sa.column("name", sa.String()),
        sa.column("archived", sa.Boolean()),
    )
    op.get_bind().execute(
        spells.update()
        .where(spells.c.name.not_in(phb_names))
        .values(archived=True)
    )


def downgrade() -> None:
    op.drop_column("spells_catalog", "archived")
