import test from "node:test";
import assert from "node:assert/strict";

import {
  filterReferenceItems,
  isCanonicalId,
  makeTypeOptions,
  recordTitle,
  reviewStatus,
  sourceLabel,
  typeLabel,
} from "./rulesReference.js";

const catalog = {
  sources: [
    { id: "osric", display_name: "OSRIC" },
    { id: "dragonlance_adventures", display_name: "Dragonlance Adventures" },
  ],
  records: [
    { id: "osric.class.magic_user", type: "class", display_name: "Magic-User", source_library_id: "osric", review_status: "verified" },
    { id: "dragolance.order.white_robes", type: "organization", display_name: "White Robes", source_library_id: "dragonlance_adventures", summary: "High Sorcery order" },
  ],
  rules_pages: [
    { id: "rules_page.how_to_play.combat", type: "rules_page", display_name: "Combat", source_library_id: "osric", section: "How To Play" },
  ],
};

test("type options include canonical records and rules pages", () => {
  assert.deepEqual(makeTypeOptions(catalog), ["class", "organization", "rules_page"]);
});

test("reference filtering supports source, type, and search", () => {
  const items = [...catalog.rules_pages, ...catalog.records];
  assert.equal(filterReferenceItems(items, { source: "osric" }).length, 2);
  assert.equal(filterReferenceItems(items, { type: "organization" })[0].id, "dragolance.order.white_robes");
  assert.equal(filterReferenceItems(items, { query: "white" })[0].id, "dragolance.order.white_robes");
});

test("display helpers render user-facing labels", () => {
  assert.equal(typeLabel("spell_slot_progression"), "Spell Slots");
  assert.equal(recordTitle(catalog.records[0]), "Magic-User");
  assert.equal(reviewStatus(catalog.records[0]), "verified");
  assert.equal(sourceLabel("dragonlance_adventures", catalog.sources), "Dragonlance Adventures");
});

test("canonical ID detection accepts stable IDs and rejects prose", () => {
  assert.equal(isCanonicalId("dragolance.progression.high_sorcery.white_robes"), true);
  assert.equal(isCanonicalId("White Robes"), false);
});
