import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { CLASSIC_PORTAL_URL, DM_NAV_ITEMS, playerPortalUrl } from "./dmNavigation.js";

test("DM sidebar contains Rules & Settings in the actual navigation model", () => {
  const labels = DM_NAV_ITEMS.map((item) => item.label);

  assert.deepEqual(labels, [
    "Home",
    "Table",
    "Campaigns",
    "Rules",
    "Monsters",
    "Players",
    "Characters",
    "Archive",
    "Settings",
  ]);
});

test("Drago Table has a sidebar entry and authenticated routes", () => {
  const item = DM_NAV_ITEMS.find((navItem) => navItem.label === "Table");
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

  assert.equal(item?.to, "/table");
  assert.equal(appSource.includes('<Route path="/table" element={<DragoTableIndexPage />} />'), true);
  assert.equal(appSource.includes('<Route path="/campaigns/:id/table" element={<DragoTablePage />} />'), true);
});

test("Rules & Settings routes inside the authenticated DM app", () => {
  const item = DM_NAV_ITEMS.find((navItem) => navItem.label === "Rules");

  assert.equal(item?.to, "/rules");
  assert.equal(item?.href, undefined);
});

test("Monsters opens the DM monster glossary in a separate window", () => {
  const item = DM_NAV_ITEMS.find((navItem) => navItem.label === "Monsters");
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

  assert.equal(item?.href, "/monsters");
  assert.equal(item?.target, "_blank");
  assert.equal(appSource.includes('<Route path="/monsters" element={<MonstersPage />} />'), true);
});

test("Classic portal link remains separate from the DM rules browser", () => {
  assert.equal(CLASSIC_PORTAL_URL, "https://classic.dragorussogames.com/");
  assert.equal(DM_NAV_ITEMS.some((item) => item.href === CLASSIC_PORTAL_URL), false);
});

test("local Drago Table links DM and player interfaces on one origin", () => {
  assert.equal(
    playerPortalUrl({ hostname: "127.0.0.1", origin: "http://127.0.0.1:8010" }),
    "http://127.0.0.1:8010/portal",
  );
  assert.equal(
    playerPortalUrl({ hostname: "table.dragorussogames.com", origin: "https://table.dragorussogames.com" }),
    "https://table.dragorussogames.com/portal",
  );
  assert.equal(
    playerPortalUrl({ hostname: "dm.dragorussogames.com", origin: "https://dm.dragorussogames.com" }),
    CLASSIC_PORTAL_URL,
  );
});

test("Drago Table uses the real logo and keeps ordinary player navigation in one tab", () => {
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  assert.match(appSource, /LogoDrago_Mesa_de_trabajo_1\.png/);
  assert.doesNotMatch(appSource, /className="brand-mark">DRG/);
  assert.doesNotMatch(appSource, /\{ label: "Create Character", href: "\/1e\/characters\/new\/", target: "_blank" \}/);
  assert.doesNotMatch(appSource, /\{ label: "Player's Guide", href: "\/1e\/", target: "_blank" \}/);
});

test("local DM character view and edit routes load the character vault", () => {
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  assert.equal(appSource.includes('<Route path="/1e/characters/:id" element={<PlayerVaultToolPage />} />'), true);
  assert.equal(appSource.includes('<Route path="/1e/characters/:id/edit" element={<PlayerVaultToolPage />} />'), true);
});

test("local Player mapper uses and registers the portal map route", () => {
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  assert.match(appSource, /function playerMapPath\(campaignId, mapId\)/);
  assert.equal(appSource.includes('<Route path="/portal/campaigns/:id/maps/:mapId" element={<PlayerMapPage />} />'), true);
  assert.match(appSource, /to=\{playerMapPath\(campaign\.id, activeMap\.id\)\}/);
});

test("remote Drago Table uses the unified player portal without a DM return link", () => {
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  assert.match(appSource, /"table\.dragorussogames\.com"/);
  assert.match(appSource, /isClassicHost\(\) \|\| isLocalDragoHost\(\)/);
});

test("expired API sessions immediately update the authenticated route state", () => {
  const apiSource = readFileSync(new URL("./api.js", import.meta.url), "utf8");
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

  assert.match(apiSource, /AUTH_CHANGED_EVENT/);
  assert.match(apiSource, /notifyAuthChanged\("admin"\)/);
  assert.match(apiSource, /notifyAuthChanged\("player"\)/);
  assert.match(appSource, /window\.addEventListener\(AUTH_CHANGED_EVENT, refreshAuthentication\)/);
  assert.match(appSource, /window\.removeEventListener\(AUTH_CHANGED_EVENT, refreshAuthentication\)/);
});

test("local authentication never survives a fresh Drago Table startup", () => {
  const apiSource = readFileSync(new URL("./api.js", import.meta.url), "utf8");
  const vaultSource = readFileSync(new URL("../../components/character-vault.js", import.meta.url), "utf8");
  const launcherSource = readFileSync(new URL("../../scripts/drago-table", import.meta.url), "utf8");

  assert.match(apiSource, /sessionStorage\.getItem\(TOKEN_KEY\)/);
  assert.match(apiSource, /sessionStorage\.getItem\(PLAYER_TOKEN_KEY\)/);
  assert.match(apiSource, /localStorage\.removeItem\(TOKEN_KEY\)/);
  assert.match(apiSource, /localStorage\.removeItem\(PLAYER_TOKEN_KEY\)/);
  assert.match(vaultSource, /sessionStorage\.getItem\(PLAYER_TOKEN_KEY\)/);
  assert.doesNotMatch(vaultSource, /const token = localStorage\.getItem\(PLAYER_TOKEN_KEY\)/);
  assert.match(launcherSource, /"SECRET_KEY": secrets\.token_urlsafe\(48\)/);
});

test("Finder startup discovers Homebrew PostgreSQL outside the GUI PATH", () => {
  const launcherSource = readFileSync(new URL("../../scripts/drago-table", import.meta.url), "utf8");

  assert.match(launcherSource, /Path\("\/opt\/homebrew\/bin"\)/);
  assert.match(launcherSource, /Path\("\/usr\/local\/bin"\)/);
  assert.match(launcherSource, /glob\(f"postgresql@\*\/bin\/\{name\}"\)/);
  assert.match(launcherSource, /os\.environ\["LC_ALL"\] = "C"/);
  assert.match(launcherSource, /os\.environ\["LANG"\] = "C"/);
  assert.match(launcherSource, /configure_process_environment\(\)\n    parser =/);
});

test("Create Character remains in player-owned navigation", () => {
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  const vaultSource = readFileSync(new URL("../../components/character-vault.js", import.meta.url), "utf8");
  const backendSource = readFileSync(new URL("../../backend/app/main.py", import.meta.url), "utf8");

  assert.match(appSource, /\{ label: "Create Character", to: classic \? "\/characters\/new" : "\/portal\/characters\/new" \}/);
  assert.match(appSource, /function playerCharacterChooserPath\(\)/);
  assert.match(appSource, /to=\{playerCharacterChooserPath\(\)\}/);
  assert.match(appSource, /<a className="secondary-button" href=\{playerCharacterBuilderPath\(campaign\.id\)\}>Create Character<\/a>/);
  assert.doesNotMatch(appSource, /<Link className="secondary-button" to=\{playerCharacterBuilderPath\(campaign\.id\)\}>Create Character<\/Link>/);
  assert.match(appSource, /href=\{playerCharacterSheetPath\(character\.id\)\}>View/);
  assert.match(appSource, /href=\{playerCharacterSheetPath\(character\.id, \{ edit: true \}\)\}>Edit/);
  assert.match(vaultSource, /Boolean\(sessionStorage\.getItem\(PLAYER_TOKEN_KEY\)\)/);
  assert.match(vaultSource, /const playerRoot = isClassicHost\(\) \? "" : "\/portal"/);
  assert.match(backendSource, /login_redirect\(request, player=True\)/);
  assert.match(backendSource, /login_path = "\/portal\/login" if player and not classic_player_host else "\/login"/);
});

test("administrative character ownership selectors disambiguate duplicate player names", () => {
  const vaultSource = readFileSync(new URL("../../components/character-vault.js", import.meta.url), "utf8");

  assert.match(vaultSource, /function playerSelectOptions\(\)/);
  assert.match(vaultSource, /@\$\{player\.username \|\| "no-username"\} · ID \$\{player\.id\}/);
  assert.match(vaultSource, /selectField\("Owner \/ Player"[\s\S]*playerSelectOptions\(\)\)/);
  assert.match(vaultSource, /selectField\("Current Player"[\s\S]*playerSelectOptions\(\)\)/);
  assert.match(vaultSource, /selectField\("Player", "dm_filter_player"[\s\S]*playerSelectOptions\(\)\)/);
});

test("Rules route is wrapped in an error boundary inside the DM shell", () => {
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  assert.match(appSource, /class RulesBrowserBoundary extends Component/);
  assert.equal(appSource.includes('<Route path="/rules" element={<RulesBrowserBoundary><RulesSettingsPage /></RulesBrowserBoundary>} />'), true);
});

test("Classic character sheet assets are versioned for cache busting", () => {
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

  assert.match(appSource, /const CLASSIC_STATIC_VERSION = "2026-07-29-character-features-v23"/);
  assert.match(appSource, /versionedClassicAsset\("\/styles\/character-vault\.css"\)/);
  assert.match(appSource, /versionedClassicAsset\("\/components\/character-vault\.js"\)/);
  assert.match(appSource, /link\[data-classic-stylesheet="\$\{id\}"\]/);
});
