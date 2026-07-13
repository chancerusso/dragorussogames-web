import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const referenceSource = readFileSync(new URL("./dragonlanceReference.js", import.meta.url), "utf8");
const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
const repoRoot = resolve(new URL("../../", import.meta.url).pathname);
const raceRoot = resolve(repoRoot, "content/options/dragolance/races");
const deityRoot = resolve(repoRoot, "content/options/dragolance/deities");
const progressionRoot = resolve(repoRoot, "content/options/dragolance/progressions");
const spellSlotRoot = resolve(repoRoot, "content/options/dragolance/spell_slots");
const languageRoot = resolve(repoRoot, "content/options/dragolance/languages");
const availabilityRoot = resolve(repoRoot, "content/options/dragolance/availability");

test("Dragolance player reference exposes only the phase 4 top-level sections", () => {
  for (const label of ["What is Dragolance?", "The World of Krynn", "Races of Krynn", "Classes", "Gods"]) {
    assert.match(referenceSource, new RegExp(`label: "${label.replace(/[?]/g, "\\?")}"`));
  }

  for (const forbidden of ["Items", "Equipment", "Monsters", "Adventures", "DM Material"]) {
    assert.equal(referenceSource.includes(`label: "${forbidden}"`), false);
  }
});

test("Dragonlance reference is routed as a nested player rulebook", () => {
  assert.match(appSource, /path="\/dragonlance\/\*"/);
  assert.match(appSource, /path="\/portal\/dragonlance\/\*"/);
  assert.match(appSource, /function DragonlanceBreadcrumb/);
  assert.match(appSource, /function DragonlanceReaderNav/);
});

test("player portal separates OSRIC core rules from Dragonlance campaign setting", () => {
  assert.match(appSource, /OSRIC Reference/);
  assert.match(appSource, /Dragolance Reference/);
  assert.match(appSource, /Dragolance is our campaign branch for the shared OSRIC rules engine/);
  assert.match(appSource, /Dragonlance Adventures as the canonical foundation/);
});

test("Races of Krynn navigation matches the approved Unit 2A hierarchy", () => {
  for (const route of [
    "races/overview",
    "races/kender",
    "races/gnomes",
    "races/elves",
    "races/elves/overview",
    "races/elves/silvanesti",
    "races/elves/qualinesti",
    "races/elves/kagonesti",
    "races/elves/dargonesti",
    "races/elves/dimernesti",
    "races/elves/dark-elves",
    "races/elves/half-elves",
    "races/dwarves",
    "races/dwarves/overview",
    "races/dwarves/hill",
    "races/dwarves/mountain",
    "races/dwarves/gully",
    "races/irda",
    "races/minotaurs",
  ]) {
    assert.match(referenceSource, new RegExp(`path: "${route}"`));
  }

  for (const forbidden of ["races/dwarves/neidar", "races/dwarves/hylar", "races/dwarves/daewar", "races/dwarves/klar", "races/dwarves/theiwar", "races/dwarves/daergar", "races/dwarves/aghar"]) {
    assert.equal(referenceSource.includes(`path: "${forbidden}"`), false);
  }

  assert.equal(referenceSource.includes('label: "Human"'), false);
  assert.match(referenceSource, /OSRIC Human/);
});

test("Races of Krynn pages render from canonical records or presentation-only pages", () => {
  for (const route of [
    "races/kender",
    "races/gnomes",
    "races/elves/silvanesti",
    "races/elves/qualinesti",
    "races/elves/kagonesti",
    "races/elves/dargonesti",
    "races/elves/dimernesti",
    "races/elves/half-elves",
    "races/dwarves/hill",
    "races/dwarves/mountain",
    "races/dwarves/gully",
    "races/irda",
    "races/minotaurs",
  ]) {
    assert.match(referenceSource, new RegExp(`"${route}": [A-Za-z]`));
  }

  assert.match(referenceSource, /"races\/elves\/dark-elves"/);
  assert.match(referenceSource, /Presentation-only social\/exile status page/);
  assert.match(appSource, /function DragonlanceRaceOverview/);
  assert.match(appSource, /function DragonlancePresentationOnlyRacePage/);
  assert.match(appSource, /function RulesRelationships/);
});

test("Classes navigation exposes Solamnic, High Sorcery, and Tinker hierarchies", () => {
  for (const route of [
    "classes/overview",
    "classes/knights-of-solamnia/organization",
    "classes/knights-of-solamnia/oath-and-measure",
    "classes/knights-of-solamnia/crown",
    "classes/knights-of-solamnia/sword",
    "classes/knights-of-solamnia/rose",
    "classes/knights-of-solamnia/battle",
    "classes/knights-of-solamnia/council",
    "classes/wizards-of-high-sorcery/moons",
    "classes/wizards-of-high-sorcery/conclave",
    "classes/wizards-of-high-sorcery/towers",
    "classes/wizards-of-high-sorcery/early-life",
    "classes/wizards-of-high-sorcery/test",
    "classes/wizards-of-high-sorcery/white-robes",
    "classes/wizards-of-high-sorcery/red-robes",
    "classes/wizards-of-high-sorcery/black-robes",
    "classes/wizards-of-high-sorcery/renegades",
    "classes/wizards-of-high-sorcery/magic-on-krynn",
    "classes/tinkers/class",
    "classes/tinkers/device-creation",
    "classes/tinkers/device-operation",
  ]) {
    assert.match(referenceSource, new RegExp(`path: "${route}"`));
  }
});

test("Gods navigation exposes Holy Orders and all deity pages", () => {
  for (const route of [
    "gods/overview",
    "gods/holy-orders",
    "gods/clerics-good",
    "gods/clerics-neutrality",
    "gods/clerics-evil",
    "gods/good/paladine",
    "gods/good/majere",
    "gods/good/kiri-jolith",
    "gods/good/mishakal",
    "gods/good/habbakuk",
    "gods/good/branchala",
    "gods/good/solinari",
    "gods/neutrality/gilean",
    "gods/neutrality/sirrion",
    "gods/neutrality/reorx",
    "gods/neutrality/chislev",
    "gods/neutrality/zivilyn",
    "gods/neutrality/shinare",
    "gods/neutrality/lunitari",
    "gods/evil/takhisis",
    "gods/evil/sargonnas",
    "gods/evil/morgion",
    "gods/evil/chemosh",
    "gods/evil/zeboim",
    "gods/evil/hiddukel",
    "gods/evil/nuitari",
  ]) {
    assert.match(referenceSource, new RegExp(`path: "${route}"`));
  }
});

test("canonical Dragonlance race records have unique IDs and resolvable references", () => {
  const files = readdirSync(raceRoot).filter((file) => file.endsWith(".json"));
  const records = files.map((file) => JSON.parse(readFileSync(resolve(raceRoot, file), "utf8")));
  const ids = new Set();

  for (const record of records) {
    assert.equal(ids.has(record.id), false, `duplicate race id ${record.id}`);
    ids.add(record.id);
    assert.ok(record.source_ref?.page, `${record.id} has a source page`);
    assert.ok(record.review?.status, `${record.id} has a review status`);

    for (const language of record.languages || []) {
      if (!language.startsWith("dragolance.language.")) continue;
      const slug = language.replace("dragolance.language.", "");
      assert.equal(existsSync(resolve(languageRoot, `${slug}.json`)), true, `${record.id} language ${language} resolves`);
    }

    const raceSlug = record.id.replace("dragolance.race.", "race_");
    assert.equal(existsSync(resolve(availabilityRoot, `${raceSlug}.json`)), true, `${record.id} availability resolves`);
  }
});

test("canonical class, spell-slot, moon, and deity records resolve for player reference", () => {
  for (const file of ["crown.json", "sword.json", "rose.json", "student.json", "white_robes.json", "red_robes.json", "black_robes.json", "good.json", "neutral.json", "evil.json"]) {
    assert.equal(existsSync(resolve(progressionRoot, file)), true, `${file} progression exists`);
  }

  for (const file of ["sword_knight.json", "white_robes.json", "red_robes.json", "black_robes.json", "good.json", "neutral.json", "evil.json"]) {
    assert.equal(existsSync(resolve(spellSlotRoot, file)), true, `${file} spell slots exist`);
  }

  const deityFiles = readdirSync(deityRoot).filter((file) => file.endsWith(".json"));
  assert.equal(deityFiles.length, 21);
  const ids = new Set();
  for (const file of deityFiles) {
    const record = JSON.parse(readFileSync(resolve(deityRoot, file), "utf8"));
    assert.equal(ids.has(record.id), false, `duplicate deity id ${record.id}`);
    ids.add(record.id);
    assert.ok(record.source_ref?.page, `${record.id} has source reference`);
    assert.ok(record.review?.status, `${record.id} has review status`);
  }
});

test("source badges and related topics render through reusable components", () => {
  assert.match(referenceSource, /export const sourceBadges/);
  assert.match(referenceSource, /export const relatedTopics/);
  assert.match(appSource, /function SourceBadge/);
  assert.match(appSource, /function RelatedTopics/);
});

test("incomplete race mechanics retain visible review flags", () => {
  const minotaur = JSON.parse(readFileSync(resolve(raceRoot, "minotaur.json"), "utf8"));
  const irda = JSON.parse(readFileSync(resolve(raceRoot, "irda.json"), "utf8"));
  const dargonesti = JSON.parse(readFileSync(resolve(raceRoot, "dargonesti_elf.json"), "utf8"));
  assert.equal(minotaur.review.status, "needs_review");
  assert.deepEqual(minotaur.needs_review_fields, ["size_rules_confirmation"]);
  assert.equal(irda.review.status, "verified");
  assert.equal(dargonesti.review.status, "verified");
});

test("OSRIC reference shell exposes a persistent player portal return", () => {
  const shellSource = readFileSync(resolve(repoRoot, "components/first-edition-app.js"), "utf8");
  assert.match(shellSource, /Return to Player Portal/);
  assert.match(shellSource, /one-e-portal-return/);
});

test("OSRIC reference shell does not crash when loaded by React character routes", () => {
  const shellSource = readFileSync(resolve(repoRoot, "components/first-edition-app.js"), "utf8");
  assert.match(shellSource, /const nav = document\.querySelector\("\[data-rules-nav\]"\);\n  if \(!nav\) return;/);
  assert.match(shellSource, /const sidebar = document\.querySelector\("\[data-section-nav\]"\);\n  if \(!sidebar\) return;/);
  assert.match(shellSource, /const article = document\.querySelector\("\[data-markdown\]"\);\n  if \(!article\) return;/);
});
