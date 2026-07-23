"""Synchronize the Player's Handbook equipment catalog.

Revision ID: 0016_phb_equipment_catalog
Revises: 0015_weapon_speed_factors
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.services.vault_rules import equipment_seed


revision: str = "0016_phb_equipment_catalog"
down_revision: Union[str, None] = "0015_weapon_speed_factors"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def equipment_table() -> sa.TableClause:
    return sa.table(
        "equipment_catalog",
        sa.column("name", sa.String()),
        sa.column("type", sa.String()),
        sa.column("subtype", sa.String()),
        sa.column("cost_amount", sa.Float()),
        sa.column("cost_coin", sa.String()),
        sa.column("weight", sa.Float()),
        sa.column("damage_small_medium", sa.String()),
        sa.column("damage_large", sa.String()),
        sa.column("rate_of_fire", sa.String()),
        sa.column("range", sa.String()),
        sa.column("armor_class_value", sa.Integer()),
        sa.column("armor_class_adjustment", sa.Integer()),
        sa.column("properties", sa.JSON()),
        sa.column("rules_reference", sa.String()),
        sa.column("is_core_osric", sa.Boolean()),
        sa.column("is_dm_created", sa.Boolean()),
        sa.column("archived", sa.Boolean()),
    )


def upgrade() -> None:
    bind = op.get_bind()
    equipment = equipment_table()
    existing_names = set(bind.execute(sa.select(equipment.c.name)).scalars())
    phb_names: set[str] = set()

    for seed in equipment_seed():
        name = seed["name"]
        phb_names.add(name)
        values = {**seed, "properties": seed.get("properties") or {}, "archived": False}
        if name in existing_names:
            bind.execute(equipment.update().where(equipment.c.name == name).values(**values))
        else:
            bind.execute(equipment.insert().values(**values))

    # Preserve rows referenced by character inventories, but remove superseded
    # OSRIC-only catalog choices from new equipment selection.
    bind.execute(
        equipment.update()
        .where(equipment.c.is_core_osric.is_(True))
        .where(equipment.c.name.not_in(phb_names))
        .values(archived=True)
    )


def downgrade() -> None:
    bind = op.get_bind()
    equipment = equipment_table()
    bind.execute(
        equipment.update()
        .where(equipment.c.properties["source"].as_string() == "Player's Handbook")
        .values(archived=True)
    )
