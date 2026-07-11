from __future__ import annotations

import sys
import unittest
import os
from pathlib import Path

from fastapi import HTTPException

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "backend"))
os.environ.setdefault("DATABASE_URL", "sqlite:////private/tmp/drg1e-canonical-reference-api-test.db")

from backend.app.api import canonical_reference_catalog, canonical_reference_record  # noqa: E402
from backend.app.main import app  # noqa: E402


class CanonicalReferenceApiTests(unittest.TestCase):
    def test_catalog_lists_sources_and_rules_pages(self) -> None:
        payload = canonical_reference_catalog(_={})
        self.assertIn("osric", {source["id"] for source in payload["sources"]})
        self.assertIn("dragonlance_adventures", {source["id"] for source in payload["sources"]})
        self.assertIn("rules_page", payload["record_types"])
        self.assertTrue(any(page["route"].startswith("/1e/") for page in payload["rules_pages"]))

    def test_catalog_filters_by_source_type_and_search(self) -> None:
        payload = canonical_reference_catalog(source_library_id="dragonlance_adventures", record_type="organization", q="white", _={})
        records = payload["records"]
        self.assertTrue(records)
        self.assertTrue(all(record["source_library_id"] == "dragonlance_adventures" for record in records))
        self.assertTrue(all(record["type"] == "organization" for record in records))
        self.assertTrue(any(record["id"] == "dragolance.order.white_robes" for record in records))

    def test_record_detail_returns_relationships(self) -> None:
        payload = canonical_reference_record("dragolance.progression.high_sorcery.white_robes", _={})
        self.assertEqual("dragolance.progression.high_sorcery.white_robes", payload["record"]["id"])
        reference_ids = {reference["id"] for reference in payload["references"]}
        self.assertIn("dragolance.order.white_robes", reference_ids)
        self.assertIn("dragolance.ability.moon_magic_modifier", reference_ids)

    def test_missing_record_returns_404(self) -> None:
        with self.assertRaises(HTTPException) as context:
            canonical_reference_record("missing.record", _={})
        self.assertEqual(404, context.exception.status_code)

    def test_reference_routes_are_read_only(self) -> None:
        reference_routes = [route for route in app.routes if getattr(route, "path", "").startswith("/api/1e/reference")]
        methods = set().union(*(getattr(route, "methods", set()) for route in reference_routes))
        self.assertTrue(methods)
        self.assertFalse({"POST", "PUT", "PATCH", "DELETE"} & methods)

    def test_private_one_e_source_path_is_explicitly_blocked(self) -> None:
        paths = {getattr(route, "path", "") for route in app.routes}
        self.assertIn("/content/1e/source/{source_path:path}", paths)


if __name__ == "__main__":
    unittest.main()
