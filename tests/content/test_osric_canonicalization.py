from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "backend"))
sys.path.insert(0, str(REPO_ROOT / "content" / "tools"))

from backend.app.services import vault_rules  # noqa: E402
from backend.app.services.canonical_content import CanonicalContentService  # noqa: E402
from validate_content import canonical_json_files, load_json  # noqa: E402


STABLE_ID_RE = re.compile(r"^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$")

CLASS_IDS = {
    name: f"osric.class.{name.lower().replace('-', '_').replace(' ', '_')}"
    for name in vault_rules.CLASSES
}
RACE_IDS = {
    "Human": "osric.race.human",
    "Dwarf": "osric.race.dwarf",
    "Elf": "osric.race.elf",
    "Gnome": "osric.race.gnome",
    "Half-Elf": "osric.race.half_elf",
    "Halfling": "osric.race.halfling",
    "Half-Orc": "osric.race.half_orc",
}
SOURCE_CONFLICT_CLASSES = {"Bard", "Monk"}
REPO_ADVANCEMENT_CLASSES = set(CLASS_IDS) - SOURCE_CONFLICT_CLASSES
ACTIVE_CLASSIC_CLASSES = {
    "Assassin",
    "Cleric",
    "Druid",
    "Fighter",
    "Illusionist",
    "Magic-User",
    "Paladin",
    "Ranger",
    "Thief",
}


def records_by_id() -> dict[str, dict]:
    records = {}
    for path in canonical_json_files(REPO_ROOT):
        record = load_json(path)
        records[record["id"]] = record
    return records


class OSRICCanonicalizationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.records = records_by_id()

    def test_every_canonical_osric_race_has_stable_id(self) -> None:
        for legacy_name, record_id in RACE_IDS.items():
            self.assertIn(record_id, self.records, legacy_name)
            self.assertRegex(record_id, STABLE_ID_RE)
            self.assertEqual(legacy_name, self.records[record_id]["name"])

    def test_every_canonical_osric_class_has_stable_id(self) -> None:
        for legacy_name, record_id in CLASS_IDS.items():
            self.assertIn(record_id, self.records, legacy_name)
            self.assertRegex(record_id, STABLE_ID_RE)
            self.assertEqual(legacy_name, self.records[record_id]["name"])

    def test_progression_references_resolve(self) -> None:
        for record_id in CLASS_IDS.values():
            progression_ref = self.records[record_id]["progression_ref"]
            self.assertIn(progression_ref, self.records)
            self.assertEqual("class_progression", self.records[progression_ref]["type"])

    def test_saving_throw_references_resolve(self) -> None:
        for record_id in CLASS_IDS.values():
            saving_throw_ref = self.records[record_id]["saving_throw_ref"]
            self.assertIn(saving_throw_ref, self.records)
            self.assertEqual("saving_throw_progression", self.records[saving_throw_ref]["type"])

    def test_attack_progression_references_resolve(self) -> None:
        for record_id in CLASS_IDS.values():
            attack_ref = self.records[record_id]["attack_progression_ref"]
            self.assertIn(attack_ref, self.records)
            self.assertEqual("attack_progression", self.records[attack_ref]["type"])

    def test_spell_slot_references_resolve(self) -> None:
        for record_id in CLASS_IDS.values():
            spellcasting = self.records[record_id].get("spellcasting")
            if not spellcasting:
                continue
            slot_ref = spellcasting["spell_slot_progression_ref"]
            self.assertIn(slot_ref, self.records)
            self.assertEqual("spell_slot_progression", self.records[slot_ref]["type"])

    def test_legacy_display_names_map_to_canonical_ids(self) -> None:
        service = CanonicalContentService(root=REPO_ROOT, enabled=True)
        for legacy_name, record_id in CLASS_IDS.items():
            self.assertEqual(record_id, service.map_legacy_string("class", legacy_name).record_id)
        for legacy_name, record_id in RACE_IDS.items():
            self.assertEqual(record_id, service.map_legacy_string("race", legacy_name).record_id)

    def test_current_runtime_rules_remain_legacy_named(self) -> None:
        self.assertEqual(set(RACE_IDS), set(vault_rules.RACES))
        self.assertEqual(set(CLASS_IDS), set(vault_rules.CLASSES))
        self.assertTrue(vault_rules.race_allows_class("Human", "Fighter"))
        self.assertFalse(vault_rules.race_allows_class("Halfling", "Magic-User"))

    def test_builder_rule_helpers_remain_unchanged(self) -> None:
        self.assertTrue(vault_rules.class_allows_alignment("Paladin", "Lawful Good"))
        self.assertFalse(vault_rules.class_allows_alignment("Paladin", "Chaotic Good"))
        self.assertEqual({"1": 1, "2": 0, "3": 0, "4": 0}, vault_rules.spell_slots("Paladin", 9))

    def test_no_database_writes_are_performed(self) -> None:
        before = set(self.records)
        service = CanonicalContentService(root=REPO_ROOT, enabled=True).load_all()
        self.assertTrue(service.loaded)
        self.assertEqual(before, set(records_by_id()))

    def test_repo_sourced_class_progressions_include_xp_thresholds(self) -> None:
        for legacy_name in REPO_ADVANCEMENT_CLASSES:
            stem = legacy_name.lower().replace("-", "_").replace(" ", "_")
            progression = self.records[f"osric.progression.class.{stem}"]
            self.assertEqual("complete", progression["xp_progression_status"], legacy_name)
            self.assertTrue(progression["levels"], legacy_name)
            self.assertTrue(all(isinstance(level.get("xp_threshold"), int) for level in progression["levels"]), legacy_name)

    def test_repo_sourced_class_progressions_include_hit_dice(self) -> None:
        for legacy_name in REPO_ADVANCEMENT_CLASSES:
            stem = legacy_name.lower().replace("-", "_").replace(" ", "_")
            progression = self.records[f"osric.progression.class.{stem}"]
            self.assertEqual("complete", progression["hit_die_progression_status"], legacy_name)
            self.assertTrue(all(level.get("hit_dice") for level in progression["levels"]), legacy_name)

    def test_attack_progressions_are_non_empty_where_repo_has_attack_reference(self) -> None:
        for legacy_name in REPO_ADVANCEMENT_CLASSES:
            stem = legacy_name.lower().replace("-", "_").replace(" ", "_")
            attack = self.records[f"osric.attack.{stem}"]
            self.assertTrue(attack["rows"], legacy_name)
            self.assertIn(attack["progression_status"], {"partial", "complete"})

    def test_bard_and_monk_source_conflicts_are_explicit(self) -> None:
        for legacy_name in SOURCE_CONFLICT_CLASSES:
            stem = legacy_name.lower().replace("-", "_").replace(" ", "_")
            progression = self.records[f"osric.progression.class.{stem}"]
            saves = self.records[f"osric.saves.{stem}"]
            self.assertEqual("conflict", progression["review"]["status"])
            self.assertEqual("missing", progression["xp_progression_status"])
            self.assertEqual("conflict", saves["review"]["status"])

    def test_bard_spell_slot_conflict_is_explicit(self) -> None:
        bard_slots = self.records["osric.spell_slots.bard"]
        self.assertEqual("conflict", bard_slots["review"]["status"])
        self.assertEqual("missing", bard_slots["progression_status"])

    def test_classic_first_implementation_availability_excludes_advanced_legacy_classes(self) -> None:
        availability = [
            record for record in self.records.values()
            if record.get("type") == "availability_rule" and record.get("campaign_profile_id") == "campaign_profile.classic"
        ]
        active_ids = {record["record_id"] for record in availability if record.get("available")}
        inactive_ids = {record["record_id"] for record in availability if not record.get("available")}
        self.assertEqual({CLASS_IDS[name] for name in ACTIVE_CLASSIC_CLASSES}, active_ids)
        self.assertEqual({"osric.class.bard", "osric.class.monk"}, inactive_ids)

    def test_inactive_legacy_classes_still_map_for_existing_characters(self) -> None:
        service = CanonicalContentService(root=REPO_ROOT, enabled=True)
        self.assertEqual("osric.class.bard", service.map_legacy_string("class", "Bard").record_id)
        self.assertEqual("osric.class.monk", service.map_legacy_string("class", "Monk").record_id)
        self.assertFalse(self.records["osric.class.bard"]["first_implementation_available"])
        self.assertFalse(self.records["osric.class.monk"]["first_implementation_available"])


if __name__ == "__main__":
    unittest.main()
