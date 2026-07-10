#!/usr/bin/env python3
from __future__ import annotations

import argparse
from collections import Counter
from pathlib import Path

from validate_content import canonical_json_files, load_json, validate_content


def main() -> int:
    parser = argparse.ArgumentParser(description="Report canonical content status.")
    parser.add_argument("--root", default=Path.cwd(), type=Path, help="Repository root")
    args = parser.parse_args()
    root = args.root.resolve()

    by_type: Counter[str] = Counter()
    by_source: Counter[str] = Counter()
    by_review: Counter[str] = Counter()
    draft_records: list[str] = []
    needs_review_records: list[str] = []
    conflict_records: list[str] = []
    deprecated_records: list[str] = []
    missing_descriptions: list[str] = []
    missing_source_refs: list[str] = []
    dragolance_todo_verify: list[str] = []

    for path in canonical_json_files(root):
        data = load_json(path)
        if not isinstance(data, dict):
            continue
        record_id = data.get("id", str(path))
        record_type = data.get("type", "unknown")
        by_type[str(record_type)] += 1
        if data.get("source_library_id"):
            by_source[str(data["source_library_id"])] += 1
        review_status = None
        if isinstance(data.get("review"), dict):
            review_status = data["review"].get("status")
        elif data.get("review_status"):
            review_status = data.get("review_status")
        if review_status:
            by_review[str(review_status)] += 1
        if review_status == "draft":
            draft_records.append(record_id)
        if review_status == "needs_review":
            needs_review_records.append(record_id)
        if review_status == "conflict":
            conflict_records.append(record_id)
        if data.get("deprecated"):
            deprecated_records.append(record_id)
        if record_type not in {"source_library", "availability_rule", "restriction_rule", "extension_rule"} and not data.get("description"):
            missing_descriptions.append(record_id)
        if record_type != "source_library" and not data.get("source_ref"):
            missing_source_refs.append(record_id)
        combined_text = " ".join(str(value) for value in data.values()).lower()
        if record_id.startswith("dragolance.") and ("todo" in combined_text or "verify" in combined_text):
            dragolance_todo_verify.append(record_id)

    validation = validate_content(root)

    print("Canonical content status")
    print("Record counts by type:")
    for key, value in sorted(by_type.items()):
        print(f"  {key}: {value}")
    print("Record counts by source:")
    for key, value in sorted(by_source.items()):
        print(f"  {key}: {value}")
    print("Record counts by review status:")
    for key, value in sorted(by_review.items()):
        print(f"  {key}: {value}")
    print(f"Draft records: {len(draft_records)}")
    for record_id in sorted(draft_records):
        print(f"  - {record_id}")
    print(f"Needs-review records: {len(needs_review_records)}")
    for record_id in sorted(needs_review_records):
        print(f"  - {record_id}")
    print(f"Conflict records: {len(conflict_records)}")
    for record_id in sorted(conflict_records):
        print(f"  - {record_id}")
    print(f"Deprecated records: {len(deprecated_records)}")
    for record_id in sorted(deprecated_records):
        print(f"  - {record_id}")
    print(f"Missing descriptions: {len(missing_descriptions)}")
    for record_id in sorted(missing_descriptions):
        print(f"  - {record_id}")
    print(f"Missing source references: {len(missing_source_refs)}")
    for record_id in sorted(missing_source_refs):
        print(f"  - {record_id}")
    print(f"Dragolance TODO/VERIFY markers: {len(dragolance_todo_verify)}")
    for record_id in sorted(dragolance_todo_verify):
        print(f"  - {record_id}")
    print(f"Validation errors: {len(validation.errors)}")
    print(f"Validation warnings: {len(validation.warnings)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
