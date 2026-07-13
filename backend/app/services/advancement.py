from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException

from app.db.models import VaultCharacter
from app.services.canonical_content import CanonicalContentService
from app.services.vault_rules import constitution_hp_adjustment


CLASS_NAME_TO_ID = {
    "assassin": "osric.class.assassin",
    "bard": "osric.class.bard",
    "cleric": "osric.class.cleric",
    "druid": "osric.class.druid",
    "fighter": "osric.class.fighter",
    "knight of solamnia": "osric.class.fighter",
    "knight of the crown": "osric.class.fighter",
    "knight of the sword": "osric.class.fighter",
    "knight of the rose": "osric.class.fighter",
    "illusionist": "osric.class.illusionist",
    "magic-user": "osric.class.magic_user",
    "magic user": "osric.class.magic_user",
    "monk": "osric.class.monk",
    "paladin": "osric.class.paladin",
    "ranger": "osric.class.ranger",
    "thief": "osric.class.thief",
}

CLASS_NAME_TO_SPECIALTY = {
    "knight of solamnia": "knight of the crown",
    "knight of the crown": "knight of the crown",
    "knight of the sword": "knight of the sword",
    "knight of the rose": "knight of the rose",
}

SPECIALTY_TO_PROGRESSION = {
    "high sorcery student": "dragolance.progression.high_sorcery.student",
    "student of high sorcery": "dragolance.progression.high_sorcery.student",
    "white robes": "dragolance.progression.high_sorcery.white_robes",
    "white robe": "dragolance.progression.high_sorcery.white_robes",
    "red robes": "dragolance.progression.high_sorcery.red_robes",
    "red robe": "dragolance.progression.high_sorcery.red_robes",
    "black robes": "dragolance.progression.high_sorcery.black_robes",
    "black robe": "dragolance.progression.high_sorcery.black_robes",
    "holy orders of good": "dragolance.progression.holy_orders.good",
    "holy order of good": "dragolance.progression.holy_orders.good",
    "holy orders of neutrality": "dragolance.progression.holy_orders.neutral",
    "holy orders of neutral": "dragolance.progression.holy_orders.neutral",
    "holy orders of evil": "dragolance.progression.holy_orders.evil",
    "holy order of evil": "dragolance.progression.holy_orders.evil",
    "knight of the crown": "dragolance.progression.solamnic.crown",
    "crown": "dragolance.progression.solamnic.crown",
    "knight of the sword": "dragolance.progression.solamnic.sword",
    "sword": "dragolance.progression.solamnic.sword",
    "knight of the rose": "dragolance.progression.solamnic.rose",
    "rose": "dragolance.progression.solamnic.rose",
}

PROGRESSION_TO_SPELL_SLOTS = {
    "dragolance.progression.high_sorcery.white_robes": "dragolance.spell_slots.high_sorcery.white_robes",
    "dragolance.progression.high_sorcery.red_robes": "dragolance.spell_slots.high_sorcery.red_robes",
    "dragolance.progression.high_sorcery.black_robes": "dragolance.spell_slots.high_sorcery.black_robes",
    "dragolance.progression.holy_orders.good": "dragolance.spell_slots.holy_orders.good",
    "dragolance.progression.holy_orders.neutral": "dragolance.spell_slots.holy_orders.neutral",
    "dragolance.progression.holy_orders.evil": "dragolance.spell_slots.holy_orders.evil",
    "dragolance.progression.solamnic.sword": "dragolance.spell_slots.sword_knight",
}


@dataclass(frozen=True)
class RuntimeAuditField:
    field: str
    classification: str
    location: str
    notes: str


CHARACTER_RUNTIME_AUDIT: list[RuntimeAuditField] = [
    RuntimeAuditField("level", "manually editable", "vault_characters.level", "Stored and editable; canonical advancement does not yet own changes."),
    RuntimeAuditField("XP", "manually editable", "vault_characters.xp", "Stored and editable directly on the character."),
    RuntimeAuditField("hit points", "manually editable", "character_combat_stats.max_hp/current_hp", "Stored; current level edits only return a review note."),
    RuntimeAuditField("hit dice", "canonical-derived", "canonical class_progression.levels", "Not stored; preview derives from progression records."),
    RuntimeAuditField("attack values", "missing", "canonical attack_progression", "No stored attack value; canonical attack rows are partial in current content."),
    RuntimeAuditField("THAC0", "missing", "none", "No explicit THAC0 field in the current schema."),
    RuntimeAuditField("saving throws", "copied at recalculation", "character_combat_stats.saving_throws", "Recalculated from vault_rules and stored on character combat stats."),
    RuntimeAuditField("spell slots", "canonical-derived", "vault_rules.spell_slot_summary / canonical spell_slot_progression", "Runtime displays derived summary; slots are not persisted as level records."),
    RuntimeAuditField("known spells", "manual", "character_spells.known", "Stored per spell row."),
    RuntimeAuditField("prepared spells", "manual", "character_spells.prepared/memorized_count", "Stored per spell row."),
    RuntimeAuditField("class abilities", "missing", "canonical class_ability", "No persistent character ability selections/history yet."),
    RuntimeAuditField("race abilities", "legacy-only", "vault_rules.RACES", "Displayed through legacy rules; not persisted per character."),
    RuntimeAuditField("class restrictions", "legacy-only", "vault_rules.CLASSES / canonical restrictions", "Validation still uses legacy choices; canonical restrictions are not runtime-enforced."),
    RuntimeAuditField("race restrictions", "legacy-only", "vault_rules.RACES / canonical restrictions", "Validation still uses legacy choices; canonical restrictions are not runtime-enforced."),
    RuntimeAuditField("level limits", "missing", "canonical records prose/status", "No structured runtime gate in character schema."),
    RuntimeAuditField("multiclass records", "missing", "none", "No class-track storage exists."),
    RuntimeAuditField("dual-class records", "missing", "none", "No original/new class state exists."),
    RuntimeAuditField("deity", "missing", "none", "No character deity field exists."),
    RuntimeAuditField("organization", "missing", "subclass_or_specialty partial", "Specialty can hold order-like text, but no canonical organization field exists."),
    RuntimeAuditField("High Sorcery order", "legacy-only", "subclass_or_specialty", "Can be represented by free text only."),
    RuntimeAuditField("Solamnic order", "legacy-only", "subclass_or_specialty", "Can be represented by free text only."),
    RuntimeAuditField("advancement history", "missing", "none", "No XP/level/HP roll audit trail exists."),
]


def runtime_audit_payload() -> list[dict[str, str]]:
    return [field.__dict__ for field in CHARACTER_RUNTIME_AUDIT]


class AdvancementPreviewService:
    def __init__(self, canonical: CanonicalContentService) -> None:
        self.canonical = canonical
        self.canonical.enabled = True
        self.canonical.load_all()

    def preview_advancement(
        self,
        character: VaultCharacter,
        target_level: int | None = None,
        class_track: str | None = None,
        proposed_xp: int | None = None,
    ) -> dict[str, Any]:
        class_id = self._class_id(class_track or character.class_name)
        class_record = self._record(class_id)
        progression = self._progression_record(character, class_record)
        current_level = max(1, int(character.level or 1))
        next_level = int(target_level or current_level + 1)
        current_xp = int(proposed_xp if proposed_xp is not None else character.xp or 0)
        current_row = self._level_row(progression, current_level)
        next_row = self._level_row(progression, next_level)
        blockers: list[str] = []
        review_flags: list[str] = []
        if not next_row:
            blockers.append("No canonical progression row exists for the target level.")
        xp_required = int((next_row or {}).get("xp_threshold") or 0)
        if next_row and current_xp < xp_required:
            blockers.append(f"{xp_required - current_xp} XP required for level {next_level}.")
        review_flags.extend(self._review_flags([class_record, progression]))

        attack = self._change_for_levels(class_record.get("attack_progression_ref"), current_level, next_level)
        saves = self._change_for_levels(class_record.get("saving_throw_ref"), current_level, next_level)
        spell_slots = self._spell_slot_change(character, class_record, progression, current_level, next_level)
        abilities = self._new_abilities(current_row, next_row)
        hp = self._hit_point_advancement(character, current_row, next_row, class_record)
        source_ids = self._source_ids(class_record, progression, attack, saves, spell_slots, abilities)

        return {
            "character_id": getattr(character, "id", None),
            "read_only": True,
            "current_class_level": current_level,
            "current_xp": current_xp,
            "next_level": next_level,
            "xp_required": xp_required,
            "advancement_available": bool(next_row) and not blockers,
            "advancement_blockers": blockers,
            "class_track": {
                "class_id": class_id,
                "class_name": class_record.get("display_name") or class_record.get("name"),
                "progression_id": progression["id"],
                "specialty": character.subclass_or_specialty,
                "base_osric_class": progression.get("class_id") or class_id,
            },
            "hit_point_advancement": hp,
            "attack_progression": attack,
            "saving_throws": saves,
            "spellcasting": spell_slots,
            "new_class_abilities": abilities,
            "organization_transition_opportunities": self._transition_flags(abilities),
            "gates": self._gates(character, class_record, progression, next_level),
            "review_flags": review_flags,
            "source_records_used": sorted(source_ids),
            "multiclass": self.multiclass_foundation(character),
            "dual_class": self.dual_class_foundation(character),
            "character_model_recommendations": character_model_recommendations(),
        }

    def multiclass_foundation(self, character: VaultCharacter) -> dict[str, Any]:
        return {
            "supported_by_current_schema": False,
            "class_tracks": [
                {
                    "class_id": self._class_id(character.class_name),
                    "current_level": int(character.level or 1),
                    "xp": int(character.xp or 0),
                    "state": "single_class_legacy_track",
                }
            ],
            "modeled_requirements": [
                "race eligibility",
                "allowed class combinations",
                "XP division",
                "independent class levels",
                "hit-point division",
                "best applicable saving throw handling",
                "attack progression interaction",
                "spellcasting per class",
                "race level limits",
            ],
            "missing_persistent_fields": ["class_tracks", "class_level_per_track", "xp_per_track", "multiclass_combination_id"],
            "review_flags": ["No multiclass character state exists yet; preview can only return the shape."],
        }

    def dual_class_foundation(self, character: VaultCharacter) -> dict[str, Any]:
        return {
            "supported_by_current_schema": False,
            "modeled_requirements": [
                "human-only eligibility",
                "original class",
                "new active class",
                "inactive former-class abilities",
                "recovery after surpassing original level",
                "new-class XP and level advancement",
                "hit point, save, attack, and spellcasting interactions",
            ],
            "missing_persistent_fields": ["original_class_id", "active_class_id", "inactive_class_ids", "dual_class_recovery_status"],
            "review_flags": ["Dual-class is not represented in the current character model."],
        }

    def _class_id(self, class_name: str) -> str:
        class_id = CLASS_NAME_TO_ID.get(str(class_name).strip().lower())
        if not class_id:
            raise HTTPException(status_code=422, detail=f"No canonical class mapping for '{class_name}'.")
        return class_id

    def _record(self, record_id: str) -> dict[str, Any]:
        record = self.canonical.get_by_id(record_id)
        if not record:
            raise HTTPException(status_code=422, detail=f"Missing canonical record: {record_id}")
        return record

    def _progression_record(self, character: VaultCharacter, class_record: dict[str, Any]) -> dict[str, Any]:
        specialty = str(character.subclass_or_specialty or "").strip().lower() or CLASS_NAME_TO_SPECIALTY.get(str(character.class_name or "").strip().lower(), "")
        progression_id = SPECIALTY_TO_PROGRESSION.get(specialty) or class_record.get("progression_ref")
        return self._record(str(progression_id))

    def _level_row(self, progression: dict[str, Any], level: int) -> dict[str, Any] | None:
        for row in progression.get("levels") or []:
            if int(row.get("level") or 0) == level:
                return row
        return None

    def _row_for_band(self, record_id: str | None, level: int) -> dict[str, Any] | None:
        if not record_id:
            return None
        record = self._record(record_id)
        for row in record.get("rows") or []:
            low = int(row.get("level_min") or 1)
            high = row.get("level_max")
            if low <= level <= (int(high) if high is not None else 999):
                return row
        return None

    def _change_for_levels(self, record_id: str | None, current_level: int, next_level: int) -> dict[str, Any]:
        if not record_id:
            return {"source_record_id": None, "old": None, "new": None, "changed": False}
        old = self._row_for_band(record_id, current_level)
        new = self._row_for_band(record_id, next_level)
        return {"source_record_id": record_id, "old": old, "new": new, "changed": old != new}

    def _spell_slot_change(self, character: VaultCharacter, class_record: dict[str, Any], progression: dict[str, Any], current_level: int, next_level: int) -> dict[str, Any]:
        spell_slot_id = PROGRESSION_TO_SPELL_SLOTS.get(progression["id"])
        if not spell_slot_id:
            spellcasting = class_record.get("spellcasting") or {}
            spell_slot_id = spellcasting.get("spell_slot_progression_ref")
        if not spell_slot_id:
            return {"source_record_id": None, "old": None, "new": None, "changed": False, "new_spell_levels_unlocked": []}
        record = self._record(spell_slot_id)
        old = self._slot_row(record, current_level)
        new = self._slot_row(record, next_level)
        return {
            "source_record_id": spell_slot_id,
            "old": old,
            "new": new,
            "changed": old != new,
            "new_spell_levels_unlocked": self._new_spell_levels(old, new),
            "bonus_spell_handling": "Wisdom bonus spells are separate from base spell slots and are not added automatically.",
            "known_spell_implications": "No spells are automatically learned in this preview.",
            "prepared_spell_capacity_changes": "Prepared/memorized entries are not mutated.",
        }

    def _slot_row(self, record: dict[str, Any], level: int) -> dict[str, Any] | None:
        exact = self._level_row(record, level)
        if exact:
            return exact
        rows = [row for row in record.get("levels") or [] if int(row.get("level") or 0) <= level]
        return rows[-1] if rows else None

    def _new_spell_levels(self, old: dict[str, Any] | None, new: dict[str, Any] | None) -> list[str]:
        old_slots = (old or {}).get("slots") or {}
        new_slots = (new or {}).get("slots") or {}
        return [level for level, value in new_slots.items() if int(value or 0) > 0 and int(old_slots.get(level) or 0) == 0]

    def _new_abilities(self, current_row: dict[str, Any] | None, next_row: dict[str, Any] | None) -> list[dict[str, Any]]:
        old_ids = set((current_row or {}).get("ability_ids") or [])
        new_ids = set((next_row or {}).get("ability_ids") or []) - old_ids
        abilities = []
        for ability_id in sorted(new_ids):
            ability = self._record(ability_id)
            abilities.append({
                "id": ability_id,
                "name": ability.get("display_name") or ability.get("name"),
                "level_gained": ability.get("level_gained") or (next_row or {}).get("level"),
                "mechanical_effect": ability.get("mechanical_effect"),
                "requires_choice": bool(ability.get("prerequisites")),
                "runtime_automation": False,
                "source_ref": ability.get("source_ref"),
                "review_status": (ability.get("review") or {}).get("status"),
            })
        return abilities

    def _hit_point_advancement(self, character: VaultCharacter, current_row: dict[str, Any] | None, next_row: dict[str, Any] | None, class_record: dict[str, Any]) -> dict[str, Any]:
        current_hd = str((current_row or {}).get("hit_dice") or "")
        next_hd = str((next_row or {}).get("hit_dice") or "")
        roll, fixed = self._hit_die_delta(current_hd, next_hd, class_record)
        constitution = getattr(getattr(character, "abilities", None), "racial_adjusted_constitution", None) or getattr(getattr(character, "abilities", None), "constitution", 10)
        con_mod = constitution_hp_adjustment(int(constitution), str(class_record.get("name") or ""))
        return {
            "old_hit_dice": current_hd or None,
            "new_hit_dice": next_hd or None,
            "roll": roll,
            "fixed_hp_gain": fixed,
            "constitution_modifier": con_mod if roll else 0,
            "division": None,
            "minimum_gain": 1,
            "commit_behavior": "preview_only_no_roll_committed",
        }

    def _hit_die_delta(self, current_hd: str, next_hd: str, class_record: dict[str, Any]) -> tuple[str | None, int | None]:
        current = self._parse_hit_dice(current_hd)
        next_value = self._parse_hit_dice(next_hd)
        die = int(class_record.get("hit_die_numeric") or 0)
        dice_delta = max(0, next_value[0] - current[0])
        fixed_delta = next_value[2] - current[2]
        roll = f"{dice_delta}d{die}" if dice_delta and die else None
        return roll, fixed_delta if fixed_delta > 0 else None

    def _parse_hit_dice(self, value: str) -> tuple[int, int, int]:
        match = re.match(r"(?:(\d+)d(\d+))?(?:\+(\d+))?", value or "")
        if not match:
            return (0, 0, 0)
        return (int(match.group(1) or 0), int(match.group(2) or 0), int(match.group(3) or 0))

    def _transition_flags(self, abilities: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [ability for ability in abilities if "transition" in str(ability.get("id", ""))]

    def _gates(self, character: VaultCharacter, class_record: dict[str, Any], progression: dict[str, Any], next_level: int) -> list[dict[str, Any]]:
        gates = []
        specialty = str(character.subclass_or_specialty or "").lower()
        if class_record.get("id") == "osric.class.magic_user" and next_level >= 4 and "robe" not in specialty:
            gates.append({"id": "dragolance.ability.test_of_high_sorcery", "status": "blocked_or_review", "reason": "High Sorcery order not recorded on character."})
        if "solamnic" in progression.get("id", ""):
            gates.append({"id": "dragolance.order.solamnic_knights", "status": "review", "reason": "Order advancement requires DM/campaign approval."})
        return gates

    def _review_flags(self, records: list[dict[str, Any]]) -> list[str]:
        flags = []
        for record in records:
            status = (record.get("review") or {}).get("status")
            if status and status != "verified":
                flags.append(f"{record['id']} review status is {status}.")
        return flags

    def _source_ids(self, *values: Any) -> set[str]:
        ids: set[str] = set()
        for value in values:
            if isinstance(value, dict):
                if isinstance(value.get("id"), str):
                    ids.add(value["id"])
                if isinstance(value.get("source_record_id"), str):
                    ids.add(value["source_record_id"])
                for nested in value.values():
                    ids.update(self._source_ids(nested))
            elif isinstance(value, list):
                for nested in value:
                    ids.update(self._source_ids(nested))
        return ids


def character_model_recommendations() -> list[str]:
    return [
        "class_tracks with class_id, level, xp, state, and progression_id",
        "advancement_history for XP thresholds, HP rolls, and DM approvals",
        "hp_roll_history with roll expression, result, Constitution modifier, and source record",
        "selected_deity_id",
        "selected_organization_ids and active_order_id",
        "high_sorcery_test_status",
        "solamnic_order_status",
        "dual_class_state with original class, new class, inactive/recovered status",
        "multiclass_combination_id and XP allocation policy",
        "selected_class_ability choices",
    ]
