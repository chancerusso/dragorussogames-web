import json
import inspect
import os
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
os.environ.setdefault("DATABASE_URL", "sqlite:////private/tmp/drg1e-monster-catalog-test.db")
os.environ.setdefault("ADMIN_PASSWORD", "monster-catalog-test-admin")
os.environ.setdefault("SECRET_KEY", "monster-catalog-test-secret")
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

from backend.app.services.vault_rules import monster_seed  # noqa: E402
from backend.app.api import list_vault_monsters, require_jwt_admin  # noqa: E402


CATALOG_PATH = ROOT / "backend" / "app" / "data" / "monster_manual_monsters.json"


class MonsterManualCatalogTest(unittest.TestCase):
    def test_catalog_has_unique_verified_main_entries(self):
        catalog = json.loads(CATALOG_PATH.read_text())

        self.assertEqual(217, len(catalog))
        self.assertEqual(len(catalog), len({monster["slug"] for monster in catalog}))
        self.assertTrue(all(monster["source"] == "Monster Manual" for monster in catalog))
        self.assertTrue(all(monster["verification"] == "printed_stats_verified" for monster in catalog))
        self.assertTrue(all(monster["source_text"] == "" for monster in catalog))
        self.assertTrue(all(not monster["is_core_osric"] for monster in catalog))

    def test_seed_keeps_official_legacy_and_adventure_sources_separate(self):
        seeds = monster_seed()
        by_source = {}
        for seed in seeds:
            by_source.setdefault(seed["source"], []).append(seed)

        self.assertEqual(217, len(by_source["Monster Manual"]))
        self.assertTrue(by_source["Legacy OSRIC Catalog"])
        self.assertTrue(by_source["N1 Against the Cult of the Reptile God"])
        self.assertTrue(
            all(seed["verification"] == "adventure_source"
                for seed in by_source["N1 Against the Cult of the Reptile God"])
        )
        self.assertEqual(len(seeds), len({seed["slug"] for seed in seeds}))

    def test_known_correction_uses_printed_basilisk_statistics(self):
        basilisk = next(
            monster
            for monster in json.loads(CATALOG_PATH.read_text())
            if monster["slug"] == "basilisk"
        )

        self.assertEqual("Uncommon", basilisk["frequency"])
        self.assertEqual("6 + 1", basilisk["hit_dice"])
        self.assertEqual("1", basilisk["attacks"])
        self.assertEqual("Gaze turns to", basilisk["special_attacks"])

    def test_monster_catalog_endpoint_is_dm_only(self):
        dependency = inspect.signature(list_vault_monsters).parameters["_"].default

        self.assertIs(dependency.dependency, require_jwt_admin)


if __name__ == "__main__":
    unittest.main()
