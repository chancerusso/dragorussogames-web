from typing import Any

from app.schemas import CharacterCreateRequest
from app.services.ability_modifiers import sync_ability_modifiers


def _coins(data: CharacterCreateRequest) -> dict[str, int]:
    return {coin: int(data.coins.get(coin, 0) or 0) for coin in ("pp", "gp", "ep", "sp", "cp")}


def _saves(data: CharacterCreateRequest) -> dict[str, int | None]:
    return {
        "death": data.saves.get("death"),
        "wands": data.saves.get("wands"),
        "paralysis_petrify": data.saves.get("paralysis_petrify"),
        "breath": data.saves.get("breath"),
        "spells": data.saves.get("spells"),
    }


def build_initial_ledger(data: CharacterCreateRequest) -> dict[str, Any]:
    coins = _coins(data)
    saves = _saves(data)
    ledger = {
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
            "xp_current": data.xp,
            "xp_needed": None,
            "languages": data.languages,
            "notes": data.notes,
        },
        "abilities": {
            "str": data.strength,
            "int": data.intelligence,
            "wis": data.wisdom,
            "dex": data.dexterity,
            "con": data.constitution,
            "cha": data.charisma,
        },
        "combat": {
            "hp_current": data.hp_current,
            "hp_max": data.hp_max,
            "armor_class": data.armor_class,
            "movement": data.movement,
            "thac0": data.thac0,
            "saving_throws": saves,
        },
        "equipment": {
            "inventory": [],
            "equipped": [],
            "stored": [],
            "encumbrance_total": 0,
            "encumbrance_category": None,
        },
        "wealth": coins,
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
            "languages": data.languages,
            "xp": data.xp,
            "notes": data.notes,
        },
        "Ability Scores": {
            "strength": data.strength,
            "dexterity": data.dexterity,
            "constitution": data.constitution,
            "intelligence": data.intelligence,
            "wisdom": data.wisdom,
            "charisma": data.charisma,
        },
        "Combat": {
            "hp": data.hp_current,
            "max_hp": data.hp_max,
            "ac": data.armor_class,
            "movement": data.movement,
            "thac0": data.thac0,
            "saving_throws": saves,
            "attacks": [],
        },
        "Equipment": {
            "items": [],
            "armor": None,
            "weapons": [],
            "encumbrance": None,
        },
        "Wealth": coins,
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
        "Notes": data.notes,
        "Recovery": {
            "resting": False,
            "healing_notes": None,
            "death_state": None,
        },
    }
    return sync_ability_modifiers(ledger)


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
