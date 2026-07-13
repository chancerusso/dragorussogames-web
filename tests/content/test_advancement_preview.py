from __future__ import annotations

import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "backend"))

from backend.app.services.advancement import AdvancementPreviewService, runtime_audit_payload  # noqa: E402
from backend.app.services.canonical_content import CanonicalContentService  # noqa: E402


class AdvancementPreviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.service = AdvancementPreviewService(CanonicalContentService(root=REPO_ROOT, enabled=True))

    def character(self, class_name: str, level: int, xp: int, specialty: str | None = None, constitution: int = 15):
        return SimpleNamespace(
            id=1,
            class_name=class_name,
            level=level,
            xp=xp,
            subclass_or_specialty=specialty,
            abilities=SimpleNamespace(constitution=constitution, racial_adjusted_constitution=constitution),
        )

    def test_osric_fighter_next_level_preview(self) -> None:
        preview = self.service.preview_advancement(self.character("Fighter", 6, 75000), target_level=7)
        self.assertEqual("osric.class.fighter", preview["class_track"]["class_id"])
        self.assertEqual("1d10", preview["hit_point_advancement"]["roll"])
        self.assertTrue(preview["attack_progression"]["changed"])
        self.assertEqual(16, preview["attack_progression"]["old"]["final_thac0"])
        self.assertEqual(14, preview["attack_progression"]["new"]["final_thac0"])
        self.assertIn("osric.progression.class.fighter", preview["source_records_used"])

    def test_osric_cleric_spell_slot_unlock_preview(self) -> None:
        preview = self.service.preview_advancement(self.character("Cleric", 2, 1500), target_level=3)
        self.assertTrue(preview["spellcasting"]["changed"])
        self.assertIn("2", preview["spellcasting"]["new_spell_levels_unlocked"])
        self.assertEqual("osric.spell_slots.cleric", preview["spellcasting"]["source_record_id"])

    def test_osric_magic_user_test_of_high_sorcery_gate(self) -> None:
        preview = self.service.preview_advancement(self.character("Magic-User", 3, 10000), target_level=4)
        self.assertTrue(any(gate["id"] == "dragolance.ability.test_of_high_sorcery" for gate in preview["gates"]))
        self.assertFalse(preview["read_only"] is False)

    def test_osric_thief_saving_throw_change_preview(self) -> None:
        preview = self.service.preview_advancement(self.character("Thief", 4, 10000), target_level=5)
        self.assertTrue(preview["saving_throws"]["changed"])

    def test_dragonlance_white_robe_preview_uses_overlay(self) -> None:
        preview = self.service.preview_advancement(self.character("Magic-User", 4, 38000, "White Robes"), target_level=5)
        self.assertEqual("dragolance.progression.high_sorcery.white_robes", preview["class_track"]["progression_id"])
        self.assertEqual("dragolance.spell_slots.high_sorcery.white_robes", preview["spellcasting"]["source_record_id"])

    def test_dragonlance_holy_orders_preview_uses_overlay(self) -> None:
        preview = self.service.preview_advancement(self.character("Cleric", 4, 14000, "Holy Orders of Good"), target_level=5)
        self.assertEqual("dragolance.progression.holy_orders.good", preview["class_track"]["progression_id"])
        self.assertEqual("dragolance.spell_slots.holy_orders.good", preview["spellcasting"]["source_record_id"])

    def test_knight_of_crown_preview(self) -> None:
        preview = self.service.preview_advancement(self.character("Fighter", 2, 3000, "Knight of the Crown"), target_level=3)
        self.assertEqual("dragolance.progression.solamnic.crown", preview["class_track"]["progression_id"])
        self.assertTrue(preview["attack_progression"]["changed"])
        self.assertEqual(20, preview["attack_progression"]["old"]["final_thac0"])
        self.assertEqual(18, preview["attack_progression"]["new"]["final_thac0"])
        self.assertTrue(any("solamnic" in gate["id"] for gate in preview["gates"]))

    def test_knight_class_name_preview_uses_solamnic_progression(self) -> None:
        preview = self.service.preview_advancement(self.character("Knight of the Crown", 1, 5000), target_level=2)
        self.assertEqual("osric.class.fighter", preview["class_track"]["class_id"])
        self.assertEqual("dragolance.progression.solamnic.crown", preview["class_track"]["progression_id"])
        self.assertTrue(preview["advancement_available"])

    def test_knight_of_sword_spell_unlock_preview(self) -> None:
        preview = self.service.preview_advancement(self.character("Fighter", 5, 95000, "Knight of the Sword"), target_level=6)
        self.assertEqual("dragolance.spell_slots.sword_knight", preview["spellcasting"]["source_record_id"])
        self.assertIn("1", preview["spellcasting"]["new_spell_levels_unlocked"])

    def test_knight_of_rose_transition_gate_preview(self) -> None:
        preview = self.service.preview_advancement(self.character("Fighter", 6, 60000, "Knight of the Rose"), target_level=7)
        self.assertTrue(any("solamnic" in gate["id"] for gate in preview["gates"]))

    def test_hp_roll_expression_and_constitution_adjustment(self) -> None:
        preview = self.service.preview_advancement(self.character("Fighter", 1, 1900, constitution=17), target_level=2)
        self.assertEqual("1d10", preview["hit_point_advancement"]["roll"])
        self.assertEqual(3, preview["hit_point_advancement"]["constitution_modifier"])
        self.assertEqual(1, preview["hit_point_advancement"]["minimum_gain"])

    def test_multiclass_and_dual_class_foundation_shapes(self) -> None:
        preview = self.service.preview_advancement(self.character("Fighter", 3, 4250), target_level=4)
        self.assertFalse(preview["multiclass"]["supported_by_current_schema"])
        self.assertFalse(preview["dual_class"]["supported_by_current_schema"])
        self.assertIn("class_tracks", preview["multiclass"]["missing_persistent_fields"])
        self.assertIn("original_class_id", preview["dual_class"]["missing_persistent_fields"])

    def test_missing_canonical_mapping_fails(self) -> None:
        with self.assertRaises(Exception):
            self.service.preview_advancement(self.character("Dragon Rider", 1, 0), target_level=2)

    def test_runtime_audit_classifies_progression_fields(self) -> None:
        audit = {entry["field"]: entry["classification"] for entry in runtime_audit_payload()}
        self.assertEqual("manually editable", audit["level"])
        self.assertEqual("canonical-derived", audit["THAC0"])
        self.assertEqual("missing", audit["multiclass records"])
        self.assertEqual("legacy-only", audit["High Sorcery order"])


if __name__ == "__main__":
    unittest.main()
