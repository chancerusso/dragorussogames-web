from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "backend"))
os.environ.setdefault("DATABASE_URL", "sqlite:////private/tmp/drg1e-player-campaign-import.db")

from app.api import (  # noqa: E402
    create_player_vault_character,
    create_vault_player,
    delete_player_vault_character,
    delete_vault_player,
    update_player_vault_character,
)
from app.db.base import Base  # noqa: E402
from app.db.models import Campaign, CampaignPlayer, Player, VaultCharacter  # noqa: E402
import app.db.models  # noqa: E402,F401


class PlayerCampaignOwnershipTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.invited = Campaign(name="Invited Campaign", setting="greyhawk")
        self.closed = Campaign(name="Closed Campaign", setting="greyhawk")
        self.db.add_all([self.invited, self.closed])
        self.db.commit()

    def tearDown(self) -> None:
        self.db.close()

    def character_data(self, name: str = "Player Hero") -> dict:
        return {
            "name": name,
            "race": "Human",
            "class_name": "Fighter",
            "alignment": "Neutral Good",
            "abilities": {
                "strength": 16,
                "intelligence": 10,
                "wisdom": 11,
                "dexterity": 13,
                "constitution": 15,
                "charisma": 12,
            },
            "combat": {"max_hp": 8, "current_hp": 8},
            "coins": {},
        }

    def test_new_player_invitations_and_player_campaign_assignment(self) -> None:
        player_payload = create_vault_player(
            {
                "display_name": "Invited Player",
                "username": "invited-player",
                "password": "temporary-password",
                "campaign_ids": [self.invited.id],
            },
            {},
            self.db,
        )
        player_id = player_payload["id"]
        self.assertIsNotNone(self.db.get(CampaignPlayer, (self.invited.id, player_id)))

        character = create_player_vault_character(self.character_data(), {"sub": str(player_id)}, self.db)
        assigned = update_player_vault_character(
            character["id"],
            {"campaign_id": self.invited.id},
            {"sub": str(player_id)},
            self.db,
        )
        self.assertEqual(assigned["campaign_id"], self.invited.id)

        with self.assertRaises(HTTPException) as uninvited:
            update_player_vault_character(
                character["id"],
                {"campaign_id": self.closed.id},
                {"sub": str(player_id)},
                self.db,
            )
        self.assertEqual(uninvited.exception.status_code, 404)

    def test_permanent_character_and_player_deletion(self) -> None:
        player_payload = create_vault_player(
            {
                "display_name": "Disposable Player",
                "username": "disposable-player",
                "password": "temporary-password",
                "campaign_ids": [self.invited.id],
            },
            {},
            self.db,
        )
        player_id = player_payload["id"]
        first = create_player_vault_character(self.character_data("First Hero"), {"sub": str(player_id)}, self.db)
        delete_player_vault_character(first["id"], {"sub": str(player_id)}, self.db)
        self.assertIsNone(self.db.get(VaultCharacter, first["id"]))

        create_player_vault_character(self.character_data("Second Hero"), {"sub": str(player_id)}, self.db)
        result = delete_vault_player(player_id, {}, self.db)
        self.assertTrue(result["deleted"])
        self.assertEqual(result["character_count"], 1)
        self.assertIsNone(self.db.get(Player, player_id))
        self.assertEqual(
            self.db.scalar(select(func.count()).select_from(VaultCharacter).where(VaultCharacter.user_id == player_id)),
            0,
        )
        self.assertIsNone(self.db.get(CampaignPlayer, (self.invited.id, player_id)))


if __name__ == "__main__":
    unittest.main()
