import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const vault = readFileSync(new URL("../../components/character-vault.js", import.meta.url), "utf8");

test("player combat flow begins with surprise and explains weapon speed", () => {
  assert.match(app, /\["1\. Surprise"/);
  assert.match(app, /Lower numbers indicate a quicker weapon/);
  assert.doesNotMatch(app, /<h2>Combat Flow<\/h2>/);
});

test("player weapon summaries and character vault show speed factor", () => {
  assert.match(app, /Spd \{weapon\.speed\}/);
  assert.match(vault, /statRow\("SPEED", runtime\.weapon_speed/);
  assert.match(vault, /Speed Factor/);
});

test("live session status is filled green", () => {
  assert.match(styles, /\.live-pill\s*\{[^}]*background:\s*#2f6b3b/s);
  assert.match(styles, /border-color:\s*#75b97f/);
});

test("table refresh cannot overwrite an in-flight player color save", () => {
  assert.match(app, /if \(tableSaveCountRef\.current\) return/);
  assert.match(app, /const version = tableSaveVersionRef\.current;[\s\S]*if \(tableSaveCountRef\.current \|\| version !== tableSaveVersionRef\.current\) return/);
  assert.match(app, /playerColors: \{ \.\.\.tableState\.playerColors, \[tokenId\]: color \}/);
});

test("exploration restores marching order and player combat tools share rolls", () => {
  assert.match(app, /mode === "hex_crawl" \? DRAGO_OUTDOORS_GRID : DRAGO_MARCHING_GRID/);
  assert.match(app, /<h2>Marching Order<\/h2>/);
  assert.match(app, /className="drago-grid marching-grid"/);
  assert.match(app, /rollerName=\{currentCharacter\?\.name \|\| "Player"\}/);
  assert.match(app, /rollHistory: \[roll, \.\.\.\(tableState\.rollHistory \|\| \[\]\)\]/);
  assert.match(app, /rollerName="DM"/);
  assert.match(app, /<RollHistory history=\{history\} \/>/);
  assert.match(styles, /\.roll-history-entry/);
});

test("player character start and ability rolls use one authenticated identity", () => {
  assert.match(vault, /<div class="vault-kicker">Player Name<\/div>/);
  assert.doesNotMatch(vault, /Ownership is taken from your player login/);
  assert.match(vault, /pageKind\(\) === "new"[\s\S]*?\\? ""/);
  assert.match(vault, /data-unassign-roll="\$\{index\}"/);
  assert.match(vault, /document\.querySelectorAll\("\[name\^='assigned_rolls\.'\]"\)/);
  assert.match(vault, /state\.draft\.assigned_rolls\[ability\] = ""/);
  assert.match(vault, /Required for an unmodified STR 18 Fighter, Paladin, or Ranger/);
  assert.doesNotMatch(vault, /field\("Campaign Day", "campaign_day"[\s\S]{0,250}isPlayerCharacterMode/);
});

test("campaign invitations control player character assignment and rosters can delete", () => {
  assert.match(app, /Campaign Invitations/);
  assert.match(app, /campaign_ids/);
  assert.match(app, /Only campaigns your DM invited you to are available|another character is assigned/);
  assert.match(app, /Save Campaign/);
  assert.match(app, /Permanently delete \$\{player\.display_name \|\| player\.player_name\}/);
  assert.match(app, /api\(`\/1e\/players\/\$\{player\.id\}`,\s*\{ method: "DELETE" \}\)/);
  assert.match(app, /api\(`\/1e\/characters\/\$\{character\.id\}`,\s*\{ method: "DELETE" \}\)/);
  assert.match(vault, /Pending \/ No campaign/);
  assert.match(vault, /Only campaigns your DM invited you to are available/);
});

test("Dragonlance reference is limited to invited Dragonlance campaigns", () => {
  assert.match(app, /const hasDragonlanceCampaign = \(playerCampaigns \|\| \[\]\)\.some\(isDragonlanceCampaign\)/);
  assert.match(app, /\.\.\.\(hasDragonlanceCampaign \? \[\{ label: "Dragonlance"/);
  assert.match(app, /function PlayerDragonlanceRoute/);
  assert.match(app, /!\(campaigns \|\| \[\]\)\.some\(isDragonlanceCampaign\)/);
  assert.match(app, /<Route path="\/dragonlance\/\*" element=\{<PlayerDragonlanceRoute \/>/);
});
