from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os
import sys
import unittest
from pathlib import Path

from fastapi import HTTPException, Response
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "backend"))
os.environ.setdefault("DATABASE_URL", "sqlite:////private/tmp/drg1e-player-invite-import.db")

from app.api import (  # noqa: E402
    claim_player_invite,
    create_vault_player,
    create_vault_player_invite,
    inspect_player_invite,
    player_login,
)
from app.db.base import Base  # noqa: E402
from app.db.models import Campaign, PlayerInvite  # noqa: E402
import app.db.models  # noqa: E402,F401


class PlayerInviteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.campaign = Campaign(name="Invite Test", setting="greyhawk")
        self.db.add(self.campaign)
        self.db.commit()

    def tearDown(self) -> None:
        self.db.close()

    def create_player_and_invite(self, username: str = "first-time") -> tuple[dict, dict]:
        player = create_vault_player(
            {
                "display_name": "First Time Player",
                "username": username,
                "campaign_ids": [self.campaign.id],
            },
            {},
            self.db,
        )
        invite = create_vault_player_invite(player["id"], {}, self.db)
        return player, invite

    def test_player_chooses_password_from_single_use_invite(self) -> None:
        player, invite = self.create_player_and_invite()
        self.assertFalse(player["password_set"])
        inspected = inspect_player_invite({"token": invite["token"]}, self.db)
        self.assertEqual("first-time", inspected["username"])
        self.assertEqual(["Invite Test"], inspected["campaigns"])

        claimed = claim_player_invite(
            {
                "token": invite["token"],
                "password": "player-created-password",
                "password_confirmation": "player-created-password",
            },
            Response(),
            self.db,
        )
        self.assertTrue(claimed["user"]["password_set"])
        logged_in = player_login(
            {"username": "first-time", "password": "player-created-password"},
            Response(),
            self.db,
        )
        self.assertEqual(player["id"], logged_in["user"]["id"])
        with self.assertRaises(HTTPException) as replay:
            inspect_player_invite({"token": invite["token"]}, self.db)
        self.assertEqual(404, replay.exception.status_code)

    def test_invite_expiry_and_password_validation(self) -> None:
        _, invite = self.create_player_and_invite()
        record = self.db.query(PlayerInvite).filter_by(token_hash=__import__("hashlib").sha256(invite["token"].encode()).hexdigest()).one()
        record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        self.db.commit()
        with self.assertRaises(HTTPException) as expired:
            inspect_player_invite({"token": invite["token"]}, self.db)
        self.assertEqual(404, expired.exception.status_code)

        _, fresh = self.create_player_and_invite("second-player")
        with self.assertRaises(HTTPException) as weak:
            claim_player_invite(
                {"token": fresh["token"], "password": "short", "password_confirmation": "short"},
                Response(),
                self.db,
            )
        self.assertEqual(422, weak.exception.status_code)


if __name__ == "__main__":
    unittest.main()
