import os
from pathlib import Path
import sys
import unittest

os.environ["DATABASE_URL"] = "sqlite:////private/tmp/drg1e-campaign-mapping-test.db"
os.environ.setdefault("ADMIN_PASSWORD", "mapping-test-admin")
os.environ.setdefault("SECRET_KEY", "mapping-test-secret")
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api import (
    create_admin_campaign_map,
    get_player_campaign_map,
    list_player_campaign_maps,
    update_admin_campaign_table_state,
    update_player_campaign_map,
)
from app.db.base import Base
from app.db.models import Campaign, CampaignMapRevision, CampaignPlayer, Player
from app.db.session import engine


class CampaignMappingApiTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        self.db = Session(engine)
        self.campaign = Campaign(name="Mapping Test", setting="greyhawk")
        self.mapper = Player(player_name="Mapper", username="mapper", active=True)
        self.viewer = Player(player_name="Viewer", username="viewer", active=True)
        self.db.add_all([self.campaign, self.mapper, self.viewer])
        self.db.flush()
        self.db.add_all([
            CampaignPlayer(campaign_id=self.campaign.id, user_id=self.mapper.id, role="player"),
            CampaignPlayer(campaign_id=self.campaign.id, user_id=self.viewer.id, role="player"),
        ])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_dm_controls_map_and_only_assigned_mapper_can_write(self):
        created = create_admin_campaign_map(
            self.campaign.id,
            {"name": "The Old Ruins", "mapper_user_id": self.mapper.id},
            {},
            self.db,
        )
        update_admin_campaign_table_state(
            self.campaign.id,
            {"table_mode": "mapping", "active_map_id": created["id"]},
            {},
            self.db,
        )

        mapper_maps = list_player_campaign_maps(self.campaign.id, {"sub": str(self.mapper.id)}, self.db)
        viewer_maps = list_player_campaign_maps(self.campaign.id, {"sub": str(self.viewer.id)}, self.db)
        self.assertTrue(mapper_maps[0]["can_edit"])
        self.assertFalse(viewer_maps[0]["can_edit"])

        updated = update_player_campaign_map(
            self.campaign.id,
            created["id"],
            {
                "drawing_state": {
                    "objects": [{"id": "wall-1", "type": "line", "x": 0, "y": 0, "x2": 20, "y2": 0}],
                    "notes": [],
                },
                "viewport": {"x": 120, "y": 80, "zoom": 1},
            },
            {"sub": str(self.mapper.id)},
            self.db,
        )
        self.assertEqual(updated["revision"], 2)
        self.assertEqual(updated["viewport"]["x"], 120)
        self.assertEqual(get_player_campaign_map(self.campaign.id, created["id"], {"sub": str(self.viewer.id)}, self.db)["drawing_state"]["objects"][0]["id"], "wall-1")
        revision_count = self.db.scalar(select(func.count()).select_from(CampaignMapRevision))
        self.assertEqual(revision_count, 2)

        with self.assertRaises(HTTPException) as denied:
            update_player_campaign_map(
                self.campaign.id,
                created["id"],
                {"drawing_state": {"objects": [], "notes": []}},
                {"sub": str(self.viewer.id)},
                self.db,
            )
        self.assertEqual(denied.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
