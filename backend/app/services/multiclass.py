from __future__ import annotations

from typing import Any


MULTICLASS_COMBINATIONS: dict[str, tuple[tuple[str, ...], ...]] = {
    "Dwarf": (("Fighter", "Thief"),),
    "Elf": (
        ("Fighter", "Magic-User"),
        ("Fighter", "Thief"),
        ("Magic-User", "Thief"),
        ("Fighter", "Magic-User", "Thief"),
    ),
    "Gnome": (
        ("Fighter", "Illusionist"),
        ("Fighter", "Thief"),
        ("Illusionist", "Thief"),
    ),
    "Half-Elf": (
        ("Cleric", "Fighter"),
        ("Cleric", "Ranger"),
        ("Cleric", "Magic-User"),
        ("Fighter", "Magic-User"),
        ("Fighter", "Thief"),
        ("Magic-User", "Thief"),
        ("Cleric", "Fighter", "Magic-User"),
        ("Fighter", "Magic-User", "Thief"),
    ),
    "Halfling": (("Fighter", "Thief"),),
    "Half-Orc": (
        ("Cleric", "Fighter"),
        ("Cleric", "Thief"),
        ("Cleric", "Assassin"),
        ("Fighter", "Thief"),
        ("Fighter", "Assassin"),
    ),
}

MULTICLASS_RESTRICTIONS = {
    "Dwarf": "The more restrictive class requirements apply when using class abilities.",
    "Elf": "The less restrictive class requirements apply; thief abilities require thief-permitted armor.",
    "Gnome": "Multi-class gnomes may wear leather armor, no better.",
    "Half-Elf": "The less restrictive class requirements apply; thief abilities require thief-permitted armor.",
    "Halfling": "Thief abilities require thief-permitted armor.",
    "Half-Orc": "Use the more restrictive armor rules and the less restrictive weapon rules.",
}


def canonical_combination(classes: list[str] | tuple[str, ...]) -> tuple[str, ...]:
    return tuple(str(value).strip() for value in classes if str(value).strip())


def allowed_combinations(race: str) -> list[list[str]]:
    return [list(combo) for combo in MULTICLASS_COMBINATIONS.get(race, ())]


def validate_combination(race: str, classes: list[str] | tuple[str, ...]) -> bool:
    selected = canonical_combination(classes)
    if len(selected) == 1:
        return True
    return any(set(selected) == set(combo) and len(selected) == len(combo) for combo in MULTICLASS_COMBINATIONS.get(race, ()))


def normalize_class_tracks(
    tracks: Any,
    fallback_class: str = "Fighter",
    fallback_level: int = 1,
    total_xp: int = 0,
) -> list[dict[str, Any]]:
    raw = tracks if isinstance(tracks, list) else []
    normalized: list[dict[str, Any]] = []
    for entry in raw:
        if not isinstance(entry, dict):
            continue
        class_name = str(entry.get("class_name") or "").strip()
        if not class_name or class_name in {track["class_name"] for track in normalized}:
            continue
        normalized.append(
            {
                "class_name": class_name,
                "level": max(1, int(entry.get("level") or 1)),
                "xp": max(0, int(entry.get("xp") or 0)),
                "state": str(entry.get("state") or "active"),
            }
        )
    if not normalized:
        normalized = [{
            "class_name": fallback_class,
            "level": max(1, int(fallback_level or 1)),
            "xp": max(0, int(total_xp or 0)),
            "state": "active",
        }]
    return normalized


def distribute_xp(tracks: list[dict[str, Any]], total_xp: int) -> list[dict[str, Any]]:
    normalized = normalize_class_tracks(tracks, total_xp=total_xp)
    share = max(0, int(total_xp or 0)) // len(normalized)
    return [{**track, "xp": share} for track in normalized]


def class_display(tracks: list[dict[str, Any]]) -> str:
    return "/".join(track["class_name"] for track in tracks)


def level_display(tracks: list[dict[str, Any]]) -> str:
    return "/".join(str(track["level"]) for track in tracks)

