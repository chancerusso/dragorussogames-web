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


DRAGOLANCE_RACE_IDS = {
    "dragolance.race.kender",
    "dragolance.race.tinker_gnome",
    "dragolance.race.silvanesti_elf",
    "dragolance.race.qualinesti_elf",
    "dragolance.race.kagonesti_elf",
    "dragolance.race.dimernesti_elf",
    "dragolance.race.dargonesti_elf",
    "dragolance.race.half_elf",
    "dragolance.race.hill_dwarf",
    "dragolance.race.mountain_dwarf",
    "dragolance.race.gully_dwarf",
    "dragolance.race.irda",
    "dragolance.race.minotaur",
}

VERIFIED_RACE_IDS = DRAGOLANCE_RACE_IDS - {
    "dragolance.race.dargonesti_elf",
    "dragolance.race.irda",
    "dragolance.race.minotaur",
}


def records_by_id() -> dict[str, dict]:
    records = {}
    for path in canonical_json_files(REPO_ROOT):
        record = load_json(path)
        records[record["id"]] = record
    return records


class DragolanceRaceCanonicalizationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.records = records_by_id()

    def test_all_source_races_have_canonical_records_or_explicit_handling(self) -> None:
        for record_id in DRAGOLANCE_RACE_IDS:
            self.assertIn(record_id, self.records)
            self.assertEqual("race", self.records[record_id]["type"])
        self.assertIn("dragolance.extension.race.human", self.records)
        self.assertIn("dragolance.restriction.race.halfling_unavailable", self.records)
        self.assertIn("dragolance.restriction.race.half_orc_unavailable", self.records)

    def test_verified_races_have_structured_builder_fields(self) -> None:
        for record_id in VERIFIED_RACE_IDS:
            record = self.records[record_id]
            self.assertEqual("verified", record["review"]["status"], record_id)
            self.assertTrue(record["ability_minimums"], record_id)
            self.assertTrue(record["ability_maximums"], record_id)
            self.assertTrue(record["level_limits"], record_id)
            self.assertIsNotNone(record["movement"], record_id)

    def test_uncertain_ocr_values_remain_needs_review(self) -> None:
        for record_id in ("dragolance.race.irda", "dragolance.race.minotaur"):
            record = self.records[record_id]
            self.assertEqual("needs_review", record["review"]["status"])
            self.assertIn("needs_review_fields", record)
        self.assertIn("irda_intelligence_minimum", self.records["dragolance.race.irda"]["needs_review_fields"])
        self.assertIn("minotaur_intelligence_minimum", self.records["dragolance.race.minotaur"]["needs_review_fields"])

    def test_dragolance_race_references_resolve(self) -> None:
        for record_id in DRAGOLANCE_RACE_IDS:
            record = self.records[record_id]
            for language_id in record["languages"]:
                self.assertIn(language_id, self.records, f"{record_id} language {language_id}")
            for class_id in record["class_access"]:
                self.assertIn(class_id, self.records, f"{record_id} class {class_id}")
            base_id = record.get("base_osric_race_ref")
            if base_id:
                self.assertIn(base_id, self.records, f"{record_id} base {base_id}")

    def test_dragolance_profile_makes_races_available(self) -> None:
        service = CanonicalContentService(root=REPO_ROOT, enabled=True).load_all()
        available = {record["id"] for record in service.get_available_records("campaign_profile.dragolance", "race")}
        self.assertTrue(DRAGOLANCE_RACE_IDS.issubset(available))

    def test_legacy_dragolance_race_names_map_explicitly(self) -> None:
        service = CanonicalContentService(root=REPO_ROOT, enabled=True)
        expected = {
            "Kender": "dragolance.race.kender",
            "Hill Dwarf": "dragolance.race.hill_dwarf",
            "Mountain Dwarf": "dragolance.race.mountain_dwarf",
            "Qualinesti Elf": "dragolance.race.qualinesti_elf",
            "Silvanesti Elf": "dragolance.race.silvanesti_elf",
            "Tinker Gnome": "dragolance.race.tinker_gnome",
            "Gully Dwarf": "dragolance.race.gully_dwarf",
            "Irda": "dragolance.race.irda",
            "Minotaur": "dragolance.race.minotaur",
        }
        for legacy_name, record_id in expected.items():
            result = service.map_legacy_string("race", legacy_name)
            self.assertEqual("resolved", result.status, legacy_name)
            self.assertEqual(record_id, result.record_id, legacy_name)

    def test_no_runtime_api_or_database_behavior_is_changed(self) -> None:
        before = set(self.records)
        service = CanonicalContentService(root=REPO_ROOT, enabled=True).load_all()
        self.assertTrue(service.loaded)
        self.assertEqual(before, set(records_by_id()))


if __name__ == "__main__":
    unittest.main()
