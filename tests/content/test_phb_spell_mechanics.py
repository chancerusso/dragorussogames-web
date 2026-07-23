import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MECHANICS_PATH = ROOT / "content" / "1e" / "source" / "phb_spell_mechanics.json"


class PhbSpellMechanicsTest(unittest.TestCase):
    def test_compact_header_fields_fit_database_columns(self):
        payload = json.loads(MECHANICS_PATH.read_text())
        limits = {
            "range": 120,
            "duration": 120,
            "area_of_effect": 160,
            "components": 120,
            "casting_time": 120,
            "saving_throw": 120,
            "school": 160,
        }

        for spell_name, class_entries in payload["entries"].items():
            for class_name, mechanics in class_entries.items():
                for field, limit in limits.items():
                    value = mechanics.get(field)
                    if value is not None:
                        self.assertLessEqual(
                            len(value),
                            limit,
                            f"{spell_name} ({class_name}) {field} exceeds {limit}",
                        )

    def test_identify_area_is_not_contaminated_by_familiar_table(self):
        payload = json.loads(MECHANICS_PATH.read_text())

        self.assertEqual(
            "One item",
            payload["entries"]["Identify"]["magic-user"]["area_of_effect"],
        )


if __name__ == "__main__":
    unittest.main()
