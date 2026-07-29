import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appSource = fs.readFileSync(path.join(currentDir, "App.jsx"), "utf8");
const apiSource = fs.readFileSync(path.join(currentDir, "api.js"), "utf8");
const vaultSource = fs.readFileSync(path.join(currentDir, "../../components/character-vault.js"), "utf8");

test("DM creates a username invitation and player chooses the first password", () => {
  assert.equal(appSource.includes("Player Invitation Ready"), true);
  assert.equal(appSource.includes("Create Your Password"), true);
  assert.equal(appSource.includes("Create Password & Continue"), true);
  assert.equal(appSource.includes('<Route path="/portal/claim" element={<PlayerClaimInvitePage />} />'), true);
  assert.equal(appSource.includes('<Route path="/claim" element={<PlayerClaimInvitePage />} />'), true);
  assert.equal(apiSource.includes("playerClaimInvite"), true);
  assert.equal(apiSource.includes('api("/player/invite/claim"'), true);
  assert.equal(appSource.includes("Invitation copied to your clipboard."), true);
  assert.equal(appSource.includes('modal.copied ? "Copied!" : "Copy Invitation"'), true);
  assert.equal(appSource.includes("You do not need to start the campaign table session."), true);
});

test("player table is visibly and functionally locked outside live sessions", () => {
  assert.equal(appSource.includes("The DM has not started the session yet. You can view the saved table, but movement and HP controls are locked."), true);
  assert.equal(appSource.includes("if (!sessionLive) return;"), true);
  assert.equal(appSource.includes("disabled={!sessionLive || token.id !== tokenId}"), true);
});

test("player character builder preserves unfinished work on the device", () => {
  assert.match(vaultSource, /function localDraftStorageKey\(\)/);
  assert.match(vaultSource, /function persistLocalDraft\(\)/);
  assert.match(vaultSource, /drago_table_player_draft:/);
  assert.doesNotMatch(vaultSource, /Your unfinished character is saved on this device/);
  assert.match(vaultSource, /localStorage\.removeItem\(draftStorageKeyBeforeSave\)/);
});

test("class selection leads with multi-class choice and compact class grid", () => {
  assert.match(vaultSource, /<h2>Class Selection<\/h2>/);
  assert.match(vaultSource, /Single Class or Multi-Class/);
  assert.equal(vaultSource.includes('label: `Multi-class: ${classes.join(" / ")}`'), true);
  assert.match(vaultSource, /vault-choice-grid vault-class-choice-grid/);
  assert.doesNotMatch(vaultSource.match(/if \(state\.step === 3\)[\s\S]*?if \(state\.step === 4\)/)?.[0] || "", /sourcebookNoticeHtml/);
});

test("local player character sheets stay inside matched player routes", () => {
  assert.equal(appSource.includes('function playerCharacterSheetPath(id, { edit = false } = {})'), true);
  assert.equal(appSource.includes('<Route path="/portal/characters/:id" element={<PlayerVaultToolPage />} />'), true);
  assert.equal(appSource.includes('<Route path="/portal/characters/:id/edit" element={<PlayerVaultToolPage />} />'), true);
  assert.equal(appSource.includes("function openPlayerCharacterSheet(id, returnTo = \"\")"), true);
  assert.equal(appSource.includes("sheetTab.sessionStorage.setItem(\"drg_player_token\", playerToken)"), true);
  assert.equal(appSource.includes("sheetTab.location.replace(path)"), true);
  assert.equal(vaultSource.includes('location.pathname.startsWith("/portal/characters")'), true);
});
