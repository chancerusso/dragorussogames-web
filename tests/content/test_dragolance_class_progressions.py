from __future__ import annotations

import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "backend"))
sys.path.insert(0, str(REPO_ROOT / "content" / "tools"))

from backend.app.services.canonical_content import CanonicalContentService  # noqa: E402
from validate_content import canonical_json_files, load_json  # noqa: E402


HIGH_SORCERY_PROGRESSIONS = {
    "dragolance.progression.high_sorcery.student",
    "dragolance.progression.high_sorcery.white_robes",
    "dragolance.progression.high_sorcery.red_robes",
    "dragolance.progression.high_sorcery.black_robes",
}

HOLY_ORDERS_PROGRESSIONS = {
    "dragolance.progression.holy_orders.good",
    "dragolance.progression.holy_orders.neutral",
    "dragolance.progression.holy_orders.evil",
}

SOLAMNIC_PROGRESSIONS = {
    "dragolance.progression.solamnic.crown",
    "dragolance.progression.solamnic.sword",
    "dragolance.progression.solamnic.rose",
}

SPELL_SLOT_OVERLAYS = {
    "dragolance.spell_slots.high_sorcery.white_robes",
    "dragolance.spell_slots.high_sorcery.red_robes",
    "dragolance.spell_slots.high_sorcery.black_robes",
    "dragolance.spell_slots.holy_orders.good",
    "dragolance.spell_slots.holy_orders.neutral",
    "dragolance.spell_slots.holy_orders.evil",
    "dragolance.spell_slots.sword_knight",
}


def records_by_id() -> dict[str, dict]:
    records = {}
    for path in canonical_json_files(REPO_ROOT):
        record = load_json(path)
        records[record["id"]] = record
    return records


class DragolanceClassProgressionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.records = records_by_id()

    def test_high_sorcery_progressions_resolve(self) -> None:
        for progression_id in HIGH_SORCERY_PROGRESSIONS:
            record = self.records[progression_id]
            self.assertEqual("class_progression", record["type"])
            self.assertEqual("osric.class.magic_user", record["class_id"])
            self.assertTrue(record["levels"], progression_id)
            self.assertIn(record["base_progression_ref"], self.records)

    def test_holy_orders_progressions_resolve(self) -> None:
        for progression_id in HOLY_ORDERS_PROGRESSIONS:
            record = self.records[progression_id]
            self.assertEqual("class_progression", record["type"])
            self.assertEqual("osric.class.cleric", record["class_id"])
            self.assertEqual("osric.progression.class.cleric", record["base_progression_ref"])

    def test_solamnic_progressions_resolve(self) -> None:
        for progression_id in SOLAMNIC_PROGRESSIONS:
            record = self.records[progression_id]
            self.assertEqual("class_progression", record["type"])
            self.assertEqual("osric.class.fighter", record["class_id"])
            self.assertEqual("osric.progression.class.fighter", record["base_progression_ref"])

    def test_spell_slot_overlays_resolve(self) -> None:
        for slot_id in SPELL_SLOT_OVERLAYS:
            record = self.records[slot_id]
            self.assertEqual("spell_slot_progression", record["type"])
            self.assertTrue(record["levels"], slot_id)
            base = record.get("base_spell_slot_progression_ref")
            if base:
                self.assertIn(base, self.records)

    def test_extensions_reference_progression_overlays(self) -> None:
        expectations = {
            "dragolance.extension.magic_user.high_sorcery": HIGH_SORCERY_PROGRESSIONS,
            "dragolance.extension.illusionist.high_sorcery": HIGH_SORCERY_PROGRESSIONS,
            "dragolance.extension.cleric.holy_orders": HOLY_ORDERS_PROGRESSIONS,
            "dragolance.extension.fighter.solamnic_knighthood": SOLAMNIC_PROGRESSIONS,
        }
        for extension_id, progression_ids in expectations.items():
            extension = self.records[extension_id]
            overlays = set(extension["adds"]["progression_overlays"])
            self.assertTrue(progression_ids.issubset(overlays), extension_id)

    def test_level_gated_abilities_resolve(self) -> None:
        ability_ids = {
            "dragolance.ability.test_of_high_sorcery",
            "dragolance.ability.sword_knight_clerical_spells",
            "dragolance.ability.rose_order_transition",
            "dragolance.ability.holy_orders_wisdom_bonus",
        }
        for ability_id in ability_ids:
            ability = self.records[ability_id]
            self.assertEqual("class_ability", ability["type"])
            self.assertIn(ability["owner_id"], self.records)
            for ref in ability["references"]:
                self.assertIn(ref, self.records, ability_id)

    def test_no_circular_progression_inheritance_exists(self) -> None:
        for record in self.records.values():
            if record.get("type") != "class_progression":
                continue
            seen = {record["id"]}
            current = record
            while current.get("base_progression_ref"):
                base_id = current["base_progression_ref"]
                self.assertNotIn(base_id, seen, record["id"])
                seen.add(base_id)
                current = self.records[base_id]

    def test_osric_class_records_remain_osric_sourced(self) -> None:
        for class_id in (
            "osric.class.magic_user",
            "osric.class.illusionist",
            "osric.class.cleric",
            "osric.class.fighter",
            "osric.class.ranger",
            "osric.class.paladin",
            "osric.class.thief",
            "osric.class.assassin",
            "osric.class.druid",
        ):
            self.assertEqual("osric", self.records[class_id]["source_library_id"], class_id)

    def test_loader_sees_progression_extensions_without_mutating_records(self) -> None:
        before = set(self.records)
        service = CanonicalContentService(root=REPO_ROOT, enabled=True).load_all()
        magic_extensions = service.get_extensions("campaign_profile.dragolance", "osric.class.magic_user")
        self.assertEqual(["dragolance.extension.magic_user.high_sorcery"], [item["id"] for item in magic_extensions])
        self.assertEqual(before, set(records_by_id()))


if __name__ == "__main__":
    unittest.main()
