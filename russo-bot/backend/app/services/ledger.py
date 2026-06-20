from typing import Any

from app.schemas import CharacterCreateRequest


def build_initial_ledger(data: CharacterCreateRequest) -> dict[str, Any]:
    return {
        "identity": {
            "character_name": data.character_name,
            "player_name": data.player_name,
            "discord_username": data.discord_username,
            "discord_user_id": data.discord_user_id,
            "status": "Inactive",
        },
        "basics": {
            "race": data.race,
            "class_name": data.class_name,
            "level": data.level,
            "alignment": data.alignment,
            "xp_current": 0,
            "xp_needed": None,
        },
        "abilities": {
            "str": None,
            "int": None,
            "wis": None,
            "dex": None,
            "con": None,
            "cha": None,
        },
        "combat": {
            "hp_current": data.hp_current,
            "hp_max": data.hp_max,
            "armor_class": data.armor_class,
            "movement": None,
            "saving_throws": {
                "death": None,
                "wands": None,
                "paralysis_petrify": None,
                "breath": None,
                "spells": None,
            },
        },
        "equipment": {
            "inventory": [],
            "equipped": [],
            "stored": [],
            "encumbrance_total": 0,
            "encumbrance_category": None,
        },
        "wealth": {
            "pp": 0,
            "gp": 0,
            "ep": 0,
            "sp": 0,
            "cp": 0,
        },
        "resources": {
            "torches": 0,
            "lantern_oil": 0,
            "rations": 0,
            "water": 0,
            "arrows": 0,
            "bolts": 0,
            "sling_stones": 0,
        },
        "Identity": {
            "character_name": data.character_name,
            "player_name": data.player_name,
            "discord_username": data.discord_username,
            "discord_user_id": data.discord_user_id,
            "status": "Inactive",
        },
        "Character Basics": {
            "race": data.race,
            "class_name": data.class_name,
            "level": data.level,
            "alignment": data.alignment,
            "languages": [],
            "xp": 0,
        },
        "Ability Scores": {
            "strength": None,
            "dexterity": None,
            "constitution": None,
            "intelligence": None,
            "wisdom": None,
            "charisma": None,
        },
        "Combat": {
            "hp": data.hp_current,
            "max_hp": data.hp_max,
            "ac": data.armor_class,
            "movement": None,
            "saving_throws": {},
            "attacks": [],
        },
        "Equipment": {
            "items": [],
            "armor": None,
            "weapons": [],
            "encumbrance": None,
        },
        "Wealth": {
            "pp": 0,
            "gp": 0,
            "ep": 0,
            "sp": 0,
            "cp": 0,
        },
        "Resources": {
            "torches": 0,
            "lantern_oil": 0,
            "rations": 0,
            "water": 0,
            "arrows": 0,
            "bolts": 0,
            "sling_stones": 0,
            "light": [],
            "ammunition": [],
            "class_resources": {},
        },
        "Magic": {
            "spellcasting_class": None,
            "prepared_spells": [],
            "spellbook": [],
            "spell_slots": {},
        },
        "Conditions": [],
        "Recovery": {
            "resting": False,
            "healing_notes": None,
            "death_state": None,
        },
    }


def merge_ledger(base: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base)
    for key, value in patch.items():
        existing = merged.get(key)
        if isinstance(existing, dict) and isinstance(value, dict):
            merged[key] = merge_ledger(existing, value)
        else:
            merged[key] = value
    return merged


def sync_active_status(ledger: dict[str, Any], status: str) -> dict[str, Any]:
    active = status == "Active"
    return merge_ledger(
        ledger,
        {
            "identity": {"status": status, "active": active},
            "Identity": {"status": status, "active": active},
        },
    )
