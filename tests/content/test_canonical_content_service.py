from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "backend"))

from backend.app.services import vault_rules  # noqa: E402
from backend.app.services.canonical_content import CanonicalContentError, CanonicalContentService  # noqa: E402


CANONICAL_PATHS = [
    "content/schemas",
    "content/sources",
    "content/tools",
    "content/osric/core",
    "content/options/classic",
    "content/options/dragolance",
    "content/campaigns/templates",
]


class CanonicalContentServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        for relative in CANONICAL_PATHS:
            source = REPO_ROOT / relative
            target = self.root / relative
            if source.exists():
                shutil.copytree(source, target)

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def service(self, enabled: bool = True) -> CanonicalContentService:
        return CanonicalContentService(root=self.root, enabled=enabled)

    def load_record(self, relative: str) -> dict:
        return json.loads((self.root / relative).read_text(encoding="utf-8"))

    def save_record(self, relative: str, data: dict) -> None:
        (self.root / relative).write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    def test_loader_initializes_with_valid_canonical_content(self) -> None:
        service = self.service().load_all()
        self.assertTrue(service.loaded)
        self.assertEqual("Fighter", service.get_by_id("osric.class.fighter")["name"])

    def test_loader_fails_clearly_on_invalid_content(self) -> None:
        data = self.load_record("content/osric/core/classes/fighter.json")
        data["progression_ref"] = "osric.progression.class.missing"
        self.save_record("content/osric/core/classes/fighter.json", data)
        with self.assertRaises(CanonicalContentError) as context:
            self.service().load_all()
        self.assertIn("osric.progression.class.missing", str(context.exception))

    def test_stable_id_lookup_works(self) -> None:
        service = self.service().load_all()
        self.assertEqual("race", service.get_by_id("osric.race.human")["type"])

    def test_type_lookup_works(self) -> None:
        service = self.service().load_all()
        expected = {
            f"osric.class.{class_name.lower().replace('-', '_').replace(' ', '_')}"
            for class_name in vault_rules.CLASSES
        }
        self.assertEqual(expected, {record["id"] for record in service.list_by_type("class")})

    def test_source_lookup_works(self) -> None:
        service = self.service().load_all()
        source_records = service.list_by_source("dragonlance_adventures")
        self.assertEqual({"dragolance.race.kender", "dragolance.order.white_robes", "dragolance.moon.solinari"}, {record["id"] for record in source_records})

    def test_campaign_availability_works(self) -> None:
        service = self.service().load_all()
        available = service.get_available_records("campaign_profile.dragolance", "race")
        self.assertEqual(["dragolance.race.kender"], [record["id"] for record in available])

    def test_dragolance_extension_resolution_works(self) -> None:
        service = self.service().load_all()
        extensions = service.get_extensions("campaign_profile.dragolance", "osric.class.magic_user")
        self.assertEqual(["dragolance.extension.magic_user.high_sorcery"], [record["id"] for record in extensions])

    def test_restriction_lookup_works(self) -> None:
        service = self.service().load_all()
        self.assertEqual([], service.get_restrictions("campaign_profile.dragolance"))

    def test_legacy_string_mapping_resolves_exact_matches(self) -> None:
        service = self.service()
        result = service.map_legacy_string("class", "Magic-User")
        self.assertEqual("resolved", result.status)
        self.assertEqual("osric.class.magic_user", result.record_id)

    def test_ambiguous_legacy_mapping_does_not_silently_resolve(self) -> None:
        service = self.service()
        service.set_legacy_mappings_for_tests({("class", "ranger"): ["osric.class.ranger", "dragolance.class.ranger"]})
        result = service.map_legacy_string("class", "Ranger")
        self.assertEqual("ambiguous", result.status)
        self.assertIsNone(result.record_id)
        self.assertIsNotNone(result.warning)

    def test_feature_flag_disabled_leaves_loader_unloaded(self) -> None:
        service = self.service(enabled=False)
        service.load_all()
        self.assertFalse(service.loaded)
        self.assertIsNone(service.get_by_id("osric.class.fighter"))

    def test_feature_flag_enabled_loads_without_changing_legacy_api_shape(self) -> None:
        service = self.service(enabled=True).load_all()
        legacy_like_payload = {
            "races": {"Human": {}},
            "classes": {"Fighter": {}, "Magic-User": {}},
            "alignments": ["Lawful Good"],
        }
        self.assertTrue(service.loaded)
        self.assertEqual(["races", "classes", "alignments"], list(legacy_like_payload.keys()))


if __name__ == "__main__":
    unittest.main()
