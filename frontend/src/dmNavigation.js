export const DM_NAV_ITEMS = [
  { label: "Home", to: "/campaigns" },
  { label: "Table", to: "/table", match: (path) => path === "/table" || path.endsWith("/table") },
  { label: "Campaigns", href: "/campaigns#active-campaigns" },
  { label: "Rules", to: "/rules" },
  { label: "Monsters", href: "/monsters", target: "_blank" },
  { label: "Players", to: "/players" },
  { label: "Characters", to: "/characters" },
  { label: "Archive", to: "/archive" },
  { label: "Settings", to: "/settings" },
];

export const CLASSIC_PORTAL_URL = "https://classic.dragorussogames.com/";

export function playerPortalUrl(location = window.location) {
  if (["127.0.0.1", "localhost"].includes(location.hostname)) {
    return `${location.origin}/portal`;
  }
  return CLASSIC_PORTAL_URL;
}
