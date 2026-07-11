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


EXTENSION_RELATIONSHIPS = {
    "dragolance.extension.magic_user.high_sorcery": "osric.class.magic_user",
    "dragolance.extension.illusionist.high_sorcery": "osric.class.illusionist",
    "dragolance.extension.cleric.holy_orders": "osric.class.cleric",
    "dragolance.extension.fighter.solamnic_knighthood": "osric.class.fighter",
}

ORGANIZATION_IDS = {
    "dragolance.order.high_sorcery",
    "dragolance.order.white_robes",
    "dragolance.order.red_robes",
    "dragolance.order.black_robes",
    "dragolance.order.holy_orders",
    "dragolance.order.solamnic_knights",
    "dragolance.order.knights_crown",
    "dragolance.order.knights_sword",
    "dragolance.order.knights_rose",
}

DEITY_IDS = {
    "dragolance.deity.paladine",
    "dragolance.deity.kiri_jolith",
    "dragolance.deity.habbakuk",
    "dragolance.deity.mishakal",
    "dragolance.deity.solinari",
    "dragolance.deity.lunitari",
    "dragolance.deity.nuitari",
}

MOON_IDS = {
    "dragolance.moon.solinari",
    "dragolance.moon.lunitari",
    "dragolance.moon.nuitari",
}

CLASS_RESTRICTION_IDS = {
    "dragolance.restriction.class.assassin_unavailable",
    "dragolance.restriction.class.magic_user_high_sorcery_required",
    "dragolance.restriction.class.illusionist_high_sorcery_required",
    "dragolance.restriction.class.cleric_deity_required",
    "dragolance.restriction.class.druid_heathen_review",
    "dragolance.restriction.class.paladin_campaign_review",
    "dragolance.restriction.class.ranger_campaign_review",
}


def records_by_id() -> dict[str, dict]:
    records = {}
    for path in canonical_json_files(REPO_ROOT):
        record = load_json(path)
        records[record["id"]] = record
    return records


class DragolanceClassRelationshipTests(unittest.TestCase):
    def setUp(self) -> None:
        self.records = records_by_id()

    def test_class_extension_targets_resolve_to_osric_classes(self) -> None:
        for extension_id, target_id in EXTENSION_RELATIONSHIPS.items():
            extension = self.records[extension_id]
            target = self.records[target_id]
            self.assertEqual("extension_rule", extension["type"], extension_id)
            self.assertEqual(target_id, extension["target_id"], extension_id)
            self.assertEqual("class", target["type"], target_id)

    def test_organization_references_resolve(self) -> None:
        for organization_id in ORGANIZATION_IDS:
            organization = self.records[organization_id]
            self.assertEqual("organization", organization["type"], organization_id)
            for extension_id in organization["class_extensions"]:
                self.assertIn(extension_id, self.records, organization_id)

    def test_deity_references_resolve(self) -> None:
        for deity_id in DEITY_IDS:
            deity = self.records[deity_id]
            self.assertEqual("deity", deity["type"], deity_id)
            for extension_id in deity["cleric_extensions"]:
                self.assertIn(extension_id, self.records, deity_id)

    def test_moon_references_resolve_to_orders(self) -> None:
        for moon_id in MOON_IDS:
            moon = self.records[moon_id]
            self.assertEqual("moon", moon["type"], moon_id)
            for organization_id in moon["affects"]:
                self.assertIn(organization_id, self.records, moon_id)

    def test_campaign_profile_references_class_availability_and_restrictions(self) -> None:
        profile = self.records["campaign_profile.dragolance"]
        self.assertTrue(CLASS_RESTRICTION_IDS.issubset(set(profile["restriction_sets"])))
        expected_availability = {
            "dragolance.availability.class.magic_user",
            "dragolance.availability.class.illusionist",
            "dragolance.availability.class.cleric",
            "dragolance.availability.class.fighter",
            "dragolance.availability.class.ranger",
            "dragolance.availability.class.paladin",
            "dragolance.availability.class.thief",
            "dragolance.availability.class.druid",
            "dragolance.availability.class.assassin",
        }
        self.assertTrue(expected_availability.issubset(set(profile["availability_sets"])))

    def test_loader_resolves_class_extensions_and_restrictions(self) -> None:
        service = CanonicalContentService(root=REPO_ROOT, enabled=True).load_all()
        magic_extensions = service.get_extensions("campaign_profile.dragolance", "osric.class.magic_user")
        fighter_extensions = service.get_extensions("campaign_profile.dragolance", "osric.class.fighter")
        assassin_restrictions = service.get_restrictions("campaign_profile.dragolance", "osric.class.assassin")
        self.assertEqual(["dragolance.extension.magic_user.high_sorcery"], [item["id"] for item in magic_extensions])
        self.assertEqual(["dragolance.extension.fighter.solamnic_knighthood"], [item["id"] for item in fighter_extensions])
        self.assertEqual(["dragolance.restriction.class.assassin_unavailable"], [item["id"] for item in assassin_restrictions])

    def test_no_runtime_or_database_behavior_is_changed(self) -> None:
        before = set(self.records)
        service = CanonicalContentService(root=REPO_ROOT, enabled=True).load_all()
        self.assertTrue(service.loaded)
        self.assertEqual(before, set(records_by_id()))


if __name__ == "__main__":
    unittest.main()
