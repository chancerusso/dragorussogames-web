import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appSource = fs.readFileSync(path.join(currentDir, "App.jsx"), "utf8");
const magicRules = fs.readFileSync(path.resolve(currentDir, "../../content/1e/how-to-play/magic.md"), "utf8");
const workspaceTabs = appSource.slice(appSource.indexOf("const WORKSPACE_TABS"), appSource.indexOf("function CampaignTabs"));

test("DM campaign workspace replaces placeholders with saved working tools", () => {
  assert.equal(workspaceTabs.includes('["journal", "Journal"]'), false);
  assert.equal(workspaceTabs.includes('["treasure", "Treasure"]'), false);
  assert.equal(appSource.includes("<CampaignSessionsTab"), true);
  assert.equal(appSource.includes("<CampaignNpcsTab"), true);
  assert.equal(appSource.includes("<CampaignHandoutsTab"), true);
  assert.equal(appSource.includes("Show To Players"), true);
  assert.equal(appSource.includes("Delete Campaign Permanently"), true);
});

test("player handouts load only through player-authorized endpoints", () => {
  assert.equal(appSource.includes("<PlayerHandoutsTab"), true);
  assert.equal(appSource.includes("Shared By Your DM"), true);
  assert.equal(appSource.includes('openAuthorizedFile(`/player/campaigns/${campaign.id}/handouts/${handout.id}/file`, "player")'), true);
});

test("combat controls restore marching order and support bounded rounds", () => {
  assert.equal(appSource.includes('["mapping", "Marching Order"]'), true);
  assert.equal(appSource.includes("onStartCombat={startCombat}"), true);
  assert.equal(appSource.includes('await changeTableMode("mapping")'), true);
  assert.equal(appSource.includes("Math.max(1, current.round - 1)"), true);
  assert.equal(appSource.includes("const slotX = (relativeX % cellWidth)"), true);
  assert.equal(appSource.includes("const standardMonster = monster && footprint.columns === 1"), true);
});

test("Classic Tracker can reset only the exploration turn count", () => {
  assert.match(appSource, /onClick=\{\(\) => onUpdate\(\{ turn: 0 \}\)\}>Reset Turns/);
});

test("Drago magic rules distinguish starting spell access from daily slots", () => {
  assert.match(magicRules, /Starting Spells, Access, And Slots/);
  assert.match(magicRules, /Magic User \| Four written spells: Read Magic, one chosen by the player, and two different spells determined randomly \| 1/);
  assert.match(magicRules, /Illusionist \| Four written spells: two chosen by the player and two different spells determined randomly \| 1/);
  assert.match(magicRules, /Cleric \| The complete 1st-level Cleric list[\s\S]*\| 1/);
  assert.match(magicRules, /Druid \| The complete 1st-level Druid list[\s\S]*\| 2/);
  assert.match(magicRules, /Clerics and druids add any 1st-level bonus slots granted by high Wisdom/);
});
