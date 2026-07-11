from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "content" / "tools"))

from validate_content import validate_content  # noqa: E402


CANONICAL_PATHS = [
    "content/schemas",
    "content/sources",
    "content/osric/core",
    "content/options/classic",
    "content/options/dragolance",
    "content/campaigns/templates",
]


class ContentValidationTests(unittest.TestCase):
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

    def load(self, relative: str) -> dict:
        return json.loads((self.root / relative).read_text(encoding="utf-8"))

    def save(self, relative: str, data: dict) -> None:
        path = self.root / relative
        path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    def assert_has_error(self, needle: str) -> None:
        result = validate_content(self.root)
        self.assertTrue(result.errors, "expected validation errors")
        self.assertIn(needle, "\n".join(result.errors))

    def test_valid_content_passes(self) -> None:
        result = validate_content(self.root)
        self.assertEqual([], result.errors)

    def test_duplicate_ids_fail(self) -> None:
        duplicate = self.root / "content/osric/core/classes/fighter-copy.json"
        shutil.copyfile(self.root / "content/osric/core/classes/fighter.json", duplicate)
        self.assert_has_error("duplicate id")

    def test_missing_source_library_fails(self) -> None:
        data = self.load("content/osric/core/races/human.json")
        data["source_library_id"] = "missing_source"
        self.save("content/osric/core/races/human.json", data)
        self.assert_has_error("missing source library")

    def test_broken_reference_fails(self) -> None:
        data = self.load("content/options/dragolance/extensions/magic_user_high_sorcery.json")
        data["target_id"] = "osric.class.nope"
        self.save("content/options/dragolance/extensions/magic_user_high_sorcery.json", data)
        self.assert_has_error("missing referenced id 'osric.class.nope'")

    def test_bad_stable_id_fails(self) -> None:
        data = self.load("content/osric/core/classes/fighter.json")
        data["id"] = "OSRIC Class Fighter"
        self.save("content/osric/core/classes/fighter.json", data)
        self.assert_has_error("malformed stable id")

    def test_player_visible_internal_only_material_fails(self) -> None:
        data = self.load("content/osric/core/races/human.json")
        data["visibility"]["description_status"] = "internal_only"
        self.save("content/osric/core/races/human.json", data)
        self.assert_has_error("player-visible record has internal-only description status")

    def test_wrong_directory_type_placement_fails(self) -> None:
        misplaced = self.root / "content/osric/core/classes/human.json"
        shutil.copyfile(self.root / "content/osric/core/races/human.json", misplaced)
        self.assert_has_error("type 'race' is not allowed in this directory")

    def test_classic_profile_validates(self) -> None:
        result = validate_content(self.root)
        self.assertFalse(any("campaign_profile.classic" in error for error in result.errors))

    def test_dragolance_extension_validates_against_osric_target(self) -> None:
        result = validate_content(self.root)
        self.assertFalse(any("dragolance.extension.magic_user.high_sorcery" in error for error in result.errors))


if __name__ == "__main__":
    unittest.main()
