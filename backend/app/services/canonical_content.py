from __future__ import annotations

import importlib.util
import json
import os
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class CanonicalContentError(RuntimeError):
    pass


@dataclass(frozen=True)
class LegacyMappingResult:
    legacy_type: str
    legacy_value: str
    record_id: str | None
    status: str
    warning: str | None = None


def repository_root() -> Path:
    return Path(__file__).resolve().parents[3]


def canonical_content_enabled() -> bool:
    return os.getenv("CANONICAL_CONTENT_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}


class CanonicalContentService:
    def __init__(self, root: Path | None = None, enabled: bool | None = None) -> None:
        self.root = root or repository_root()
        self.enabled = canonical_content_enabled() if enabled is None else enabled
        self._loaded = False
        self._records: dict[str, dict[str, Any]] = {}
        self._by_type: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self._by_source: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self._availability_by_profile: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self._restrictions_by_profile: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self._extensions_by_profile: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self._resolved_references: dict[str, set[str]] = defaultdict(set)
        self._legacy_mappings: dict[tuple[str, str], list[str]] = self._default_legacy_mappings()

    @property
    def loaded(self) -> bool:
        return self._loaded

    def load_all(self, force: bool = False) -> "CanonicalContentService":
        if not self.enabled:
            return self
        if self._loaded and not force:
            return self
        validation = self.validate_references()
        if validation:
            raise CanonicalContentError("Canonical content validation failed:\n" + "\n".join(validation))

        self._records.clear()
        self._by_type.clear()
        self._by_source.clear()
        self._availability_by_profile.clear()
        self._restrictions_by_profile.clear()
        self._extensions_by_profile.clear()
        self._resolved_references.clear()

        for path in self._canonical_json_files():
            record = self._load_json(path)
            if not isinstance(record, dict):
                continue
            record_id = record.get("id")
            record_type = record.get("type")
            if not isinstance(record_id, str) or not isinstance(record_type, str):
                continue
            self._records[record_id] = record
            self._by_type[record_type].append(record)
            if record.get("source_library_id"):
                self._by_source[str(record["source_library_id"])].append(record)
            if record_type == "availability_rule":
                self._availability_by_profile[str(record["campaign_profile_id"])].append(record)
            elif record_type == "restriction_rule":
                self._restrictions_by_profile[str(record["campaign_profile_id"])].append(record)
            elif record_type == "extension_rule":
                self._extensions_by_profile[str(record["campaign_profile_id"])].append(record)
            self._resolved_references[record_id] = self._record_references(record)

        self._loaded = True
        return self

    def reload(self) -> "CanonicalContentService":
        return self.load_all(force=True)

    def get_by_id(self, record_id: str) -> dict[str, Any] | None:
        self._ensure_loaded()
        return self._records.get(record_id)

    def list_by_type(self, record_type: str) -> list[dict[str, Any]]:
        self._ensure_loaded()
        return list(self._by_type.get(record_type, []))

    def list_by_source(self, source_library_id: str) -> list[dict[str, Any]]:
        self._ensure_loaded()
        return list(self._by_source.get(source_library_id, []))

    def list_records(
        self,
        record_type: str | None = None,
        source_library_id: str | None = None,
        search: str | None = None,
    ) -> list[dict[str, Any]]:
        self._ensure_loaded()
        records = list(self._records.values())
        if record_type:
            records = [record for record in records if record.get("type") == record_type]
        if source_library_id:
            records = [record for record in records if record.get("source_library_id") == source_library_id]
        if search:
            needle = search.strip().lower()
            records = [record for record in records if needle in self._search_blob(record)]
        return sorted(records, key=lambda record: (str(record.get("type", "")), str(record.get("display_name") or record.get("name") or record.get("id"))))

    def list_source_libraries(self) -> list[dict[str, Any]]:
        self._ensure_loaded()
        libraries = [record for record in self._records.values() if record.get("type") == "source_library"]
        return sorted(libraries, key=lambda record: str(record.get("display_name") or record.get("name") or record.get("id")))

    def list_record_types(self) -> list[str]:
        self._ensure_loaded()
        return sorted(self._by_type)

    def record_references(self, record: dict[str, Any]) -> set[str]:
        return self._record_references(record)

    def resolved_references(self, record_id: str) -> list[dict[str, Any]]:
        self._ensure_loaded()
        record = self._records.get(record_id)
        if not record:
            return []
        references = []
        for reference_id in sorted(self._record_references(record)):
            target = self._records.get(reference_id)
            references.append({
                "id": reference_id,
                "resolved": target is not None,
                "type": target.get("type") if target else None,
                "display_name": target.get("display_name") or target.get("name") if target else None,
            })
        return references

    def list_rules_pages(self, search: str | None = None) -> list[dict[str, Any]]:
        content_root = self.root / "content" / "1e"
        if not content_root.exists():
            return []
        pages: list[dict[str, Any]] = []
        for path in sorted(content_root.rglob("*.md")):
            if path.name.startswith("_") or "source" in path.relative_to(content_root).parts:
                continue
            record = self._rules_page_record(content_root, path)
            if search and search.strip().lower() not in self._search_blob(record):
                continue
            pages.append(record)
        return pages

    def get_campaign_profile(self, profile_id: str) -> dict[str, Any] | None:
        record = self.get_by_id(profile_id)
        if record and record.get("type") == "campaign_profile":
            return record
        return None

    def get_available_records(self, profile_id: str, record_type: str | None = None) -> list[dict[str, Any]]:
        self._ensure_loaded()
        records: list[dict[str, Any]] = []
        for rule in self._availability_by_profile.get(profile_id, []):
            if not rule.get("available"):
                continue
            record = self._records.get(str(rule.get("record_id")))
            if not record:
                continue
            if record_type and record.get("type") != record_type:
                continue
            records.append(record)
        return records

    def get_extensions(self, profile_id: str, target_id: str | None = None) -> list[dict[str, Any]]:
        self._ensure_loaded()
        extensions = self._extensions_by_profile.get(profile_id, [])
        if target_id is None:
            return list(extensions)
        return [record for record in extensions if record.get("target_id") == target_id]

    def get_restrictions(self, profile_id: str, target_id: str | None = None) -> list[dict[str, Any]]:
        self._ensure_loaded()
        restrictions = self._restrictions_by_profile.get(profile_id, [])
        if target_id is None:
            return list(restrictions)
        return [record for record in restrictions if record.get("target_id") == target_id]

    def validate_references(self) -> list[str]:
        validator = self._load_validator()
        result = validator.validate_content(self.root)
        return list(result.errors)

    def map_legacy_string(self, legacy_type: str, legacy_value: str) -> LegacyMappingResult:
        key = (legacy_type.strip().lower(), legacy_value.strip().lower())
        matches = self._legacy_mappings.get(key, [])
        if len(matches) == 1:
            return LegacyMappingResult(legacy_type, legacy_value, matches[0], "resolved")
        if len(matches) > 1:
            return LegacyMappingResult(legacy_type, legacy_value, None, "ambiguous", "Legacy value maps to multiple canonical IDs.")
        return LegacyMappingResult(legacy_type, legacy_value, None, "unresolved", "No explicit canonical mapping exists.")

    def set_legacy_mappings_for_tests(self, mappings: dict[tuple[str, str], list[str]]) -> None:
        self._legacy_mappings = mappings

    def _ensure_loaded(self) -> None:
        if self.enabled and not self._loaded:
            self.load_all()

    def _canonical_json_files(self) -> list[Path]:
        validator = self._load_validator()
        return validator.canonical_json_files(self.root)

    def _load_json(self, path: Path) -> Any:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def _rules_page_record(self, content_root: Path, path: Path) -> dict[str, Any]:
        relative = path.relative_to(content_root)
        text = path.read_text(encoding="utf-8")
        title = self._markdown_title(text) or self._title_from_path(path)
        summary = self._markdown_summary(text)
        route_parts = list(relative.with_suffix("").parts)
        route = "/1e/" if route_parts == ["index"] else "/1e/" + "/".join(part for part in route_parts if part != "index") + "/"
        section = route_parts[0] if len(route_parts) > 1 else "core"
        return {
            "id": "rules_page." + ".".join(self._stable_segment(part) for part in route_parts),
            "type": "rules_page",
            "name": title,
            "display_name": title,
            "source_library_id": "osric",
            "section": section.replace("-", " ").replace("_", " ").title(),
            "path": str(relative),
            "route": route,
            "summary": summary,
            "review": {"status": "implemented"},
        }

    def _markdown_title(self, text: str) -> str | None:
        for line in text.splitlines():
            if line.startswith("# "):
                return line.removeprefix("# ").strip()
        return None

    def _markdown_summary(self, text: str) -> str:
        for line in text.splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or stripped.startswith("|") or stripped.startswith("---"):
                continue
            return stripped[:240]
        return ""

    def _title_from_path(self, path: Path) -> str:
        return path.stem.replace("-", " ").replace("_", " ").title()

    def _stable_segment(self, value: str) -> str:
        return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_") or "index"

    def _load_validator(self):
        validator_path = self.root / "content" / "tools" / "validate_content.py"
        spec = importlib.util.spec_from_file_location("canonical_validate_content", validator_path)
        if spec is None or spec.loader is None:
            raise CanonicalContentError(f"Unable to load canonical validator from {validator_path}")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def _record_references(self, record: dict[str, Any]) -> set[str]:
        refs: set[str] = set()
        for key in ("campaign_profile_id", "record_id", "target_id", "class_id", "spell_id", "calendar_id", "base_item_ref"):
            if isinstance(record.get(key), str):
                refs.add(record[key])
        for key in ("languages", "class_access", "months", "weekdays", "moons", "affects", "class_extensions", "availability_sets", "restriction_sets", "extension_sets"):
            value = record.get(key)
            if isinstance(value, list):
                refs.update(item for item in value if isinstance(item, str))
        for key in ("progression_ref", "saving_throw_ref", "attack_progression_ref"):
            if record.get(key):
                refs.add(record[key])
        refs.update(self._stable_strings(record.get("spellcasting")))
        refs.update(self._stable_strings(record.get("adds")))
        refs.update(self._stable_strings(record))
        if isinstance(record.get("id"), str):
            refs.discard(record["id"])
        return refs

    def _stable_strings(self, value: Any) -> set[str]:
        validator = self._load_validator()
        refs: set[str] = set()
        for item in validator.nested_string_lists(value):
            refs.add(item)
        return refs

    def _search_blob(self, record: dict[str, Any]) -> str:
        pieces = [
            str(record.get("id", "")),
            str(record.get("type", "")),
            str(record.get("name", "")),
            str(record.get("display_name", "")),
            str(record.get("source_library_id", "")),
            str(record.get("section", "")),
            str(record.get("summary", "")),
            str(record.get("description", "")),
        ]
        aliases = record.get("aliases")
        if isinstance(aliases, list):
            pieces.extend(str(alias) for alias in aliases)
        pieces.extend(sorted(self._record_references(record)))
        return " ".join(pieces).lower()

    def _default_legacy_mappings(self) -> dict[tuple[str, str], list[str]]:
        return {
            ("class", "assassin"): ["osric.class.assassin"],
            ("class", "bard"): ["osric.class.bard"],
            ("class", "cleric"): ["osric.class.cleric"],
            ("class", "druid"): ["osric.class.druid"],
            ("class", "fighter"): ["osric.class.fighter"],
            ("class", "illusionist"): ["osric.class.illusionist"],
            ("class", "magic-user"): ["osric.class.magic_user"],
            ("class", "magic user"): ["osric.class.magic_user"],
            ("class", "monk"): ["osric.class.monk"],
            ("class", "paladin"): ["osric.class.paladin"],
            ("class", "ranger"): ["osric.class.ranger"],
            ("class", "thief"): ["osric.class.thief"],
            ("race", "dwarf"): ["osric.race.dwarf"],
            ("race", "elf"): ["osric.race.elf"],
            ("race", "gnome"): ["osric.race.gnome"],
            ("race", "half-elf"): ["osric.race.half_elf"],
            ("race", "half elf"): ["osric.race.half_elf"],
            ("race", "half-orc"): ["osric.race.half_orc"],
            ("race", "half orc"): ["osric.race.half_orc"],
            ("race", "halfling"): ["osric.race.halfling"],
            ("race", "human"): ["osric.race.human"],
            ("race", "dargonesti elf"): ["dragolance.race.dargonesti_elf"],
            ("race", "dimernesti elf"): ["dragolance.race.dimernesti_elf"],
            ("race", "dragolance half-elf"): ["dragolance.race.half_elf"],
            ("race", "gully dwarf"): ["dragolance.race.gully_dwarf"],
            ("race", "half-elf (dragolance)"): ["dragolance.race.half_elf"],
            ("race", "hill dwarf"): ["dragolance.race.hill_dwarf"],
            ("race", "irda"): ["dragolance.race.irda"],
            ("race", "kagonesti elf"): ["dragolance.race.kagonesti_elf"],
            ("race", "kender"): ["dragolance.race.kender"],
            ("race", "krynn minotaur"): ["dragolance.race.minotaur"],
            ("race", "minotaur"): ["dragolance.race.minotaur"],
            ("race", "mountain dwarf"): ["dragolance.race.mountain_dwarf"],
            ("race", "qualinesti elf"): ["dragolance.race.qualinesti_elf"],
            ("race", "silvanesti elf"): ["dragolance.race.silvanesti_elf"],
            ("race", "tinker gnome"): ["dragolance.race.tinker_gnome"],
            ("weapon", "long sword"): ["osric.weapon.long_sword"],
            ("equipment", "long sword"): ["osric.weapon.long_sword"],
            ("spell", "magic missile"): ["osric.spell.magic_missile"],
            ("language", "common"): ["osric.language.common"],
        }


_canonical_content = CanonicalContentService()


def get_canonical_content() -> CanonicalContentService:
    return _canonical_content
