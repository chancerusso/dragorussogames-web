import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { CLASSIC_PORTAL_URL, DM_NAV_ITEMS } from "./dmNavigation.js";

test("DM sidebar contains Rules & Settings in the actual navigation model", () => {
  const labels = DM_NAV_ITEMS.map((item) => item.label);

  assert.deepEqual(labels, [
    "Command Center",
    "Campaigns",
    "Rules & Settings",
    "Players",
    "Characters",
    "Archive",
    "Settings",
  ]);
});

test("Rules & Settings routes inside the authenticated DM app", () => {
  const item = DM_NAV_ITEMS.find((navItem) => navItem.label === "Rules & Settings");

  assert.equal(item?.to, "/rules");
  assert.equal(item?.href, undefined);
});

test("Classic portal link remains separate from the DM rules browser", () => {
  assert.equal(CLASSIC_PORTAL_URL, "https://classic.dragorussogames.com/");
  assert.equal(DM_NAV_ITEMS.some((item) => item.href === CLASSIC_PORTAL_URL), false);
});

test("Rules route is wrapped in an error boundary inside the DM shell", () => {
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  assert.match(appSource, /class RulesBrowserBoundary extends Component/);
  assert.equal(appSource.includes('<Route path="/rules" element={<RulesBrowserBoundary><RulesSettingsPage /></RulesBrowserBoundary>} />'), true);
});

test("Classic character sheet assets are versioned for cache busting", () => {
  const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

  assert.match(appSource, /const CLASSIC_STATIC_VERSION = "2026-07-13-facing-ac-v8"/);
  assert.match(appSource, /versionedClassicAsset\("\/styles\/character-vault\.css"\)/);
  assert.match(appSource, /versionedClassicAsset\("\/components\/character-vault\.js"\)/);
  assert.match(appSource, /link\[data-classic-stylesheet="\$\{id\}"\]/);
});
