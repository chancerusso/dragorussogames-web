from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "backend"))
os.environ.setdefault("DATABASE_URL", "sqlite:////private/tmp/drg1e-multiclass-import.db")

from app.api import create_player_vault_character, create_vault_player  # noqa: E402
from app.db.base import Base  # noqa: E402
import app.db.models  # noqa: E402,F401
from app.services.multiclass import allowed_combinations, distribute_xp  # noqa: E402


class MulticlassCharacterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.player = create_vault_player(
            {
                "display_name": "Multiclass Player",
                "username": "multiclass-player",
                "password": "temporary-password",
            },
            {},
            self.db,
        )

    def tearDown(self) -> None:
        self.db.close()

    def character_data(self, race: str, classes: list[str]) -> dict:
        return {
            "name": "Practice Hero",
            "race": race,
            "class_name": classes[0],
            "class_tracks": [
                {"class_name": class_name, "level": 1, "xp": 0, "state": "active"}
                for class_name in classes
            ],
            "xp": 101,
            "alignment": "True Neutral",
            "abilities": {
                "strength": 16,
                "intelligence": 17,
                "wisdom": 12,
                "dexterity": 16,
                "constitution": 14,
                "charisma": 10,
            },
            "combat": {"max_hp": 5, "current_hp": 5},
            "coins": {},
        }

    def test_official_combinations_are_exposed(self) -> None:
        self.assertIn(["Fighter", "Magic-User", "Thief"], allowed_combinations("Elf"))
        self.assertIn(["Cleric", "Assassin"], allowed_combinations("Half-Orc"))
        self.assertEqual([], allowed_combinations("Human"))

    def test_multiclass_creation_divides_xp_and_derives_tracks(self) -> None:
        result = create_player_vault_character(
            self.character_data("Elf", ["Fighter", "Magic-User"]),
            {"sub": str(self.player["id"])},
            self.db,
        )
        self.assertTrue(result["is_multiclass"])
        self.assertEqual("Fighter/Magic-User", result["class_display"])
        self.assertEqual("1/1", result["level_display"])
        self.assertEqual([50, 50], [track["xp"] for track in result["class_tracks"]])
        self.assertEqual(["Magic-User"], [track["class_name"] for track in result["spellcasting_tracks"]])
        self.assertEqual("Fighter", result["combat"]["runtime"]["thac0"]["class_source"])

    def test_illegal_combination_is_rejected(self) -> None:
        with self.assertRaises(HTTPException) as rejected:
            create_player_vault_character(
                self.character_data("Dwarf", ["Fighter", "Magic-User"]),
                {"sub": str(self.player["id"])},
                self.db,
            )
        self.assertEqual(422, rejected.exception.status_code)

    def test_xp_remainder_is_not_assigned_to_a_track(self) -> None:
        tracks = distribute_xp(
            [
                {"class_name": "Fighter", "level": 1, "xp": 0},
                {"class_name": "Magic-User", "level": 1, "xp": 0},
                {"class_name": "Thief", "level": 1, "xp": 0},
            ],
            100,
        )
        self.assertEqual([33, 33, 33], [track["xp"] for track in tracks])


if __name__ == "__main__":
    unittest.main()
