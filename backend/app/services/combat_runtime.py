from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.services.vault_rules import CLASSES, ability_modifiers, is_allowed_equipment, strength_attack_damage


THROWN_WEAPON_NAMES = {
    "axe, hand",
    "club",
    "dagger",
    "hammer",
    "javelin",
    "spear",
}

PROJECTILE_WEAPON_TERMS = ("bow", "crossbow", "sling")

RACIAL_COMBAT_MODIFIERS = {
    "Elf": [
        {
            "applies_to": "attack",
            "bonus": 1,
            "weapon_terms": ["sword", "bow"],
            "label": "+1 to hit with swords and bows",
            "source": "OSRIC elf racial combat modifier",
        }
    ],
    "Half-Elf": [
        {
            "applies_to": "attack",
            "bonus": 1,
            "weapon_terms": ["sword", "bow"],
            "label": "+1 to hit with swords and bows",
            "source": "OSRIC half-elf inherits the elf weapon modifier in the current runtime.",
            "review": "Source Verification Required: half-elf inheritance should be confirmed against the final OSRIC race table.",
        }
    ],
}

DRAGOLANCE_RACE_RUNTIME_BASE = {
    "Hill Dwarf": "Dwarf",
    "Mountain Dwarf": "Dwarf",
    "Gully Dwarf": "Dwarf",
    "Silvanesti Elf": "Elf",
    "Qualinesti Elf": "Elf",
    "Kagonesti Elf": "Elf",
    "Dargonesti Elf": "Elf",
    "Dimernesti Elf": "Elf",
    "Dragonlance Half-Elf": "Half-Elf",
    "Half-Elf": "Half-Elf",
    "Kender": "Halfling",
    "Tinker Gnome": "Gnome",
}


def content_root() -> Path:
    return Path(__file__).resolve().parents[3] / "content"


def attack_progression_id(class_name: str) -> str:
    key = class_name.lower().replace("-", "_").replace(" ", "_")
    return f"osric.attack.{key}"


def load_attack_progression(class_name: str) -> dict[str, Any] | None:
    path = content_root() / "osric" / "core" / "attacks" / f"{attack_progression_id(class_name).split('.')[-1]}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text())


def _row_matches_level(row: dict[str, Any], level: int) -> bool:
    low = int(row.get("level_min") or 1)
    high = row.get("level_max")
    return low <= level and (high is None or level <= int(high))


def thac0(class_name: str, level: int) -> dict[str, Any]:
    progression = load_attack_progression(class_name)
    if not progression:
        return {
            "base_thac0": None,
            "final_thac0": None,
            "class_source": class_name,
            "level_source": level,
            "attack_progression_ref": attack_progression_id(class_name),
            "automation_status": "missing_canonical_attack_progression",
            "notes": ["No canonical attack progression record could be loaded."],
        }
    attack_rows = [row for row in progression.get("rows", []) if row.get("rolls_to_hit")]
    matching = next((row for row in attack_rows if _row_matches_level(row, level)), None) or (attack_rows[0] if attack_rows else None)
    base = (matching or {}).get("rolls_to_hit", {}).get("ac_0")
    notes = []
    if progression.get("progression_status") != "complete":
        notes.append("Attack progression record is partial; THAC0 uses the available canonical AC 0 row.")
    return {
        "base_thac0": base,
        "final_thac0": base,
        "class_source": class_name,
        "level_source": level,
        "attack_progression_ref": progression["id"],
        "attack_progression_status": progression.get("progression_status"),
        "source": (matching or {}).get("source") or progression.get("source_ref", {}).get("section"),
        "automation_status": "derived_from_canonical_attack_progression" if base is not None else "missing_attack_row",
        "notes": notes,
    }


def attacks_per_round(class_name: str, level: int, specialized: bool = False) -> dict[str, Any]:
    progression = load_attack_progression(class_name)
    attack_text = "1 attack per round"
    source = "Default single attack"
    if progression:
        for row in progression.get("rows", []):
            if row.get("attacks") and _row_matches_level(row, level):
                attack_text = row["attacks"]
                source = progression["id"]
                break
    specialization_note = "Specialization automation is represented as a flag; exact OSRIC extra attacks remain campaign-policy review."
    return {
        "value": attack_text,
        "source": source,
        "specialization_applied": bool(specialized),
        "specialization_note": specialization_note if specialized else None,
        "rate_of_fire_separate": True,
    }


def weapon_mode(equipment: dict[str, Any]) -> str:
    name = (equipment.get("name") or "").lower()
    if name in THROWN_WEAPON_NAMES:
        return "thrown"
    if any(term in name for term in PROJECTILE_WEAPON_TERMS) or equipment.get("rate_of_fire"):
        return "missile"
    return "melee"


def range_bands(equipment: dict[str, Any]) -> dict[str, Any]:
    raw = equipment.get("range")
    if not raw:
        return {"short": None, "medium": None, "long": None, "raw": None}
    number = None
    try:
        number = int(str(raw).split()[0])
    except (TypeError, ValueError):
        pass
    if number is None:
        return {"short": None, "medium": None, "long": None, "raw": raw}
    return {"short": number, "medium": number * 2, "long": number * 3, "raw": raw}


def _property_bonus(equipment: dict[str, Any], *keys: str) -> int:
    props = equipment.get("properties") or {}
    for key in keys:
        value = props.get(key)
        if value is not None:
            return int(value)
    return 0


def _proficiency_entry(equipment_id: int | None, proficiencies: list[dict[str, Any]]) -> dict[str, Any] | None:
    for entry in proficiencies:
        if int(entry.get("equipment_id") or 0) == int(equipment_id or 0):
            return entry
    return None


def _racial_attack_modifier(race: str, equipment: dict[str, Any]) -> dict[str, Any]:
    runtime_race = DRAGOLANCE_RACE_RUNTIME_BASE.get(race, race)
    name = (equipment.get("name") or "").lower()
    applied = []
    total = 0
    for modifier in RACIAL_COMBAT_MODIFIERS.get(runtime_race, []):
        if any(term in name for term in modifier.get("weapon_terms", [])):
            total += int(modifier["bonus"])
            applied.append(modifier)
    return {"bonus": total, "applied": applied, "runtime_race": runtime_race}


def weapon_combat(
    equipment: dict[str, Any],
    abilities: dict[str, int],
    class_name: str,
    race: str,
    level: int,
    proficiencies: list[dict[str, Any]] | None = None,
    exceptional_strength: int | None = None,
) -> dict[str, Any]:
    proficiencies = proficiencies or []
    mode = weapon_mode(equipment)
    prof = _proficiency_entry(equipment.get("id"), proficiencies)
    specialized = bool((prof or {}).get("specialization"))
    class_info = CLASSES.get(class_name, {})
    non_prof_penalty = int(class_info.get("non_proficiency_penalty") or 0)
    proficiency_modifier = 0 if prof and prof.get("proficient") else non_prof_penalty
    strength = strength_attack_damage(
        int(abilities.get("strength", 10)),
        exceptional_strength,
        class_name in {"Fighter", "Paladin", "Ranger"} and int(abilities.get("strength", 10)) == 18,
    )
    dex = ability_modifiers(abilities, class_name)["dexterity"]["missile_to_hit"]
    racial = _racial_attack_modifier(race, equipment)
    magic_attack = _property_bonus(equipment, "magic_bonus", "attack_bonus")
    magic_damage = _property_bonus(equipment, "magic_bonus", "damage_bonus")
    misc_attack = _property_bonus(equipment, "misc_attack_bonus")
    misc_damage = _property_bonus(equipment, "misc_damage_bonus")
    strength_attack = strength["attack"] if mode == "melee" else 0
    dex_attack = dex if mode in {"missile", "thrown"} else 0
    strength_damage = strength["damage"] if mode in {"melee", "thrown"} else 0
    base = thac0(class_name, level)
    total_attack_bonus = strength_attack + dex_attack + racial["bonus"] + magic_attack + proficiency_modifier + misc_attack
    base_thac0 = base.get("final_thac0")
    final_attack_value = None if base_thac0 is None else int(base_thac0) - total_attack_bonus
    allowed, legality_reason = is_allowed_equipment(class_name, equipment)
    if not allowed:
        return {
            "equipment_id": equipment.get("id"),
            "weapon": equipment.get("name"),
            "mode": mode,
            "weight": equipment.get("weight"),
            "size": (equipment.get("properties") or {}).get("size"),
            "weapon_speed": (equipment.get("properties") or {}).get("speed"),
            "damage_type": (equipment.get("properties") or {}).get("damage_type"),
            "legal": False,
            "calculations_disabled": True,
            "legality_reason": legality_reason,
            "base_thac0": None,
            "thac0_source": base,
            "attack_modifiers": {
                "strength": 0,
                "dexterity_missile": 0,
                "racial": 0,
                "magical": 0,
                "proficiency": 0,
                "miscellaneous": 0,
            },
            "total_attack_bonus": None,
            "final_attack_value": None,
            "damage": {
                "base_small_medium": equipment.get("damage_small_medium"),
                "base_large": equipment.get("damage_large"),
                "strength": 0,
                "magical": 0,
                "miscellaneous": 0,
                "final_small_medium": None,
                "final_large": None,
            },
            "rate_of_fire": equipment.get("rate_of_fire"),
            "range": range_bands(equipment),
            "attacks_per_round": attacks_per_round(class_name, level, specialized),
            "proficiency": {
                "proficient": bool(prof and prof.get("proficient")),
                "specialization": (prof or {}).get("specialization"),
                "non_proficiency_penalty": non_prof_penalty,
            },
            "racial_modifiers": racial,
            "automation_status": "disabled_illegal_equipment",
            "notes": [f"Illegal Equipment: {legality_reason}", "Combat calculations disabled until corrected."],
        }
    return {
        "equipment_id": equipment.get("id"),
        "weapon": equipment.get("name"),
        "mode": mode,
        "weight": equipment.get("weight"),
        "size": (equipment.get("properties") or {}).get("size"),
        "weapon_speed": (equipment.get("properties") or {}).get("speed"),
        "damage_type": (equipment.get("properties") or {}).get("damage_type"),
        "legal": allowed,
        "legality_reason": legality_reason,
        "base_thac0": base.get("base_thac0"),
        "thac0_source": base,
        "attack_modifiers": {
            "strength": strength_attack,
            "dexterity_missile": dex_attack,
            "racial": racial["bonus"],
            "magical": magic_attack,
            "proficiency": proficiency_modifier,
            "miscellaneous": misc_attack,
        },
        "total_attack_bonus": total_attack_bonus,
        "final_attack_value": final_attack_value,
        "damage": {
            "base_small_medium": equipment.get("damage_small_medium"),
            "base_large": equipment.get("damage_large"),
            "strength": strength_damage,
            "magical": magic_damage,
            "miscellaneous": misc_damage,
            "final_small_medium": _damage_expression(equipment.get("damage_small_medium"), strength_damage + magic_damage + misc_damage),
            "final_large": _damage_expression(equipment.get("damage_large"), strength_damage + magic_damage + misc_damage),
        },
        "rate_of_fire": equipment.get("rate_of_fire"),
        "range": range_bands(equipment),
        "attacks_per_round": attacks_per_round(class_name, level, specialized),
        "proficiency": {
            "proficient": bool(prof and prof.get("proficient")),
            "specialization": (prof or {}).get("specialization"),
            "non_proficiency_penalty": non_prof_penalty,
        },
        "racial_modifiers": racial,
        "automation_status": "derived",
        "notes": _weapon_notes(mode),
    }


def _damage_expression(base: str | None, bonus: int) -> str | None:
    if not base:
        return None
    if bonus == 0:
        return base
    sign = "+" if bonus > 0 else ""
    return f"{base}{sign}{bonus}"


def _weapon_notes(mode: str) -> list[str]:
    if mode == "missile":
        return ["Projectile missile attacks apply Dexterity to hit. Strength damage is not applied by default."]
    if mode == "thrown":
        return ["Thrown weapons apply Dexterity to hit and Strength to damage in the current runtime model."]
    return ["Melee attacks apply Strength to hit and damage."]


def combat_payload(
    abilities: dict[str, int],
    inventory: list[dict[str, Any]],
    class_name: str,
    race: str,
    level: int,
    proficiencies: list[dict[str, Any]] | None = None,
    exceptional_strength: int | None = None,
) -> dict[str, Any]:
    weapons = [
        weapon_combat(item.get("equipment") or {}, abilities, class_name, race, level, proficiencies, exceptional_strength)
        for item in inventory
        if (item.get("equipment") or {}).get("type") == "weapon" and item.get("status") != "dropped"
    ]
    return {
        "thac0": thac0(class_name, level),
        "attacks_per_round": attacks_per_round(class_name, level),
        "weapons": weapons,
        "runtime_matrix": runtime_matrix(),
    }


def runtime_matrix() -> list[dict[str, str]]:
    rows = [
        ("THAC0", "content/osric/core/attacks/*.json", "combat_runtime.thac0", "none; derived at payload time", "visible in combat_runtime payload", "available in character payload", "partial until attack progressions are complete"),
        ("attack progression", "canonical attack_progression records", "combat_runtime.load_attack_progression", "none", "not directly shown", "source carried in THAC0 payload", "partial canonical tables"),
        ("attacks per round", "attack progression rows", "combat_runtime.attacks_per_round", "none", "not edited by builder", "available per character and per weapon", "specialization extra attacks are flagged, not automated"),
        ("missile rate of fire", "EquipmentCatalog.rate_of_fire", "combat_runtime.weapon_combat", "equipment catalog", "catalog display only", "available per weapon", "complete for seeded OSRIC equipment"),
        ("weapon proficiency", "WeaponProficiency table and class proficiency records", "combat_runtime.weapon_combat", "weapon_proficiencies table", "builder marks proficiencies", "applies attack modifier", "specialization policy incomplete"),
        ("non-proficiency penalties", "CLASSES non_proficiency_penalty", "combat_runtime.weapon_combat", "none", "displayed in builder", "automatically applied", "complete for encoded classes"),
        ("melee modifiers", "ability tables, race runtime table, equipment properties", "combat_runtime.weapon_combat", "none", "not calculated in React", "available per weapon", "misc/magic require properties"),
        ("missile modifiers", "Dexterity ability table, race runtime table, equipment properties", "combat_runtime.weapon_combat", "none", "not calculated in React", "available per weapon", "strength missile damage is conservative"),
        ("thrown weapons", "EquipmentCatalog names/ranges plus runtime thrown list", "combat_runtime.weapon_mode", "none", "not calculated in React", "available per weapon", "canonical thrown taxonomy should move to content records"),
        ("class weapon restrictions", "CLASSES/canonical class records", "is_allowed_equipment", "none", "builder blocks illegal equipment", "legality included per weapon", "some classes remain Manual DM Review"),
        ("armor restrictions", "CLASSES armor fields", "is_allowed_equipment + validate_equipped_inventory", "inventory status", "builder blocks illegal armor", "AC derived backend", "wooden shield material not modeled"),
        ("AC", "EquipmentCatalog armor values, shield, Dexterity", "vault_rules.derived_stats", "combat stats snapshot", "breakdown rendered from payload", "character payload", "working"),
        ("ability modifiers", "OSRIC ability score tables", "vault_rules.ability_score_breakdown", "none", "not calculated in React", "shown with ability scores", "open doors/system shock/resurrection values not encoded"),
        ("saving throws", "OSRIC class saving throw tables and dwarf adjustments", "vault_rules.saving_throws", "none", "not calculated in React", "breakdown rendered from payload", "situational modifiers remain notes"),
        ("encumbrance", "OSRIC encumbrance bands, Strength, race movement, armor cap", "vault_rules.encumbrance_details", "inventory and coins", "not calculated in React", "breakdown rendered from payload", "complete for current inventory statuses"),
        ("initiative modifiers", "Dexterity missile note", "vault_rules.derived_stats", "combat stats snapshot", "display note only", "manual review note", "not automated"),
    ]
    keys = ("calculation", "canonical_source", "runtime_service", "persistence", "builder_status", "sheet_status", "missing_work")
    return [dict(zip(keys, row)) for row in rows]
