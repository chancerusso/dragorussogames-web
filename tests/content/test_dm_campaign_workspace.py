from __future__ import annotations

import base64
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
os.environ.setdefault("DATABASE_URL", "sqlite:////private/tmp/drg1e-workspace-import.db")

from app.api import (  # noqa: E402
    create_admin_handout,
    create_admin_npc,
    create_admin_session,
    create_planning_item,
    delete_admin_handout,
    forward_planning_item,
    get_player_handout_file,
    list_player_handouts,
    permanently_delete_vault_campaign,
    update_admin_handout,
)
from app.db.base import Base  # noqa: E402
from app.db.models import (  # noqa: E402
    Campaign,
    CampaignHandout,
    CampaignNpc,
    CampaignPlayer,
    CampaignSession,
    Player,
    SessionPlanningItem,
    VaultCharacter,
)
import app.db.models  # noqa: E402,F401


class DmCampaignWorkspaceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.campaign = Campaign(name="Workspace Test", setting="greyhawk")
        self.player = Player(player_name="Player", username="workspace-player", active=True)
        self.db.add_all([self.campaign, self.player])
        self.db.flush()
        self.db.add(CampaignPlayer(campaign_id=self.campaign.id, user_id=self.player.id, role="player"))
        self.db.commit()

    def tearDown(self) -> None:
        self.db.close()

    def test_handouts_are_private_until_shared_and_can_be_deleted(self) -> None:
        created = create_admin_handout(
            self.campaign.id,
            {
                "title": "Secret Letter",
                "filename": "letter.txt",
                "content_type": "text/plain",
                "data_base64": base64.b64encode(b"Meet at midnight.").decode(),
            },
            {},
            self.db,
        )
        claims = {"sub": str(self.player.id)}
        self.assertEqual([], list_player_handouts(self.campaign.id, claims, self.db))
        with self.assertRaises(HTTPException) as hidden:
            get_player_handout_file(self.campaign.id, created["id"], claims, self.db)
        self.assertEqual(404, hidden.exception.status_code)

        update_admin_handout(self.campaign.id, created["id"], {"shared_with_players": True}, {}, self.db)
        self.assertEqual("Secret Letter", list_player_handouts(self.campaign.id, claims, self.db)[0]["title"])
        response = get_player_handout_file(self.campaign.id, created["id"], claims, self.db)
        self.assertEqual(b"Meet at midnight.", response.body)

        delete_admin_handout(self.campaign.id, created["id"], {}, self.db)
        self.assertIsNone(self.db.get(CampaignHandout, created["id"]))

    def test_npcs_sessions_and_forwarded_planning_are_persistent(self) -> None:
        npc = create_admin_npc(self.campaign.id, {"name": "Elmo", "notes": "Friendly ranger."}, {}, self.db)
        self.assertEqual("Elmo", self.db.get(CampaignNpc, npc["id"]).name)
        session = create_admin_session(self.campaign.id, {"session_number": 1, "session_date": "2026-07-29"}, {}, self.db)
        updated = create_planning_item(
            self.campaign.id,
            session["id"],
            {"category": "scenes", "text": "The ruined moat house"},
            {},
            self.db,
        )
        item = updated["planning_items"][0]
        forwarded = forward_planning_item(self.campaign.id, session["id"], item["id"], {}, self.db)
        self.assertEqual(2, forwarded["session_number"])
        self.assertEqual("The ruined moat house", forwarded["planning_items"][0]["text"])
        self.assertFalse(forwarded["planning_items"][0]["completed"])

    def test_permanent_campaign_delete_unassigns_character_and_removes_workspace(self) -> None:
        character = VaultCharacter(
            user_id=self.player.id,
            campaign_id=self.campaign.id,
            name="Surviving Hero",
            race="Human",
            class_name="Fighter",
            class_tracks=[{"class_name": "Fighter", "level": 1, "xp": 0, "state": "active"}],
            alignment="Neutral",
        )
        self.db.add(character)
        self.db.commit()
        create_admin_npc(self.campaign.id, {"name": "Disposable NPC"}, {}, self.db)
        session = create_admin_session(self.campaign.id, {"session_number": 1}, {}, self.db)
        create_planning_item(self.campaign.id, session["id"], {"category": "notes", "text": "Disposable note"}, {}, self.db)

        with self.assertRaises(HTTPException):
            permanently_delete_vault_campaign(self.campaign.id, {"confirmation": "wrong"}, {}, self.db)
        result = permanently_delete_vault_campaign(self.campaign.id, {"confirmation": self.campaign.name}, {}, self.db)
        self.assertTrue(result["deleted"])
        self.assertIsNone(self.db.get(Campaign, self.campaign.id))
        self.assertIsNone(self.db.get(VaultCharacter, character.id).campaign_id)
        self.assertEqual(0, self.db.scalar(select(func.count()).select_from(CampaignNpc)))
        self.assertEqual(0, self.db.scalar(select(func.count()).select_from(CampaignSession)))
        self.assertEqual(0, self.db.scalar(select(func.count()).select_from(SessionPlanningItem)))


if __name__ == "__main__":
    unittest.main()
