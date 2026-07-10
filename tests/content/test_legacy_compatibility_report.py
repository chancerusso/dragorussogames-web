from __future__ import annotations

import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "content" / "tools"))

from report_legacy_compatibility import (  # noqa: E402
    RISK_CONFLICT,
    RISK_MISSING,
    RISK_SAFE,
    build_report,
    duplicate_names,
    map_legacy_name,
    mapping_summary,
    read_character_values,
)


class LegacyCompatibilityReportTests(unittest.TestCase):
    def test_exact_mapping(self) -> None:
        finding = map_legacy_name("Fighter", [{"id": "osric.class.fighter", "name": "Fighter"}])
        self.assertEqual(RISK_SAFE, finding.risk)
        self.assertEqual("exact", finding.match_type)
        self.assertEqual("osric.class.fighter", finding.canonical_id)

    def test_normalized_mapping(self) -> None:
        finding = map_legacy_name("Sword, long", [{"id": "osric.weapon.long_sword", "name": "Long Sword"}])
        self.assertEqual(RISK_SAFE, finding.risk)
        self.assertEqual("normalized", finding.match_type)
        self.assertEqual("osric.weapon.long_sword", finding.canonical_id)

    def test_ambiguous_mapping(self) -> None:
        finding = map_legacy_name(
            "Ranger",
            [
                {"id": "osric.class.ranger", "name": "Ranger"},
                {"id": "dragolance.class.ranger", "name": "Ranger"},
            ],
        )
        self.assertEqual(RISK_CONFLICT, finding.risk)
        self.assertEqual("ambiguous", finding.match_type)
        self.assertIsNone(finding.canonical_id)

    def test_missing_canonical_record(self) -> None:
        finding = map_legacy_name("Dwarf", [{"id": "osric.race.human", "name": "Human"}])
        self.assertEqual(RISK_MISSING, finding.risk)
        self.assertEqual("missing", finding.match_type)

    def test_duplicate_legacy_record_detection(self) -> None:
        duplicates = duplicate_names(["Magic Missile", "magic-missile", "Fireball"])
        self.assertEqual({"Magic Missile": 2}, duplicates)

    def test_conflict_classification(self) -> None:
        finding = map_legacy_name("Cleric", [{"id": "a.class.cleric", "name": "Cleric"}, {"id": "b.class.cleric", "name": "Cleric"}])
        self.assertEqual(RISK_CONFLICT, finding.risk)

    def test_aggregate_readiness_counts(self) -> None:
        findings = [
            map_legacy_name("Human", [{"id": "osric.race.human", "name": "Human"}]),
            map_legacy_name("Dwarf", [{"id": "osric.race.human", "name": "Human"}]),
        ]
        summary = mapping_summary(findings)
        self.assertEqual(2, summary["total"])
        self.assertEqual(1, summary["safe"])
        self.assertEqual(50.0, summary["safe_percent"])

    def test_no_db_writes(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            db_path = Path(tempdir) / "compat.db"
            connection = sqlite3.connect(db_path)
            connection.executescript(
                """
                create table vault_characters(race text, class_name text);
                create table spells_catalog(id integer, name text);
                create table character_spells(spell_id integer);
                create table equipment_catalog(id integer, name text);
                create table character_inventory(equipment_id integer);
                insert into vault_characters values('Human', 'Fighter');
                insert into spells_catalog values(1, 'Magic Missile');
                insert into character_spells values(1);
                insert into equipment_catalog values(1, 'Sword, long');
                insert into character_inventory values(1);
                """
            )
            connection.commit()
            before = connection.execute("select count(*) from sqlite_master where type='table'").fetchone()[0]
            connection.close()

            values = read_character_values(f"sqlite:///{db_path}")

            connection = sqlite3.connect(db_path)
            after = connection.execute("select count(*) from sqlite_master where type='table'").fetchone()[0]
            character_count = connection.execute("select count(*) from vault_characters").fetchone()[0]
            connection.close()

        self.assertTrue(values["inspected"])
        self.assertEqual(before, after)
        self.assertEqual(1, character_count)

    def test_no_runtime_api_changes(self) -> None:
        before_api_loaded = "app.api" in sys.modules or "app.main" in sys.modules
        report = build_report(REPO_ROOT)
        after_api_loaded = "app.api" in sys.modules or "app.main" in sys.modules
        self.assertEqual(before_api_loaded, after_api_loaded)
        self.assertIn("migration_readiness", report)

    def test_dragonlance_pdf_coverage_is_reported(self) -> None:
        report = build_report(REPO_ROOT)
        self.assertIn("pdf_coverage", report["dragolance"])
        self.assertIn("per_race_completeness", report["dragolance"])
        self.assertIn("per_class_completeness", report["dragolance"])
        self.assertIn("human_review_queue", report["dragolance"])
        self.assertGreaterEqual(report["dragolance"]["pdf_coverage"]["total_classes_orders_found_in_pdf"], 1)

    def test_data_authority_is_reported(self) -> None:
        report = build_report(REPO_ROOT)
        self.assertEqual(
            "private-reference/sources/osric_core_rules.pdf",
            report["data_authority"]["osric"]["verification_only"],
        )
        self.assertEqual(
            "private-reference/sources/Dragonlance_Adventures_1e.pdf",
            report["data_authority"]["dragolance"]["authoritative_private_reference"],
        )
        self.assertIn("vault_rules.py", report["data_authority"]["osric"]["primary"][0])


if __name__ == "__main__":
    unittest.main()
