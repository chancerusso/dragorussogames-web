import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const appSource = readFileSync(resolve(repoRoot, "frontend", "src", "App.jsx"), "utf8");
const portalCss = readFileSync(resolve(repoRoot, "frontend", "src", "styles.css"), "utf8");
const rulesSource = readFileSync(resolve(repoRoot, "components", "first-edition-app.js"), "utf8");
const rulesCss = readFileSync(resolve(repoRoot, "styles", "first-edition.css"), "utf8");
const vaultCss = readFileSync(resolve(repoRoot, "styles", "character-vault.css"), "utf8");

test("player portal offers shared system, light, and dark appearance choices", () => {
  assert.match(appSource, /const PLAYER_THEME_KEY = "drago_player_theme"/);
  assert.match(appSource, /Use Device Setting/);
  assert.match(appSource, /<option value="light">Light<\/option>/);
  assert.match(appSource, /<option value="dark">Dark<\/option>/);
  assert.match(appSource, /matchMedia\("\(prefers-color-scheme: dark\)"\)/);
  assert.match(appSource, /document\.documentElement\.dataset\.playerTheme = resolved/);
  assert.match(appSource, /window\.localStorage\.setItem\(PLAYER_THEME_KEY, themePreference\)/);
});

test("First Edition pages use the same preference and react to device changes", () => {
  assert.match(rulesSource, /const PLAYER_THEME_KEY = "drago_player_theme"/);
  assert.match(rulesSource, /function applyPlayerTheme/);
  assert.match(rulesSource, /function renderThemeControl/);
  assert.match(rulesSource, /Use Device Setting/);
  assert.match(rulesSource, /addEventListener\?\.\("change"/);
  assert.match(rulesSource, /dataset\.playerTheme = resolved/);
});

test("light portal and dark parchment surfaces have explicit theme treatments", () => {
  assert.match(portalCss, /html\[data-player-theme="light"\]/);
  assert.match(portalCss, /\.player-theme-control/);
  assert.match(rulesCss, /html\[data-player-theme="light"\] \.one-e-header/);
  assert.match(rulesCss, /html\[data-player-theme="dark"\] \.one-e-markdown/);
  assert.match(vaultCss, /html\[data-player-theme="dark"\]/);
  assert.match(vaultCss, /--vault-ivory:#1d1918/);
  assert.match(vaultCss, /\.vault-sheet-card/);
});
