import test from "node:test";
import assert from "node:assert/strict";

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
