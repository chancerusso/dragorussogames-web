import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const vault = readFileSync(new URL("../../components/character-vault.js", import.meta.url), "utf8");

test("player combat reference codifies surprise, tied weapon speed, and critical hits", () => {
  assert.match(app, /\["1\. Surprise"/);
  assert.match(app, /lower weapon Speed Factor strikes first/);
  assert.match(app, /Speed never grants extra attacks/);
  assert.match(app, /natural 20 always hits and doubles the attack’s total damage/);
  assert.match(app, /Round Procedure/);
  assert.match(app, /Combat Actions/);
  assert.match(app, /Damage is never held for this step/);
  assert.doesNotMatch(app, /\["8\. Damage and status"/);
  assert.doesNotMatch(app, /<h2>Combat Flow<\/h2>/);
});

test("player dice controls appear before the collapsed combat reference", () => {
  const sidebar = app.slice(app.indexOf('<aside className="panel player-table-rules">'));
  assert.ok(sidebar.indexOf("<DiceRollerPanel") < sidebar.indexOf("<PlayerCombatRules"));
  assert.match(styles, /\.combat-reference-group\s*>\s*summary/);
  assert.match(styles, /\.player-rule-step summary\s*\{[^}]*font-size:\s*0\.72rem/s);
});

test("combat action reference includes closing, charging, parrying, retreat, fleeing, and holding", () => {
  for (const action of ["Attack", "Close", "Charge", "Parry", "Fighting retreat", "Flee", "Hold initiative"]) {
    assert.ok(app.includes(`["${action}"`), `${action} should appear in the combat action reference`);
  }
  assert.match(app, /This is a delay, not an unlimited reaction or interruption/);
});

test("player combat card shows facing AC, concise attacks, styled status, and same-session sheet navigation", () => {
  assert.match(app, /AC Front \/ Flank \/ Rear/);
  assert.match(app, /characterAcFacingText\(character\)/);
  assert.match(app, /return `\$\{value \|\| "1"\} per round`/);
  assert.match(app, /titleCaseStatus\(character\.life_status \|\| character\.status\)/);
  assert.match(app, /className=\{`status-pill \$\{sessionLive && myToken \? "token-status-pill" : ""\}`\}/);
  assert.match(app, /style=\{sessionLive && myToken && selectedColor \? \{ "--token-color": selectedColor \}/);
  assert.match(app, /onClick=\{\(\) => openPlayerCharacterSheet\(character\.id, window\.location\.pathname \+ window\.location\.search\)\}>Open Sheet/);
  assert.match(app, /window\.open\("about:blank", "_blank"\)/);
  assert.match(app, /playerTab\.opener = null/);
  assert.match(styles, /\.player-character-actions \.table-button\s*\{[^}]*display:\s*flex[^}]*min-height:\s*34px/s);
  assert.match(styles, /\.token-status-pill\s*\{[^}]*background:\s*var\(--token-color\)/s);
});

test("player character sheet relies on the main player menu instead of duplicate hero navigation", () => {
  assert.match(vault, /const shellActions = sheetPage && playerCharacterPage \? ""/);
  assert.match(vault, /\$\{shellActions \? `<div class="vault-actions">\$\{shellActions\}<\/div>` : ""\}/);
  assert.match(vault, /data-quick-edit-open>Quick Edit/);
  assert.match(vault, />Full Edit<\/a>/);
  assert.match(vault, /data-level-up-open>Level Up/);
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

test("player and monster token drags start without calculating against the token button", () => {
  assert.match(app, /token=\{token\} onDragStart=\{\(\) => setDraggedToken\(token\)\}/);
  assert.match(app, /token=\{token\} monster onDragStart=\{\(\) => setDraggedToken\(token\)\}/);
  assert.match(app, /onDragStart=\{sessionLive && token\.id === tokenId \? \(\) => setDraggedToken\(token\) : undefined\}/);
  assert.doesNotMatch(app, /setDraggedToken\(token\);\s*move(?:Own)?Token\(token, event\)/);
  assert.match(app, /pendingTokenStateRef/);
  assert.match(app, /window\.setTimeout\(flushOwnTokenPosition, 120\)/);
  assert.match(app, /onPointerUp=\{\(\) => \{ flushOwnTokenPosition\(\); setDraggedToken\(null\); \}\}/);
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
