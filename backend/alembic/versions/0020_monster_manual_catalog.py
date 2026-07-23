"""Replace matched legacy monsters with Monster Manual statistics.

Revision ID: 0020_monster_manual_catalog
Revises: 0019_phb_spell_mechanics
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.services.vault_rules import monster_seed


revision: str = "0020_monster_manual_catalog"
down_revision: Union[str, None] = "0019_phb_spell_mechanics"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


MONSTER_FIELDS = (
    "name",
    "slug",
    "source",
    "supplemental_source",
    "verification",
    "source_pdf_page",
    "rules_reference",
    "frequency",
    "number_encountered",
    "size",
    "movement",
    "armor_class",
    "hit_dice",
    "attacks",
    "damage",
    "special_attacks",
    "special_defences",
    "magic_resistance",
    "lair_probability",
    "intelligence",
    "alignment",
    "level_xp",
    "treasure",
    "description",
    "source_text",
    "search_text",
    "is_core_osric",
    "archived",
)


def monster_table() -> sa.TableClause:
    return sa.table(
        "monster_catalog",
        sa.column("id", sa.Integer()),
        *[
            sa.column(field, sa.Boolean() if field in {"is_core_osric", "archived"} else sa.String())
            for field in MONSTER_FIELDS
        ],
    )


def upgrade() -> None:
    with op.batch_alter_table("monster_catalog") as batch_op:
        batch_op.alter_column(
            "source",
            existing_type=sa.String(length=120),
            server_default="Monster Manual",
            existing_nullable=False,
        )
    op.add_column("monster_catalog", sa.Column("supplemental_source", sa.String(length=160), nullable=True))
    op.add_column(
        "monster_catalog",
        sa.Column(
            "verification",
            sa.String(length=80),
            nullable=False,
            server_default="legacy_unverified",
        ),
    )

    bind = op.get_bind()
    monsters = monster_table()
    official_seeds = [seed for seed in monster_seed() if seed.get("source") == "Monster Manual"]
    for seed in official_seeds:
        values = {field: seed.get(field) for field in MONSTER_FIELDS if field != "slug"}
        existing_id = bind.scalar(
            sa.select(monsters.c.id).where(monsters.c.slug == seed["slug"]).limit(1)
        )
        if existing_id is None:
            bind.execute(monsters.insert().values(**{field: seed.get(field) for field in MONSTER_FIELDS}))
        else:
            bind.execute(
                monsters.update()
                .where(monsters.c.id == existing_id)
                .values(**values)
            )

    bind.execute(
        monsters.update()
        .where(monsters.c.source == "OSRIC Core Rules")
        .where(monsters.c.is_core_osric.is_(True))
        .values(
            source="Legacy OSRIC Catalog",
            supplemental_source=None,
            verification="legacy_unverified",
        )
    )
    bind.execute(
        monsters.update()
        .where(monsters.c.source != "Monster Manual")
        .where(monsters.c.source != "Legacy OSRIC Catalog")
        .where(monsters.c.is_core_osric.is_(False))
        .values(
            supplemental_source=None,
            verification="adventure_source",
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    monsters = monster_table()
    bind.execute(
        monsters.update()
        .where(monsters.c.source == "Legacy OSRIC Catalog")
        .values(source="OSRIC Core Rules")
    )
    with op.batch_alter_table("monster_catalog") as batch_op:
        batch_op.alter_column(
            "source",
            existing_type=sa.String(length=120),
            server_default="OSRIC Core Rules",
            existing_nullable=False,
        )
    op.drop_column("monster_catalog", "verification")
    op.drop_column("monster_catalog", "supplemental_source")
