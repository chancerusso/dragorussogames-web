from __future__ import annotations

from typing import Any


ABILITY_ORDER = ("str", "int", "wis", "dex", "con", "cha")
LEGACY_ABILITY_KEYS = {
    "str": "strength",
    "int": "intelligence",
    "wis": "wisdom",
    "dex": "dexterity",
    "con": "constitution",
    "cha": "charisma",
}


def ability_modifier(score: Any) -> int | None:
    """Return the campaign ability modifier for a raw OSRIC/AD&D-style score."""
    if score is None or score == "":
        return None
    try:
        raw_score = int(score)
    except (TypeError, ValueError):
        return None
    if raw_score <= 3:
        return -3
    if raw_score <= 5:
        return -2
    if raw_score <= 8:
        return -1
    if raw_score <= 14:
        return 0
    if raw_score <= 17:
        return 1
    if raw_score == 18:
        return 2
    if raw_score <= 20:
        return 3
    if raw_score <= 23:
        return 4
    return 5


def ability_modifiers(abilities: dict[str, Any]) -> dict[str, int | None]:
    return {key: ability_modifier(abilities.get(key)) for key in ABILITY_ORDER}


def sync_ability_modifiers(ledger: dict[str, Any]) -> dict[str, Any]:
    abilities = ledger.get("abilities")
    if not isinstance(abilities, dict):
        abilities = {}

    legacy_abilities = ledger.get("Ability Scores")
    if not isinstance(legacy_abilities, dict):
        legacy_abilities = {}

    normalized = dict(abilities)
    for key, legacy_key in LEGACY_ABILITY_KEYS.items():
        if normalized.get(key) is None and legacy_abilities.get(legacy_key) is not None:
            normalized[key] = legacy_abilities.get(legacy_key)

    modifiers = ability_modifiers(normalized)
    legacy_modifiers = {LEGACY_ABILITY_KEYS[key]: value for key, value in modifiers.items()}

    ledger["abilities"] = {**normalized, "modifiers": modifiers}
    ledger["Ability Scores"] = {**legacy_abilities, "modifiers": legacy_modifiers}
    return ledger
