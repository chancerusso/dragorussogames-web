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
    playerPortalUrl({ hostname: "dm.dragorussogames.com", origin: "https://dm.dragorussogames.com" }),
    CLASSIC_PORTAL_URL,
  );
});

test("Rules route is wrapped in an error boundary inside the DM shell", () => {
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  assert.match(appSource, /class RulesBrowserBoundary extends Component/);
  assert.equal(appSource.includes('<Route path="/rules" element={<RulesBrowserBoundary><RulesSettingsPage /></RulesBrowserBoundary>} />'), true);
});

test("Classic character sheet assets are versioned for cache busting", () => {
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

  assert.match(appSource, /const CLASSIC_STATIC_VERSION = "2026-07-13-facing-ac-v20"/);
  assert.match(appSource, /versionedClassicAsset\("\/styles\/character-vault\.css"\)/);
  assert.match(appSource, /versionedClassicAsset\("\/components\/character-vault\.js"\)/);
  assert.match(appSource, /link\[data-classic-stylesheet="\$\{id\}"\]/);
});
