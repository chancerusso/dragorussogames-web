#!/usr/bin/env python3
"""Extract PHB spell header mechanics into a reviewable structured catalog.

The purchased PDF is an input only. This tool writes no descriptive source
prose; it records the compact game fields printed above each spell entry.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
from typing import Any

from pypdf import PdfReader


CLASS_PAGE_RANGES = {
    # Zero-based PDF indexes. Boundary pages intentionally overlap because the
    # printed book begins the next class after finishing the previous class.
    "cleric": range(43, 55),
    "druid": range(54, 65),
    "magic-user": range(64, 95),
    "illusionist": range(93, 101),
}

LABEL_PATTERNS = {
    "level": r"Level\s*:",
    "components": r"Comp\s*onents?\s*:",
    "range": r"Range\s*:",
    "casting_time": r"Castin\s*g Time\s*:",
    "duration": r"Duration\s*:",
    "saving_throw": r"Saving Throw\s*:",
    "area_of_effect": r"Area of Effect\s*:",
}


def normalized_key(value: str) -> str:
    value = (
        value.lower()
        .replace("colour", "color")
        .replace("glamour", "glamer")
        .replace("’", "'")
    )
    return re.sub(r"[^a-z0-9]", "", value)


def clean_value(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    return (
        value.replace("“", '"')
        .replace("”", '"')
        .replace("½", "1/2")
        .replace("¼", "1/4")
        .replace("¾", "3/4")
    )


def source_lines(reader: PdfReader, pages: range) -> list[dict[str, Any]]:
    lines: list[dict[str, Any]] = []
    for page_index in pages:
        text = reader.pages[page_index].extract_text() or ""
        for line in text.splitlines():
            stripped = line.strip()
            if not stripped:
                continue
            if stripped.isdigit() or stripped.startswith("Chance Russo (Order #"):
                continue
            if re.match(
                r"^(CLERIC|DRUID|MAGIC-USER|ILLUSIONIST) SPELLS(?: |$)",
                stripped,
            ):
                continue
            lines.append(
                {
                    "text": stripped,
                    "pdf_page": page_index + 1,
                    "printed_page": page_index,
                }
            )
    return lines


def field_values(block: str) -> dict[str, str]:
    marker = "|".join(
        f"(?P<{field}>{pattern})"
        for field, pattern in LABEL_PATTERNS.items()
    )
    hits = list(re.finditer(marker, block, re.I))
    values: dict[str, str] = {}
    for index, hit in enumerate(hits):
        end = hits[index + 1].start() if index + 1 < len(hits) else len(block)
        values[hit.lastgroup or ""] = clean_value(block[hit.end() : end])
    return values


def entry_block(lines: list[dict[str, Any]], start: int) -> str:
    block: list[str] = []
    for row in lines[start + 1 : start + 50]:
        if (
            row["pdf_page"] != lines[start]["pdf_page"]
            and len(field_values(clean_value(" ".join(block)))) == len(LABEL_PATTERNS)
        ):
            break
        letters = re.sub(r"[^a-z]", "", row["text"].lower())
        if letters.startswith("explanationdescription"):
            break
        block.append(row["text"])
    return clean_value(" ".join(block))


def title_metadata(lines: list[dict[str, Any]], start: int) -> tuple[str | None, bool]:
    title = lines[start]["text"]
    if start + 1 < len(lines) and "(" not in title and lines[start + 1]["text"].startswith("("):
        title = f"{title} {lines[start + 1]['text']}"
    groups = re.findall(r"\(([^()]*)\)", title)
    school = clean_value(groups[-1]) if groups else None
    return school, "reversible" in title.lower()


def find_entry(
    lines: list[dict[str, Any]],
    name: str,
    level: int,
) -> dict[str, Any] | None:
    name_key = normalized_key(name)
    for index, row in enumerate(lines):
        line_key = normalized_key(row["text"])
        has_school = "(" in row["text"] or (
            index + 1 < len(lines) and lines[index + 1]["text"].startswith("(")
        ) or name.lower().startswith("first level magic-user spells")
        if not line_key.startswith(name_key) or not has_school:
            continue
        block = entry_block(lines, index)
        fields = field_values(block)
        if fields.get("level") != str(level):
            continue
        school, reversible = title_metadata(lines, index)
        fields["school"] = school
        fields["reversible"] = reversible
        fields["source"] = "Player's Handbook"
        fields["source_page"] = row["printed_page"]
        fields["header_verification"] = "verified"
        fields["effect_verification"] = "pending_semantic_review"
        if "area_of_effect" not in fields:
            fields["area_of_effect"] = "Not printed"
        return fields
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument(
        "--spell-lists",
        type=Path,
        default=Path("content/1e/source/phb_spell_lists.json"),
    )
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    reader = PdfReader(str(args.pdf))
    source = json.loads(args.spell_lists.read_text())
    result: dict[str, Any] = {
        "source": "Player's Handbook",
        "verification": "spell_header_mechanics_verified",
        "entries": {},
    }
    missing: list[str] = []

    for spell_class, levels in source["lists"].items():
        lines = source_lines(reader, CLASS_PAGE_RANGES[spell_class])
        for level_text, names in levels.items():
            for name in names:
                mechanics = find_entry(lines, name, int(level_text))
                if mechanics is None:
                    missing.append(f"{spell_class} {level_text}: {name}")
                    continue
                result["entries"].setdefault(name, {})[spell_class] = mechanics

    expected = sum(
        len(names)
        for levels in source["lists"].values()
        for names in levels.values()
    )
    found = sum(len(entries) for entries in result["entries"].values())
    result["expected_class_entries"] = expected
    result["verified_header_entries"] = found
    result["missing_entries"] = missing

    payload = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.write_text(payload)
    else:
        print(payload)
    return 0 if not missing and found == expected else 1


if __name__ == "__main__":
    raise SystemExit(main())
