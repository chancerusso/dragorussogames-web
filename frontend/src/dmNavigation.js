export const DM_NAV_ITEMS = [
  { label: "Command Center", to: "/campaigns" },
  { label: "Drago Table", to: "/table", match: (path) => path === "/table" || path.endsWith("/table") },
  { label: "Campaigns", href: "/campaigns#active-campaigns" },
  { label: "Rules & Settings", to: "/rules" },
  { label: "Monsters", href: "/monsters", target: "_blank" },
  { label: "Players", to: "/players" },
  { label: "Characters", to: "/characters" },
  { label: "Archive", to: "/archive" },
  { label: "Settings", to: "/settings" },
];

export const CLASSIC_PORTAL_URL = "https://classic.dragorussogames.com/";
