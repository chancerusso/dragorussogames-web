#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

STABLE_ID_RE = re.compile(r"^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$")
SOURCE_ID_RE = re.compile(r"^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$")

SCHEMA_BY_TYPE = {
    "source_library": "source_library.schema.json",
    "race": "race.schema.json",
    "class": "class.schema.json",
    "class_progression": "class_progression.schema.json",
    "saving_throw_progression": "saving_throw_progression.schema.json",
    "attack_progression": "attack_progression.schema.json",
    "spell": "spell.schema.json",
    "spell_list": "spell_list.schema.json",
    "spell_slot_progression": "spell_slot_progression.schema.json",
    "weapon": "weapon.schema.json",
    "armor": "armor.schema.json",
    "shield": "shield.schema.json",
    "equipment_item": "equipment_item.schema.json",
    "magic_item": "magic_item.schema.json",
    "monster": "monster.schema.json",
    "deity": "deity.schema.json",
    "organization": "organization.schema.json",
    "language": "language.schema.json",
    "calendar": "calendar.schema.json",
    "month": "month.schema.json",
    "weekday": "weekday.schema.json",
    "moon": "moon.schema.json",
    "campaign_profile": "campaign_profile.schema.json",
    "availability_rule": "availability_rule.schema.json",
    "restriction_rule": "restriction_rule.schema.json",
    "extension_rule": "extension_rule.schema.json",
}

TYPE_DIRS = {
    "source_library": ["content/sources"],
    "race": ["content/osric/core/races", "content/options/dragolance/races"],
    "class": ["content/osric/core/classes", "content/options/dragolance/classes"],
    "class_progression": ["content/osric/core/progressions"],
    "saving_throw_progression": ["content/osric/core/saving_throws"],
    "attack_progression": ["content/osric/core/attacks"],
    "spell": ["content/osric/core/spells", "content/options/dragolance/spells"],
    "spell_list": ["content/osric/core/spell_lists"],
    "spell_slot_progression": ["content/osric/core/spell_slots"],
    "weapon": ["content/osric/core/equipment", "content/options/dragolance/equipment"],
    "armor": ["content/osric/core/equipment", "content/options/dragolance/equipment"],
    "shield": ["content/osric/core/equipment", "content/options/dragolance/equipment"],
    "equipment_item": ["content/osric/core/equipment", "content/options/dragolance/equipment"],
    "magic_item": ["content/osric/core/equipment", "content/options/dragolance/equipment"],
    "monster": ["content/osric/core/monsters"],
    "deity": ["content/options/dragolance/deities"],
    "organization": ["content/options/dragolance/organizations"],
    "language": ["content/osric/core/languages", "content/options/dragolance/languages"],
    "calendar": ["content/options/dragolance/calendars"],
    "month": ["content/options/dragolance/calendars"],
    "weekday": ["content/options/dragolance/calendars"],
    "moon": ["content/options/dragolance/moons"],
    "campaign_profile": ["content/campaigns/templates"],
    "availability_rule": ["content/options/classic/availability", "content/options/dragolance/availability"],
    "restriction_rule": ["content/options/classic/restrictions", "content/options/dragolance/restrictions"],
    "extension_rule": ["content/options/classic/extensions", "content/options/dragolance/extensions"],
}

CANONICAL_DIRS = [
    "content/sources",
    "content/osric/core",
    "content/options/classic",
    "content/options/dragolance",
    "content/campaigns/templates",
]


class ValidationResult:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.files_checked = 0
        self.records_checked = 0
        self.by_type: Counter[str] = Counter()
        self.by_review_status: Counter[str] = Counter()
        self.by_source: Counter[str] = Counter()

    def error(self, path: Path, message: str) -> None:
        self.errors.append(f"{path}: {message}")

    def warn(self, path: Path, message: str) -> None:
        self.warnings.append(f"{path}: {message}")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def canonical_json_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for directory in CANONICAL_DIRS:
        target = root / directory
        if target.exists():
            files.extend(path for path in target.rglob("*.json") if path.is_file())
    return sorted(files)


def load_schemas(root: Path) -> dict[str, dict[str, Any]]:
    schemas: dict[str, dict[str, Any]] = {}
    schema_root = root / "content" / "schemas"
    for path in schema_root.rglob("*.schema.json"):
        schemas[path.name] = load_json(path)
        if path.parent.name == "shared":
            schemas[f"shared/{path.name}"] = schemas[path.name]
    return schemas


def check_type(value: Any, expected: str) -> bool:
    if expected == "null":
        return value is None
    if expected == "object":
        return isinstance(value, dict)
    if expected == "array":
        return isinstance(value, list)
    if expected == "string":
        return isinstance(value, str)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "boolean":
        return isinstance(value, bool)
    return True


def validate_schema(
    value: Any,
    schema: dict[str, Any],
    schemas: dict[str, dict[str, Any]],
    errors: list[str],
    location: str = "$",
) -> None:
    for sub_schema in schema.get("allOf", []):
        ref = sub_schema.get("$ref")
        if ref:
            validate_schema(value, schemas[ref], schemas, errors, location)

    if "type" in schema:
        expected = schema["type"]
        expected_types = expected if isinstance(expected, list) else [expected]
        if not any(check_type(value, item) for item in expected_types):
            errors.append(f"{location}: expected type {expected}")
            return

    if "const" in schema and value != schema["const"]:
        errors.append(f"{location}: expected {schema['const']!r}")

    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{location}: expected one of {schema['enum']}")

    if isinstance(value, str) and "pattern" in schema and not re.match(schema["pattern"], value):
        errors.append(f"{location}: does not match pattern {schema['pattern']}")

    if isinstance(value, int) and "minimum" in schema and value < schema["minimum"]:
        errors.append(f"{location}: must be at least {schema['minimum']}")

    if isinstance(value, dict):
        for key in schema.get("required", []):
            if key not in value:
                errors.append(f"{location}.{key}: required field missing")
        properties = schema.get("properties", {})
        if schema.get("additionalProperties") is False:
            for key in value:
                if key not in properties:
                    errors.append(f"{location}.{key}: unexpected field")
        for key, prop_schema in properties.items():
            if key in value:
                validate_schema(value[key], prop_schema, schemas, errors, f"{location}.{key}")

    if isinstance(value, list) and "items" in schema:
        for index, item in enumerate(value):
            validate_schema(item, schema["items"], schemas, errors, f"{location}[{index}]")


def nested_values(value: Any, key_name: str) -> list[str]:
    found: list[str] = []
    if isinstance(value, dict):
        for key, item in value.items():
            if key == key_name and isinstance(item, str):
                found.append(item)
            else:
                found.extend(nested_values(item, key_name))
    elif isinstance(value, list):
        for item in value:
            found.extend(nested_values(item, key_name))
    return found


def nested_string_lists(value: Any) -> list[str]:
    refs: list[str] = []
    if isinstance(value, dict):
        for item in value.values():
            refs.extend(nested_string_lists(item))
    elif isinstance(value, list):
        for item in value:
            refs.extend(nested_string_lists(item))
    elif isinstance(value, str) and STABLE_ID_RE.match(value):
        refs.append(value)
    return refs


def file_is_in_allowed_dir(root: Path, path: Path, record_type: str) -> bool:
    relative = path.relative_to(root).as_posix()
    return any(relative.startswith(f"{allowed}/") for allowed in TYPE_DIRS.get(record_type, []))


def validate_content(root: Path) -> ValidationResult:
    result = ValidationResult()
    schemas = load_schemas(root)
    records: list[tuple[Path, dict[str, Any]]] = []
    ids: dict[str, Path] = {}
    source_ids: set[str] = set()

    for path in canonical_json_files(root):
        result.files_checked += 1
        try:
            data = load_json(path)
        except (OSError, json.JSONDecodeError) as exc:
            result.error(path, f"could not load JSON: {exc}")
            continue
        if not isinstance(data, dict):
            result.error(path, "top-level JSON value must be an object")
            continue
        records.append((path, data))
        record_id = data.get("id")
        if isinstance(record_id, str):
            if record_id in ids:
                result.error(path, f"duplicate id {record_id!r}; first seen in {ids[record_id]}")
            ids[record_id] = path
        if data.get("type") == "source_library" and isinstance(record_id, str):
            source_ids.add(record_id)

    for path, data in records:
        record_type = data.get("type")
        record_id = data.get("id")
        result.records_checked += 1
        result.by_type[str(record_type)] += 1
        if data.get("source_library_id"):
            result.by_source[str(data["source_library_id"])] += 1
        if isinstance(data.get("review"), dict):
            result.by_review_status[str(data["review"].get("status"))] += 1
        elif data.get("review_status"):
            result.by_review_status[str(data["review_status"])] += 1

        if record_type not in SCHEMA_BY_TYPE:
            result.error(path, f"unknown type {record_type!r}")
            continue
        if not file_is_in_allowed_dir(root, path, str(record_type)):
            result.error(path, f"type {record_type!r} is not allowed in this directory")

        schema_name = SCHEMA_BY_TYPE[str(record_type)]
        schema_errors: list[str] = []
        validate_schema(data, schemas[schema_name], schemas, schema_errors)
        for message in schema_errors:
            result.error(path, message)

        if record_type == "source_library":
            if not isinstance(record_id, str) or not SOURCE_ID_RE.match(record_id):
                result.error(path, f"malformed source id {record_id!r}")
        elif not isinstance(record_id, str) or not STABLE_ID_RE.match(record_id):
            result.error(path, f"malformed stable id {record_id!r}")

        source_library_id = data.get("source_library_id")
        if source_library_id and source_library_id not in source_ids:
            result.error(path, f"missing source library {source_library_id!r}")

        replaces = data.get("replaces")
        if replaces and replaces not in ids:
            result.error(path, f"replaces target does not exist: {replaces}")

        visibility = data.get("visibility")
        if isinstance(visibility, dict) and visibility.get("player_visible"):
            if visibility.get("description_status") == "internal_only":
                result.error(path, "player-visible record has internal-only description status")
            for field in ("internal_text", "internal_description"):
                if field in data:
                    result.error(path, f"player-visible record contains {field}")

        references = set(nested_values(data, "class_id"))
        references.update(nested_values(data, "spell_id"))
        references.update(nested_values(data, "calendar_id"))
        references.update(nested_values(data, "base_item_ref"))
        references.update(data.get("languages", []) if isinstance(data.get("languages"), list) else [])
        references.update(data.get("class_access", []) if isinstance(data.get("class_access"), list) else [])
        references.update(data.get("months", []) if isinstance(data.get("months"), list) else [])
        references.update(data.get("weekdays", []) if isinstance(data.get("weekdays"), list) else [])
        references.update(data.get("moons", []) if isinstance(data.get("moons"), list) else [])
        references.update(data.get("affects", []) if isinstance(data.get("affects"), list) else [])
        references.update(data.get("class_extensions", []) if isinstance(data.get("class_extensions"), list) else [])
        if data.get("progression_ref"):
            references.add(data["progression_ref"])
        if data.get("saving_throw_ref"):
            references.add(data["saving_throw_ref"])
        if data.get("attack_progression_ref"):
            references.add(data["attack_progression_ref"])
        if isinstance(data.get("spellcasting"), dict):
            references.update(nested_string_lists(data["spellcasting"]))

        if record_type == "availability_rule":
            references.add(data["campaign_profile_id"])
            references.add(data["record_id"])
        if record_type == "restriction_rule":
            references.add(data["campaign_profile_id"])
            references.add(data["target_id"])
        if record_type == "extension_rule":
            references.add(data["campaign_profile_id"])
            references.add(data["target_id"])
            references.update(nested_string_lists(data.get("adds", {})))
        if record_type == "campaign_profile":
            references.update(data.get("availability_sets", []))
            references.update(data.get("restriction_sets", []))
            references.update(data.get("extension_sets", []))

        for ref in sorted(ref for ref in references if ref):
            if ref not in ids:
                result.error(path, f"missing referenced id {ref!r}")

        if not data.get("description") and record_type not in {"source_library", "availability_rule", "restriction_rule", "extension_rule"}:
            result.warn(path, "description is missing or empty")
        if data.get("source_ref") and data["source_ref"].get("section") is None:
            result.warn(path, "source_ref.section is missing")

    return result


def print_summary(result: ValidationResult) -> None:
    print("Canonical content validation")
    print(f"Files checked: {result.files_checked}")
    print(f"Records checked: {result.records_checked}")
    print(f"Errors: {len(result.errors)}")
    print(f"Warnings: {len(result.warnings)}")
    print("Records by type:")
    for key, value in sorted(result.by_type.items()):
        print(f"  {key}: {value}")
    print("Records by review status:")
    for key, value in sorted(result.by_review_status.items()):
        print(f"  {key}: {value}")
    print("Records by source library:")
    for key, value in sorted(result.by_source.items()):
        print(f"  {key}: {value}")
    if result.errors:
        print("Errors:")
        for error in result.errors:
            print(f"  - {error}")
    if result.warnings:
        print("Warnings:")
        for warning in result.warnings:
            print(f"  - {warning}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate canonical Classic Drago content.")
    parser.add_argument("--root", default=Path.cwd(), type=Path, help="Repository root")
    args = parser.parse_args(argv)
    result = validate_content(args.root.resolve())
    print_summary(result)
    return 1 if result.errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
