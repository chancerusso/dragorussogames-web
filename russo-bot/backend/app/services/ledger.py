from typing import Any

from app.schemas import CharacterCreateRequest


def build_initial_ledger(data: CharacterCreateRequest) -> dict[str, Any]:
    return {
        "Identity": {
            "character_name": data.character_name,
            "player_name": data.player_name,
            "discord_username": data.discord_username,
            "discord_user_id": data.discord_user_id,
        },
        "Character Basics": {
            "race": data.race,
            "class_name": data.class_name,
            "level": data.level,
            "alignment": None,
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
            "hp": None,
            "max_hp": None,
            "ac": None,
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
            "rations": None,
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
