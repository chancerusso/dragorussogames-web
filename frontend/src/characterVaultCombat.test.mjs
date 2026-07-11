import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const vaultSource = readFileSync(resolve(repoRoot, "components", "character-vault.js"), "utf8");
const vaultCss = readFileSync(resolve(repoRoot, "styles", "character-vault.css"), "utf8");

test("character sheet renders combat summary from runtime payload", () => {
  assert.match(vaultSource, /function combatSummaryHtml/);
  assert.match(vaultSource, /c\.combat\?\.runtime/);
  assert.match(vaultSource, /attack_progression_ref/);
  assert.match(vaultSource, /Attacks\/Round/);
});

test("ability, armor class, saves, and encumbrance render backend breakdown payloads", () => {
  assert.match(vaultSource, /ability_breakdown/);
  assert.match(vaultSource, /armor_class_breakdown/);
  assert.match(vaultSource, /saves\.breakdown/);
  assert.match(vaultSource, /enc\.weight_movement/);
  assert.doesNotMatch(vaultSource, /function equippedArmor/);
  assert.doesNotMatch(vaultSource, /const armorAdjustment =/);
  assert.doesNotMatch(vaultSource, /const shieldAdjustment =/);
});

test("weapon cards expose runtime breakdown and illegal equipment state", () => {
  assert.match(vaultSource, /function weaponCardHtml/);
  assert.match(vaultSource, /calculations_disabled/);
  assert.match(vaultSource, /Illegal Equipment/);
  assert.match(vaultSource, /function modifierBreakdownHtml/);
  assert.match(vaultSource, /function damageBreakdownHtml/);
});

test("builder weapon preview requests backend combat runtime", () => {
  assert.match(vaultSource, /data-preview-equipment/);
  assert.match(vaultSource, /combat-preview/);
  assert.match(vaultSource, /builderWeaponPreviewHtml/);
});

test("spell slot table renders backend remaining values without fallback arithmetic", () => {
  assert.match(vaultSource, /const remainingValue = remaining\[level\]/);
  assert.doesNotMatch(vaultSource, /Math\.max\(0, Number\(count\) - usedCount\)/);
});

test("combat presentation has responsive readable styles", () => {
  assert.match(vaultCss, /\.vault-combat-summary/);
  assert.match(vaultCss, /\.vault-weapon-card/);
  assert.match(vaultCss, /\.vault-breakdown-list/);
  assert.match(vaultCss, /\.vault-ability-mods/);
  assert.match(vaultCss, /\.vault-saving-row summary/);
  assert.match(vaultCss, /@media \(max-width: 820px\)/);
});
