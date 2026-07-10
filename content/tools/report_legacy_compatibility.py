#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = REPO_ROOT / "backend"
sys.path.insert(0, str(REPO_ROOT / "content" / "tools"))
sys.path.insert(0, str(BACKEND_ROOT))

from validate_content import canonical_json_files, load_json, validate_content  # noqa: E402

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover - covered by environments without pypdf
    PdfReader = None


RISK_SAFE = "safe_auto_map"
RISK_REVIEW = "needs_review"
RISK_CONFLICT = "conflict"
RISK_MISSING = "missing"
RISK_LEGACY_ONLY = "legacy_only"
RISK_CANONICAL_ONLY = "canonical_only"

DRAGONLANCE_PDF_CANDIDATES = [
    REPO_ROOT / "private-reference" / "sources" / "Dragonlance_Adventures_1e.pdf",
    REPO_ROOT / "docs" / "sources" / "Dragonlance_Adventures_1e.pdf",
]

DRAGONLANCE_EXPECTED_RACES = [
    "Human",
    "Kender",
    "Gnome",
    "Tinker Gnome",
    "Elf",
    "Qualinesti Elf",
    "Silvanesti Elf",
    "Kagonesti Elf",
    "Dimernesti Elf",
    "Half-Elf",
    "Dwarf",
    "Hill Dwarf",
    "Mountain Dwarf",
    "Gully Dwarf",
    "Irda",
    "Minotaur",
]

DRAGONLANCE_RACE_ALIASES = {
    "Gnome": ["Gnomes"],
    "Tinker Gnome": ["Tinker Gnomes"],
    "Qualinesti Elf": ["Qualinesti"],
    "Silvanesti Elf": ["Silvanesti"],
    "Kagonesti Elf": ["Kagonesti"],
    "Dimernesti Elf": ["Dimernesti"],
    "Half-Elf": ["Half elves", "Half-elves"],
    "Hill Dwarf": ["Hill Dwarves"],
    "Mountain Dwarf": ["Mountain Dwarves"],
    "Gully Dwarf": ["Gully Dwarves"],
    "Minotaur": ["Minotaurs"],
}

DRAGONLANCE_EXPECTED_CLASSES = [
    {"name": "Cleric", "base_osric": "osric.class.cleric"},
    {"name": "Druid", "base_osric": "osric.class.druid"},
    {"name": "Fighter", "base_osric": "osric.class.fighter"},
    {"name": "Ranger", "base_osric": "osric.class.ranger"},
    {"name": "Magic-User", "base_osric": "osric.class.magic_user"},
    {"name": "Illusionist", "base_osric": "osric.class.illusionist"},
    {"name": "Handler", "base_osric": "osric.class.thief"},
    {"name": "Tinker", "base_osric": None},
    {"name": "Knight of the Crown", "base_osric": "osric.class.fighter"},
    {"name": "Knight of the Sword", "base_osric": "osric.class.fighter"},
    {"name": "Knight of the Rose", "base_osric": "osric.class.fighter"},
    {"name": "White Robe Wizard", "base_osric": "osric.class.magic_user"},
    {"name": "Red Robe Wizard", "base_osric": "osric.class.magic_user"},
    {"name": "Black Robe Wizard", "base_osric": "osric.class.magic_user"},
]

DRAGONLANCE_EXPECTED_DEITIES = [
    "Paladine",
    "Majere",
    "Kiri-Jolith",
    "Mishakal",
    "Habbakuk",
    "Branchala",
    "Solinari",
    "Gilean",
    "Sirrion",
    "Reorx",
    "Chislev",
    "Zivilyn",
    "Shinare",
    "Lunitari",
    "Takhisis",
    "Sargonnas",
    "Morgion",
    "Chemosh",
    "Zeboim",
    "Hiddukel",
    "Nuitari",
]

DRAGONLANCE_EXPECTED_ORGANIZATIONS = [
    "White Robes",
    "Red Robes",
    "Black Robes",
    "Knights of the Crown",
    "Knights of the Sword",
    "Knights of the Rose",
]

DRAGONLANCE_EXPECTED_MOONS = ["Solinari", "Lunitari", "Nuitari"]

RACE_REQUIRED_FIELDS = [
    "ability_minimums",
    "ability_maximums",
    "ability_adjustments",
    "class_access",
    "level_limits",
    "movement",
    "size",
    "languages",
    "vision",
    "saving_throw_modifiers",
    "combat_modifiers",
    "racial_abilities",
    "special_restrictions",
    "starting_age",
    "aging",
    "height_weight",
    "homelands",
    "osric_differences",
    "era_restrictions",
]

CLASS_REQUIRED_FIELDS = [
    "ability_minimums",
    "prime_requisites",
    "alignment_restrictions",
    "race_restrictions",
    "hit_die",
    "starting_hit_points",
    "armor_permissions",
    "shield_permissions",
    "weapon_permissions",
    "proficiencies",
    "saving_throw_ref",
    "attack_progression_ref",
    "progression_ref",
    "hit_die_progression",
    "spell_slots_ref",
    "spell_list_ref",
    "known_spell_rules",
    "prepared_spell_rules",
    "wisdom_bonus_interaction",
    "class_abilities_by_level",
    "restrictions_by_level",
    "organization_requirements",
    "deity_requirements",
    "moon_relationships",
    "advancement_requirements",
    "title_progression",
    "level_limits",
    "multiclass_compatibility",
]


@dataclass
class MappingFinding:
    legacy_name: str
    canonical_id: str | None
    match_type: str
    risk: str
    notes: list[str]


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def token_key(value: str) -> str:
    tokens = re.findall(r"[a-z0-9]+", value.lower())
    return " ".join(sorted(tokens))


def slug_to_name(value: str) -> str:
    return value.replace("-", " ").replace("_", " ").strip().title()


def record_label(record: dict[str, Any]) -> str:
    return str(record.get("display_name") or record.get("name") or record.get("id", ""))


def canonical_records(root: Path) -> dict[str, dict[str, Any]]:
    return {
        record["id"]: record
        for path in canonical_json_files(root)
        for record in [load_json(path)]
        if isinstance(record, dict) and isinstance(record.get("id"), str)
    }


def records_by_type(records: dict[str, dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    indexed: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for record in records.values():
        indexed[str(record.get("type"))].append(record)
    return indexed


def map_legacy_name(legacy_name: str, candidates: list[dict[str, Any]]) -> MappingFinding:
    exact = [record for record in candidates if record_label(record).lower() == legacy_name.lower()]
    if len(exact) == 1:
        return MappingFinding(legacy_name, exact[0]["id"], "exact", RISK_SAFE, [])
    if len(exact) > 1:
        return MappingFinding(legacy_name, None, "ambiguous", RISK_CONFLICT, [f"{len(exact)} exact canonical matches"])

    normalized = [record for record in candidates if normalize_name(record_label(record)) == normalize_name(legacy_name)]
    if len(normalized) == 1:
        return MappingFinding(legacy_name, normalized[0]["id"], "normalized", RISK_SAFE, [])
    if len(normalized) > 1:
        return MappingFinding(legacy_name, None, "ambiguous", RISK_CONFLICT, [f"{len(normalized)} normalized canonical matches"])

    token_matches = [record for record in candidates if token_key(record_label(record)) == token_key(legacy_name)]
    if len(token_matches) == 1:
        return MappingFinding(legacy_name, token_matches[0]["id"], "normalized", RISK_SAFE, ["token-order match"])
    if len(token_matches) > 1:
        return MappingFinding(legacy_name, None, "ambiguous", RISK_CONFLICT, [f"{len(token_matches)} token-normalized canonical matches"])

    return MappingFinding(legacy_name, None, "missing", RISK_MISSING, ["no canonical record"])


def duplicate_names(names: list[str]) -> dict[str, int]:
    counts = Counter(normalize_name(name) for name in names)
    labels: dict[str, str] = {}
    for name in names:
        labels.setdefault(normalize_name(name), name)
    return {labels[key]: count for key, count in counts.items() if count > 1}


def import_vault_rules():
    from app.services import vault_rules

    return vault_rules


def markdown_names(root: Path, relative_dir: str) -> list[str]:
    directory = root / relative_dir
    if not directory.exists():
        return []
    names = []
    for path in sorted(directory.glob("*.md")):
        if path.name in {"index.md", "all-spells.md", "spell-lists-by-level.md"}:
            continue
        names.append(slug_to_name(path.stem))
    return names


def load_dragonlance_json(root: Path, category: str) -> list[dict[str, Any]]:
    directory = root / "content" / "settings" / "dragonlance" / category
    if not directory.exists():
        return []
    records = []
    for path in sorted(directory.glob("*.json")):
        if path.name == "index.json":
            continue
        data = load_json(path)
        if isinstance(data, dict):
            data["_path"] = str(path.relative_to(root))
            records.append(data)
    return records


def dragonlance_pdf_path(root: Path) -> Path | None:
    candidates = [
        root / "private-reference" / "sources" / "Dragonlance_Adventures_1e.pdf",
        root / "docs" / "sources" / "Dragonlance_Adventures_1e.pdf",
    ]
    for path in candidates:
        if path.exists():
            return path
    return None


def extract_pdf_page_text(path: Path | None) -> dict[int, str]:
    if path is None or PdfReader is None:
        return {}
    reader = PdfReader(str(path))
    pages: dict[int, str] = {}
    for index, page in enumerate(reader.pages, start=1):
        pages[index] = page.extract_text() or ""
    return pages


def find_pdf_mentions(pages: dict[int, str], terms: list[str]) -> dict[str, dict[str, Any]]:
    mentions: dict[str, dict[str, Any]] = {}
    for term in terms:
        pattern = re.compile(re.escape(term).replace(r"\ ", r"\s+"), re.I)
        found_pages = [page_number for page_number, text in pages.items() if pattern.search(text)]
        mentions[term] = {
            "found": bool(found_pages),
            "first_page": found_pages[0] if found_pages else None,
            "pages": found_pages[:10],
        }
    return mentions


def find_pdf_mentions_with_aliases(pages: dict[int, str], terms: list[str], aliases: dict[str, list[str]]) -> dict[str, dict[str, Any]]:
    mentions: dict[str, dict[str, Any]] = {}
    for term in terms:
        all_terms = [term, *aliases.get(term, [])]
        pages_found: list[int] = []
        matched_terms: list[str] = []
        for candidate in all_terms:
            pattern = re.compile(re.escape(candidate).replace(r"\ ", r"\s+"), re.I)
            found = [page_number for page_number, text in pages.items() if pattern.search(text)]
            if found:
                matched_terms.append(candidate)
                pages_found.extend(found)
        unique_pages = sorted(set(pages_found))
        mentions[term] = {
            "found": bool(unique_pages),
            "first_page": unique_pages[0] if unique_pages else None,
            "pages": unique_pages[:10],
            "matched_terms": matched_terms,
        }
    return mentions


def legacy_record_by_name(records: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    indexed: dict[str, dict[str, Any]] = {}
    for record in records:
        for key in ("name", "slug", "id"):
            value = record.get(key)
            if isinstance(value, str) and value:
                indexed.setdefault(normalize_name(value), record)
    return indexed


def canonical_record_for_name(name: str, candidates: list[dict[str, Any]]) -> dict[str, Any] | None:
    finding = map_legacy_name(name, candidates)
    if finding.canonical_id:
        return next((record for record in candidates if record.get("id") == finding.canonical_id), None)
    return None


def missing_fields(record: dict[str, Any] | None, required_fields: list[str]) -> list[str]:
    if record is None:
        return list(required_fields)
    missing = []
    for field in required_fields:
        if field not in record or record[field] in (None, "", [], {}):
            missing.append(field)
    return missing


def progression_status(record: dict[str, Any] | None) -> str:
    if record is None:
        return "missing"
    required = [
        "progression_ref",
        "attack_progression_ref",
        "saving_throw_ref",
        "hit_die_progression",
        "class_abilities_by_level",
        "advancement_requirements",
    ]
    missing = missing_fields(record, required)
    if not missing:
        return "complete"
    if len(missing) == len(required):
        return "missing"
    return "partial"


def pdf_verification_status(mention: dict[str, Any]) -> str:
    return "found_in_pdf" if mention.get("found") else "not_found_in_pdf"


def safe_to_migrate(missing: list[str], mention: dict[str, Any], markers: list[str]) -> bool:
    return not missing and bool(mention.get("found")) and not markers


def todo_markers(value: Any) -> list[str]:
    markers: list[str] = []
    if isinstance(value, dict):
        for item in value.values():
            markers.extend(todo_markers(item))
    elif isinstance(value, list):
        for item in value:
            markers.extend(todo_markers(item))
    elif isinstance(value, str) and ("TODO" in value.upper() or "VERIFY" in value.upper()):
        markers.append(value)
    return markers


def sqlite_path_from_url(database_url: str | None) -> Path | None:
    if not database_url or not database_url.startswith("sqlite:///"):
        return None
    value = database_url.replace("sqlite:///", "", 1)
    return Path(value)


def read_character_values(database_url: str | None) -> dict[str, Any]:
    db_path = sqlite_path_from_url(database_url)
    if not db_path or not db_path.exists():
        return {
            "inspected": False,
            "reason": "No readable sqlite database URL supplied.",
            "race_values": {},
            "class_values": {},
            "spell_values": {},
            "equipment_values": {},
        }
    connection = sqlite3.connect(str(db_path))
    connection.row_factory = sqlite3.Row
    try:
        values = {
            "inspected": True,
            "reason": None,
            "race_values": dict(connection.execute("select race, count(*) as count from vault_characters group by race").fetchall()),
            "class_values": dict(connection.execute("select class_name, count(*) as count from vault_characters group by class_name").fetchall()),
            "spell_values": dict(connection.execute("select s.name, count(*) as count from character_spells cs join spells_catalog s on s.id = cs.spell_id group by s.name").fetchall()),
            "equipment_values": dict(connection.execute("select e.name, count(*) as count from character_inventory ci join equipment_catalog e on e.id = ci.equipment_id group by e.name").fetchall()),
        }
    finally:
        connection.close()
    return values


def mapping_summary(findings: list[MappingFinding]) -> dict[str, Any]:
    total = len(findings)
    safe = sum(1 for finding in findings if finding.risk == RISK_SAFE)
    return {
        "total": total,
        "safe": safe,
        "safe_percent": round((safe / total * 100) if total else 100, 2),
        "ambiguous": sum(1 for finding in findings if finding.match_type == "ambiguous"),
        "missing": sum(1 for finding in findings if finding.risk == RISK_MISSING),
        "needs_review": sum(1 for finding in findings if finding.risk == RISK_REVIEW),
    }


def classify_rules_gap(present: bool, complete: bool = False) -> str:
    if complete:
        return RISK_SAFE
    if present:
        return RISK_REVIEW
    return RISK_MISSING


def build_report(root: Path, database_url: str | None = None) -> dict[str, Any]:
    validation = validate_content(root)
    records = canonical_records(root)
    by_type = records_by_type(records)
    vault_rules = import_vault_rules()

    legacy_races = sorted(vault_rules.RACES)
    legacy_classes = sorted(vault_rules.CLASSES)
    canonical_races = by_type.get("race", [])
    canonical_classes = by_type.get("class", [])
    canonical_spells = by_type.get("spell", [])
    canonical_equipment = [record for item_type in ("weapon", "armor", "shield", "equipment_item", "magic_item") for record in by_type.get(item_type, [])]

    race_findings = [map_legacy_name(name, canonical_races) for name in legacy_races]
    class_findings = [map_legacy_name(name, canonical_classes) for name in legacy_classes]

    equipment_seed = vault_rules.equipment_seed()
    spell_seed = vault_rules.spell_seed()
    spell_findings = [map_legacy_name(seed["name"], canonical_spells) for seed in sorted(spell_seed, key=lambda item: item["name"])]
    equipment_findings = [map_legacy_name(seed["name"], canonical_equipment) for seed in sorted(equipment_seed, key=lambda item: item["name"])]

    dragonlance_races = load_dragonlance_json(root, "races")
    dragonlance_classes = load_dragonlance_json(root, "classes")
    legacy_dragonlance_race_index = legacy_record_by_name(dragonlance_races)
    legacy_dragonlance_class_index = legacy_record_by_name(dragonlance_classes)
    dragonlance_race_findings = [map_legacy_name(record.get("name") or slug_to_name(record.get("slug", "")), canonical_races) for record in dragonlance_races]
    dragonlance_class_findings = [map_legacy_name(record.get("name") or slug_to_name(record.get("id", "")), canonical_classes) for record in dragonlance_classes]
    dragonlance_todos = {
        str(record.get("name") or record.get("id") or record.get("slug")): todo_markers(record)
        for record in [*dragonlance_races, *dragonlance_classes]
        if todo_markers(record)
    }
    pdf_path = dragonlance_pdf_path(root)
    pdf_pages = extract_pdf_page_text(pdf_path)
    race_mentions = find_pdf_mentions_with_aliases(pdf_pages, DRAGONLANCE_EXPECTED_RACES, DRAGONLANCE_RACE_ALIASES)
    class_mentions = find_pdf_mentions(pdf_pages, [item["name"] for item in DRAGONLANCE_EXPECTED_CLASSES])
    deity_mentions = find_pdf_mentions(pdf_pages, DRAGONLANCE_EXPECTED_DEITIES)
    organization_mentions = find_pdf_mentions(pdf_pages, DRAGONLANCE_EXPECTED_ORGANIZATIONS)
    moon_mentions = find_pdf_mentions(pdf_pages, DRAGONLANCE_EXPECTED_MOONS)
    calendar_mentions = find_pdf_mentions(pdf_pages, ["calendar", "month", "week", "day"])
    spell_item_mentions = find_pdf_mentions(pdf_pages, ["spell", "equipment", "weapon", "armor", "magic item"])

    pdf_race_audit = []
    for name in DRAGONLANCE_EXPECTED_RACES:
        legacy_record = legacy_dragonlance_race_index.get(normalize_name(name))
        canonical_record = canonical_record_for_name(name, canonical_races)
        merged_record = canonical_record or legacy_record
        markers = todo_markers(legacy_record or {})
        missing = missing_fields(merged_record, RACE_REQUIRED_FIELDS)
        mention = race_mentions[name]
        pdf_race_audit.append(
            {
                "name": name,
                "stable_canonical_id": canonical_record.get("id") if canonical_record else None,
                "current_json_status": "present" if legacy_record else "missing",
                "pdf_verification_status": pdf_verification_status(mention),
                "source_ref": {"source_library_id": "dragonlance_adventures", "page": mention.get("first_page"), "section": name, "internal_only": True},
                "missing_structured_fields": missing,
                "safe_to_migrate_automatically": safe_to_migrate(missing, mention, markers),
                "todo_verify_markers": markers,
            }
        )

    pdf_class_audit = []
    for expected in DRAGONLANCE_EXPECTED_CLASSES:
        name = expected["name"]
        legacy_record = legacy_dragonlance_class_index.get(normalize_name(name))
        canonical_record = canonical_record_for_name(name, canonical_classes)
        merged_record = canonical_record or legacy_record
        markers = todo_markers(legacy_record or {})
        missing = missing_fields(merged_record, CLASS_REQUIRED_FIELDS)
        mention = class_mentions[name]
        pdf_class_audit.append(
            {
                "name": name,
                "stable_canonical_id": canonical_record.get("id") if canonical_record else None,
                "current_json_status": "present" if legacy_record else "missing",
                "pdf_verification_status": pdf_verification_status(mention),
                "progression_status": progression_status(merged_record),
                "base_osric_relationship": expected["base_osric"],
                "source_ref": {"source_library_id": "dragonlance_adventures", "page": mention.get("first_page"), "section": name, "internal_only": True},
                "missing_structured_fields": missing,
                "safe_to_migrate_automatically": safe_to_migrate(missing, mention, markers),
                "todo_verify_markers": markers,
            }
        )

    human_review_queue = []
    for race in pdf_race_audit:
        if not race["safe_to_migrate_automatically"]:
            human_review_queue.append(
                {
                    "kind": "race",
                    "name": race["name"],
                    "reason": "missing_structured_fields" if race["missing_structured_fields"] else "pdf_or_todo_verification",
                    "missing_fields": race["missing_structured_fields"],
                    "source_ref": race["source_ref"],
                }
            )
    for class_record in pdf_class_audit:
        if not class_record["safe_to_migrate_automatically"]:
            human_review_queue.append(
                {
                    "kind": "class_or_order",
                    "name": class_record["name"],
                    "reason": class_record["progression_status"],
                    "missing_fields": class_record["missing_structured_fields"],
                    "source_ref": class_record["source_ref"],
                }
            )

    character_values = read_character_values(database_url)
    character_mapping = {
        "races": [asdict(map_legacy_name(name, canonical_races)) | {"count": count} for name, count in character_values["race_values"].items()],
        "classes": [asdict(map_legacy_name(name, canonical_classes)) | {"count": count} for name, count in character_values["class_values"].items()],
        "spells": [asdict(map_legacy_name(name, canonical_spells)) | {"count": count} for name, count in character_values["spell_values"].items()],
        "equipment": [asdict(map_legacy_name(name, canonical_equipment)) | {"count": count} for name, count in character_values["equipment_values"].items()],
    }

    unresolved_character_values = sum(
        item["count"]
        for section in character_mapping.values()
        for item in section
        if item["risk"] != RISK_SAFE
    )

    osric_gaps = {
        "race_class_restrictions_present_only_in_legacy": {
            race: value.get("classes", [])
            for race, value in vault_rules.RACES.items()
            if map_legacy_name(race, canonical_races).risk == RISK_SAFE and value.get("classes")
        },
        "level_limits_present_only_in_prose": {
            race: value.get("level_limits")
            for race, value in vault_rules.RACES.items()
            if value.get("level_limits")
        },
        "saving_throw_tables": {
            "legacy_classes_with_tables": sorted(vault_rules.SAVING_THROW_TABLES),
            "canonical_records": sorted(record["id"] for record in by_type.get("saving_throw_progression", [])),
            "classification": classify_rules_gap(bool(vault_rules.SAVING_THROW_TABLES), complete=False),
        },
        "attack_progression": {
            "canonical_records": sorted(record["id"] for record in by_type.get("attack_progression", [])),
            "classification": classify_rules_gap(bool(by_type.get("attack_progression")), complete=False),
        },
        "xp_progression": {
            "canonical_records": sorted(record["id"] for record in by_type.get("class_progression", [])),
            "classification": classify_rules_gap(bool(by_type.get("class_progression")), complete=False),
        },
        "spell_slot_data": {
            "legacy_classes_with_slots": sorted(vault_rules.SPELL_SLOT_TABLES),
            "canonical_records": sorted(record["id"] for record in by_type.get("spell_slot_progression", [])),
            "classification": classify_rules_gap(bool(vault_rules.SPELL_SLOT_TABLES), complete=False),
        },
        "cleric_wisdom_bonus_logic": {
            "classification": RISK_MISSING,
            "notes": "Legacy wisdom modifier exists for mental saves, but cleric bonus spell logic is not encoded canonically.",
        },
        "languages": {
            "legacy_unique": sorted({language for race in vault_rules.RACES.values() for language in race.get("languages", [])}),
            "canonical_records": sorted(record["id"] for record in by_type.get("language", [])),
        },
    }

    report = {
        "validation": {
            "errors": validation.errors,
            "warnings": validation.warnings,
        },
        "sources_compared": [
            "backend/app/services/vault_rules.py",
            "content/1e markdown",
            "1e generated HTML",
            "content/settings/dragonlance JSON",
            "vault_rules spell_seed()",
            "vault_rules equipment_seed()",
            "backend/app/db/models.py",
        ],
        "data_authority": {
            "osric": {
                "primary": [
                    "backend/app/services/vault_rules.py",
                    "existing spell/equipment catalogs and seed expectations",
                    "existing database seed data",
                    "content/1e",
                    "existing builder logic where it reflects implemented mechanics",
                ],
                "verification_only": "private-reference/sources/osric_core_rules.pdf",
                "rule": "Prefer verified repository implementation over re-extracting OSRIC data; use the PDF only for gaps, conflicts, table confirmation, and missing structured fields.",
            },
            "dragolance": {
                "legacy_hints": [
                    "content/settings/dragonlance JSON",
                    "existing builder support",
                ],
                "authoritative_private_reference": "private-reference/sources/Dragonlance_Adventures_1e.pdf",
                "rule": "Dragonlance extends or overrides OSRIC through canonical records; do not duplicate OSRIC records only because Dragonlance uses them.",
            },
        },
        "osric": {
            "races": [asdict(item) for item in race_findings],
            "classes": [asdict(item) for item in class_findings],
            "missing_canonical_races": [item.legacy_name for item in race_findings if item.risk == RISK_MISSING],
            "missing_canonical_classes": [item.legacy_name for item in class_findings if item.risk == RISK_MISSING],
            "conflicting_names": {
                "races": duplicate_names(legacy_races),
                "classes": duplicate_names(legacy_classes),
            },
            "rules_gaps": osric_gaps,
            "markdown_counts": {
                "race_pages": len(markdown_names(root, "content/1e/races")),
                "class_pages": len(markdown_names(root, "content/1e/classes")),
                "spell_pages": len(markdown_names(root, "content/1e/spells")),
            },
            "generated_html_counts": {
                "race_pages": len(list((root / "1e" / "races").glob("*/index.html"))) if (root / "1e" / "races").exists() else 0,
                "class_pages": len(list((root / "1e" / "classes").glob("*/index.html"))) if (root / "1e" / "classes").exists() else 0,
                "spell_pages": len(list((root / "1e" / "spells").glob("*/index.html"))) if (root / "1e" / "spells").exists() else 0,
            },
        },
        "dragolance": {
            "races": [asdict(item) for item in dragonlance_race_findings],
            "classes": [asdict(item) for item in dragonlance_class_findings],
            "pdf_source": {
                "required_path": "private-reference/sources/Dragonlance_Adventures_1e.pdf",
                "used_path": str(pdf_path.relative_to(root)) if pdf_path else None,
                "available": pdf_path is not None,
                "extractable": bool(pdf_pages),
                "page_count": len(pdf_pages),
                "private_reference_only": True,
            },
            "pdf_coverage": {
                "total_races_found_in_pdf": sum(1 for value in race_mentions.values() if value["found"]),
                "total_classes_orders_found_in_pdf": sum(1 for value in class_mentions.values() if value["found"]),
                "total_deities_found": sum(1 for value in deity_mentions.values() if value["found"]),
                "total_organizations_orders_found": sum(1 for value in organization_mentions.values() if value["found"]),
                "total_moons_calendars_found": sum(1 for value in [*moon_mentions.values(), *calendar_mentions.values()] if value["found"]),
                "total_spells_items_found": sum(1 for value in spell_item_mentions.values() if value["found"]),
                "total_records_already_represented_in_current_json": sum(1 for item in [*pdf_race_audit, *pdf_class_audit] if item["current_json_status"] == "present"),
                "total_records_missing": sum(1 for item in [*pdf_race_audit, *pdf_class_audit] if item["current_json_status"] == "missing"),
                "total_records_partial": sum(1 for item in [*pdf_race_audit, *pdf_class_audit] if item["missing_structured_fields"]),
                "total_records_conflicting": 0,
                "total_records_with_complete_progression": sum(1 for item in pdf_class_audit if item["progression_status"] == "complete"),
                "total_records_lacking_progression": sum(1 for item in pdf_class_audit if item["progression_status"] != "complete"),
            },
            "per_race_completeness": pdf_race_audit,
            "per_class_completeness": pdf_class_audit,
            "human_review_queue": human_review_queue,
            "deities_pdf_mentions": deity_mentions,
            "organizations_pdf_mentions": organization_mentions,
            "moons_pdf_mentions": moon_mentions,
            "calendar_pdf_mentions": calendar_mentions,
            "spells_items_pdf_mentions": spell_item_mentions,
            "todo_verify": dragonlance_todos,
            "missing_deity_records": len(by_type.get("deity", [])) == 0,
            "missing_moon_records": len(by_type.get("moon", [])) == 0,
            "missing_calendar_records": len(by_type.get("calendar", [])) == 0,
            "missing_organization_records": len(by_type.get("organization", [])) == 0,
            "missing_restrictions": len(by_type.get("restriction_rule", [])) == 0,
            "missing_extensions": len(by_type.get("extension_rule", [])) == 0,
            "safe_to_migrate_automatically": [
                item.legacy_name for item in [*dragonlance_race_findings, *dragonlance_class_findings] if item.risk == RISK_SAFE
            ],
            "requires_human_review": [
                item.legacy_name for item in [*dragonlance_race_findings, *dragonlance_class_findings] if item.risk != RISK_SAFE
            ],
        },
        "spells": {
            "total_legacy": len(spell_findings),
            "duplicate_legacy_names": duplicate_names([seed["name"] for seed in spell_seed]),
            "findings": [asdict(item) for item in spell_findings],
            "level_class_conflicts": [],
            "cannot_safely_map": [item.legacy_name for item in spell_findings if item.risk != RISK_SAFE],
        },
        "equipment": {
            "total_legacy": len(equipment_findings),
            "duplicate_legacy_names": duplicate_names([seed["name"] for seed in equipment_seed]),
            "findings": [asdict(item) for item in equipment_findings],
            "weapon_armor_category_conflicts": [],
            "missing_weight_cost_rules_data": [
                seed["name"] for seed in equipment_seed if seed.get("weight") in {None, 0} or seed.get("cost_amount") is None
            ],
            "safe_to_map": [item.legacy_name for item in equipment_findings if item.risk == RISK_SAFE],
            "requires_review": [item.legacy_name for item in equipment_findings if item.risk != RISK_SAFE],
        },
        "characters": {
            "database_inspected": character_values["inspected"],
            "database_reason": character_values["reason"],
            "model_legacy_fields": {
                "vault_characters": ["race", "class_name"],
                "character_spells": ["spell_id -> spells_catalog.name"],
                "character_inventory": ["equipment_id -> equipment_catalog.name"],
            },
            "mapping": character_mapping,
        },
        "db_model_expectations": {
            "vault_characters": ["race", "class_name", "subclass_or_specialty"],
            "equipment_catalog": ["name", "type", "subtype", "weight", "cost_amount", "cost_coin", "damage_small_medium", "armor_class_value"],
            "spells_catalog": ["name", "class_list", "spell_level", "range", "duration", "area_of_effect", "components"],
        },
        "migration_readiness": {
            "race_safe_percent": mapping_summary(race_findings)["safe_percent"],
            "class_safe_percent": mapping_summary(class_findings)["safe_percent"],
            "spell_safe_percent": mapping_summary(spell_findings)["safe_percent"],
            "equipment_safe_percent": mapping_summary(equipment_findings)["safe_percent"],
            "active_character_values_unresolved": unresolved_character_values if character_values["inspected"] else None,
            "dragolance_todo_verify_records": len(dragonlance_todos),
            "dragolance_pdf_review_queue_items": len(human_review_queue),
            "recommended_migration_order": [
                "Complete OSRIC races/classes and legacy mappings.",
                "Populate OSRIC progressions, saves, attacks, and spell-slot records.",
                "Populate OSRIC spell and equipment definitions from reviewed seeds.",
                "Populate Dragolance deities, calendars, moons, organizations, restrictions, and extensions.",
                "Run explicit legacy string backfill dry-run before any database migration.",
            ],
        },
    }
    return report


def print_section(title: str) -> None:
    print()
    print(title)
    print("-" * len(title))


def print_report(report: dict[str, Any]) -> None:
    print("Canonical Legacy Compatibility Report")
    print(f"Validation errors: {len(report['validation']['errors'])}")
    print(f"Validation warnings: {len(report['validation']['warnings'])}")
    print_section("Migration Readiness")
    for key, value in report["migration_readiness"].items():
        if key == "recommended_migration_order":
            print("recommended_migration_order:")
            for item in value:
                print(f"  - {item}")
        else:
            print(f"{key}: {value}")

    print_section("OSRIC")
    print(f"legacy races: {len(report['osric']['races'])}")
    print(f"missing canonical races: {len(report['osric']['missing_canonical_races'])}")
    print(f"legacy classes: {len(report['osric']['classes'])}")
    print(f"missing canonical classes: {len(report['osric']['missing_canonical_classes'])}")
    print(f"spell pages markdown/generated: {report['osric']['markdown_counts']['spell_pages']}/{report['osric']['generated_html_counts']['spell_pages']}")

    print_section("Dragolance")
    print(f"PDF source available: {report['dragolance']['pdf_source']['available']}")
    print(f"PDF source used: {report['dragolance']['pdf_source']['used_path']}")
    print(f"PDF extractable pages: {report['dragolance']['pdf_source']['page_count']}")
    print(f"legacy races: {len(report['dragolance']['races'])}")
    print(f"legacy classes: {len(report['dragolance']['classes'])}")
    print(f"PDF races found: {report['dragolance']['pdf_coverage']['total_races_found_in_pdf']}")
    print(f"PDF classes/orders found: {report['dragolance']['pdf_coverage']['total_classes_orders_found_in_pdf']}")
    print(f"PDF deities found: {report['dragolance']['pdf_coverage']['total_deities_found']}")
    print(f"PDF organizations/orders found: {report['dragolance']['pdf_coverage']['total_organizations_orders_found']}")
    print(f"records already represented in current JSON: {report['dragolance']['pdf_coverage']['total_records_already_represented_in_current_json']}")
    print(f"records missing from current JSON: {report['dragolance']['pdf_coverage']['total_records_missing']}")
    print(f"records partial: {report['dragolance']['pdf_coverage']['total_records_partial']}")
    print(f"classes/orders with complete progression: {report['dragolance']['pdf_coverage']['total_records_with_complete_progression']}")
    print(f"classes/orders lacking progression: {report['dragolance']['pdf_coverage']['total_records_lacking_progression']}")
    print(f"TODO/VERIFY records: {len(report['dragolance']['todo_verify'])}")
    print(f"requires human review: {len(report['dragolance']['requires_human_review'])}")
    print(f"PDF review queue items: {len(report['dragolance']['human_review_queue'])}")

    print_section("Spells")
    print(f"legacy spells: {report['spells']['total_legacy']}")
    print(f"cannot safely map: {len(report['spells']['cannot_safely_map'])}")

    print_section("Equipment")
    print(f"legacy equipment: {report['equipment']['total_legacy']}")
    print(f"safe to map: {len(report['equipment']['safe_to_map'])}")
    print(f"requires review: {len(report['equipment']['requires_review'])}")

    print_section("Characters")
    print(f"database inspected: {report['characters']['database_inspected']}")
    if report["characters"]["database_reason"]:
        print(f"database reason: {report['characters']['database_reason']}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Report legacy compatibility with canonical content.")
    parser.add_argument("--root", default=REPO_ROOT, type=Path)
    parser.add_argument("--database-url", default=None)
    parser.add_argument("--json-output", default=REPO_ROOT / "reports" / "canonical_compatibility_report.json", type=Path)
    args = parser.parse_args()

    root = args.root.resolve()
    report = build_report(root, args.database_url)
    print_report(report)
    output_path = args.json_output
    if not output_path.is_absolute():
        output_path = root / output_path
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print()
    print(f"JSON report written: {output_path}")
    return 1 if report["validation"]["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
