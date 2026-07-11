export const TYPE_LABELS = {
  ability: "Ability Scores",
  armor: "Armor",
  attack_progression: "Attack Progressions",
  availability_rule: "Availability",
  calendar: "Calendars",
  campaign_profile: "Campaign Profiles",
  class: "Classes",
  class_ability: "Class Abilities",
  class_progression: "Progressions",
  deity: "Deities",
  equipment_item: "Equipment",
  extension_rule: "Extensions",
  language: "Languages",
  magic_item: "Magic Items",
  monster: "Monsters",
  moon: "Moons",
  organization: "Organizations",
  race: "Races",
  restriction_rule: "Restrictions",
  rules_page: "Rules Pages",
  saving_throw_progression: "Saving Throws",
  shield: "Shields",
  source_library: "Source Libraries",
  spell: "Spells",
  spell_list: "Spell Lists",
  spell_slot_progression: "Spell Slots",
  weapon: "Weapons",
  weekday: "Weekdays",
  month: "Months",
};

export function titleize(value = "") {
  return String(value)
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function safeDisplayText(value, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => safeDisplayText(item)).filter(Boolean).join(", ") || fallback;
  }
  if (typeof value === "object") {
    if (typeof value.player === "string" && value.player.trim()) return value.player;
    if (typeof value.dm === "string" && value.dm.trim()) return value.dm;
    return Object.entries(value)
      .map(([key, nested]) => {
        const text = safeDisplayText(nested);
        return text ? `${titleize(key)}: ${text}` : "";
      })
      .filter(Boolean)
      .join("; ") || fallback;
  }
  return fallback;
}

export function typeLabel(type) {
  return TYPE_LABELS[type] || titleize(type);
}

export function recordTitle(record) {
  return safeDisplayText(record?.display_name || record?.name || record?.id, "Untitled Record");
}

export function reviewStatus(record) {
  const review = record?.review;
  if (record?.review_status) return safeDisplayText(record.review_status);
  if (review && typeof review === "object") return safeDisplayText(review.status);
  return safeDisplayText(review);
}

export function sourceLabel(sourceId, sources = []) {
  const source = sources.find((item) => item.id === sourceId);
  return source ? recordTitle(source) : sourceId ? titleize(sourceId) : "Unspecified";
}

export function recordSummary(record) {
  return safeDisplayText(record?.summary || record?.description || record?.section || record?.id, "");
}

export function makeTypeOptions(catalog = {}) {
  const present = new Set([
    ...(catalog.records || []).map((record) => record.type),
    ...(catalog.rules_pages || []).length ? ["rules_page"] : [],
  ].filter(Boolean));
  return [...present].sort((a, b) => typeLabel(a).localeCompare(typeLabel(b)));
}

export function searchableText(item) {
  const pieces = [
    item.id,
    item.type,
    item.name,
    item.display_name,
    item.source_library_id,
    item.summary,
    item.description,
    item.section,
    item.path,
  ];
  return pieces.map((piece) => safeDisplayText(piece)).filter(Boolean).join(" ").toLowerCase();
}

export function filterReferenceItems(items, { source = "all", type = "all", query = "" } = {}) {
  const needle = query.trim().toLowerCase();
  return (items || []).filter((item) => {
    if (source !== "all" && item.source_library_id !== source) return false;
    if (type !== "all" && item.type !== type) return false;
    if (needle && !searchableText(item).includes(needle)) return false;
    return true;
  });
}

export function isCanonicalId(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:[._][a-z0-9]+)+$/.test(value);
}
