from __future__ import annotations

from pathlib import Path
import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import EquipmentCatalog, SpellsCatalog


ABILITIES = ("strength", "intelligence", "wisdom", "dexterity", "constitution", "charisma")
SAVE_CATEGORIES = (
    "aimed_magic_items",
    "breath_weapons",
    "death_paralysis_poison",
    "petrifaction_polymorph",
    "spells",
)
SAVE_LABELS = {
    "aimed_magic_items": "Aimed Magic Items / Wands",
    "breath_weapons": "Breath Weapons",
    "death_paralysis_poison": "Death / Paralysis / Poison",
    "petrifaction_polymorph": "Petrifaction / Polymorph",
    "spells": "Spells",
}

AMMUNITION_RULES = (
    {
        "kind": "arrow",
        "name_terms": ("arrow", "arrows"),
        "display_name": "Arrows",
        "compatible_weapon_terms": ("bow",),
        "bundle_size": 12,
    },
    {
        "kind": "light_bolt",
        "name_terms": ("light crossbow bolt", "bolt, light crossbow", "bolts, light crossbow"),
        "display_name": "Light Crossbow Bolts",
        "compatible_weapon_terms": ("crossbow, light", "light crossbow"),
        "bundle_size": 12,
    },
    {
        "kind": "heavy_bolt",
        "name_terms": ("heavy crossbow bolt", "bolt, heavy crossbow", "bolts, heavy crossbow"),
        "display_name": "Heavy Crossbow Bolts",
        "compatible_weapon_terms": ("crossbow, heavy", "heavy crossbow"),
        "bundle_size": 12,
    },
    {
        "kind": "sling_bullet",
        "name_terms": ("sling bullet", "sling bullets", "bullet, dozen"),
        "display_name": "Sling Bullets",
        "compatible_weapon_terms": ("sling",),
        "bundle_size": 12,
    },
    {
        "kind": "sling_stone",
        "name_terms": ("sling stone", "sling stones", "stone, dozen"),
        "display_name": "Sling Stones",
        "compatible_weapon_terms": ("sling",),
        "bundle_size": 12,
    },
)

RACES = {
    "Human": {
        "adjustments": {},
        "classes": ["Assassin", "Bard", "Cleric", "Druid", "Fighter", "Illusionist", "Magic-User", "Monk", "Paladin", "Ranger", "Thief"],
        "movement": 120,
        "vision": "Normal vision",
        "languages": ["Common", "Alignment language"],
        "special": ["No racial special abilities; widest class freedom."],
        "level_limits": "No race-based class limit for most classes; assassin and druid use class-specific limits.",
    },
    "Dwarf": {
        "adjustments": {"constitution": 1, "charisma": -1},
        "classes": ["Assassin", "Cleric", "Fighter", "Thief"],
        "movement": 90,
        "vision": "Infravision 60 ft",
        "languages": ["Common", "Alignment language", "Dwarfish", "Gnomish", "Goblin", "Kobold", "Orcish"],
        "special": ["Constitution-based saves against magic and poison.", "Stonework detection.", "Bonuses against goblin/orc enemies.", "Harder for large giant-type foes to hit."],
        "level_limits": "Check dwarf class level limits on the race page; fighter limit depends on Strength.",
    },
    "Elf": {
        "adjustments": {"dexterity": 1, "constitution": -1},
        "classes": ["Assassin", "Cleric", "Fighter", "Magic-User", "Thief"],
        "movement": 120,
        "vision": "Infravision 60 ft",
        "languages": ["Common", "Elven", "Gnoll", "Gnomish", "Goblin", "Halfling", "Hobgoblin", "Orcish"],
        "special": ["Resistance to sleep and charm.", "Detection chances for secret doors.", "Surprise benefits in appropriate conditions."],
        "level_limits": "Check elf class level limits on the race page; several limits depend on ability scores.",
    },
    "Gnome": {
        "adjustments": {},
        "classes": ["Assassin", "Cleric", "Fighter", "Illusionist", "Thief"],
        "movement": 90,
        "vision": "Infravision 60 ft",
        "languages": ["Common", "Dwarfish", "Gnomish", "Goblin", "Halfling", "Kobold"],
        "special": ["Constitution-based saves against magic and poison.", "Bonuses against kobolds and goblins.", "Underground detection.", "Communication with normal burrowing animals."],
        "level_limits": "Check gnome class level limits on the race page.",
    },
    "Half-Elf": {
        "adjustments": {},
        "classes": ["Assassin", "Cleric", "Fighter", "Magic-User", "Ranger", "Thief"],
        "movement": 120,
        "vision": "Infravision 60 ft",
        "languages": ["Common", "Elven", "Gnoll", "Gnome", "Goblin", "Halfling", "Hobgoblin", "Orcish"],
        "special": ["Partial resistance to sleep and charm.", "Detection chances for secret doors."],
        "level_limits": "Check half-elf class level limits on the race page.",
    },
    "Halfling": {
        "adjustments": {"strength": -1, "dexterity": 1},
        "classes": ["Druid", "Fighter", "Thief"],
        "movement": 90,
        "vision": "Infravision 60 ft",
        "languages": ["Common", "Dwarfish", "Gnome", "Goblin", "Halfling", "Orcish"],
        "special": ["Constitution-based saves against magic and poison.", "Bonus with bow or sling.", "Improved surprise when scouting in appropriate conditions."],
        "level_limits": "Check halfling class level limits on the race page.",
    },
    "Half-Orc": {
        "adjustments": {"strength": 1, "constitution": 1, "charisma": -2},
        "classes": ["Assassin", "Cleric", "Fighter", "Thief"],
        "movement": 120,
        "vision": "Infravision 60 ft",
        "languages": ["Common", "Orcish"],
        "special": ["Harsh combat roles and limited social flexibility from Charisma adjustment."],
        "level_limits": "Check half-orc class level limits on the race page.",
    },
}

CLASSES = {
    "Assassin": {"hit_die": 6, "hit_die_text": "d6", "wealth": "2d6 x 10 gp", "spellcaster": False, "armor": "Leather or studded leather; shields allowed.", "armor_types": ["Leather", "Studded"], "shields": True, "weapons": "Any weapon", "weapon_policy": "any", "proficiency_initial": 3, "proficiency_every": 4, "non_proficiency_penalty": -3, "alignment": "Any evil alignment", "allowed_alignments": ["Lawful Evil", "Neutral Evil", "Chaotic Evil"], "manual_review": ["Scroll use begins at 12th level and remains referee-adjudicated."]},
    "Bard": {"hit_die": 6, "hit_die_text": "d6 after Bard entry", "wealth": "Use the starting class before Bard entry", "spellcaster": True, "armor": "Manual DM Review: Bard is not a normal starting class and depends on prior class path.", "armor_types": [], "shields": False, "weapons": "Manual DM Review", "weapon_policy": "manual", "proficiency_initial": None, "proficiency_every": None, "non_proficiency_penalty": None, "alignment": "Manual DM Review", "allowed_alignments": ALIGNMENTS if "ALIGNMENTS" in globals() else [], "manual_review": ["Bard entry path, equipment, spellcasting, and saves require campaign confirmation."]},
    "Cleric": {"hit_die": 8, "hit_die_text": "d8", "wealth": "3d6 x 10 gp", "spellcaster": True, "spell_lists": ["cleric"], "armor": "Any armor and any shield.", "armor_types": ["any"], "shields": True, "weapons": "Blunt weapons only: club, flail, hammer, mace, oil, staff.", "weapon_policy": "list", "allowed_weapon_terms": ["club", "flail", "hammer", "mace", "oil", "staff"], "proficiency_initial": 2, "proficiency_every": 3, "non_proficiency_penalty": -3, "alignment": "Any alignment", "allowed_alignments": [], "manual_review": []},
    "Druid": {"hit_die": 8, "hit_die_text": "d8", "wealth": "3d6 x 10 gp", "spellcaster": True, "spell_lists": ["druid"], "armor": "Leather armor only. Wooden shields only.", "armor_types": ["Leather"], "shields": True, "shield_note": "Wooden shield only; catalog shield material is Manual DM Review.", "weapons": "Club, dagger, dart, hammer, oil, scimitar, sling, spear, staff.", "weapon_policy": "list", "allowed_weapon_terms": ["club", "dagger", "dart", "hammer", "oil", "scimitar", "sling", "spear", "staff"], "proficiency_initial": 2, "proficiency_every": 3, "non_proficiency_penalty": -4, "alignment": "Neutral only", "allowed_alignments": ["True Neutral"], "manual_review": ["Wooden shield material is not represented in the core shield catalog.", "Druid +2 saves vs fire/lightning is situational and displayed as a note."]},
    "Fighter": {"hit_die": 10, "hit_die_text": "d10", "wealth": "(3d6 + 2) x 10 gp", "spellcaster": False, "armor": "Any armor and any shield.", "armor_types": ["any"], "shields": True, "weapons": "Any weapon", "weapon_policy": "any", "proficiency_initial": 4, "proficiency_every": 2, "non_proficiency_penalty": -2, "alignment": "Any alignment", "allowed_alignments": [], "manual_review": ["Weapon specialization is optional campaign policy."]},
    "Illusionist": {"hit_die": 4, "hit_die_text": "d4", "wealth": "2d4 x 10 gp", "spellcaster": True, "spell_lists": ["illusionist"], "armor": "No armor or shield.", "armor_types": [], "shields": False, "weapons": "Dagger, dart, oil, staff.", "weapon_policy": "list", "allowed_weapon_terms": ["dagger", "dart", "oil", "staff"], "proficiency_initial": 1, "proficiency_every": 5, "non_proficiency_penalty": -5, "alignment": "Any alignment", "allowed_alignments": [], "manual_review": []},
    "Magic-User": {"hit_die": 4, "hit_die_text": "d4", "wealth": "2d4 x 10 gp", "spellcaster": True, "spell_lists": ["magic-user"], "armor": "No armor or shield.", "armor_types": [], "shields": False, "weapons": "Dagger, dart, oil, staff.", "weapon_policy": "list", "allowed_weapon_terms": ["dagger", "dart", "oil", "staff"], "proficiency_initial": 1, "proficiency_every": 5, "non_proficiency_penalty": -5, "alignment": "Any alignment", "allowed_alignments": [], "manual_review": []},
    "Monk": {"hit_die": 4, "hit_die_text": "Manual DM Review", "wealth": "5d4 gp", "spellcaster": False, "armor": "No armor.", "armor_types": [], "shields": False, "weapons": "Restricted monk weapon list; referee-approved.", "weapon_policy": "manual", "proficiency_initial": None, "proficiency_every": None, "non_proficiency_penalty": None, "alignment": "Lawful only", "allowed_alignments": ["Lawful Good", "Lawful Neutral", "Lawful Evil"], "manual_review": ["Monk hit dice, AC progression, saves, and weapon list need full class table encoding."]},
    "Paladin": {"hit_die": 10, "hit_die_text": "d10", "wealth": "(3d6 + 2) x 10 gp", "spellcaster": True, "spell_lists": ["cleric"], "spellcasting_starts_level": 9, "armor": "Any armor and any shield.", "armor_types": ["any"], "shields": True, "weapons": "Any weapon", "weapon_policy": "any", "proficiency_initial": 3, "proficiency_every": 2, "non_proficiency_penalty": -2, "alignment": "Lawful Good only", "allowed_alignments": ["Lawful Good"], "manual_review": []},
    "Ranger": {"hit_die": 8, "hit_die_text": "2d8 at 1st level, then d8", "wealth": "(3d6 + 2) x 10 gp", "spellcaster": True, "spell_lists": ["druid", "magic-user"], "spellcasting_starts_level": 8, "armor": "Any armor and any shield.", "armor_types": ["any"], "shields": True, "weapons": "Any weapon", "weapon_policy": "any", "proficiency_initial": 3, "proficiency_every": 2, "non_proficiency_penalty": -2, "alignment": "Any good alignment", "allowed_alignments": ["Lawful Good", "Neutral Good", "Chaotic Good"], "manual_review": []},
    "Thief": {"hit_die": 6, "hit_die_text": "d6", "wealth": "2d6 x 10 gp", "spellcaster": False, "armor": "Leather or studded leather only. No shields.", "armor_types": ["Leather", "Studded"], "shields": False, "weapons": "Club, dagger, dart, oil, sling, and single-handed swords except bastard swords.", "weapon_policy": "thief", "proficiency_initial": 2, "proficiency_every": 4, "non_proficiency_penalty": -3, "alignment": "Any neutral or any evil alignment; Neutral Good allowed.", "allowed_alignments": ["Lawful Neutral", "Neutral Good", "True Neutral", "Neutral Evil", "Chaotic Neutral", "Chaotic Evil", "Lawful Evil"], "manual_review": ["Scroll use begins at 10th level and remains referee-adjudicated."]},
}

ALIGNMENTS = (
    "Lawful Good",
    "Lawful Neutral",
    "Lawful Evil",
    "Neutral Good",
    "True Neutral",
    "Neutral Evil",
    "Chaotic Good",
    "Chaotic Neutral",
    "Chaotic Evil",
)


def adjusted_abilities(scores: dict[str, int], race: str) -> dict[str, int]:
    adjustments = RACES.get(race, {}).get("adjustments", {})
    return {ability: max(3, min(18, int(scores.get(ability, 10)) + int(adjustments.get(ability, 0)))) for ability in ABILITIES}


def dex_ac_adjustment(dexterity: int) -> int:
    if dexterity <= 3:
        return 4
    if dexterity == 4:
        return 3
    if dexterity == 5:
        return 2
    if dexterity == 6:
        return 1
    if dexterity == 15:
        return -1
    if dexterity == 16:
        return -2
    if dexterity == 17:
        return -3
    if dexterity >= 18:
        return -4
    return 0


def constitution_hp_adjustment(constitution: int, class_name: str = "") -> int:
    warrior = class_name in {"Fighter", "Paladin", "Ranger"}
    if constitution <= 3:
        return -2
    if constitution <= 6:
        return -1
    if constitution == 15:
        return 1
    if constitution == 16:
        return 2
    if constitution == 17:
        return 3 if warrior else 2
    if constitution == 18:
        return 4 if warrior else 2
    if constitution >= 19:
        return 5 if warrior else 2
    return 0


MARTIAL_EXCEPTIONAL_STRENGTH_CLASSES = {"Fighter", "Paladin", "Ranger"}


def exceptional_strength_adjustment(exceptional_strength: int | None) -> int:
    if exceptional_strength is None:
        return 75
    percentile = 100 if int(exceptional_strength) == 0 else int(exceptional_strength)
    if percentile <= 50:
        return 100
    if percentile <= 75:
        return 125
    if percentile <= 90:
        return 150
    if percentile <= 99:
        return 200
    return 300


def qualifies_for_exceptional_strength(class_name: str, strength: int) -> bool:
    return class_name in MARTIAL_EXCEPTIONAL_STRENGTH_CLASSES and int(strength) == 18


def strength_encumbrance_adjustment(strength: int, exceptional_strength: int | None = None, class_name: str = "") -> int:
    if strength <= 3:
        return -35
    if strength <= 5:
        return -25
    if strength <= 7:
        return -15
    if strength <= 11:
        return 0
    if strength <= 13:
        return 10
    if strength <= 15:
        return 20
    if strength == 16:
        return 35
    if strength == 17:
        return 50
    if strength == 18:
        if qualifies_for_exceptional_strength(class_name, strength):
            return exceptional_strength_adjustment(exceptional_strength)
        return 75
    return 300


def strength_display(strength: int, exceptional_strength: int | None = None, class_name: str = "") -> str:
    if not qualifies_for_exceptional_strength(class_name, strength):
        return str(strength)
    if exceptional_strength is None:
        return "18/--"
    percentile = 100 if int(exceptional_strength) == 0 else int(exceptional_strength)
    if percentile >= 100:
        return "18/00"
    return f"18/{percentile:02d}"


def strength_attack_damage(strength: int, exceptional_strength: int | None = None, qualifies_exceptional: bool = False) -> dict[str, int]:
    strength = int(strength or 10)
    if strength <= 3:
        return {"attack": -3, "damage": -1}
    if strength <= 5:
        return {"attack": -2, "damage": -1}
    if strength <= 7:
        return {"attack": -1, "damage": 0}
    if strength <= 16:
        return {"attack": 0, "damage": 0}
    if strength == 17:
        return {"attack": 1, "damage": 1}
    if strength == 18 and qualifies_exceptional:
        percentile = 100 if int(exceptional_strength or 0) == 0 else int(exceptional_strength or 0)
        if percentile <= 0:
            return {"attack": 1, "damage": 2}
        if percentile <= 50:
            return {"attack": 1, "damage": 3}
        if percentile <= 75:
            return {"attack": 2, "damage": 3}
        if percentile <= 90:
            return {"attack": 2, "damage": 4}
        if percentile <= 99:
            return {"attack": 2, "damage": 5}
        return {"attack": 3, "damage": 6}
    if strength == 18:
        return {"attack": 1, "damage": 2}
    if strength == 19:
        return {"attack": 3, "damage": 7}
    return {"attack": 3, "damage": 7}


def ability_modifiers(scores: dict[str, int], class_name: str = "") -> dict:
    dexterity = int(scores.get("dexterity", 10))
    constitution = int(scores.get("constitution", 10))
    wisdom = int(scores.get("wisdom", 10))
    intelligence = int(scores.get("intelligence", 10))
    charisma = int(scores.get("charisma", 10))
    return {
        "dexterity": {
            "ac_adjustment": dex_ac_adjustment(dexterity),
            "surprise_bonus": -3 if dexterity == 3 else -2 if dexterity == 4 else -1 if dexterity == 5 else 1 if dexterity == 16 else 2 if dexterity == 17 else 3 if dexterity >= 18 else 0,
            "missile_to_hit": -3 if dexterity == 3 else -2 if dexterity == 4 else -1 if dexterity == 5 else 1 if dexterity == 16 else 2 if dexterity == 17 else 3 if dexterity >= 18 else 0,
        },
        "constitution": {"hp_adjustment": constitution_hp_adjustment(constitution, class_name)},
        "wisdom": {"mental_save_bonus": -3 if wisdom == 3 else -2 if wisdom == 4 else -1 if 5 <= wisdom <= 7 else 1 if wisdom == 15 else 2 if wisdom == 16 else 3 if wisdom == 17 else 4 if wisdom == 18 else 5 if wisdom >= 19 else 0},
        "intelligence": {"additional_languages": 0 if intelligence <= 7 else 1 if intelligence <= 9 else 2 if intelligence <= 11 else 3 if intelligence <= 13 else 4 if intelligence <= 15 else 5 if intelligence == 16 else 6 if intelligence == 17 else 7 if intelligence == 18 else 8},
        "charisma": {"max_henchmen": 1 if charisma <= 4 else 2 if charisma <= 6 else 3 if charisma <= 8 else 4 if charisma <= 11 else 5 if charisma <= 13 else 6 if charisma == 14 else 7 if charisma == 15 else 8 if charisma == 16 else 10 if charisma == 17 else 15 if charisma == 18 else 20},
    }


def ability_score_breakdown(scores: dict[str, int], class_name: str = "", exceptional_strength: int | None = None) -> dict:
    strength = int(scores.get("strength", 10))
    qualifies_exceptional = qualifies_for_exceptional_strength(class_name, strength)
    strength_mods = strength_attack_damage(strength, exceptional_strength, qualifies_exceptional)
    modifiers = ability_modifiers(scores, class_name)
    carry_adjustment = strength_encumbrance_adjustment(strength, exceptional_strength, class_name)
    return {
        "strength": {
            "display": strength_display(strength, exceptional_strength, class_name),
            "melee_to_hit": strength_mods["attack"],
            "melee_damage": strength_mods["damage"],
            "carry_adjustment": carry_adjustment,
            "source": "OSRIC Strength and exceptional Strength tables",
            "automation_status": "derived",
        },
        "dexterity": {
            "display": str(int(scores.get("dexterity", 10))),
            "missile_to_hit": modifiers["dexterity"]["missile_to_hit"],
            "armor_class_adjustment": modifiers["dexterity"]["ac_adjustment"],
            "reaction_initiative": modifiers["dexterity"]["surprise_bonus"],
            "source": "OSRIC Dexterity adjustment table",
            "automation_status": "derived",
        },
        "constitution": {
            "display": str(int(scores.get("constitution", 10))),
            "hit_point_adjustment": modifiers["constitution"]["hp_adjustment"],
            "source": "OSRIC Constitution hit point adjustment table",
            "automation_status": "derived",
        },
        "wisdom": {
            "display": str(int(scores.get("wisdom", 10))),
            "mental_save_bonus": modifiers["wisdom"]["mental_save_bonus"],
            "source": "OSRIC Wisdom mental attack save adjustment",
            "automation_status": "derived",
        },
        "intelligence": {
            "display": str(int(scores.get("intelligence", 10))),
            "additional_languages": modifiers["intelligence"]["additional_languages"],
            "source": "OSRIC Intelligence language adjustment",
            "automation_status": "derived",
        },
        "charisma": {
            "display": str(int(scores.get("charisma", 10))),
            "max_henchmen": modifiers["charisma"]["max_henchmen"],
            "source": "OSRIC Charisma henchmen table",
            "automation_status": "derived",
        },
    }


def coin_weight(coins: dict[str, int]) -> float:
    return sum(max(0, int(coins.get(coin, 0) or 0)) for coin in ("platinum", "gold", "electrum", "silver", "copper")) / 10


def encumbrance_details(
    total_weight: float,
    armor_move_limit: int | None = None,
    base_movement: int = 120,
    strength: int = 10,
    exceptional_strength: int | None = None,
    class_name: str = "",
    coin_load: float = 0,
    equipment_load: float | None = None,
    armor_move_source: str | None = None,
) -> dict:
    adjustment = strength_encumbrance_adjustment(strength, exceptional_strength, class_name)
    thresholds = [35 + adjustment, 70 + adjustment, 105 + adjustment, 150 + adjustment]
    maximum = thresholds[-1]
    band = "Overloaded"
    standard_move = 0
    if total_weight > maximum:
        band = "Over adjusted carry limit"
    elif total_weight <= thresholds[0]:
        band, standard_move = "Unencumbered", 120
    elif total_weight <= thresholds[1]:
        band, standard_move = "Light", 90
    elif total_weight <= thresholds[2]:
        band, standard_move = "Heavy", 60
    elif total_weight <= thresholds[3]:
        band, standard_move = "Severe", 30
    weight_move = standard_move
    if base_movement == 90 and weight_move > 30:
        weight_move -= 30
    move = weight_move
    if armor_move_limit:
        move = min(move, armor_move_limit)
    next_threshold = next((threshold + 1 for threshold in thresholds if total_weight <= threshold), None)
    return {
        "band": band,
        "movement": move,
        "weight_movement": weight_move,
        "armor_move_limit": armor_move_limit,
        "armor_move_source": armor_move_source,
        "base_movement": 120,
        "race_movement": base_movement,
        "coin_weight": round(coin_load, 2),
        "equipment_weight": round(total_weight - coin_load, 2) if equipment_load is None else round(equipment_load, 2),
        "thresholds": {
            "unencumbered": thresholds[0],
            "light": thresholds[1],
            "heavy": thresholds[2],
            "severe": thresholds[3],
        },
        "max_carried": maximum,
        "unencumbered_through": thresholds[0],
        "next_encumbrance": next_threshold,
        "strength_adjustment": adjustment,
        "source": "OSRIC encumbrance bands with Strength adjustment, racial movement, and armor movement cap",
    }


def encumbrance(total_weight: float, armor_move_limit: int | None = None, base_movement: int = 120, strength: int = 10) -> tuple[str, int]:
    details = encumbrance_details(total_weight, armor_move_limit, base_movement, strength)
    return details["band"], details["movement"]


SAVING_THROW_TABLES = {
    "Assassin": [((1, 4), (14, 16, 13, 12, 15)), ((5, 8), (12, 15, 12, 11, 13)), ((9, 12), (10, 14, 11, 10, 11)), ((13, 15), (8, 13, 10, 9, 9))],
    "Cleric": [((1, 3), (14, 16, 10, 13, 15)), ((4, 6), (13, 15, 9, 12, 14)), ((7, 9), (11, 13, 7, 10, 12)), ((10, 12), (10, 12, 6, 9, 11)), ((13, 15), (9, 11, 5, 8, 10)), ((16, 18), (8, 10, 4, 7, 9)), ((19, 99), (6, 8, 2, 5, 7))],
    "Druid": [((1, 3), (14, 16, 10, 13, 15)), ((4, 6), (13, 15, 9, 12, 14)), ((7, 9), (11, 13, 7, 10, 12)), ((10, 12), (10, 12, 6, 9, 11)), ((13, 14), (9, 11, 5, 8, 10))],
    "Fighter": [((1, 2), (16, 17, 14, 15, 17)), ((3, 4), (15, 16, 13, 14, 16)), ((5, 6), (13, 13, 11, 12, 14)), ((7, 8), (12, 12, 10, 11, 13)), ((9, 10), (10, 9, 8, 9, 11)), ((11, 12), (9, 8, 7, 8, 10)), ((13, 14), (7, 5, 5, 6, 8)), ((15, 16), (6, 4, 4, 5, 7)), ((17, 18), (5, 4, 3, 4, 6)), ((19, 99), (4, 3, 2, 3, 5))],
    "Illusionist": [((1, 5), (11, 15, 14, 13, 12)), ((6, 10), (9, 13, 13, 11, 10)), ((11, 15), (7, 11, 11, 9, 8)), ((16, 20), (5, 9, 10, 7, 6)), ((21, 99), (3, 7, 8, 5, 4))],
    "Magic-User": [((1, 5), (11, 15, 14, 13, 12)), ((6, 10), (9, 13, 13, 11, 10)), ((11, 15), (7, 11, 11, 9, 8)), ((16, 20), (5, 9, 10, 7, 6)), ((21, 99), (3, 7, 8, 5, 4))],
    "Paladin": [((1, 2), (14, 15, 12, 13, 15)), ((3, 4), (13, 14, 11, 12, 14)), ((5, 6), (11, 11, 9, 10, 12)), ((7, 8), (10, 10, 8, 9, 11)), ((9, 10), (8, 7, 6, 7, 9)), ((11, 12), (7, 6, 5, 6, 8)), ((13, 14), (5, 3, 3, 4, 6)), ((15, 16), (4, 2, 2, 3, 5)), ((17, 18), (3, 2, 2, 2, 4)), ((19, 99), (2, 2, 2, 2, 3))],
    "Ranger": [((1, 2), (16, 17, 14, 15, 17)), ((3, 4), (15, 16, 13, 14, 16)), ((5, 6), (13, 13, 11, 12, 14)), ((7, 8), (12, 12, 10, 11, 13)), ((9, 10), (10, 9, 8, 9, 11)), ((11, 12), (9, 8, 7, 8, 10)), ((13, 14), (7, 5, 5, 6, 8)), ((15, 16), (6, 4, 4, 5, 7)), ((17, 18), (5, 4, 3, 4, 6)), ((19, 99), (4, 3, 2, 3, 5))],
    "Thief": [((1, 4), (14, 16, 13, 12, 15)), ((5, 8), (12, 15, 12, 11, 13)), ((9, 12), (10, 14, 11, 10, 11)), ((13, 16), (8, 13, 10, 9, 9)), ((17, 20), (6, 12, 9, 8, 7)), ((21, 99), (4, 11, 8, 7, 5))],
}


def constitution_save_bonus(constitution: int) -> int:
    if constitution <= 3:
        return 0
    if constitution <= 6:
        return 1
    if constitution <= 10:
        return 2
    if constitution <= 13:
        return 3
    if constitution <= 17:
        return 4
    return 5


def saving_throws(class_name: str, level: int, race: str = "Human", constitution: int = 10) -> dict:
    table = SAVING_THROW_TABLES.get(class_name)
    if not table:
        return {"status": "Manual DM Review", "reason": "No verified single-class saving throw table is encoded for this class yet."}
    values = table[-1][1]
    band = f"{table[-1][0][0]}+"
    for (low, high), row in table:
        if low <= level <= high:
            values = row
            band = f"{low}-{high}" if high < 99 else f"{low}+"
            break
    base_categories = {category: value for category, value in zip(SAVE_CATEGORIES, values)}
    categories = dict(base_categories)
    modifiers = {category: [] for category in SAVE_CATEGORIES}
    notes = ["Druid +2 bonus vs fire/lightning is situational and not applied to the base table."] if class_name == "Druid" else []
    if race == "Dwarf":
        bonus = constitution_save_bonus(constitution)
        for category in ("aimed_magic_items", "death_paralysis_poison", "spells"):
            before = categories[category]
            categories[category] = max(2, categories[category] - bonus)
            modifiers[category].append({
                "label": "Dwarf racial adjustment",
                "modifier": categories[category] - before,
                "source": "OSRIC Dwarf Constitution save adjustment against magic and poison",
            })
        notes.append(f"Dwarf Constitution save adjustment applied: +{bonus} against magic and poison.")
    breakdown = {}
    for category in SAVE_CATEGORIES:
        rows = [
            {
                "label": f"Base {class_name} Save",
                "value": base_categories[category],
                "source": f"OSRIC {class_name} saving throw table",
            }
        ]
        rows.extend(modifiers[category])
        rows.append({"label": "Miscellaneous", "modifier": 0, "source": "No miscellaneous save modifier currently applied"})
        rows.append({"label": "Final Save", "value": categories[category]})
        breakdown[category] = rows
    return {
        "level_band": band,
        "level_source": level,
        "class_source": class_name,
        "race_source": race,
        "categories": categories,
        "base_categories": base_categories,
        "breakdown": breakdown,
        "labels": SAVE_LABELS,
        "notes": notes,
        "source": f"OSRIC {class_name} saving throw table",
        "automation_status": "derived",
    }


def slots_from_rows(rows: dict[int, str], level: int) -> dict[str, int]:
    if not rows:
        return {}
    capped_level = min(max(1, level), max(rows))
    row = rows.get(capped_level) or rows[max(rows)]
    slots = {}
    for index, value in enumerate(row.split("/"), start=1):
        slots[str(index)] = 0 if value == "-" else int(value)
    return slots


SPELL_SLOT_TABLES = {
    "Cleric": {
        1: "1/-/-/-/-/-/-", 2: "2/-/-/-/-/-/-", 3: "2/1/-/-/-/-/-", 4: "3/2/-/-/-/-/-",
        5: "3/3/1/-/-/-/-", 6: "3/3/2/-/-/-/-", 7: "3/3/2/1/-/-/-", 8: "3/3/3/2/-/-/-",
        9: "4/4/3/2/1/-/-", 10: "4/4/3/3/2/-/-", 11: "5/4/4/3/2/1/-", 12: "6/5/5/3/2/2/-",
        13: "6/6/6/4/2/2/-", 14: "6/6/6/5/3/2/-", 15: "7/7/7/5/4/2/-", 16: "7/7/7/6/5/3/1",
        17: "8/8/8/6/5/3/1", 18: "8/8/8/7/6/4/1", 19: "9/9/9/7/6/4/2", 20: "9/9/9/8/7/5/2",
        21: "9/9/9/9/8/6/2", 22: "9/9/9/9/9/6/3", 23: "9/9/9/9/9/7/3", 24: "9/9/9/9/9/8/3",
    },
    "Druid": {
        1: "2/-/-/-/-/-/-", 2: "2/1/-/-/-/-/-", 3: "3/2/1/-/-/-/-", 4: "4/2/2/-/-/-/-",
        5: "4/3/2/-/-/-/-", 6: "4/3/2/1/-/-/-", 7: "4/4/3/1/-/-/-", 8: "4/4/3/2/-/-/-",
        9: "5/4/3/2/1/-/-", 10: "5/4/3/3/2/-/-", 11: "5/5/3/3/2/1/-", 12: "5/5/4/4/3/2/1",
        13: "6/5/5/5/4/3/2", 14: "6/6/6/6/5/4/3",
    },
    "Magic-User": {
        1: "1/-/-/-/-/-/-/-/-", 2: "2/-/-/-/-/-/-/-/-", 3: "2/1/-/-/-/-/-/-/-", 4: "3/2/-/-/-/-/-/-/-",
        5: "4/2/1/-/-/-/-/-/-", 6: "4/3/2/-/-/-/-/-/-", 7: "4/3/2/1/-/-/-/-/-", 8: "4/3/3/2/-/-/-/-/-",
        9: "4/4/3/2/1/-/-/-/-", 10: "4/4/3/2/2/-/-/-/-", 11: "4/4/4/3/3/-/-/-/-", 12: "5/4/4/3/3/1/-/-/-",
        13: "5/5/4/3/3/2/-/-/-", 14: "5/5/5/4/4/2/1/-/-", 15: "5/5/5/4/4/3/2/-/-", 16: "5/5/5/4/4/3/2/1/-",
        17: "5/5/5/5/5/4/3/2/-", 18: "5/5/5/5/5/4/3/2/1", 19: "5/5/5/5/5/5/4/3/1", 20: "5/5/5/5/5/5/4/3/2",
        21: "6/6/5/5/5/5/4/4/2", 22: "6/6/6/6/5/5/5/4/2", 23: "6/6/6/6/6/6/5/4/3", 24: "6/6/6/6/6/6/6/5/3",
    },
    "Illusionist": {
        1: "1/-/-/-/-/-/-", 2: "2/-/-/-/-/-/-", 3: "2/1/-/-/-/-/-", 4: "3/2/-/-/-/-/-",
        5: "4/3/1/-/-/-/-", 6: "4/3/2/-/-/-/-", 7: "4/3/2/1/-/-/-", 8: "4/3/2/2/-/-/-",
        9: "5/3/3/2/-/-/-", 10: "5/4/3/2/1/-/-", 11: "5/4/3/3/2/-/-", 12: "5/5/4/3/2/1/-",
        13: "5/5/4/3/2/2/-", 14: "5/5/4/3/2/2/1", 15: "5/5/4/4/2/2/2", 16: "5/5/5/4/3/2/2",
        17: "6/5/5/4/3/3/2", 18: "6/6/5/4/4/3/2", 19: "6/6/5/5/5/3/2", 20: "6/6/6/5/5/4/2",
        21: "6/6/6/6/5/4/3", 22: "6/6/6/6/5/5/3", 23: "6/6/6/6/6/5/4", 24: "6/6/6/6/6/6/5",
    },
    "Paladin": {
        1: "-/-/-/-", 2: "-/-/-/-", 3: "-/-/-/-", 4: "-/-/-/-", 5: "-/-/-/-", 6: "-/-/-/-", 7: "-/-/-/-", 8: "-/-/-/-",
        9: "1/-/-/-", 10: "2/-/-/-", 11: "2/1/-/-", 12: "2/2/-/-", 13: "2/2/1/-", 14: "3/2/1/-", 15: "3/2/1/1",
        16: "3/3/1/1", 17: "3/3/2/1", 18: "3/3/3/1", 19: "3/3/3/2", 20: "3/3/3/3", 21: "4/3/3/3",
        22: "4/4/3/3", 23: "4/4/4/3", 24: "4/4/4/4",
    },
}

RANGER_DRUID_SLOTS = {
    1: "-/-/-", 2: "-/-/-", 3: "-/-/-", 4: "-/-/-", 5: "-/-/-", 6: "-/-/-", 7: "-/-/-",
    8: "1/-/-", 9: "1/-/-", 10: "2/-/-", 11: "2/-/-", 12: "2/1/-", 13: "2/1/-", 14: "2/2/-",
    15: "2/2/-", 16: "2/2/1", 17: "2/2/2", 18: "3/2/2", 19: "3/2/2", 20: "3/3/2",
    21: "3/3/2", 22: "3/3/3", 23: "4/3/3", 24: "4/3/3",
}

RANGER_MAGIC_USER_SLOTS = {
    1: "-/-", 2: "-/-", 3: "-/-", 4: "-/-", 5: "-/-", 6: "-/-", 7: "-/-", 8: "-/-",
    9: "1/-", 10: "1/-", 11: "2/-", 12: "2/-", 13: "2/1", 14: "2/1", 15: "2/2", 16: "2/2",
    17: "2/2", 18: "2/2", 19: "3/2", 20: "3/2", 21: "3/3", 22: "3/3", 23: "3/3", 24: "4/3",
}

SWORD_KNIGHT_CLERIC_SLOTS = {
    6: "1/-/-/-/-/-/-",
    7: "2/-/-/-/-/-/-",
    8: "2/1/-/-/-/-/-",
    9: "3/2/-/-/-/-/-",
    10: "4/2/-/-/-/-/-",
    11: "4/2/1/-/-/-/-",
    12: "5/3/1/1/-/-/-",
    13: "6/4/1/1/1/-/-",
    14: "7/5/2/1/1/1/-",
    15: "8/6/3/2/1/1/1",
    16: "9/7/3/2/2/1/1",
    17: "9/8/4/3/3/2/1",
    18: "9/9/5/4/3/2/1",
}


def spell_slots(class_name: str, level: int) -> dict:
    if class_name == "Ranger":
        return {
            "druid": slots_from_rows(RANGER_DRUID_SLOTS, level),
            "magic-user": slots_from_rows(RANGER_MAGIC_USER_SLOTS, level),
        }
    if class_name == "Knight of the Sword":
        return slots_from_rows(SWORD_KNIGHT_CLERIC_SLOTS, level)
    table = SPELL_SLOT_TABLES.get(class_name)
    return slots_from_rows(table or {}, level)


def spell_slot_summary(class_name: str, level: int, character_spells: list[dict]) -> dict:
    slots = spell_slots(class_name, level)
    used: dict = {}
    for entry in character_spells:
        spell = entry.get("spell") or {}
        count = int(entry.get("memorized_count") or (1 if entry.get("prepared") else 0))
        if count <= 0:
            continue
        spell_level = str(spell.get("spell_level") or 0)
        lists = spell.get("class_list") or []
        if class_name == "Ranger":
            bucket = "druid" if "druid" in lists else "magic-user" if "magic-user" in lists else None
            if bucket:
                used.setdefault(bucket, {})
                used[bucket][spell_level] = used[bucket].get(spell_level, 0) + count
        else:
            used[spell_level] = used.get(spell_level, 0) + count
    remaining = {}
    if class_name == "Ranger":
        for bucket, levels in slots.items():
            remaining[bucket] = {level_key: max(0, value - used.get(bucket, {}).get(level_key, 0)) for level_key, value in levels.items()}
    else:
        remaining = {level_key: max(0, value - used.get(level_key, 0)) for level_key, value in slots.items()}
    return {"slots": slots, "used": used, "remaining": remaining}


def proficiency_count(class_name: str, level: int) -> int | None:
    info = CLASSES.get(class_name, {})
    initial = info.get("proficiency_initial")
    every = info.get("proficiency_every")
    if initial is None or every is None:
        return None
    return int(initial) + max(0, (max(1, level) - 1) // int(every))


def class_allows_alignment(class_name: str, alignment: str) -> bool:
    allowed = CLASSES.get(class_name, {}).get("allowed_alignments") or []
    return not allowed or alignment in allowed


def race_allows_class(race: str, class_name: str) -> bool:
    return class_name in (RACES.get(race, {}).get("classes") or [])


def ammunition_profile(equipment: dict) -> dict | None:
    name = (equipment.get("name") or "").lower()
    subtype = (equipment.get("subtype") or "").lower()
    if "ammunition" in subtype:
        for profile in AMMUNITION_RULES:
            if any(term in name for term in profile["name_terms"]):
                return profile
        return {
            "kind": "ammunition",
            "name_terms": (),
            "display_name": equipment.get("name") or "Ammunition",
            "compatible_weapon_terms": (),
            "bundle_size": 1,
        }
    return next((profile for profile in AMMUNITION_RULES if any(term in name for term in profile["name_terms"])), None)


def is_ammunition(equipment: dict) -> bool:
    return ammunition_profile(equipment) is not None


def ammunition_unit_weight(equipment: dict) -> float:
    weight = float(equipment.get("weight") or 0)
    profile = ammunition_profile(equipment)
    if not profile:
        return weight
    bundle_size = int(profile.get("bundle_size") or 1)
    return weight / max(1, bundle_size)


def equipment_total_weight(equipment: dict, quantity: int) -> float:
    return ammunition_unit_weight(equipment) * max(0, int(quantity or 0))


def ammunition_unit_cost(equipment: dict) -> float | None:
    cost = equipment.get("cost_amount")
    if cost is None:
        return None
    profile = ammunition_profile(equipment)
    if not profile:
        return float(cost)
    bundle_size = int(profile.get("bundle_size") or 1)
    return float(cost) / max(1, bundle_size)


def equipment_stack_value(equipment: dict, quantity: int) -> float | None:
    unit_cost = ammunition_unit_cost(equipment)
    if unit_cost is None:
        return None
    if ammunition_profile(equipment):
        return unit_cost * max(0, int(quantity or 0))
    return unit_cost * max(1, int(quantity or 1))


def is_allowed_equipment(class_name: str, equipment: dict) -> tuple[bool, str]:
    info = CLASSES.get(class_name, {})
    item_type = equipment.get("type")
    name = (equipment.get("name") or "").lower()
    if item_type == "armor":
        allowed = info.get("armor_types", [])
        if "any" in allowed:
            return True, "Allowed armor"
        return any(term.lower() in name for term in allowed), info.get("armor", "Manual DM Review")
    if item_type == "shield":
        return bool(info.get("shields")), info.get("shield_note") or ("Allowed shield" if info.get("shields") else "Class does not allow shields")
    if item_type == "weapon":
        if is_ammunition(equipment):
            return True, "Ammunition"
        policy = info.get("weapon_policy")
        if policy == "any":
            return True, "Allowed weapon"
        if policy == "manual":
            return False, "Manual DM Review: class weapon list is not encoded safely."
        if policy == "thief":
            allowed = any(term in name for term in ["club", "dagger", "dart", "oil", "sling"]) or ("sword" in name and "bastard" not in name and "two-handed" not in name)
            return allowed, info.get("weapons", "")
        terms = info.get("allowed_weapon_terms") or []
        return any(term in name for term in terms), info.get("weapons", "")
    return True, "Noncombat equipment"


def character_warnings(race: str, class_name: str, alignment: str) -> list[str]:
    warnings = []
    if not class_allows_alignment(class_name, alignment):
        warnings.append(f"{class_name} alignment restriction: {CLASSES.get(class_name, {}).get('alignment')}.")
    warnings.extend(
        warning
        for warning in (CLASSES.get(class_name, {}).get("manual_review") or [])
        if "optional campaign policy" not in warning.lower()
    )
    return warnings


def derived_stats(
    abilities: dict[str, int],
    inventory: list[dict],
    coins: dict[str, int],
    class_name: str = "Fighter",
    race: str = "Human",
    level: int = 1,
    exceptional_strength: int | None = None,
) -> dict:
    coin_load = coin_weight(coins)
    carried_weight = coin_load
    equipment_weight = 0.0
    armor_ac = 10
    armor_move_limit = None
    armor_name = None
    armor_legal = True
    armor_reason = ""
    shield_bonus = 0
    shield_name = None
    shield_legal = True
    shield_reason = ""
    for item in inventory:
        status = item.get("status", "carried")
        equipment = item.get("equipment") or {}
        quantity = max(1, int(item.get("quantity", 1) or 1))
        if status in {"carried", "equipped"}:
            item_weight = equipment_total_weight(equipment, quantity)
            equipment_weight += item_weight
            carried_weight += item_weight
        if status == "equipped":
            if equipment.get("type") == "armor" and equipment.get("armor_class_value"):
                allowed, reason = is_allowed_equipment(class_name, equipment)
                if allowed and int(equipment["armor_class_value"]) < armor_ac:
                    armor_ac = int(equipment["armor_class_value"])
                    armor_name = equipment.get("name")
                    armor_reason = reason
                    max_move = (equipment.get("properties") or {}).get("max_move")
                    if max_move:
                        armor_move_limit = int(max_move)
                elif not allowed:
                    armor_legal = False
                    armor_name = equipment.get("name")
                    armor_reason = reason
            if equipment.get("type") == "shield":
                allowed, reason = is_allowed_equipment(class_name, equipment)
                if allowed:
                    shield_bonus = max(shield_bonus, 1)
                    shield_name = equipment.get("name")
                    shield_reason = reason
                else:
                    shield_legal = False
                    shield_name = equipment.get("name")
                    shield_reason = reason
    dex_adjustment = dex_ac_adjustment(int(abilities.get("dexterity", 10)))
    armor_class = armor_ac - shield_bonus + dex_adjustment
    flank_armor_class = armor_class + shield_bonus
    rear_armor_class = flank_armor_class - dex_adjustment
    armor_adjustment = armor_ac - 10
    shield_adjustment = -shield_bonus
    ac_notes = ["Only equipped, legal armor and shields affect descending Armor Class."]
    if not armor_legal:
        ac_notes.append(f"Illegal armor ignored for AC: {armor_reason}")
    if not shield_legal:
        ac_notes.append(f"Illegal shield ignored for AC: {shield_reason}")
    armor_class_breakdown = {
        "source": "OSRIC descending Armor Class from armor, shield, and Dexterity",
        "base": {"label": "Base AC", "value": 10},
        "armor": {
            "label": armor_name or "No armor",
            "value": armor_adjustment,
            "armor_class_value": armor_ac,
            "legal": armor_legal,
            "reason": armor_reason,
        },
        "shield": {
            "label": shield_name or "No shield",
            "value": shield_adjustment,
            "legal": shield_legal,
            "reason": shield_reason,
        },
        "dexterity": {"label": "Dexterity", "value": dex_adjustment, "source": "OSRIC Dexterity AC adjustment"},
        "magical": {"label": "Magic", "value": 0, "automation_status": "not_modeled"},
        "miscellaneous": {"label": "Miscellaneous", "value": 0},
        "final": armor_class,
        "flank": {
            "label": "Flank AC",
            "value": flank_armor_class,
            "removed": ["shield"] if shield_bonus else [],
            "source": "Final AC without shield bonus",
        },
        "rear": {
            "label": "Rear AC",
            "value": rear_armor_class,
            "removed": [part for part, active in (("shield", shield_bonus), ("dexterity", dex_adjustment)) if active],
            "source": "Final AC without shield bonus or Dexterity adjustment",
        },
        "notes": ac_notes,
        "automation_status": "derived",
    }
    encumbrance = encumbrance_details(
        carried_weight,
        armor_move_limit,
        int(RACES.get(race, {}).get("movement", 120)),
        int(abilities.get("strength", 10)),
        exceptional_strength,
        class_name,
        coin_load,
        equipment_weight,
        armor_name,
    )
    surprise = ability_modifiers(abilities, class_name)["dexterity"]["surprise_bonus"]
    return {
        "armor_class": armor_class,
        "flank_armor_class": flank_armor_class,
        "rear_armor_class": rear_armor_class,
        "unarmored_ac": 10 + dex_adjustment,
        "shield_bonus": shield_bonus,
        "dex_adjustment": dex_adjustment,
        "movement_rate": encumbrance["movement"],
        "carried_weight": round(carried_weight, 2),
        "encumbrance_band": encumbrance["band"],
        "encumbrance": encumbrance,
        "strength_display": strength_display(int(abilities.get("strength", 10)), exceptional_strength, class_name),
        "surprise_adjustment": f"{surprise:+d}",
        "initiative_adjustment": "Manual DM Review: OSRIC Dexterity does not modify melee initiative, but may modify missile initiative.",
        "saving_throws": saving_throws(class_name, level, race, int(abilities.get("constitution", 10))),
        "ability_modifiers": ability_modifiers(abilities, class_name),
        "ability_breakdown": ability_score_breakdown(abilities, class_name, exceptional_strength),
        "armor_class_breakdown": armor_class_breakdown,
        "coin_weight": round(coin_load, 2),
        "coin_count": sum(max(0, int(coins.get(coin, 0) or 0)) for coin in ("platinum", "gold", "electrum", "silver", "copper")),
        "warnings": character_warnings(race, class_name, ""),
    }


def content_root() -> Path:
    return Path(__file__).resolve().parents[3] / "content" / "1e"


def parse_weight(value: str) -> float:
    value = value.strip().lower()
    if value in {"-", "n/a", "free", "not sold"}:
        return 0
    if "1/2" in value:
        return 0.5
    match = re.search(r"(\d+(?:\.\d+)?)", value)
    return float(match.group(1)) if match else 0


def parse_cost(value: str) -> tuple[float | None, str | None]:
    value = value.strip()
    match = re.search(r"(\d+(?:\.\d+)?)\+?\s*(pp|gp|ep|sp|cp)", value, re.I)
    if not match:
        return None, None
    return float(match.group(1)), match.group(2).lower()


def table_rows(markdown: str, heading: str) -> list[list[str]]:
    lines = markdown.splitlines()
    start = next((index for index, line in enumerate(lines) if line.strip() == f"## {heading}"), None)
    if start is None:
        return []
    rows = []
    for line in lines[start + 1 :]:
        if line.startswith("## "):
            break
        if line.startswith("|") and "---" not in line:
            rows.append([cell.strip() for cell in line.strip("|").split("|")])
    return rows[1:]


def equipment_seed() -> list[dict]:
    markdown = (content_root() / "equipment.md").read_text()
    seeds: list[dict] = []
    for row in table_rows(markdown, "General Equipment"):
        cost_amount, cost_coin = parse_cost(row[2])
        seeds.append({"name": row[0], "type": "adventuring_gear", "subtype": "general", "weight": parse_weight(row[1]), "cost_amount": cost_amount, "cost_coin": cost_coin})
    for row in table_rows(markdown, "Animals And Transport"):
        cost_amount, cost_coin = parse_cost(row[2])
        seeds.append({"name": row[0], "type": "mount" if any(word in row[0].lower() for word in ("horse", "mule", "ox", "pony")) else "transport", "subtype": "animal_transport", "weight": parse_weight(row[1]), "cost_amount": cost_amount, "cost_coin": cost_coin})
    for row in table_rows(markdown, "Master Weapon Table"):
        cost_amount, cost_coin = parse_cost(row[4])
        seeds.append({"name": row[0], "type": "weapon", "subtype": "melee", "damage_small_medium": row[1], "damage_large": row[2], "weight": parse_weight(row[3]), "cost_amount": cost_amount, "cost_coin": cost_coin})
    for row in table_rows(markdown, "Missile Weapon Table"):
        cost_amount, cost_coin = parse_cost(row[6])
        seeds.append({"name": row[0], "type": "weapon", "subtype": "missile", "damage_small_medium": row[1], "damage_large": row[2], "rate_of_fire": row[3], "range": row[4], "weight": parse_weight(row[5]), "cost_amount": cost_amount, "cost_coin": cost_coin})
    armor_ac = {"Banded": 4, "Mail hauberk or byrnie": 5, "Mail, elfin": 5, "Leather": 8, "Padded gambeson": 8, "Plate": 3, "Ring": 7, "Scale or lamellar": 6, "Splint": 4, "Studded": 7}
    for row in table_rows(markdown, "Armour"):
        cost_amount, cost_coin = parse_cost(row[4])
        is_shield = row[0].startswith("Shield")
        max_move = parse_weight(row[2]) if not is_shield else None
        seeds.append({
            "name": row[0],
            "type": "shield" if is_shield else "armor",
            "subtype": "shield" if is_shield else "armor",
            "weight": parse_weight(row[1]),
            "cost_amount": cost_amount,
            "cost_coin": cost_coin,
            "armor_class_value": 9 if is_shield else armor_ac.get(row[0]),
            "armor_class_adjustment": -1 if is_shield else parse_weight(row[3]) * -1,
            "properties": {"max_move": int(max_move) if max_move else None},
        })
    deduped = {}
    for seed in seeds:
        seed["rules_reference"] = "/1e/equipment/"
        seed["is_core_osric"] = True
        seed["is_dm_created"] = False
        deduped[seed["name"]] = seed
    return list(deduped.values())


def strip_md_links(value: str) -> tuple[str, str | None]:
    match = re.search(r"\[([^\]]+)\]\(([^)]+)\)", value)
    if match:
        return match.group(1), match.group(2)
    return re.sub(r"[*_`]", "", value).strip(), None


def spell_seed() -> list[dict]:
    markdown = (content_root() / "spells" / "all-spells.md").read_text()
    seeds = {}
    for row in table_rows(markdown, "Spell Index"):
        name, href = strip_md_links(row[0])
        class_entries = []
        min_level = 9
        for part in row[1].split(","):
            match = re.search(r"([A-Za-z -]+)\s+(\d+)", part.strip())
            if match:
                spell_class = match.group(1).strip().lower().replace(" ", "-")
                level = int(match.group(2))
                class_entries.append(spell_class)
                min_level = min(min_level, level)
        seeds[name] = {
            "name": name,
            "class_list": class_entries,
            "spell_level": min_level if min_level != 9 or "9" in row[1] else 1,
            "description": "Manual DM Review: see linked spell page for full OSRIC text.",
            "rules_reference": href or "/1e/spells/all-spells/",
        }
    spells_dir = content_root() / "spells"
    for seed in seeds.values():
        href = seed.get("rules_reference") or ""
        slug = href.strip("/").split("/")[-1] if href.startswith("/1e/spells/") else ""
        spell_file = spells_dir / f"{slug}.md"
        if not spell_file.exists():
            continue
        text = spell_file.read_text()
        fields = {}
        for row in re.findall(r"\| ([^|]+) \| ([^|]+) \|", text):
            key = row[0].strip().lower()
            value = row[1].strip()
            fields[key] = value
        seed["range"] = fields.get("range")
        seed["duration"] = fields.get("duration")
        seed["area_of_effect"] = fields.get("area of effect")
        seed["components"] = fields.get("components")
        description = re.search(r"### Spell Description\n\n(.+?)(?:\n\n###|\n\n##|$)", text, re.S)
        if description:
            seed["description"] = re.sub(r"\s+", " ", description.group(1)).strip()
    return list(seeds.values())


def seed_vault_catalogs(db: Session) -> None:
    if db.scalar(select(EquipmentCatalog.id).limit(1)) is None:
        for seed in equipment_seed():
            db.add(EquipmentCatalog(**seed))
    if db.scalar(select(SpellsCatalog.id).limit(1)) is None:
        for seed in spell_seed():
            db.add(SpellsCatalog(**seed))
    db.commit()
