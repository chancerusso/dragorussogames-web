from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "backend"))
os.environ.setdefault("DATABASE_URL", "sqlite:////private/tmp/drg1e-runtime-repairs-import.db")

from app.api import (  # noqa: E402
    add_inventory_record,
    character_payload,
    create_vault_character_for_player,
    delete_inventory_record,
    remove_weapon_proficiency,
    update_inventory_record,
    upsert_weapon_proficiency,
)
from app.db.base import Base  # noqa: E402
from app.db.models import EquipmentCatalog, Player, VaultCharacter, WeaponProficiency  # noqa: E402
from app.services.vault_rules import seed_vault_catalogs  # noqa: E402
from app.services.vault_rules import encumbrance  # noqa: E402
import app.db.models  # noqa: E402,F401


class CharacterRuntimeRepairTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        seed_vault_catalogs(self.db)
        self.player = Player(player_name="Chance", display_name="Chance", username="drago", active=True)
        self.db.add(self.player)
        self.db.flush()
        self.character = create_vault_character_for_player(
            {
                "name": "Dwarf Crown Test",
                "race": "Hill Dwarf",
                "class_name": "Knight of the Crown",
                "alignment": "Lawful Good",
                "level": 7,
                "xp": 70000,
                "abilities": {
                    "strength": 15,
                    "intelligence": 10,
                    "wisdom": 12,
                    "dexterity": 13,
                    "constitution": 16,
                    "charisma": 10,
                },
                "combat": {"max_hp": 40, "current_hp": 40},
                "coins": {},
            },
            self.player,
            self.db,
        )
        self.character_model = self.db.get(VaultCharacter, self.character["id"])

    def tearDown(self) -> None:
        self.db.close()

    def equipment(self, name: str) -> EquipmentCatalog:
        item = self.db.scalar(select(EquipmentCatalog).where(EquipmentCatalog.name == name))
        self.assertIsNotNone(item)
        return item

    def test_knight_of_the_crown_inherits_fighter_saves_and_proficiency_rules(self) -> None:
        payload = character_payload(self.character_model)
        self.assertEqual("Fighter", payload["class_details"]["rules_class_name"])
        self.assertEqual(7, payload["class_details"]["proficiency_count"])
        self.assertEqual(-2, payload["class_details"]["non_proficiency_penalty"])
        self.assertEqual("7-8", payload["combat"]["saving_throws"]["level_band"])
        self.assertIn("Dwarf Constitution save adjustment", " ".join(payload["combat"]["saving_throws"]["notes"]))

    def test_equipping_splint_persists_status_and_recalculates_ac(self) -> None:
        splint = self.equipment("Splint")
        payload = add_inventory_record(self.character_model, {"equipment_id": splint.id, "status": "equipped"}, self.db)
        row = payload["inventory"][0]
        self.assertEqual("equipped", row["status"])
        self.assertEqual("Splint", row["equipment"]["name"])
        self.assertEqual(4, payload["combat"]["armor_class"])

        updated = update_inventory_record(self.character_model, row["id"], {"status": "carried"}, self.db)
        self.assertEqual("carried", updated["inventory"][0]["status"])
        self.assertEqual(10, updated["combat"]["armor_class"])

    def test_exceptional_strength_and_armor_limited_dwarf_encumbrance(self) -> None:
        character = create_vault_character_for_player(
            {
                "name": "Dwarf Crown Strong",
                "race": "Hill Dwarf",
                "class_name": "Knight of the Crown",
                "alignment": "Lawful Good",
                "level": 1,
                "abilities": {
                    "strength": 18,
                    "intelligence": 10,
                    "wisdom": 12,
                    "dexterity": 16,
                    "constitution": 16,
                    "charisma": 10,
                },
                "exceptional_strength": 43,
                "combat": {"max_hp": 10, "current_hp": 10},
                "coins": {"gold": 100},
            },
            self.player,
            self.db,
        )
        model = self.db.get(VaultCharacter, character["id"])
        payload = add_inventory_record(model, {"equipment_id": self.equipment("Splint").id, "status": "equipped"}, self.db)
        self.db.refresh(model)
        payload = add_inventory_record(model, {"equipment_id": self.equipment("Backpack").id, "quantity": 4, "status": "carried"}, self.db)

        self.assertEqual("18/43", payload["strength_display"])
        self.assertEqual(90, payload["combat"]["carried_weight"])
        self.assertEqual(2, payload["combat"]["armor_class"])
        self.assertEqual("Unencumbered", payload["combat"]["encumbrance_band"])
        self.assertEqual(60, payload["combat"]["movement_rate"])
        self.assertEqual(250, payload["combat"]["encumbrance"]["max_carried"])
        self.assertEqual(135, payload["combat"]["encumbrance"]["unencumbered_through"])
        self.assertEqual(136, payload["combat"]["encumbrance"]["next_encumbrance"])
        self.assertEqual(60, payload["combat"]["encumbrance"]["armor_move_limit"])

    def test_plain_strength_18_shifts_all_encumbrance_thresholds(self) -> None:
        band, movement = encumbrance(90, None, 90, 18)

        self.assertEqual("Unencumbered", band)
        self.assertEqual(90, movement)

    def test_drop_preserves_dropped_status_and_removes_derived_effects(self) -> None:
        splint = self.equipment("Splint")
        payload = add_inventory_record(self.character_model, {"equipment_id": splint.id, "status": "equipped"}, self.db)
        dropped = delete_inventory_record(self.character_model, payload["inventory"][0]["id"], self.db)
        self.assertEqual("dropped", dropped["inventory"][0]["status"])
        self.assertEqual(10, dropped["combat"]["armor_class"])

    def test_weapon_proficiency_upserts_and_unmarks_by_equipment_id(self) -> None:
        hammer = self.equipment("Hammer, war, heavy")
        marked = upsert_weapon_proficiency(self.character_model, {"equipment_id": hammer.id, "proficient": True}, self.db)
        self.assertEqual(1, len(marked["weapon_proficiencies"]))
        self.assertTrue(marked["weapon_proficiencies"][0]["proficient"])

        upsert_weapon_proficiency(self.character_model, {"equipment_id": hammer.id, "proficient": True}, self.db)
        count = self.db.scalar(select(func.count()).select_from(WeaponProficiency).where(WeaponProficiency.character_id == self.character_model.id))
        self.assertEqual(1, count)

        unmarked = remove_weapon_proficiency(self.character_model, hammer.id, self.db)
        self.assertEqual([], unmarked["weapon_proficiencies"])


if __name__ == "__main__":
    unittest.main()
