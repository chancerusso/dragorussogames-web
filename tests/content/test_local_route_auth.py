from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from urllib.parse import urlsplit

from starlette.requests import Request

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "backend"))
os.environ.setdefault("DATABASE_URL", "sqlite:////private/tmp/drg1e-local-route-auth-test.db")

from backend.app.main import login_redirect  # noqa: E402


def request_for(url: str) -> Request:
    parsed = urlsplit(url)
    path = parsed.path.encode()
    return Request({
        "type": "http",
        "method": "GET",
        "path": parsed.path,
        "headers": [(b"host", parsed.netloc.encode())],
        "query_string": parsed.query.encode(),
        "scheme": parsed.scheme,
        "server": (parsed.hostname or "test", parsed.port or 443),
        "client": ("test", 1),
        "root_path": "",
        "http_version": "1.1",
        "raw_path": path,
    })


class LocalRouteAuthenticationTests(unittest.TestCase):
    def test_unified_character_route_redirects_to_player_login(self) -> None:
        response = login_redirect(
            request_for("https://table.dragorussogames.com/1e/characters/new/?campaign_id=7"),
            player=True,
        )
        self.assertEqual(
            "/portal/login?next=%2F1e%2Fcharacters%2Fnew%2F%3Fcampaign_id%3D7",
            response.headers["location"],
        )

    def test_classic_character_route_uses_classic_player_login(self) -> None:
        response = login_redirect(
            request_for("https://classic.dragorussogames.com/1e/characters/new/"),
            player=True,
        )
        self.assertEqual("/login?next=%2F1e%2Fcharacters%2Fnew%2F", response.headers["location"])

    def test_dm_route_still_redirects_to_dm_login(self) -> None:
        response = login_redirect(request_for("https://table.dragorussogames.com/1e/dm/"))
        self.assertEqual("/login?next=%2F1e%2Fdm%2F", response.headers["location"])


if __name__ == "__main__":
    unittest.main()
