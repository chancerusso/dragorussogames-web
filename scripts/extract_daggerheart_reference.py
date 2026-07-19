import json
import re
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
SRD = ROOT / "content/daggerheart/reference/Daggerheart-SRD-9-09-25.pdf"
OUT = ROOT / "daggerheart/daggerheart-data.js"

COLS = [(50, 295), (300, 560), (680, 920), (930, 1190)]
DOMAINS = {"Arcana", "Blade", "Bone", "Codex", "Grace", "Midnight", "Sage", "Splendor", "Valor"}
CARD_TYPES = {"Spell", "Ability", "Grimoire"}
CLASS_NAMES = ["Bard", "Druid", "Guardian", "Ranger", "Rogue", "Seraph", "Sorcerer", "Warrior", "Wizard"]
ANCESTRIES = ["Clank", "Drakona", "Dwarf", "Elf", "Faerie", "Faun", "Firbolg", "Fungril", "Galapa", "Giant", "Goblin", "Halfling", "Human", "Infernis", "Katari", "Orc", "Ribbet", "Simiah"]
COMMUNITIES = ["Highborne", "Loreborne", "Orderborne", "Ridgeborne", "Seaborne", "Slyborne", "Underborne", "Wanderborne", "Wildborne"]
ITEM_SPLITS = [
    "During", "This", "When", "You", "A creature", "As ", "While", "Spend", "Once", "By ",
    "Mark", "Clear", "Eat", "Consume", "Thick", "If ", "After", "Activate", "Position",
]


def clean_text(value):
    return (
        re.sub(r"\s+", " ", value)
        .replace("T o ", "To ")
        .replace("T ake", "Take")
        .replace("diﬀerent", "different")
        .replace("oﬀer", "offer")
        .replace("aﬀect", "affect")
        .replace("eﬀect", "effect")
        .replace("Diffi culty", "Difficulty")
        .replace("profi t", "profit")
        .replace("fi ght", "fight")
        .replace("off er", "offer")
        .strip()
    )


def smart_name(value):
    lowers = {"of", "and", "or", "the", "a", "an", "to", "in"}
    parts = re.split(r"([ -])", value.lower())
    out = []
    word_index = 0
    for part in parts:
        if part in {" ", "-"}:
            out.append(part)
            continue
        if not part:
            continue
        word_index += 1
        if word_index > 1 and part in lowers:
            out.append(part)
        else:
            out.append(part[:1].upper() + part[1:])
    return "".join(out).replace("’S", "’s")


def norm(value):
    return re.sub(r"[^A-Z0-9]+", "", value.upper())


def page_column_lines(page, columns=COLS):
    output = []
    for x0, x1 in columns:
        words = [w for w in page.extract_words(x_tolerance=1, y_tolerance=3, keep_blank_chars=False) if x0 <= w["x0"] < x1]
        groups = []
        for word in sorted(words, key=lambda item: (item["top"], item["x0"])):
            if groups and abs(groups[-1]["top"] - word["top"]) < 3:
                groups[-1]["words"].append(word)
                groups[-1]["top"] = min(groups[-1]["top"], word["top"])
            else:
                groups.append({"top": word["top"], "words": [word]})
        output.append([
            (group["top"], " ".join(w["text"] for w in sorted(group["words"], key=lambda item: item["x0"])))
            for group in groups
        ])
    return output


def all_lines(pdf, start_page, end_page):
    lines = []
    for page_no in range(start_page, end_page + 1):
        for column in page_column_lines(pdf.pages[page_no - 1]):
            lines.extend(text for _, text in column)
            lines.append("")
    return lines


def stitched_column_lines(page, left_index, right_index):
    columns = page_column_lines(page)
    left = columns[left_index]
    right = columns[right_index]
    stitched = []
    for top, text in left:
        if text in {"Daggerheart SRD", "ROLL Loot description", "ROLL LOOT description"}:
            continue
        matching = " ".join(other for other_top, other in right if abs(other_top - top) < 3 and "Daggerheart SRD" not in other)
        stitched.append(clean_text(f"{text} {matching}".strip()))
    return stitched


def split_item_name(rest):
    positions = [rest.find(token) for token in ITEM_SPLITS if rest.find(token) > 0]
    if not positions:
        words = rest.split()
        return " ".join(words[:3]), " ".join(words[3:])
    split = min(positions)
    return rest[:split].strip(), rest[split:].strip()


def parse_numbered_items(lines, kind, rarity_hint="SRD table"):
    records = []
    current = None
    for line in lines:
        if not line or line.startswith("ROLL") or line.startswith("Loot comprises") or line.startswith("Consumables are"):
            continue
        match = re.match(r"^(\d{2})\s+(.+)$", line)
        if match:
            if current:
                records.append(current)
            name, description = split_item_name(match.group(2))
            current = {
                "roll": match.group(1),
                "name": clean_text(name),
                "kind": kind,
                "rarity": rarity_hint,
                "description": clean_text(description),
                "source": "Daggerheart SRD 1.0 Loot Reference",
            }
        elif current:
            current["description"] = clean_text(f"{current['description']} {line}")
    if current:
        records.append(current)
    return records


def parse_loot(pdf):
    lines = []
    lines.extend(stitched_column_lines(pdf.pages[29], 0, 1))
    lines.extend(stitched_column_lines(pdf.pages[29], 2, 3))
    lines.extend(stitched_column_lines(pdf.pages[30], 0, 1)[:18])
    return [item for item in parse_numbered_items(lines, "Loot") if item["roll"].isdigit()]


def parse_consumables(pdf):
    lines = []
    # Page 31 contains reusable loot in the top-left, then consumables begin lower on the page.
    page_31_columns = page_column_lines(pdf.pages[30])
    for top, text in page_31_columns[0]:
        if top >= 488:
            lines.append(clean_text(text))
    for column in page_31_columns[1:]:
        lines.extend(clean_text(text) for _, text in column if text and "Daggerheart SRD" not in text)
    lines.extend(clean_text(text) for _, text in page_column_lines(pdf.pages[31])[0] if text and "Daggerheart SRD" not in text)
    return [item for item in parse_numbered_items(lines, "Consumable") if item["roll"].isdigit()]


def tier_number(symbol):
    if symbol and 0xE541 <= ord(symbol[0]) <= 0xE544:
        return ord(symbol[0]) - 0xE540
    match = re.search(r"[1-4]", symbol)
    return int(match.group()) if match else 1


def parse_features(lines):
    starts = [(index, re.match(r"^(.+?) - (Passive|Action|Reaction):\s*(.*)$", line)) for index, line in enumerate(lines)]
    starts = [(index, match) for index, match in starts if match]
    features = []
    for position, (index, match) in enumerate(starts):
        end = starts[position + 1][0] if position + 1 < len(starts) else len(lines)
        body = clean_text(" ".join([match.group(3), *lines[index + 1:end]]))
        features.append({"name": clean_text(match.group(1)), "type": match.group(2), "text": body})
    return features


def parse_stat_blocks(pdf, start_page, end_page, kind):
    records = []
    for page_no in range(start_page, end_page + 1):
        for column in page_column_lines(pdf.pages[page_no - 1]):
            lines = [clean_text(text) for _, text in column if text and "Daggerheart SRD" not in text]
            starts = [index for index in range(len(lines) - 1) if re.fullmatch(r"[A-Z0-9][A-Z0-9’'&:, -]+", lines[index]) and lines[index + 1].startswith("Tier ")]
            for position, start in enumerate(starts):
                end = starts[position + 1] if position + 1 < len(starts) else len(lines)
                block = lines[start:end]
                tier_match = re.match(r"Tier (\S+) (.+)", block[1])
                if not tier_match:
                    continue
                joined = clean_text(" ".join(block[2:]))
                feature_index = block.index("FEATURES") if "FEATURES" in block else len(block)
                feature_lines = block[feature_index + 1:]
                features_text = joined.split("FEATURES", 1)[1].strip() if "FEATURES" in joined else ""
                intro = joined.split("FEATURES", 1)[0].strip()
                marker = "Motives & Tactics:" if kind == "adversary" else "Impulses:"
                description = intro.split(marker, 1)[0].strip()
                impulses = first_match(r"Impulses: (.+?)(?: Difficulty:| Potential Adversaries:|$)", intro)
                record = {
                    "name": smart_name(block[0]), "tier": tier_number(tier_match.group(1)), "type": clean_text(tier_match.group(2)),
                    "description": description, "features": parse_features(feature_lines), "featuresText": features_text,
                    "source": f"Daggerheart SRD 1.0 page {page_no}",
                }
                if kind == "adversary":
                    stat = re.search(r"Difficulty: (\d+) \| Thresholds: ([^|]+) \| HP: (\d+) \| Stress: (\d+)", intro)
                    attack = re.search(r"ATK: ([^|]+) \| ([^:]+): ([^|]+) \| ([^ ]+) (\w+)", intro)
                    record.update({"motives": first_match(r"Motives & Tactics: (.+?)(?: Difficulty:|$)", intro), "difficulty": int(stat.group(1)) if stat else None, "thresholds": clean_text(stat.group(2)) if stat else "", "hp": int(stat.group(3)) if stat else None, "stress": int(stat.group(4)) if stat else None, "attackModifier": clean_text(attack.group(1)) if attack else "", "attackName": clean_text(attack.group(2)) if attack else "", "range": clean_text(attack.group(3)) if attack else "", "damage": clean_text(f"{attack.group(4)} {attack.group(5)}") if attack else "", "experience": first_match(r"Experience: (.+?)(?: FEATURES|$)", intro)})
                else:
                    record.update({"impulses": impulses, "difficulty": int(first_match(r"Difficulty: (\d+)", intro) or 0), "potentialAdversaries": first_match(r"Potential Adversaries: (.+)$", intro)})
                records.append(record)
    return records


def existing_data():
    text = OUT.read_text()
    payload = text.split("=", 1)[1].strip()
    if payload.endswith(";"):
        payload = payload[:-1]
    return json.loads(payload)


def parse_cards(pdf, data):
    existing_by_norm = {norm(card["name"]): card["name"] for card in data.get("cards", [])}
    records = []
    for page_no in range(60, 69):
        for column in page_column_lines(pdf.pages[page_no - 1]):
            entries = [{"top": top, "text": text} for top, text in column if text.strip()]
            starts = []
            for index in range(len(entries) - 2):
                title = entries[index]["text"].strip()
                level_line = entries[index + 1]["text"].strip()
                recall_line = entries[index + 2]["text"].strip()
                if title.endswith("DOMAIN") or title in {"APPENDIX", "Daggerheart SRD"}:
                    continue
                if not re.fullmatch(r"[A-Z0-9][A-Z0-9’'&:, -]+", title):
                    continue
                level_match = re.fullmatch(r"Level (\d+) ([A-Za-z]+) ([A-Za-z]+)", level_line)
                recall_match = re.fullmatch(r"Recall Cost: (\d+)", recall_line)
                if level_match and recall_match and level_match.group(2) in DOMAINS and level_match.group(3) in CARD_TYPES:
                    starts.append((index, title, level_match, recall_match))
            for pos, (index, title, level_match, recall_match) in enumerate(starts):
                end_index = starts[pos + 1][0] if pos + 1 < len(starts) else len(entries)
                body = " ".join(item["text"] for item in entries[index + 3:end_index])
                body = clean_text(body)
                if not body or len(body) < 8:
                    continue
                name = existing_by_norm.get(norm(title), smart_name(title))
                records.append({
                    "name": name,
                    "level": int(level_match.group(1)),
                    "domain": level_match.group(2),
                    "type": level_match.group(3),
                    "recall": int(recall_match.group(1)),
                    "text": body,
                    "source": "Daggerheart SRD 1.0 Appendix Domain Card Reference",
                })
    deduped = {}
    for card in records:
        deduped[norm(card["name"])] = card
    return list(deduped.values())


def extract_named_sections(lines, names):
    name_by_norm = {norm(name): name for name in names}
    headings = []
    for index, line in enumerate(lines):
        key = norm(line)
        if key in name_by_norm:
            headings.append((index, name_by_norm[key]))
    sections = []
    for pos, (index, name) in enumerate(headings):
        end = headings[pos + 1][0] if pos + 1 < len(headings) else len(lines)
        text = "\n".join(line for line in lines[index + 1:end] if line.strip() and line != "Daggerheart SRD")
        sections.append({"name": name, "text": clean_text(text), "source": "Daggerheart SRD 1.0"})
    return sections


def first_match(pattern, text):
    match = re.search(pattern, text, re.IGNORECASE)
    return clean_text(match.group(1)) if match else ""


def class_records(lines):
    sections = extract_named_sections(lines, CLASS_NAMES)
    records = []
    for section in sections:
        text = section["text"]
        name = section["name"]
        records.append({
            **section,
            "description": clean_text(text.split("DOMAINS -", 1)[0]),
            "domains": [entry.strip() for entry in first_match(r"DOMAINS - ([^\n]+?)(?: STARTING|$)", text).replace(" and ", " & ").split("&") if entry.strip()],
            "startingEvasion": first_match(r"STARTING EVASION - ([0-9]+)", text),
            "startingHitPoints": first_match(r"STARTING HIT POINTS - ([0-9]+)", text),
            "classItems": first_match(r"CLASS ITEMS - (.+?)(?: [A-Z][A-Z’' ]+’S HOPE FEATURE| HOPE FEATURE| CLASS FEATURE)", text),
            "hopeFeature": first_match(r"HOPE FEATURE (.+?)(?: CLASS FEATURE| CLASS FEATURES| [A-Z]+ SUBCLASSES)", text),
            "subclassNames": re.findall(r"Choose either the ([A-Za-z' -]+) or ([A-Za-z' -]+) subclass", text),
        })
    return records


def write_data(data):
    data["cards"] = parse_cards_cache
    data["domainCards"] = {}
    for card in data["cards"]:
        data["domainCards"].setdefault(card["domain"], []).append(card["name"])
    data["classesFull"] = parse_classes_cache
    data["ancestriesFull"] = parse_ancestries_cache
    data["communitiesFull"] = parse_communities_cache
    data["lootItems"] = parse_loot_cache
    data["consumables"] = parse_consumables_cache
    data["adversaries"] = parse_adversaries_cache
    data["environments"] = parse_environments_cache
    OUT.write_text("// Generated from local Daggerheart SRD reference PDF for the Drago Russo Games player portal.\nwindow.DAGGERHEART_DATA = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n")


if __name__ == "__main__":
    data = existing_data()
    with pdfplumber.open(SRD) as pdf:
        parse_cards_cache = parse_cards(pdf, data)
        class_lines = all_lines(pdf, 5, 13)
        ancestry_lines = all_lines(pdf, 14, 17)
        community_lines = all_lines(pdf, 17, 19)
        parse_classes_cache = class_records(class_lines)
        parse_ancestries_cache = extract_named_sections(ancestry_lines, ANCESTRIES)
        parse_communities_cache = extract_named_sections(community_lines, COMMUNITIES)
        parse_loot_cache = parse_loot(pdf)
        parse_consumables_cache = parse_consumables(pdf)
        parse_adversaries_cache = parse_stat_blocks(pdf, 38, 51, "adversary")
        parse_environments_cache = parse_stat_blocks(pdf, 53, 56, "environment")
    write_data(data)
    print(f"cards={len(parse_cards_cache)} classes={len(parse_classes_cache)} ancestries={len(parse_ancestries_cache)} communities={len(parse_communities_cache)} loot={len(parse_loot_cache)} consumables={len(parse_consumables_cache)} adversaries={len(parse_adversaries_cache)} environments={len(parse_environments_cache)}")
