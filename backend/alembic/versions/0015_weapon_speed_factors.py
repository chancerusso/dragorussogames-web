"""Populate First Edition weapon speed factors.

Revision ID: 0015_weapon_speed_factors
Revises: 0014_player_campaign_journal
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0015_weapon_speed_factors"
down_revision: Union[str, None] = "0014_player_campaign_journal"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


WEAPON_SPEEDS = {
    "Arrows, dozen": "—",
    "Axe, battle": "7",
    "Axe, hand": "4",
    "Bolt, heavy crossbow, dozen": "—",
    "Bolt, light crossbow, dozen": "—",
    "Bow, long": "—",
    "Bow, short": "—",
    "Club": "4",
    "Composite bow, long": "—",
    "Composite bow, short": "—",
    "Crossbow, heavy": "—",
    "Crossbow, light": "—",
    "Dagger": "2",
    "Dart": "—",
    "Flail, heavy": "7",
    "Flail, light": "6",
    "Halberd": "9",
    "Hammer": "4",
    "Hammer, war, heavy": "4",
    "Hammer, war, light": "4",
    "Javelin": "—",
    "Lance": "6-8",
    "Mace, heavy": "7",
    "Mace, light": "6",
    "Morning star": "7",
    "Pick, heavy": "7",
    "Pick, light": "5",
    "Pole arm": "Varies",
    "Sling": "—",
    "Sling bullet, dozen": "—",
    "Sling stone, dozen": "—",
    "Spear": "6-8",
    "Staff": "4",
    "Sword, broad": "5",
    "Sword, claymore/bastard": "6",
    "Sword, long": "5",
    "Sword, scimitar": "4",
    "Sword, short": "3",
    "Sword, two-handed": "10",
    "Trident": "6-8",
}


def upgrade() -> None:
    bind = op.get_bind()
    equipment = sa.table(
        "equipment_catalog",
        sa.column("name", sa.String()),
        sa.column("type", sa.String()),
        sa.column("properties", sa.JSON()),
    )
    rows = bind.execute(sa.select(equipment.c.name, equipment.c.properties).where(equipment.c.type == "weapon")).all()
    for name, existing_properties in rows:
        if name not in WEAPON_SPEEDS:
            continue
        properties = dict(existing_properties or {})
        properties["speed"] = WEAPON_SPEEDS[name]
        bind.execute(equipment.update().where(equipment.c.name == name).values(properties=properties))


def downgrade() -> None:
    bind = op.get_bind()
    equipment = sa.table(
        "equipment_catalog",
        sa.column("name", sa.String()),
        sa.column("type", sa.String()),
        sa.column("properties", sa.JSON()),
    )
    rows = bind.execute(sa.select(equipment.c.name, equipment.c.properties).where(equipment.c.type == "weapon")).all()
    for name, existing_properties in rows:
        if name not in WEAPON_SPEEDS:
            continue
        properties = dict(existing_properties or {})
        properties.pop("speed", None)
        bind.execute(equipment.update().where(equipment.c.name == name).values(properties=properties))
