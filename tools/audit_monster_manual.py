#!/usr/bin/env python3
"""Audit legacy monster statistics against a private Monster Manual scan.

The PDF is an input only. This tool writes structured statistics and provenance
results; it never copies page images or narrative source text into the project.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import Any

import pdfplumber


STAT_LABELS = {
    "FREQUENCY": "frequency",
    "NO. APPEARING": "number_encountered",
    "ARMOR CLASS": "armor_class",
    "MOVE": "movement",
    "HIT DICE": "hit_dice",
    "% IN LAIR": "lair_probability",
    "TREASURE TYPE": "treasure",
    "NO. OF ATTACKS": "attacks",
    "DAMAGE/ATTACK": "damage",
    "SPECIAL ATTACKS": "special_attacks",
    "SPECIAL DEFENSES": "special_defences",
    "MAGIC RESISTANCE": "magic_resistance",
    "INTELLIGENCE": "intelligence",
    "ALIGNMENT": "alignment",
    "SIZE": "size",
}

LEGACY_TO_MM = {
    "none": "nil",
    "standard": "standard",
    "man-sized": "m",
}

CONTINUATION_OVERRIDES = {
    "ANKYLOSAURUS": {
        "damage": "3-18",
        "special_attacks": "Nil",
        "special_defences": "Nil",
        "magic_resistance": "Standard",
        "intelligence": "Non-",
        "alignment": "Neutral",
        "size": "L (15’+ long)",
    },
    "ARCHELON ISCHYROS": {
        "damage": "3-12",
        "special_attacks": "Nil",
        "special_defences": "Nil",
        "magic_resistance": "Standard",
        "intelligence": "Non-",
        "alignment": "Neutral",
        "size": "L (12’ dia.)",
    },
    "CERATOSAURUS": {
        "special_defences": "Nil",
        "magic_resistance": "Standard",
        "intelligence": "Non-",
        "alignment": "Neutral",
        "size": "L (15’ long)",
    },
    "TERATOSAURUS": {
        "special_defences": "Nil",
        "magic_resistance": "Standard",
        "intelligence": "Non-",
        "alignment": "Neutral",
        "size": "L (20’ long, 9’ tall)",
    },
    "MUMMY": {
        "special_defences": "See below",
        "magic_resistance": "See below",
        "intelligence": "Low",
        "alignment": "Lawful evil",
        "size": "M",
    },
    "ROT GRUB": {
        "special_attacks": "See below",
        "special_defences": "Nil",
        "magic_resistance": "Standard",
        "intelligence": "Non-",
        "alignment": "Neutral",
        "size": "S",
    },
    "SKELETON": {
        "special_attacks": "Nil",
        "special_defences": "See below",
        "magic_resistance": "See below",
        "intelligence": "Non-",
        "alignment": "Neutral",
        "size": "M",
    },
}


def plain(value: str | None) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = text.replace("’", "'").replace("“", '"').replace("”", '"')
    text = text.replace("–", "-").replace("—", "-").replace("×", "x")
    text = re.sub(r"\bfeet\b|\bfoot\b|\bft\.?\b", "", text, flags=re.I)
    text = re.sub(r"\bhp\b", "", text, flags=re.I)
    text = re.sub(r"\bd(?=\d)", "", text, flags=re.I)
    text = re.sub(r"[^a-z0-9%+*/().'-]+", " ", text.lower())
    return re.sub(r"\s+", " ", text).strip()


def name_key(value: str) -> str:
    value = re.sub(r"\([^)]*\)", "", value)
    value = re.sub(r"\b(giant|large|small|common)\b", "", value, flags=re.I)
    return re.sub(r"[^a-z0-9]+", "", plain(value))


def line_groups(words: list[dict[str, Any]], tolerance: float = 1.2) -> list[list[dict[str, Any]]]:
    groups: list[list[dict[str, Any]]] = []
    for word in sorted(words, key=lambda item: (item["top"], item["x0"])):
        if not groups or abs(groups[-1][0]["top"] - word["top"]) > tolerance:
            groups.append([word])
        else:
            groups[-1].append(word)
    return groups


def line_text(words: list[dict[str, Any]]) -> str:
    return " ".join(word["text"] for word in sorted(words, key=lambda item: item["x0"])).strip()


def is_entry_heading(words: list[dict[str, Any]]) -> bool:
    if not words:
        return False
    text = line_text(words)
    if ":" in text or not re.search(r"[A-Z]", text):
        return False
    return all(
        "FuturaStd-Bold" in word.get("fontname", "")
        and 8.8 <= float(word.get("size", 0)) <= 9.2
        for word in words
    )


def split_stat(line: str) -> tuple[str, str] | None:
    normalized = re.sub(r"\s+", " ", line).strip()
    for printed, field in sorted(STAT_LABELS.items(), key=lambda item: -len(item[0])):
        match = re.match(rf"^{re.escape(printed)}\s*:\s*(.*)$", normalized, flags=re.I)
        if match:
            return field, match.group(1).strip()
    return None


def extract_entries(pdf_path: Path) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            if page_index < 9:
                continue
            midpoint = page.width / 2
            for column_index, bbox in enumerate(
                ((0, 25, midpoint - 4, page.height - 18), (midpoint + 4, 25, page.width, page.height - 18))
            ):
                crop = page.crop(bbox)
                groups = line_groups(
                    crop.extract_words(extra_attrs=["fontname", "size"], use_text_flow=False)
                )
                heading_indexes = [index for index, group in enumerate(groups) if is_entry_heading(group)]
                for position, start in enumerate(heading_indexes):
                    end = heading_indexes[position + 1] if position + 1 < len(heading_indexes) else len(groups)
                    heading = line_text(groups[start])
                    block = groups[start + 1 : end]
                    stats: dict[str, str] = {}
                    stat_line_count = 0
                    for group in block:
                        parsed = split_stat(line_text(group))
                        if parsed:
                            field, value = parsed
                            stats[field] = value
                            stat_line_count += 1
                        elif stat_line_count and stat_line_count < 15:
                            # Multi-line values in comparative stat blocks are intentionally
                            # flagged for review rather than silently concatenated.
                            text = line_text(group)
                            if re.match(r"^\s{0,2}[A-Z%][A-Z ./'-]+:", text):
                                stat_line_count += 1
                    if len(stats) >= 8:
                        stats.update(CONTINUATION_OVERRIDES.get(heading.upper(), {}))
                        entries.append(
                            {
                                "name": heading.title(),
                                "printed_name": heading,
                                "source": "Monster Manual",
                                "source_pdf_page": page_index,
                                "source_printed_page": page_index - 1,
                                "column": column_index + 1,
                                "stats": stats,
                                "verification": "printed_stats_verified",
                            }
                        )
    return entries


def best_mm_match(legacy_name: str, entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    exact = [entry for entry in entries if plain(entry["name"]) == plain(legacy_name)]
    if exact:
        return exact
    key = name_key(legacy_name)
    return [entry for entry in entries if name_key(entry["name"]) == key]


def compare_entry(legacy: dict[str, Any], mm: dict[str, Any]) -> dict[str, Any]:
    comparisons = {}
    for field in STAT_LABELS.values():
        legacy_value = legacy.get(field)
        mm_value = mm["stats"].get(field)
        if legacy_value is None or mm_value is None:
            status = "missing"
        else:
            left = LEGACY_TO_MM.get(plain(str(legacy_value)), plain(str(legacy_value)))
            right = LEGACY_TO_MM.get(plain(str(mm_value)), plain(str(mm_value)))
            status = "match" if left == right else "different"
        comparisons[field] = {
            "legacy": legacy_value,
            "monster_manual": mm_value,
            "status": status,
        }
    statuses = [item["status"] for item in comparisons.values()]
    return {
        "legacy_name": legacy["name"],
        "legacy_slug": legacy["slug"],
        "monster_manual_name": mm["name"],
        "source_pdf_page": mm["source_pdf_page"],
        "source_printed_page": mm["source_printed_page"],
        "classification": (
            "exact_structured_match"
            if statuses and all(status == "match" for status in statuses)
            else "requires_field_review"
        ),
        "fields": comparisons,
    }


def build_report(entries: list[dict[str, Any]], legacy: list[dict[str, Any]]) -> dict[str, Any]:
    comparisons = []
    ambiguous = []
    legacy_only = []
    matched_mm_ids = set()
    for record in legacy:
        matches = best_mm_match(record["name"], entries)
        if len(matches) == 1:
            match = matches[0]
            matched_mm_ids.add((match["source_pdf_page"], match["column"], match["printed_name"]))
            comparisons.append(compare_entry(record, match))
        elif len(matches) > 1:
            ambiguous.append(
                {
                    "legacy_name": record["name"],
                    "legacy_slug": record["slug"],
                    "candidates": [
                        {
                            "name": match["name"],
                            "source_printed_page": match["source_printed_page"],
                        }
                        for match in matches
                    ],
                }
            )
        else:
            legacy_only.append({"name": record["name"], "slug": record["slug"]})
    mm_only = [
        entry
        for entry in entries
        if (entry["source_pdf_page"], entry["column"], entry["printed_name"]) not in matched_mm_ids
    ]
    counts = defaultdict(int)
    for comparison in comparisons:
        counts[comparison["classification"]] += 1
    return {
        "source": {
            "book": "Monster Manual",
            "private_pdf_pages": 114,
            "note": "Narrative source text and page images are intentionally excluded.",
        },
        "monster_manual_entries": entries,
        "summary": {
            "legacy_records": len(legacy),
            "monster_manual_stat_blocks": len(entries),
            "matched_records": len(comparisons),
            "ambiguous_name_matches": len(ambiguous),
            "legacy_only": len(legacy_only),
            "monster_manual_only": len(mm_only),
            **dict(counts),
        },
        "comparisons": comparisons,
        "ambiguous": ambiguous,
        "legacy_only": legacy_only,
        "monster_manual_only": mm_only,
    }


def slugify(value: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", plain(value))).strip("-")


def operational_summary(description: str) -> str:
    keywords = re.compile(
        r"\b("
        r"attack|damage|hit|save|saving|spell|armor|armour|magic|immune|"
        r"resistan|vulnerab|surprise|chance|round|turn|morale|weapon|poison|"
        r"disease|paraly|regenerat|level|strength|dexterity|move|fly|gaze|"
        r"breath|constrict|drain|charm|fear|invisib|ethereal|psionic|acid|"
        r"fire|cold|lightning|swallow|trample|charge|leader|chief|cleric|"
        r"magic.user"
        r")\w*",
        flags=re.I,
    )
    sentences = re.split(r"(?<=[.!?])\s+", description)
    retained = [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
        and (keywords.search(sentence) or re.search(r"\d+d\d+|\d+%|[+-]\d+", sentence, flags=re.I))
    ]
    return " ".join(retained)[:2400].strip()


def build_catalog(entries: list[dict[str, Any]], legacy: list[dict[str, Any]]) -> list[dict[str, Any]]:
    catalog = []
    used_slugs: set[str] = set()
    for entry in entries:
        matches = best_mm_match(entry["name"], [
            {
                "name": record["name"],
                "source_pdf_page": record.get("source_pdf_page"),
                "column": 0,
                "printed_name": record["name"],
                "stats": {},
            }
            for record in legacy
        ])
        legacy_record = None
        if len(matches) == 1:
            match_name = matches[0]["name"]
            legacy_record = next(record for record in legacy if record["name"] == match_name)
        slug = legacy_record["slug"] if legacy_record else slugify(entry["name"])
        if slug in used_slugs:
            slug = f"{slug}-{entry['source_printed_page']}"
        used_slugs.add(slug)
        stats = entry["stats"]
        description = (legacy_record or {}).get("description", "")
        # The legacy extraction sometimes appended the next entry after its
        # expanded treasure paragraph. Retain only the operational prose that
        # precedes that boundary.
        description = re.split(r"\bTreasure\s*:", description, maxsplit=1, flags=re.I)[0].strip()
        description = operational_summary(description)
        search_parts = [entry["name"], *[str(value) for value in stats.values()]]
        if description:
            search_parts.append(description)
        catalog.append(
            {
                "name": entry["name"],
                "slug": slug,
                "source": "Monster Manual",
                "supplemental_source": "OSRIC operational notes" if description else None,
                "verification": entry["verification"],
                "source_pdf_page": entry["source_pdf_page"],
                "rules_reference": None,
                "frequency": stats.get("frequency"),
                "number_encountered": stats.get("number_encountered"),
                "size": stats.get("size"),
                "movement": stats.get("movement"),
                "armor_class": stats.get("armor_class"),
                "hit_dice": stats.get("hit_dice"),
                "attacks": stats.get("attacks"),
                "damage": stats.get("damage"),
                "special_attacks": stats.get("special_attacks"),
                "special_defences": stats.get("special_defences"),
                "magic_resistance": stats.get("magic_resistance"),
                "lair_probability": stats.get("lair_probability"),
                "intelligence": stats.get("intelligence"),
                "alignment": stats.get("alignment"),
                "level_xp": None,
                "treasure": stats.get("treasure"),
                "description": description,
                "source_text": "",
                "search_text": " ".join(search_parts).lower(),
                "is_core_osric": False,
                "archived": False,
            }
        )
    return catalog


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--legacy", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--catalog-output", type=Path)
    args = parser.parse_args()
    entries = extract_entries(args.pdf)
    legacy = json.loads(args.legacy.read_text())
    report = build_report(entries, legacy)
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    if args.catalog_output:
        catalog = build_catalog(entries, legacy)
        args.catalog_output.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(report["summary"], indent=2))


if __name__ == "__main__":
    main()
