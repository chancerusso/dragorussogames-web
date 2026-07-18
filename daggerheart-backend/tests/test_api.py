from __future__ import annotations

import os
import tempfile
import unittest

database_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
database_file.close()
os.environ["DAGGERHEART_DATABASE_URL"] = f"sqlite:///{database_file.name}"
os.environ["DAGGERHEART_SECRET_KEY"] = "test-secret"
os.environ["DAGGERHEART_GM_BOOTSTRAP_PASSWORD"] = "bootstrap-secret"

from fastapi.testclient import TestClient  # noqa: E402

from app.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


class DaggerheartApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        Base.metadata.create_all(engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client.close()
        Base.metadata.drop_all(engine)
        os.unlink(database_file.name)

    def setUp(self) -> None:
        with engine.begin() as connection:
            for table in reversed(Base.metadata.sorted_tables):
                connection.execute(table.delete())

        gm = self.client.post("/api/auth/bootstrap-gm", json={"username": "gamemaster", "display_name": "GM", "password": "password1", "bootstrap_password": "bootstrap-secret"})
        player = self.client.post("/api/auth/register", json={"username": "player", "display_name": "Player", "password": "password1"})
        self.gm_headers = {"Authorization": f"Bearer {gm.json()['token']}"}
        self.player_headers = {"Authorization": f"Bearer {player.json()['token']}"}

    def test_character_campaign_and_table_state_flow(self) -> None:
        character = self.client.post("/api/characters", headers=self.player_headers, json={
            "name": "Tass", "pronouns": "he/him", "level": 1,
            "mechanics": {"class": "Rogue", "ancestry": "Halfling"},
            "display_names": {"class": "Thief", "ancestry": "Kender"}, "sheet": {"hope": 2},
        })
        self.assertEqual(201, character.status_code)

        campaign = self.client.post("/api/campaigns", headers=self.gm_headers, json={"name": "Dragon Queen", "notes": ""})
        self.assertEqual(201, campaign.status_code)
        campaign_id = campaign.json()["id"]

        invitation = self.client.post(f"/api/campaigns/{campaign_id}/members", headers=self.gm_headers, json={"username": "player", "status": "invited"})
        self.assertEqual("invited", invitation.json()["status"])
        self.assertEqual("Dragon Queen", self.client.get("/api/invitations", headers=self.player_headers).json()[0]["name"])
        self.assertEqual(200, self.client.post(f"/api/campaigns/{campaign_id}/accept", headers=self.player_headers).status_code)
        self.assertEqual(200, self.client.post(f"/api/campaigns/{campaign_id}/characters", headers=self.gm_headers, json={"character_id": character.json()["id"]}).status_code)

        moved = self.client.put(f"/api/campaigns/{campaign_id}/player-token", headers=self.player_headers, json={"expected_revision": 0, "character_id": character.json()["id"], "x": 4, "y": 7})
        self.assertEqual(1, moved.json()["revision"])
        self.assertEqual(4, moved.json()["public_state"]["tokens"][0]["x"])

        saved = self.client.put(f"/api/campaigns/{campaign_id}/table-state", headers=self.gm_headers, json={
            "expected_revision": 1,
            "public_state": {"fear": 3, "countdowns": [{"name": "Gate", "current": 2, "maximum": 6}], "grid": {"columns": 16, "rows": 12, "cell_feet": 5}},
            "gm_state": {"adversaries": [{"name": "Draconian", "hp": 4}]},
        })
        self.assertEqual(2, saved.json()["revision"])

        player_state = self.client.get(f"/api/campaigns/{campaign_id}/table-state", headers=self.player_headers)
        self.assertEqual(3, player_state.json()["public_state"]["fear"])
        self.assertNotIn("gm_state", player_state.json())

        conflict = self.client.put(f"/api/campaigns/{campaign_id}/table-state", headers=self.gm_headers, json={"expected_revision": 1, "public_state": {}, "gm_state": {}})
        self.assertEqual(409, conflict.status_code)

    def test_players_cannot_read_uninvited_campaigns_or_all_characters(self) -> None:
        self.client.post("/api/characters", headers=self.player_headers, json={"name": "Mine"})
        campaign = self.client.post("/api/campaigns", headers=self.gm_headers, json={"name": "Private"})
        campaign_id = campaign.json()["id"]
        self.assertEqual(403, self.client.get(f"/api/campaigns/{campaign_id}", headers=self.player_headers).status_code)
        self.assertEqual(1, len(self.client.get("/api/characters", headers=self.player_headers).json()))
        self.assertEqual(1, len(self.client.get("/api/characters", headers=self.gm_headers).json()))


if __name__ == "__main__":
    unittest.main()
