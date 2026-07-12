from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import create_engine, func, select
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "backend"))
os.environ.setdefault("DATABASE_URL", "sqlite:////private/tmp/drg1e-runtime-repairs-import.db")

from app.api import (  # noqa: E402
    add_inventory_record,
    character_weapon_preview,
    character_payload,
    create_vault_character_for_player,
    delete_inventory_record,
    delete_player_vault_inventory,
    get_player_vault_character,
    get_vault_character,
    remove_weapon_proficiency,
    update_inventory_record,
    upsert_weapon_proficiency,
)
from app.db.base import Base  # noqa: E402
from app.db.models import EquipmentCatalog, Player, VaultCharacter, WeaponProficiency  # noqa: E402
from app.services.vault_rules import seed_vault_catalogs  # noqa: E402
from app.services.vault_rules import encumbrance  # noqa: E402
from app.services.combat_runtime import combat_payload, load_attack_progression, weapon_combat  # noqa: E402
import app.db.models  # noqa: E402,F401


class CharacterRuntimeRepairTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        seed_vault_catalogs(self.db)
        self.player = Player(player_name="Chance", display_name="Chance", username="drago", active=True)
        self.db.add(self.player)
        self.db.flush()
        self.character = create_vault_character_for_player(
            {
                "name": "Dwarf Crown Test",
                "race": "Hill Dwarf",
                "class_name": "Knight of the Crown",
                "alignment": "Lawful Good",
                "level": 7,
                "xp": 70000,
                "abilities": {
                    "strength": 15,
                    "intelligence": 10,
                    "wisdom": 12,
                    "dexterity": 13,
                    "constitution": 16,
                    "charisma": 10,
                },
                "combat": {"max_hp": 40, "current_hp": 40},
                "coins": {},
            },
            self.player,
            self.db,
        )
        self.character_model = self.db.get(VaultCharacter, self.character["id"])

    def tearDown(self) -> None:
        self.db.close()

    def equipment(self, name: str) -> EquipmentCatalog:
        item = self.db.scalar(select(EquipmentCatalog).where(EquipmentCatalog.name == name))
        self.assertIsNotNone(item)
        return item

    def strong_knight_with_weapon(self) -> VaultCharacter:
        character = create_vault_character_for_player(
            {
                "name": "Endpoint Runtime Knight",
                "race": "Hill Dwarf",
                "class_name": "Knight of the Crown",
                "alignment": "Lawful Good",
                "level": 1,
                "abilities": {
                    "strength": 18,
                    "intelligence": 10,
                    "wisdom": 12,
                    "dexterity": 16,
                    "constitution": 16,
                    "charisma": 10,
                },
                "exceptional_strength": 77,
                "combat": {"max_hp": 10, "current_hp": 10},
                "coins": {"gold": 100},
            },
            self.player,
            self.db,
        )
        model = self.db.get(VaultCharacter, character["id"])
        sword = self.equipment("Sword, long")
        add_inventory_record(model, {"equipment_id": sword.id, "status": "equipped"}, self.db)
        self.db.refresh(model)
        upsert_weapon_proficiency(model, {"equipment_id": sword.id, "proficient": True}, self.db)
        self.db.refresh(model)
        return model

    def test_knight_of_the_crown_inherits_fighter_saves_and_proficiency_rules(self) -> None:
        payload = character_payload(self.character_model)
        self.assertEqual("Fighter", payload["class_details"]["rules_class_name"])
        self.assertEqual(7, payload["class_details"]["proficiency_count"])
        self.assertEqual(-2, payload["class_details"]["non_proficiency_penalty"])
        self.assertEqual("7-8", payload["combat"]["saving_throws"]["level_band"])
        self.assertIn("Dwarf Constitution save adjustment", " ".join(payload["combat"]["saving_throws"]["notes"]))

    def test_equipping_splint_persists_status_and_recalculates_ac(self) -> None:
        splint = self.equipment("Splint")
        payload = add_inventory_record(self.character_model, {"equipment_id": splint.id, "status": "equipped"}, self.db)
        row = payload["inventory"][0]
        self.assertEqual("equipped", row["status"])
        self.assertEqual("Splint", row["equipment"]["name"])
        self.assertEqual(4, payload["combat"]["armor_class"])

        updated = update_inventory_record(self.character_model, row["id"], {"status": "carried"}, self.db)
        self.assertEqual("carried", updated["inventory"][0]["status"])
        self.assertEqual(10, updated["combat"]["armor_class"])

    def test_exceptional_strength_and_armor_limited_dwarf_encumbrance(self) -> None:
        character = create_vault_character_for_player(
            {
                "name": "Dwarf Crown Strong",
                "race": "Hill Dwarf",
                "class_name": "Knight of the Crown",
                "alignment": "Lawful Good",
                "level": 1,
                "abilities": {
                    "strength": 18,
                    "intelligence": 10,
                    "wisdom": 12,
                    "dexterity": 16,
                    "constitution": 16,
                    "charisma": 10,
                },
                "exceptional_strength": 43,
                "combat": {"max_hp": 10, "current_hp": 10},
                "coins": {"gold": 100},
            },
            self.player,
            self.db,
        )
        model = self.db.get(VaultCharacter, character["id"])
        payload = add_inventory_record(model, {"equipment_id": self.equipment("Splint").id, "status": "equipped"}, self.db)
        self.db.refresh(model)
        payload = add_inventory_record(model, {"equipment_id": self.equipment("Backpack").id, "quantity": 4, "status": "carried"}, self.db)

        self.assertEqual("18/43", payload["strength_display"])
        self.assertEqual(90, payload["combat"]["carried_weight"])
        self.assertEqual(2, payload["combat"]["armor_class"])
        self.assertEqual("Unencumbered", payload["combat"]["encumbrance_band"])
        self.assertEqual(60, payload["combat"]["movement_rate"])
        self.assertEqual(250, payload["combat"]["encumbrance"]["max_carried"])
        self.assertEqual(135, payload["combat"]["encumbrance"]["unencumbered_through"])
        self.assertEqual(136, payload["combat"]["encumbrance"]["next_encumbrance"])
        self.assertEqual(60, payload["combat"]["encumbrance"]["armor_move_limit"])
        self.assertEqual("Splint", payload["combat"]["encumbrance"]["armor_move_source"])
        self.assertEqual(10, payload["combat"]["encumbrance"]["coin_weight"])
        self.assertEqual(80, payload["combat"]["encumbrance"]["equipment_weight"])
        self.assertEqual(135, payload["combat"]["encumbrance"]["thresholds"]["unencumbered"])
        self.assertEqual(90, payload["combat"]["encumbrance"]["weight_movement"])

    def test_ability_breakdown_exposes_backend_modifiers(self) -> None:
        character = create_vault_character_for_player(
            {
                "name": "Ability Runtime",
                "race": "Human",
                "class_name": "Fighter",
                "alignment": "Lawful Good",
                "level": 1,
                "abilities": {"strength": 18, "intelligence": 12, "wisdom": 16, "dexterity": 16, "constitution": 17, "charisma": 15},
                "exceptional_strength": 77,
                "combat": {"max_hp": 10, "current_hp": 10},
                "coins": {},
            },
            self.player,
            self.db,
        )
        payload = character_payload(self.db.get(VaultCharacter, character["id"]))
        abilities = payload["combat"]["ability_breakdown"]

        self.assertEqual("18/77", abilities["strength"]["display"])
        self.assertEqual(2, abilities["strength"]["melee_to_hit"])
        self.assertEqual(4, abilities["strength"]["melee_damage"])
        self.assertEqual(150, abilities["strength"]["carry_adjustment"])
        self.assertEqual(1, abilities["dexterity"]["missile_to_hit"])
        self.assertEqual(-2, abilities["dexterity"]["armor_class_adjustment"])
        self.assertEqual(3, abilities["constitution"]["hit_point_adjustment"])
        self.assertEqual(2, abilities["wisdom"]["mental_save_bonus"])

    def test_plain_strength_18_shifts_all_encumbrance_thresholds(self) -> None:
        band, movement = encumbrance(90, None, 90, 18)

        self.assertEqual("Unencumbered", band)
        self.assertEqual(90, movement)

    def test_drop_deletes_inventory_row_and_removes_armor_effects(self) -> None:
        splint = self.equipment("Splint")
        payload = add_inventory_record(self.character_model, {"equipment_id": splint.id, "status": "equipped"}, self.db)
        dropped = delete_inventory_record(self.character_model, payload["inventory"][0]["id"], self.db)
        self.assertEqual([], dropped["inventory"])
        self.assertEqual(10, dropped["combat"]["armor_class"])

    def test_drop_deletes_equipped_weapon_and_removes_runtime_card(self) -> None:
        hammer = self.equipment("Hammer, war, heavy")
        payload = add_inventory_record(self.character_model, {"equipment_id": hammer.id, "status": "equipped"}, self.db)
        row = next(item for item in payload["inventory"] if item["equipment_id"] == hammer.id)
        self.assertEqual(1, len(payload["combat"]["runtime"]["weapons"]))

        dropped = delete_inventory_record(self.character_model, row["id"], self.db)

        self.assertFalse(any(item["id"] == row["id"] for item in dropped["inventory"]))
        self.assertEqual([], dropped["combat"]["runtime"]["weapons"])

    def test_ammunition_is_inventory_not_runtime_weapon(self) -> None:
        crossbow = self.equipment("Crossbow, heavy")
        bolts = self.equipment("Bolt, heavy crossbow, dozen")

        payload = add_inventory_record(self.character_model, {"equipment_id": crossbow.id, "status": "equipped"}, self.db)
        payload = add_inventory_record(self.character_model, {"equipment_id": bolts.id, "status": "equipped"}, self.db)

        ammo_row = next(item for item in payload["inventory"] if item["equipment_id"] == bolts.id)
        self.assertTrue(ammo_row["is_ammunition"])
        self.assertEqual("heavy_bolt", ammo_row["ammunition_kind"])
        self.assertEqual(12, ammo_row["quantity"])
        self.assertEqual(4.0, ammo_row["total_weight"])
        self.assertEqual("Heavy Crossbow Bolts", ammo_row["ammunition_display_name"])
        self.assertEqual(4.0, ammo_row["stack_value"])
        self.assertEqual(["Crossbow, heavy"], [weapon["weapon"] for weapon in payload["combat"]["runtime"]["weapons"]])

    def test_ammunition_addition_merges_bundles_and_non_bundled_gear_stays_one(self) -> None:
        bolts = self.equipment("Bolt, heavy crossbow, dozen")
        arrows = self.equipment("Arrows, dozen")
        backpack = self.equipment("Backpack")

        payload = add_inventory_record(self.character_model, {"equipment_id": bolts.id, "status": "carried"}, self.db)
        payload = add_inventory_record(self.character_model, {"equipment_id": bolts.id, "status": "carried"}, self.db)
        payload = add_inventory_record(self.character_model, {"equipment_id": arrows.id, "status": "carried"}, self.db)
        payload = add_inventory_record(self.character_model, {"equipment_id": backpack.id, "status": "carried"}, self.db)

        bolt_rows = [item for item in payload["inventory"] if item["equipment_id"] == bolts.id]
        arrow_row = next(item for item in payload["inventory"] if item["equipment_id"] == arrows.id)
        backpack_row = next(item for item in payload["inventory"] if item["equipment_id"] == backpack.id)
        self.assertEqual(1, len(bolt_rows))
        self.assertEqual(24, bolt_rows[0]["quantity"])
        self.assertEqual(12, arrow_row["quantity"])
        self.assertEqual(1, backpack_row["quantity"])

    def test_ammunition_quantity_updates_weight_value_and_zero_removes_stack(self) -> None:
        bolts = self.equipment("Bolt, heavy crossbow, dozen")
        payload = add_inventory_record(self.character_model, {"equipment_id": bolts.id, "status": "carried"}, self.db)
        ammo_row = next(item for item in payload["inventory"] if item["equipment_id"] == bolts.id)

        updated = update_inventory_record(self.character_model, ammo_row["id"], {"quantity": 6}, self.db)

        updated_row = next(item for item in updated["inventory"] if item["id"] == ammo_row["id"])
        self.assertEqual(6, updated_row["quantity"])
        self.assertEqual(2.0, updated_row["total_weight"])
        self.assertEqual(2.0, updated_row["stack_value"])
        self.assertEqual(2.0, updated["combat"]["encumbrance"]["equipment_weight"])

        updated = update_inventory_record(self.character_model, ammo_row["id"], {"quantity": 3}, self.db)
        updated_row = next(item for item in updated["inventory"] if item["id"] == ammo_row["id"])
        self.assertEqual(1.0, updated_row["total_weight"])
        self.assertEqual(1.0, updated_row["stack_value"])

        updated = update_inventory_record(self.character_model, ammo_row["id"], {"quantity": 1}, self.db)
        updated_row = next(item for item in updated["inventory"] if item["id"] == ammo_row["id"])
        self.assertAlmostEqual(1 / 3, updated_row["unit_weight"], places=4)
        self.assertAlmostEqual(1 / 3, updated_row["total_weight"], places=4)

        removed = update_inventory_record(self.character_model, ammo_row["id"], {"quantity": 0}, self.db)
        self.assertFalse(any(item["id"] == ammo_row["id"] for item in removed["inventory"]))

    def test_legacy_ammunition_quantity_remains_physical_count_with_normalized_totals(self) -> None:
        bolts = self.equipment("Bolt, heavy crossbow, dozen")
        payload = add_inventory_record(self.character_model, {"equipment_id": bolts.id, "quantity": 3, "status": "carried"}, self.db)
        ammo_row = next(item for item in payload["inventory"] if item["equipment_id"] == bolts.id)

        self.assertEqual(3, ammo_row["quantity"])
        self.assertEqual("Heavy Crossbow Bolts", ammo_row["ammunition_display_name"])
        self.assertEqual(1.0, ammo_row["total_weight"])
        self.assertEqual(1.0, ammo_row["stack_value"])

    def test_ammunition_drop_removes_active_ammo_and_carried_weight(self) -> None:
        crossbow = self.equipment("Crossbow, heavy")
        bolts = self.equipment("Bolt, heavy crossbow, dozen")
        payload = add_inventory_record(self.character_model, {"equipment_id": crossbow.id, "status": "equipped"}, self.db)
        payload = add_inventory_record(self.character_model, {"equipment_id": bolts.id, "status": "equipped"}, self.db)
        ammo_row = next(item for item in payload["inventory"] if item["equipment_id"] == bolts.id)
        self.assertEqual(16.0, payload["combat"]["encumbrance"]["equipment_weight"])

        dropped = delete_inventory_record(self.character_model, ammo_row["id"], self.db)

        self.assertFalse(any(item["equipment_id"] == bolts.id for item in dropped["inventory"]))
        self.assertEqual(12.0, dropped["combat"]["encumbrance"]["equipment_weight"])

    def test_player_inventory_delete_rejects_wrong_owner(self) -> None:
        sword = self.equipment("Sword, long")
        payload = add_inventory_record(self.character_model, {"equipment_id": sword.id, "status": "carried"}, self.db)
        row = next(item for item in payload["inventory"] if item["equipment_id"] == sword.id)
        other = Player(player_name="Other", display_name="Other", username="other", active=True)
        self.db.add(other)
        self.db.commit()

        with self.assertRaises(Exception) as raised:
            delete_player_vault_inventory(self.character_model.id, row["id"], {"sub": str(other.id)}, self.db)

        self.assertEqual(404, raised.exception.status_code)

    def test_armor_class_breakdown_excludes_unequipped_armor_and_applies_shield(self) -> None:
        payload = add_inventory_record(self.character_model, {"equipment_id": self.equipment("Splint").id, "status": "carried"}, self.db)
        self.assertEqual(10, payload["combat"]["armor_class"])
        self.assertEqual("No armor", payload["combat"]["armor_class_breakdown"]["armor"]["label"])

        self.db.refresh(self.character_model)
        payload = add_inventory_record(self.character_model, {"equipment_id": self.equipment("Shield, large").id, "status": "equipped"}, self.db)
        ac = payload["combat"]["armor_class_breakdown"]
        self.assertEqual(-1, ac["shield"]["value"])
        self.assertEqual(9, ac["final"])
        self.assertIn("Only equipped, legal armor", " ".join(ac["notes"]))

    def test_saving_throw_breakdown_reports_knight_fighter_source_and_dwarf_adjustment(self) -> None:
        payload = character_payload(self.character_model)
        saves = payload["combat"]["saving_throws"]
        death_rows = saves["breakdown"]["death_paralysis_poison"]

        self.assertEqual("Fighter", saves["class_source"])
        self.assertEqual("Dwarf", saves["race_source"])
        self.assertEqual(6, saves["categories"]["death_paralysis_poison"])
        self.assertEqual("Base Fighter Save", death_rows[0]["label"])
        self.assertEqual(10, death_rows[0]["value"])
        self.assertEqual("Dwarf racial adjustment", death_rows[1]["label"])
        self.assertEqual(-4, death_rows[1]["modifier"])

    def test_player_character_endpoint_includes_combat_runtime_shape(self) -> None:
        model = self.strong_knight_with_weapon()

        payload = get_player_vault_character(model.id, {"sub": str(self.player.id)}, self.db)

        runtime = payload["combat"]["runtime"]
        self.assertIn("thac0", runtime)
        self.assertIn("attacks_per_round", runtime)
        self.assertIn("weapons", runtime)
        self.assertEqual(20, runtime["thac0"]["base_thac0"])
        self.assertEqual("Sword, long", runtime["weapons"][0]["weapon"])
        self.assertEqual(2, runtime["weapons"][0]["attack_modifiers"]["strength"])
        self.assertEqual(4, runtime["weapons"][0]["damage"]["strength"])
        self.assertIn("ability_breakdown", payload["combat"])
        self.assertIn("armor_class_breakdown", payload["combat"])
        self.assertIn("saving_throws", payload["combat"])
        self.assertIn("encumbrance", payload["combat"])

    def test_admin_character_endpoint_includes_same_combat_runtime_shape(self) -> None:
        model = self.strong_knight_with_weapon()

        payload = get_vault_character(model.id, {"sub": "admin", "role": "admin"}, self.db)

        self.assertIn("runtime", payload["combat"])
        self.assertEqual("osric.attack.fighter", payload["combat"]["runtime"]["thac0"]["attack_progression_ref"])
        self.assertEqual("Sword, long", payload["combat"]["runtime"]["weapons"][0]["weapon"])

    def test_character_endpoint_calls_combat_runtime_once(self) -> None:
        model = self.strong_knight_with_weapon()

        with patch("app.api.combat_payload", wraps=combat_payload) as wrapped:
            payload = get_player_vault_character(model.id, {"sub": str(self.player.id)}, self.db)

        self.assertIn("runtime", payload["combat"])
        self.assertEqual(1, wrapped.call_count)

    def test_attack_progression_is_cached_within_character_runtime(self) -> None:
        model = self.strong_knight_with_weapon()
        load_attack_progression.cache_clear()

        payload = get_player_vault_character(model.id, {"sub": str(self.player.id)}, self.db)
        cache = load_attack_progression.cache_info()

        self.assertEqual("osric.attack.fighter", payload["combat"]["runtime"]["thac0"]["attack_progression_ref"])
        self.assertEqual(1, cache.misses)
        self.assertGreaterEqual(cache.hits, 1)

    def test_combat_runtime_failure_is_logged_and_returned_structurally(self) -> None:
        model = self.strong_knight_with_weapon()

        with patch("app.api.combat_payload", side_effect=RuntimeError("boom")):
            with self.assertLogs("app.api", level="ERROR") as logs:
                payload = get_player_vault_character(model.id, {"sub": str(self.player.id)}, self.db)

        runtime = payload["combat"]["runtime"]
        self.assertEqual("runtime_error", runtime["automation_status"])
        self.assertEqual([], runtime["weapons"])
        self.assertIn("Combat runtime generation failed for character", "\n".join(logs.output))

    def test_weapon_proficiency_upserts_and_unmarks_by_equipment_id(self) -> None:
        hammer = self.equipment("Hammer, war, heavy")
        marked = upsert_weapon_proficiency(self.character_model, {"equipment_id": hammer.id, "proficient": True}, self.db)
        self.assertEqual(1, len(marked["weapon_proficiencies"]))
        self.assertTrue(marked["weapon_proficiencies"][0]["proficient"])

        upsert_weapon_proficiency(self.character_model, {"equipment_id": hammer.id, "proficient": True}, self.db)
        count = self.db.scalar(select(func.count()).select_from(WeaponProficiency).where(WeaponProficiency.character_id == self.character_model.id))
        self.assertEqual(1, count)

        unmarked = remove_weapon_proficiency(self.character_model, hammer.id, self.db)
        self.assertEqual([], unmarked["weapon_proficiencies"])

    def test_fighter_thac0_is_derived_from_canonical_attack_progression(self) -> None:
        sword = self.equipment("Sword, long")
        payload = add_inventory_record(self.character_model, {"equipment_id": sword.id, "status": "carried"}, self.db)

        runtime = payload["combat"]["runtime"]
        self.assertEqual(20, runtime["thac0"]["base_thac0"])
        self.assertEqual("osric.attack.fighter", runtime["thac0"]["attack_progression_ref"])
        self.assertEqual("3 attacks every 2 rounds", runtime["attacks_per_round"]["value"])

    def test_knight_of_the_crown_uses_fighter_combat_runtime(self) -> None:
        payload = character_payload(self.character_model)

        self.assertEqual("osric.attack.fighter", payload["combat"]["runtime"]["thac0"]["attack_progression_ref"])
        self.assertEqual("3 attacks every 2 rounds", payload["combat"]["runtime"]["attacks_per_round"]["value"])

    def test_magic_user_and_cleric_combat_sources_are_separate(self) -> None:
        magic_user = create_vault_character_for_player(
            {
                "name": "M-U Runtime",
                "race": "Human",
                "class_name": "Magic-User",
                "alignment": "Neutral Good",
                "level": 1,
                "abilities": {"strength": 10, "intelligence": 15, "wisdom": 10, "dexterity": 10, "constitution": 10, "charisma": 10},
                "combat": {"max_hp": 4, "current_hp": 4},
                "coins": {},
            },
            self.player,
            self.db,
        )
        cleric = create_vault_character_for_player(
            {
                "name": "Cleric Runtime",
                "race": "Human",
                "class_name": "Cleric",
                "alignment": "Lawful Good",
                "level": 1,
                "abilities": {"strength": 10, "intelligence": 10, "wisdom": 15, "dexterity": 10, "constitution": 10, "charisma": 10},
                "combat": {"max_hp": 8, "current_hp": 8},
                "coins": {},
            },
            self.player,
            self.db,
        )

        self.assertEqual("osric.attack.magic_user", character_payload(self.db.get(VaultCharacter, magic_user["id"]))["combat"]["runtime"]["thac0"]["attack_progression_ref"])
        self.assertEqual("osric.attack.cleric", character_payload(self.db.get(VaultCharacter, cleric["id"]))["combat"]["runtime"]["thac0"]["attack_progression_ref"])

    def test_ranger_elf_longbow_applies_dexterity_and_racial_bonus(self) -> None:
        bow = self.equipment("Bow, long")
        result = weapon_combat(
            {
                "id": bow.id,
                "name": bow.name,
                "type": bow.type,
                "subtype": bow.subtype,
                "damage_small_medium": bow.damage_small_medium,
                "damage_large": bow.damage_large,
                "rate_of_fire": bow.rate_of_fire,
                "range": bow.range,
                "properties": bow.properties,
            },
            {"strength": 12, "dexterity": 16, "constitution": 10, "intelligence": 10, "wisdom": 10, "charisma": 10},
            "Ranger",
            "Elf",
            1,
            [{"equipment_id": bow.id, "proficient": True}],
        )

        self.assertEqual("missile", result["mode"])
        self.assertEqual(1, result["attack_modifiers"]["dexterity_missile"])
        self.assertEqual(1, result["attack_modifiers"]["racial"])
        self.assertEqual(0, result["damage"]["strength"])
        self.assertEqual("2", result["rate_of_fire"])
        self.assertEqual({"short": 70, "medium": 140, "long": 210, "raw": "70 ft"}, result["range"])

    def test_exceptional_strength_and_nonproficiency_modify_melee_attack(self) -> None:
        sword = self.equipment("Sword, long")
        result = weapon_combat(
            {
                "id": sword.id,
                "name": sword.name,
                "type": sword.type,
                "subtype": sword.subtype,
                "damage_small_medium": sword.damage_small_medium,
                "damage_large": sword.damage_large,
                "rate_of_fire": sword.rate_of_fire,
                "range": sword.range,
                "properties": sword.properties,
            },
            {"strength": 18, "dexterity": 10, "constitution": 10, "intelligence": 10, "wisdom": 10, "charisma": 10},
            "Fighter",
            "Human",
            1,
            [],
            exceptional_strength=91,
        )

        self.assertEqual("melee", result["mode"])
        self.assertEqual(2, result["attack_modifiers"]["strength"])
        self.assertEqual(5, result["damage"]["strength"])
        self.assertEqual(-2, result["attack_modifiers"]["proficiency"])
        self.assertEqual(0, result["total_attack_bonus"])
        self.assertEqual(20, result["final_attack_value"])
        self.assertEqual("1d8+5", result["damage"]["final_small_medium"])

    def test_thrown_weapon_uses_dexterity_to_hit_and_strength_to_damage(self) -> None:
        dagger = self.equipment("Dagger")
        result = weapon_combat(
            {
                "id": dagger.id,
                "name": dagger.name,
                "type": dagger.type,
                "subtype": dagger.subtype,
                "damage_small_medium": dagger.damage_small_medium,
                "damage_large": dagger.damage_large,
                "rate_of_fire": dagger.rate_of_fire,
                "range": dagger.range,
                "properties": dagger.properties,
            },
            {"strength": 17, "dexterity": 16, "constitution": 10, "intelligence": 10, "wisdom": 10, "charisma": 10},
            "Fighter",
            "Human",
            1,
            [{"equipment_id": dagger.id, "proficient": True}],
        )

        self.assertEqual("thrown", result["mode"])
        self.assertEqual(1, result["attack_modifiers"]["dexterity_missile"])
        self.assertEqual(0, result["attack_modifiers"]["strength"])
        self.assertEqual(1, result["damage"]["strength"])
        self.assertEqual("1d4+1", result["damage"]["final_small_medium"])

    def test_magical_weapon_properties_modify_attack_and_damage(self) -> None:
        sword = self.equipment("Sword, long")
        sword.properties = {"magic_bonus": 1}
        self.db.flush()
        result = weapon_combat(
            {
                "id": sword.id,
                "name": sword.name,
                "type": sword.type,
                "subtype": sword.subtype,
                "damage_small_medium": sword.damage_small_medium,
                "damage_large": sword.damage_large,
                "rate_of_fire": sword.rate_of_fire,
                "range": sword.range,
                "properties": sword.properties,
            },
            {"strength": 10, "dexterity": 10, "constitution": 10, "intelligence": 10, "wisdom": 10, "charisma": 10},
            "Fighter",
            "Human",
            1,
            [{"equipment_id": sword.id, "proficient": True}],
        )

        self.assertEqual(1, result["attack_modifiers"]["magical"])
        self.assertEqual(1, result["damage"]["magical"])
        self.assertEqual(19, result["final_attack_value"])
        self.assertEqual("1d8+1", result["damage"]["final_small_medium"])

    def test_illegal_weapon_selection_is_blocked_for_magic_user(self) -> None:
        sword = self.equipment("Sword, long")
        magic_user = create_vault_character_for_player(
            {
                "name": "Illegal Sword Wizard",
                "race": "Human",
                "class_name": "Magic-User",
                "alignment": "Neutral Good",
                "level": 1,
                "abilities": {"strength": 10, "intelligence": 15, "wisdom": 10, "dexterity": 10, "constitution": 10, "charisma": 10},
                "combat": {"max_hp": 4, "current_hp": 4},
                "coins": {},
            },
            self.player,
            self.db,
        )
        model = self.db.get(VaultCharacter, magic_user["id"])

        with self.assertRaises(Exception):
            add_inventory_record(model, {"equipment_id": sword.id, "status": "equipped"}, self.db)

    def test_illegal_weapon_runtime_disables_calculations(self) -> None:
        bow = self.equipment("Bow, long")
        result = weapon_combat(
            {
                "id": bow.id,
                "name": bow.name,
                "type": bow.type,
                "subtype": bow.subtype,
                "damage_small_medium": bow.damage_small_medium,
                "damage_large": bow.damage_large,
                "rate_of_fire": bow.rate_of_fire,
                "range": bow.range,
                "weight": bow.weight,
                "properties": bow.properties,
            },
            {"strength": 10, "dexterity": 10, "constitution": 10, "intelligence": 15, "wisdom": 10, "charisma": 10},
            "Magic-User",
            "Human",
            1,
            [],
        )

        self.assertFalse(result["legal"])
        self.assertTrue(result["calculations_disabled"])
        self.assertEqual("disabled_illegal_equipment", result["automation_status"])
        self.assertIsNone(result["final_attack_value"])
        self.assertIsNone(result["damage"]["final_small_medium"])

    def test_character_weapon_preview_uses_backend_runtime_shape(self) -> None:
        sword = self.equipment("Sword, long")
        preview = character_weapon_preview(self.character_model, sword)

        self.assertEqual("Sword, long", preview["weapon"])
        self.assertIn("attack_modifiers", preview)
        self.assertIn("damage", preview)
        self.assertIn("range", preview)
        self.assertIn("attacks_per_round", preview)

    def test_combat_runtime_matrix_is_exposed(self) -> None:
        payload = combat_payload(
            {"strength": 10, "dexterity": 10, "constitution": 10, "intelligence": 10, "wisdom": 10, "charisma": 10},
            [],
            "Fighter",
            "Human",
            1,
            [],
        )

        calculations = {row["calculation"] for row in payload["runtime_matrix"]}
        self.assertIn("THAC0", calculations)
        self.assertIn("weapon proficiency", calculations)
        self.assertIn("missile rate of fire", calculations)


if __name__ == "__main__":
    unittest.main()
