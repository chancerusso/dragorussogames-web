const VAULT_API_BASE =
  window.DRG1E_VAULT_API_BASE ||
  "/api";
const API = `${VAULT_API_BASE}/1e`;
const abilities = ["strength", "intelligence", "wisdom", "dexterity", "constitution", "charisma"];
const abilityLabels = { strength: "STR", intelligence: "INT", wisdom: "WIS", dexterity: "DEX", constitution: "CON", charisma: "CHA" };
const coins = ["platinum", "gold", "electrum", "silver", "copper"];
const DRAGONLANCE_RACE_PATH = "/content/settings/dragonlance/races/";
const DRAGONLANCE_CLASS_PATH = "/content/settings/dragonlance/classes/";
const OSRIC_MAGIC_ITEM_CATALOG_PATH = "/content/osric/core/magic_items/index.json";
const ADVENTURE_MAGIC_ITEM_CATALOG_PATHS = [
  "/content/adventures/n1_against_the_cult_of_the_reptile_god/magic_items.json",
];
const DRAGONLANCE_HIDDEN_CLASS_NAMES = new Set([
  "Barbarian",
  "Cavalier",
  "Paladin",
]);
const PLAYER_TOKEN_KEY = "drg_player_token";
const fallbackDragonlanceRaces = [
  {
    name: "Human",
    description: "The dominant free peoples of Ansalon, with the broadest class and culture options.",
    ability_adjustments: {},
    allowed_classes: ["Fighter", "Cleric", "Magic-User", "Thief", "Ranger", "Paladin", "Druid", "Assassin", "Monk", "Bard"],
    allowed_alignments: ["Any"],
    languages: ["Common", "Regional language - TODO/VERIFY"],
    special_abilities: ["No racial maximums or level limits under DRG house rules"],
    movement: "12\" / 120 ft",
    enabled_by_default: true,
    advanced: false,
  },
  {
    name: "Kender",
    description: "Fearless, curious wanderers whose courage and handling habits require careful table agreement.",
    ability_adjustments: { dexterity: 1, strength: -1 },
    allowed_classes: ["Fighter", "Thief", "Ranger - TODO/VERIFY", "Cleric - TODO/VERIFY"],
    allowed_alignments: ["Any non-evil - TODO/VERIFY"],
    languages: ["Common", "Kenderspeak - TODO/VERIFY"],
    special_abilities: ["Fear resistance - TODO/VERIFY", "Taunt - TODO/VERIFY", "Handling/pockets - TODO/VERIFY"],
    movement: "9\" / 90 ft - TODO/VERIFY",
    enabled_by_default: true,
    advanced: false,
  },
  {
    name: "Hill Dwarf",
    description: "Practical dwarves of clan and craft, sturdy in battle and grounded in old traditions.",
    ability_adjustments: { constitution: 1, charisma: -1 },
    allowed_classes: ["Fighter", "Cleric", "Thief - TODO/VERIFY"],
    allowed_alignments: ["Any lawful - TODO/VERIFY", "Neutral - TODO/VERIFY"],
    languages: ["Common", "Dwarvish", "Hill dwarf clan tongue - TODO/VERIFY"],
    special_abilities: ["Infravision - TODO/VERIFY", "Stonework detection - TODO/VERIFY", "Poison/magic save bonuses - TODO/VERIFY"],
    movement: "9\" / 90 ft",
    enabled_by_default: true,
    advanced: false,
  },
  {
    name: "Mountain Dwarf",
    description: "Deep-clan dwarves of strongholds and stone halls, hardier and more insular than their hill kin.",
    ability_adjustments: { constitution: 1, charisma: -1 },
    allowed_classes: ["Fighter", "Cleric", "Thief - TODO/VERIFY"],
    allowed_alignments: ["Any lawful - TODO/VERIFY", "Neutral - TODO/VERIFY"],
    languages: ["Common", "Dwarvish", "Mountain dwarf clan tongue - TODO/VERIFY"],
    special_abilities: ["Infravision - TODO/VERIFY", "Stonework detection - TODO/VERIFY", "Poison/magic save bonuses - TODO/VERIFY"],
    movement: "9\" / 90 ft",
    enabled_by_default: true,
    advanced: false,
  },
  {
    name: "Qualinesti Elf",
    description: "Woodland elves with a proud national tradition, suited to warriors, scouts, and arcane paths.",
    ability_adjustments: { dexterity: 1, constitution: -1 },
    allowed_classes: ["Fighter", "Magic-User", "Thief", "Ranger - TODO/VERIFY"],
    allowed_alignments: ["Any good - TODO/VERIFY", "Neutral - TODO/VERIFY"],
    languages: ["Common", "Elvish", "Qualinesti - TODO/VERIFY"],
    special_abilities: ["Infravision - TODO/VERIFY", "Secret door detection - TODO/VERIFY", "Sleep/charm resistance - TODO/VERIFY"],
    movement: "12\" / 120 ft",
    enabled_by_default: true,
    advanced: false,
  },
  {
    name: "Silvanesti Elf",
    description: "Ancient high elves bound to tradition, courtly magic, and the weight of a fading homeland.",
    ability_adjustments: { dexterity: 1, constitution: -1 },
    allowed_classes: ["Fighter", "Magic-User", "Thief - TODO/VERIFY"],
    allowed_alignments: ["Any good - TODO/VERIFY", "Lawful Neutral - TODO/VERIFY"],
    languages: ["Common", "Elvish", "Silvanesti - TODO/VERIFY"],
    special_abilities: ["Infravision - TODO/VERIFY", "Secret door detection - TODO/VERIFY", "Sleep/charm resistance - TODO/VERIFY"],
    movement: "12\" / 120 ft",
    enabled_by_default: true,
    advanced: false,
  },
  {
    name: "Half-Elf",
    description: "Children of two worlds, adaptable but often caught between human ambition and elven memory.",
    ability_adjustments: {},
    allowed_classes: ["Fighter", "Cleric", "Magic-User", "Thief", "Ranger", "Druid - TODO/VERIFY"],
    allowed_alignments: ["Any"],
    languages: ["Common", "Elvish", "Regional language - TODO/VERIFY"],
    special_abilities: ["Infravision - TODO/VERIFY", "Secret door detection - TODO/VERIFY", "Sleep/charm resistance - TODO/VERIFY"],
    movement: "12\" / 120 ft",
    enabled_by_default: true,
    advanced: false,
  },
  {
    name: "Tinker Gnome",
    description: "Brilliant, chaotic inventors whose devices are story engines as much as equipment.",
    ability_adjustments: { intelligence: 1, wisdom: -1 },
    allowed_classes: ["Fighter", "Thief", "Illusionist - TODO/VERIFY", "Cleric - TODO/VERIFY"],
    allowed_alignments: ["Any non-evil - TODO/VERIFY"],
    languages: ["Common", "Gnomish", "Technologist jargon - TODO/VERIFY"],
    special_abilities: ["Infravision - TODO/VERIFY", "Tinkering specialty - TODO/VERIFY", "Device mishaps - TODO/VERIFY"],
    movement: "6\" / 60 ft - TODO/VERIFY",
    enabled_by_default: true,
    advanced: false,
  },
  {
    name: "Gully Dwarf",
    description: "Aghar survivors with comedic legacy baggage; use only with explicit table consent.",
    ability_adjustments: { constitution: 1, intelligence: -1, charisma: -1 },
    allowed_classes: ["Fighter - TODO/VERIFY", "Thief - TODO/VERIFY"],
    allowed_alignments: ["Any non-lawful - TODO/VERIFY"],
    languages: ["Common - TODO/VERIFY", "Dwarvish - TODO/VERIFY", "Aghar dialect - TODO/VERIFY"],
    special_abilities: ["Survival instincts - TODO/VERIFY", "Disease/poison resilience - TODO/VERIFY"],
    movement: "6\" / 60 ft - TODO/VERIFY",
    enabled_by_default: false,
    advanced: true,
  },
  {
    name: "Irda",
    description: "Rare, secretive high ogres with major setting implications; DM approval required.",
    ability_adjustments: { intelligence: 1, charisma: 1, constitution: -1 },
    allowed_classes: ["Magic-User - TODO/VERIFY", "Fighter - TODO/VERIFY", "Cleric - TODO/VERIFY"],
    allowed_alignments: ["Any non-evil - TODO/VERIFY"],
    languages: ["Common", "Irda - TODO/VERIFY", "Ancient Ogre - TODO/VERIFY"],
    special_abilities: ["Shapechanging - TODO/VERIFY", "Magic affinity - TODO/VERIFY", "Setting-secret restrictions - TODO/VERIFY"],
    movement: "12\" / 120 ft - TODO/VERIFY",
    enabled_by_default: false,
    advanced: true,
  },
  {
    name: "Minotaur",
    description: "Militant seafarers with strong honor codes and campaign-specific social consequences.",
    ability_adjustments: { strength: 1, intelligence: -1, charisma: -1 },
    allowed_classes: ["Fighter", "Cleric - TODO/VERIFY", "Thief - TODO/VERIFY"],
    allowed_alignments: ["Any lawful - TODO/VERIFY"],
    languages: ["Common", "Kothian/Minotaur - TODO/VERIFY"],
    special_abilities: ["Natural horns - TODO/VERIFY", "Seamanship - TODO/VERIFY", "Honor-code restrictions - TODO/VERIFY"],
    movement: "12\" / 120 ft - TODO/VERIFY",
    enabled_by_default: false,
    advanced: true,
  },
];
const state = { characters: [], equipment: [], spells: [], campaigns: [], players: [], dragonlanceRaces: [], dragonlanceClasses: [], magicItemCatalog: [], campaign: null, rules: null, character: null, currentPlayer: null, step: 0, draft: null, hpRollMessage: "", moneyRollMessage: "", equipmentFeedback: {}, equipmentPreviews: {}, inventoryFilter: "equipped", dmOverride: false, dmCharacterFilters: { campaign_id: "", user_id: "", status: "" }, equipmentFilters: { q: "", type: "", allowedOnly: false }, editEquipmentId: null, dmCampaignTab: "overview", sheetDisclosure: { inventoryOpen: false, magicItemsOpen: false, spellsOpen: true, campaignOpen: false } };
const sessionDataCache = {
  api: new Map(),
  content: new Map(),
};
const AMMUNITION_COMPATIBILITY = [
  { kind: "arrow", terms: ["arrow"], label: "Arrows", weaponTerms: ["bow"] },
  { kind: "light_bolt", terms: ["light crossbow bolt", "bolt, light crossbow", "bolts, light crossbow", "quarrel (or bolt), light"], label: "Light Crossbow Bolts", weaponTerms: ["crossbow, light", "light crossbow"] },
  { kind: "heavy_bolt", terms: ["heavy crossbow bolt", "bolt, heavy crossbow", "bolts, heavy crossbow", "quarrel (or bolt), heavy"], label: "Heavy Crossbow Bolts", weaponTerms: ["crossbow, heavy", "heavy crossbow"] },
  { kind: "sling_bullet", terms: ["sling bullet", "sling bullets", "bullet, dozen"], label: "Sling Bullets", weaponTerms: ["sling"] },
  { kind: "sling_stone", terms: ["sling stone", "sling stones", "stone, dozen"], label: "Sling Stones", weaponTerms: ["sling"] },
];
const builderContext = detectBuilderContext();

function h(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function detectBuilderContext() {
  const params = new URLSearchParams(window.location.search);
  const hostSetting = window.location.hostname.toLowerCase().includes("dragolance") ? "dragolance" : "osric";
  const setting = (params.get("setting") || params.get("source") || hostSetting).toLowerCase();
  if (setting === "dragolance" || setting === "dragonlance") {
    return { setting: "dragolance", label: "Dragonlance", selectableSources: new Set(["OSRIC", "DRAGOLANCE"]) };
  }
  if (setting === "greyhawk") {
    return { setting: "greyhawk", label: "Greyhawk", selectableSources: new Set(["OSRIC", "GREYHAWK"]) };
  }
  return { setting: "osric", label: "First Edition", selectableSources: new Set(["OSRIC"]) };
}

function sourceSelectable(source) {
  return builderContext.selectableSources.has(source);
}

function isDragonlanceMode() {
  return builderContext.setting === "dragolance";
}

function sourceAdvisory(source) {
  return !sourceSelectable(source);
}

function newCharacterHref() {
  if (isPlayerCharacterMode()) return "/1e/characters/new/";
  return builderContext.setting === "dragolance" ? "/1e/characters/new/?setting=dragolance" : "/1e/characters/new/";
}

async function api(path, options = {}) {
  const { headers = {}, ...fetchOptions } = options;
  const response = await fetch(`${API}${path}`, {
    ...fetchOptions,
    headers: { "Content-Type": "application/json", ...headers },
  });
  if (!response.ok) throw new Error(await cleanResponseError(response));
  return response.status === 204 ? null : response.json();
}

function cachedApi(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  if (method !== "GET") return api(path, options);
  const key = `${API}${path}`;
  if (!sessionDataCache.api.has(key)) {
    sessionDataCache.api.set(key, api(path, options));
  }
  return sessionDataCache.api.get(key);
}

function invalidateApiCache(...paths) {
  paths.forEach((path) => sessionDataCache.api.delete(`${API}${path}`));
}

function invalidateCharacterCache(characterId = state.character?.id) {
  if (!characterId) return;
  invalidateApiCache(`/characters/${characterId}`, "/characters?include_archived=true");
  sessionDataCache.api.forEach((_, key) => {
    if (key.includes(`${API}/characters?`)) sessionDataCache.api.delete(key);
  });
}

function invalidateEquipmentCache() {
  invalidateApiCache("/equipment");
}

async function rootApi(path, options = {}) {
  const { headers = {}, ...fetchOptions } = options;
  const response = await fetch(`${VAULT_API_BASE}${path}`, {
    ...fetchOptions,
    headers: { "Content-Type": "application/json", ...headers },
  });
  if (!response.ok) throw new Error(await cleanResponseError(response));
  return response.status === 204 ? null : response.json();
}

async function cleanResponseError(response) {
  const fallback = `Request failed (${response.status}).`;
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      const detail = payload.detail ?? payload.message ?? payload;
      if (Array.isArray(detail)) return detail.map((item) => {
        if (typeof item === "string") return item;
        const location = Array.isArray(item?.loc) ? item.loc.filter((part) => part !== "body").join(".") : "";
        return [location, item?.msg].filter(Boolean).join(": ");
      }).filter(Boolean).join("; ") || fallback;
      if (typeof detail === "object" && detail) return detail.msg || detail.detail || detail.message || fallback;
      return String(detail || fallback).replace(/^"|"$/g, "");
    }
    return (await response.text()).replace(/^"|"$/g, "") || fallback;
  } catch {
    return fallback;
  }
}

async function optionalApi(loader, fallback) {
  try {
    return await loader();
  } catch (error) {
    const message = String(error?.message || "");
    const lowered = message.toLowerCase();
    if (message.includes("401") || lowered.includes("authentication") || lowered.includes("authenticated")) return fallback;
    console.warn("Optional vault context unavailable.", error);
    return fallback;
  }
}

async function loadRulesData() {
  state.rules ||= await cachedApi("/rules-data");
  return state.rules;
}

async function loadEquipmentCatalog() {
  state.equipment = await cachedApi("/equipment");
  return state.equipment;
}

async function loadSpellsCatalog() {
  state.spells = await cachedApi("/spells");
  return state.spells;
}

async function loadMagicItemCatalog() {
  if (state.magicItemCatalog.length) return state.magicItemCatalog;
  const osric = await fetchJson(OSRIC_MAGIC_ITEM_CATALOG_PATH);
  const adventureCatalogs = await Promise.all(ADVENTURE_MAGIC_ITEM_CATALOG_PATHS.map(async (path) => {
    try {
      return await fetchJson(path);
    } catch {
      return { items: [] };
    }
  }));
  state.magicItemCatalog = [
    ...(Array.isArray(osric?.items) ? osric.items : []),
    ...adventureCatalogs.flatMap((catalog) => Array.isArray(catalog?.items) ? catalog.items : []),
  ];
  return state.magicItemCatalog;
}

function playerAuthHeaders() {
  localStorage.removeItem(PLAYER_TOKEN_KEY);
  const token = sessionStorage.getItem(PLAYER_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function isClassicHost() {
  return window.location.hostname.toLowerCase() === "classic.dragorussogames.com";
}

function isDragolanceHost() {
  return window.location.hostname.toLowerCase().includes("dragolance");
}

function campaignIdParam() {
  const value = new URLSearchParams(window.location.search).get("campaign_id");
  return value ? Number(value) : null;
}

function isPlayerCharacterMode() {
  const params = new URLSearchParams(window.location.search);
  const localPlayerRoute = location.pathname.startsWith("/characters/");
  const playerSession = Boolean(sessionStorage.getItem(PLAYER_TOKEN_KEY));
  return !isDmMode() && (playerSession || localPlayerRoute || isClassicHost() || isDragolanceHost() || params.get("player") === "1" || params.has("campaign_id") || params.get("setting") === "dragolance");
}

function isPlayerBuilderMode() {
  return pageKind() === "new" && isPlayerCharacterMode();
}

function applyCampaignSourceContext(campaign) {
  if (!campaign) return;
  const setting = String(campaign.setting || "").toLowerCase();
  const sourcebooks = Array.isArray(campaign.allowed_sourcebooks) && campaign.allowed_sourcebooks.length
    ? campaign.allowed_sourcebooks
    : setting === "dragonlance" || setting === "dragolance"
      ? ["OSRIC", "DRAGOLANCE"]
      : ["OSRIC", "GREYHAWK"];
  builderContext.setting = setting === "dragonlance" ? "dragolance" : setting || builderContext.setting;
  builderContext.label = title(builderContext.setting);
  builderContext.selectableSources = new Set(sourcebooks.map((source) => String(source).toUpperCase()));
}

function isDragonlanceCampaignContext() {
  const setting = String(state.campaign?.setting || "").toLowerCase();
  const sourcebooks = Array.isArray(state.campaign?.allowed_sourcebooks) ? state.campaign.allowed_sourcebooks.map((source) => String(source).toUpperCase()) : [];
  return setting === "dragonlance" || setting === "dragolance" || sourcebooks.includes("DRAGOLANCE");
}

async function fetchJson(path) {
  if (sessionDataCache.content.has(path)) return sessionDataCache.content.get(path);
  const promise = fetchJsonUncached(path);
  sessionDataCache.content.set(path, promise);
  return promise;
}

async function fetchJsonUncached(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
}

async function fetchDragonlanceRaces() {
  try {
    const files = contentIndexFiles(await fetchJson(`${DRAGONLANCE_RACE_PATH}index.json`));
    return Promise.all(files.map((file) => fetchJson(`${DRAGONLANCE_RACE_PATH}${file}`)));
  } catch (error) {
    console.warn("Dragonlance race content unavailable; using fallback race data.", error);
    return fallbackDragonlanceRaces;
  }
}

async function fetchDragonlanceClasses() {
  try {
    const files = contentIndexFiles(await fetchJson(`${DRAGONLANCE_CLASS_PATH}index.json`));
    const classes = await Promise.all(files.map(async (file) => {
      try {
        return await fetchJson(`${DRAGONLANCE_CLASS_PATH}${file}`);
      } catch (error) {
        console.warn(`Dragonlance class file unavailable: ${file}`, error);
        return null;
      }
    }));
    return classes.filter((classInfo) => classInfo?.name);
  } catch (error) {
    console.warn("Dragonlance class content unavailable.", error);
    return [];
  }
}

function contentIndexFiles(index) {
  if (Array.isArray(index)) return index;
  if (Array.isArray(index?.files)) return index.files;
  if (Array.isArray(index?.classes)) return index.classes;
  if (Array.isArray(index?.races)) return index.races;
  return [];
}

function pageKind() {
  const path = location.pathname.replace(/\/$/, "");
  if (path.endsWith("/new")) return "new";
  if (path.endsWith("/edit")) return "edit";
  if (path.endsWith("/1e/dm")) return "dmDashboard";
  if (path.includes("/dm/campaigns")) return "campaign";
  if (path.includes("/dm/players")) return "dmPlayers";
  if (path.includes("/dm/characters")) return "dmCharacters";
  if (path.includes("/dm/equipment")) return "dmEquipment";
  const match = path.match(/(?:\/1e)?\/characters\/(\d+)$/);
  return match ? "show" : "index";
}

function characterId() {
  const match = location.pathname.match(/(?:\/1e)?\/characters\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function characterViewHref(id) {
  if (location.pathname.startsWith("/portal/characters")) return `/portal/characters/${id}`;
  if (isClassicHost() && location.pathname.startsWith("/characters")) return `/characters/${id}`;
  return isPlayerCharacterMode() ? `/1e/characters/${id}/?player=1` : `/1e/characters/${id}/`;
}

function characterEditHref(id) {
  if (location.pathname.startsWith("/portal/characters")) return `/portal/characters/${id}/edit`;
  if (isClassicHost() && location.pathname.startsWith("/characters")) return `/characters/${id}/edit`;
  return isPlayerCharacterMode() ? `/1e/characters/${id}/edit/?player=1` : `/1e/characters/${id}/edit/`;
}

function campaignId() {
  const match = location.pathname.match(/\/1e\/dm\/campaigns\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function toast(message, tone = "") {
  const node = document.querySelector("[data-vault-toast]");
  if (node) {
    node.textContent = message;
    node.dataset.tone = tone;
  }
  const panelNode = document.querySelector("[data-panel-toast]");
  if (panelNode) {
    panelNode.textContent = message;
    panelNode.dataset.tone = tone;
  }
}

async function boot() {
  renderShell();
  try {
    const kind = pageKind();
    if (kind === "dmEquipment") {
      await loadEquipmentCatalog();
    } else if (["campaign", "dmDashboard"].includes(kind)) {
      await loadEquipmentCatalog();
    }

    if (isPlayerCharacterMode()) {
      await hydratePlayerBuilderContext();
    } else {
      const needsCampaigns = ["new", "edit", "index", "dmDashboard", "campaign", "dmEquipment"].includes(kind);
      const needsPlayers = ["new", "edit", "index", "dmDashboard", "campaign", "dmPlayers", "dmCharacters"].includes(kind);
      [state.campaigns, state.players] = await Promise.all([
        needsCampaigns ? optionalApi(() => cachedApi("/campaigns"), []) : [],
        needsPlayers ? optionalApi(() => cachedApi("/players"), []) : [],
      ]);
      hydrateCurrentPlayer();
    }

    if (kind === "show" || kind === "edit") {
      state.character = isPlayerCharacterMode()
        ? await rootApi(`/player/characters/${characterId()}`, { headers: playerAuthHeaders() })
        : await cachedApi(`/characters/${characterId()}`);
      if (state.character?.campaign_id) {
        state.campaign = state.campaigns.find((campaign) => campaign.id === state.character.campaign_id) || null;
        applyCampaignSourceContext(state.campaign);
      }
      renderShell();
    }
    if (kind === "campaign" && campaignId()) {
      state.campaign = await cachedApi(`/campaigns/${campaignId()}`);
      state.characters = await cachedApi("/characters?include_archived=true");
    }
    if (kind === "dmPlayers") state.characters = await cachedApi("/characters?include_archived=true");
    if (kind === "dmCharacters") state.characters = await cachedApi("/characters?include_archived=true");
    if (kind === "index") state.characters = await cachedApi(`/characters${state.currentPlayer?.id ? `?user_id=${state.currentPlayer.id}` : ""}`);
    render();
  } catch (error) {
    toast("Required builder data is unavailable. Check rules, equipment, and spell APIs.");
    console.error(error);
  }
}

async function hydratePlayerBuilderContext() {
  const headers = playerAuthHeaders();
  const player = await optionalApi(() => rootApi("/player/me", { headers }), null);
  const campaigns = await optionalApi(() => rootApi("/player/campaigns", { headers }), []);
  const selectedCampaignId = campaignIdParam();
  state.currentPlayer = player;
  state.players = player ? [player] : [];
  state.campaigns = campaigns;
  state.campaign = selectedCampaignId
    ? campaigns.find((campaign) => Number(campaign.id) === selectedCampaignId) || null
    : campaigns[0] || null;
  applyCampaignSourceContext(state.campaign);
  if (player?.id) localStorage.setItem("drg1e_player_id", String(player.id));
}

function hydrateCurrentPlayer() {
  const storedId = Number(localStorage.getItem("drg1e_player_id") || 0);
  state.currentPlayer = state.players.find((player) => player.id === storedId) || state.players[0] || null;
  if (state.currentPlayer) localStorage.setItem("drg1e_player_id", String(state.currentPlayer.id));
}

function renderShell() {
  const dmPage = isDmMode();
  const playerCharacterPage = isPlayerCharacterMode();
  const sheetId = characterId();
  const sheetPage = pageKind() === "show";
  const heroCopy = dmPage
    ? "Campaigns, characters, storage, and equipment for DRG 1e play."
    : pageKind() === "new"
      ? ""
    : playerCharacterPage
      ? "Build and maintain your classic First Edition character through the unified DRG 1e rules engine."
      : builderContext.setting === "dragolance"
        ? "Build one Dragolance character through the unified DRG 1e rules engine. Dragonlance sourcebook options are active for this campaign."
        : "Persistent OSRIC character building with DRG 1e table-rule ability rolls, catalog-only equipment, coins, spells, and campaign state.";
  if (sheetPage) {
    document.title = `${state.character?.name || "Character"} — Character Sheet | Drago Table`;
  }
  const shellActions = sheetPage && playerCharacterPage ? "" : dmPage ? dmNavHtml() : playerNavHtml(sheetId);
  document.querySelector("[data-vault-app]").innerHTML = `
    <section class="vault-hero ${dmPage || playerCharacterPage || sheetPage ? "vault-hero-compact" : ""} ${sheetPage ? "vault-sheet-hero" : ""}">
      <div>
        ${sheetPage ? "" : `<div class="vault-eyebrow">${dmPage ? "DM Tools" : playerCharacterPage ? "My Characters" : builderContext.setting === "dragolance" ? "Dragolance Character Builder" : "Character Vault"}</div>`}
        <h1>${pageTitle()}</h1>
        ${sheetPage || !heroCopy ? "" : `<p>${heroCopy}</p>`}
        ${dmPage ? `<p class="vault-warning-text">DM tools are currently unprotected until login is enabled.</p>` : ""}
        <div class="vault-toast" data-vault-toast></div>
      </div>
      ${shellActions ? `<div class="vault-actions">${shellActions}</div>` : ""}
    </section>
    <section data-vault-view></section>`;
}

function pageTitle() {
  if (pageKind() === "dmDashboard") return "DM Dashboard";
  if (pageKind() === "new") return "Build a Character";
  if (pageKind() === "edit") return "Edit Character";
  if (pageKind() === "show") return "Character Sheet";
  if (pageKind() === "campaign") return campaignId() ? "Campaign Workspace" : "Campaigns";
  if (pageKind() === "dmPlayers") return "DM Players";
  if (pageKind() === "dmCharacters") return "DM Characters";
  if (pageKind() === "dmEquipment") return "DM Equipment";
  return "Your Characters";
}

function playerNavHtml(sheetId) {
  const returnTo = new URLSearchParams(window.location.search).get("return_to");
  const returnLink = returnTo
    ? `<a class="vault-button" href="${h(returnTo)}">Back to Campaign</a>`
    : "";
  if (isPlayerCharacterMode()) {
    const playerRoot = isClassicHost() ? "" : "/portal";
    const campaignHref = state.campaign?.id ? `${playerRoot}/campaigns/${state.campaign.id}` : "";
    const dragonlanceReference = isDragonlanceCampaignContext() ? `<a class="vault-button secondary" href="${playerRoot}/dragonlance">Dragolance Reference</a>` : "";
    return `
      ${returnLink || `<a class="vault-button" href="${playerRoot || "/"}">Back to Player Home</a>`}
      ${campaignHref ? `<a class="vault-button secondary" href="${campaignHref}">Back to Campaign</a>` : ""}
      <a class="vault-button secondary" href="${playerRoot}/characters">My Characters</a>
      ${sheetId ? `<a class="vault-button secondary" href="${characterViewHref(sheetId)}">Character Sheet</a>` : ""}
      ${dragonlanceReference}
      <a class="vault-button secondary" href="/1e/">Rules</a>`;
  }
  return `
    ${returnLink}
    <a class="vault-button secondary" href="/1e/characters/">Characters</a>
    <a class="vault-button" href="${newCharacterHref()}">New Character</a>
    ${sheetId ? `<a class="vault-button secondary" href="/1e/characters/${sheetId}/">Character Sheet</a>` : ""}
    <a class="vault-button secondary" href="/1e/">Rules</a>
    <a class="vault-button secondary" href="/1e/equipment/">Equipment</a>
    <a class="vault-button secondary" href="/1e/spells/">Spells</a>
    <a class="vault-button secondary" href="/1e/races/">Races</a>
    <a class="vault-button secondary" href="/1e/classes/">Classes</a>`;
}

function dmNavHtml() {
  return `
    <a class="vault-button" href="/1e/dm/">DM Dashboard</a>
    <a class="vault-button secondary" href="/1e/dm/campaigns/">Campaigns</a>
    <a class="vault-button secondary" href="/1e/characters/">Character Vault</a>
    <a class="vault-button secondary" href="/1e/dm/equipment/">Equipment Catalog</a>`;
}

function render() {
  const kind = pageKind();
  if (kind === "new" || kind === "edit") renderBuilder();
  if (kind === "show") renderSheet();
  if (kind === "index") renderIndex();
  if (kind === "dmDashboard") renderDmDashboard();
  if (kind === "campaign") renderCampaigns();
  if (kind === "dmPlayers") renderDmPlayers();
  if (kind === "dmCharacters") renderDmCharacters();
  if (kind === "dmEquipment") renderDmEquipment();
}

function localDraftStorageKey() {
  if (!isPlayerCharacterMode()) return null;
  const playerId = state.currentPlayer?.id || localStorage.getItem("drg1e_player_id") || "unknown";
  const characterKey = state.character?.id || `new-${campaignIdParam() || state.campaign?.id || "unassigned"}`;
  return `drago_table_player_draft:${playerId}:${characterKey}`;
}

function readLocalDraft() {
  const key = localDraftStorageKey();
  if (!key) return null;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    return saved && typeof saved === "object" ? saved : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function persistLocalDraft() {
  const key = localDraftStorageKey();
  if (!key || !state.draft) return;
  localStorage.setItem(key, JSON.stringify({ ...state.draft, saved_on_device_at: new Date().toISOString() }));
}

function clearLocalDraft() {
  const key = localDraftStorageKey();
  if (key) localStorage.removeItem(key);
}

function initialDraft() {
  const character = state.character;
  if (character) return {
    ...character,
    abilities: { ...character.abilities },
    coins: { ...character.coins },
    combat: { ...character.combat },
  };
  const blank = {
    owner_name: "Website Player",
    email: "",
    discord_user_id: "",
    role: "player",
    name: "",
    race: "Human",
    class_name: "Fighter",
    class_tracks: [{ class_name: "Fighter", level: 1, xp: 0, state: "active" }],
    alignment: "True Neutral",
    level: 1,
    xp: 0,
    status: "active",
    life_status: "alive",
    campaign_id: campaignIdParam() || state.campaign?.id || "",
    campaign_day: 1,
    current_location: "Town",
    original_rolls: [],
    assigned_rolls: {},
    abilities: Object.fromEntries(abilities.map((ability) => [ability, 10])),
    coins: Object.fromEntries(coins.map((coin) => [coin, 0])),
    combat: { max_hp: 1, current_hp: 1 },
    notes: "",
  };
  const saved = readLocalDraft();
  return saved ? {
    ...blank,
    ...saved,
    abilities: { ...blank.abilities, ...(saved.abilities || {}) },
    coins: { ...blank.coins, ...(saved.coins || {}) },
    combat: { ...blank.combat, ...(saved.combat || {}) },
    class_tracks: Array.isArray(saved.class_tracks) && saved.class_tracks.length ? saved.class_tracks : blank.class_tracks,
  } : blank;
}

function renderBuilder(options = {}) {
  state.draft ||= initialDraft();
  const steps = ["Start", "Abilities", "Race", "Class", "Alignment", "Hit Points", "Money", "Equipment", "Proficiencies", "Spells", "Review"];
  const dataGate = builderStepDataGate();
  document.querySelector("[data-vault-view]").innerHTML = `
    <div class="vault-builder-nav">${steps.map((label, index) => `<button class="vault-tab" aria-selected="${state.step === index}" data-step="${index}">${index + 1}. ${label}</button>`).join("")}</div>
    <form class="vault-panel vault-form" data-builder-form><div class="vault-panel-toast vault-full" data-panel-toast></div>${dataGate ? builderLoadingHtml(dataGate.label) : builderStep()}</form>`;
  if (dataGate) dataGate.promise.then(() => renderBuilder()).catch((error) => {
    console.error("Builder step data failed to load.", error);
    toast("Unable to load this builder step. Try refreshing the page.");
  });
  document.querySelectorAll("[data-step]").forEach((button) => button.addEventListener("click", () => { syncDraft(); state.step = Number(button.dataset.step); renderBuilder(); }));
  document.querySelector("[data-builder-form]").addEventListener("input", syncDraft);
  document.querySelector("[data-builder-form]").addEventListener("change", syncDraft);
  bindBuilderActions();
  persistLocalDraft();
  restoreBuilderPosition(options);
}

function builderStepDataGate() {
  const loads = [];
  const labels = [];
  if (state.step >= 2 && !state.rules) {
    labels.push("rules");
    loads.push(loadRulesData());
  }
  if (state.step === 2 && isDragonlanceMode() && !state.dragonlanceRaces.length) {
    labels.push("race options");
    loads.push(fetchDragonlanceRaces().then((records) => { state.dragonlanceRaces = records; }));
  }
  if (state.step === 3 && isDragonlanceMode() && !state.dragonlanceClasses.length) {
    labels.push("class options");
    loads.push(fetchDragonlanceClasses().then((records) => { state.dragonlanceClasses = records; }));
  }
  if ([7, 8].includes(state.step) && !state.equipment.length) {
    labels.push("equipment catalog");
    loads.push(loadEquipmentCatalog());
  }
  if (state.step === 9 && !state.spells.length) {
    labels.push("spell catalog");
    loads.push(loadSpellsCatalog());
  }
  return loads.length ? { label: `Loading ${labels.join(", ")}...`, promise: Promise.all(loads) } : null;
}

function builderLoadingHtml(label) {
  return `<div class="vault-full vault-compact-empty"><strong>${h(label)}</strong><p class="vault-muted">Preparing this step.</p></div>${navButtons()}`;
}

function field(label, name, value, type = "text", extra = "") {
  return `<label class="vault-field ${extra}">${label}<input name="${name}" type="${type}" value="${h(value)}"></label>`;
}

function selectField(label, name, value, options, extra = "") {
  return `<label class="vault-field ${extra}">${label}<select name="${name}">${selectOptionsHtml(options, value)}</select></label>`;
}

function selectOptionsHtml(options = [], value = "") {
  return options.map((option) => {
    const optionValue = String(option.value ?? option);
    const label = String(option.label ?? option);
    return `<option value="${h(optionValue)}" ${optionValue === String(value) ? "selected" : ""}>${h(label)}</option>`;
  }).join("");
}

function playerSelectOptions() {
  return [
    { value: "", label: "Choose a player..." },
    ...state.players.map((player) => ({
      value: String(player.id),
      label: `${player.display_name || player.player_name || "Unnamed Player"} · @${player.username || "no-username"} · ID ${player.id}`,
    })),
  ];
}

function abilityAssignmentHtml(d) {
  const rolls = d.original_rolls || [];
  const assigned = d.assigned_rolls || {};
  const used = new Set(Object.values(assigned).filter((value) => value !== "" && value != null).map(String));
  return `<div class="vault-full">
    <div class="vault-roll-bank">${rolls.length ? rolls.map((roll, index) => `<button type="button" class="vault-roll-chip ${used.has(String(index)) ? "used" : ""}" data-unassign-roll="${index}" ${used.has(String(index)) ? "" : "disabled"} title="${used.has(String(index)) ? "Return this score to the available roll bank" : "Available score"}">${h(roll)}</button>`).join("") : `<span class="vault-muted">No rolls yet.</span>`}</div>
    <div class="vault-ability-assignments">${abilities.map((ability) => {
      const selected = assigned[ability] ?? "";
      return `<label class="vault-assign"><span>${abilityLabels[ability]}</span><select name="assigned_rolls.${ability}"><option value="">Manual</option>${rolls.map((roll, index) => `<option value="${index}" ${String(selected) === String(index) ? "selected" : ""} ${used.has(String(index)) && String(selected) !== String(index) ? "disabled" : ""}>${h(roll)}</option>`).join("")}</select><input name="abilities.${ability}" type="number" min="3" max="18" value="${h(d.abilities[ability])}"></label>`;
    }).join("")}</div>
    ${exceptionalStrengthBuilderHtml(d)}
    <p class="vault-muted">Manual values remain available for DM-approved overrides. Race adjustments apply after assignment.</p>
  </div>`;
}

function exceptionalStrengthEligible(d) {
  const classNames = draftClassNames(d).map(rulesClassName);
  return Number(d?.abilities?.strength || 0) === 18 && classNames.some((name) => ["Fighter", "Paladin", "Ranger"].includes(name));
}

function draftClassTracks(d = state.draft) {
  const tracks = Array.isArray(d?.class_tracks) && d.class_tracks.length
    ? d.class_tracks
    : [{ class_name: d?.class_name || "Fighter", level: Number(d?.level || 1), xp: Number(d?.xp || 0), state: "active" }];
  return tracks.map((track) => ({
    class_name: track.class_name,
    level: Number(track.level || 1),
    xp: Number(track.xp || 0),
    state: track.state || "active",
  }));
}

function draftClassNames(d = state.draft) {
  return draftClassTracks(d).map((track) => track.class_name);
}

function draftClassDisplay(d = state.draft) {
  return draftClassNames(d).join("/");
}

function multiclassOptionsHtml(d) {
  const combinations = state.rules?.multiclass_combinations?.[d.race] || [];
  const current = draftClassNames(d).join("|");
  const options = [
    { value: d.class_name, label: `Single class: ${d.class_name}` },
    ...combinations.map((classes) => ({ value: classes.join("|"), label: `Multi-class: ${classes.join(" / ")}` })),
  ];
  return `<section class="vault-class-path">
    <div>
      <div class="vault-kicker">Single Class or Multi-Class</div>
      <h3>Choose Your Class Path</h3>
      <p>${combinations.length
        ? `${h(d.race)} characters may choose one of the permitted multi-class combinations below.`
        : `${h(d.race)} characters begin as a single class and cannot multi-class at character creation.`}</p>
    </div>
    <label class="vault-field">Class Path<select name="class_combination">${selectOptionsHtml(options, current || d.class_name)}</select></label>
    ${combinations.length ? `<p class="vault-muted vault-full">${h(state.rules?.multiclass_restrictions?.[d.race] || "")}</p>` : ""}
  </section>`;
}

function exceptionalStrengthBuilderHtml(d) {
  if (!exceptionalStrengthEligible(d)) return "";
  const value = d.exceptional_strength ?? "";
  return `<div class="vault-actions">
    <label class="vault-field">Exceptional STR d100<input name="exceptional_strength" type="number" min="1" max="100" value="${h(value)}" required></label>
    <button class="vault-button secondary" type="button" data-roll-exceptional-strength>Roll d100</button>
    <span class="vault-muted">Required for an unmodified STR 18 Fighter, Paladin, or Ranger.</span>
  </div>`;
}

function builderStep() {
  const d = state.draft;
  const races = Object.keys(state.rules?.races || {});
  const classes = Object.keys(state.rules?.classes || {});
  if (state.step === 0 && isPlayerCharacterMode()) return `
    ${field("Character Name", "name", d.name)}
    ${playerIdentityHtml()}
    ${campaignSelectHtml(d)}
    <p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/">Character Creation</a></p>
    ${navButtons()}`;
  if (state.step === 0) return `
    ${field("Character Name", "name", d.name)}
    ${selectField("Owner / Player", "user_id", String(d.user_id || state.currentPlayer?.id || ""), playerSelectOptions())}
    ${field("Player Name", "owner_name", d.owner_name || state.currentPlayer?.display_name || "Website Player")}
    ${field("Email", "email", d.email || state.currentPlayer?.email || "", "email")}
    ${field("Discord User ID", "discord_user_id", d.discord_user_id || state.currentPlayer?.discord_user_id || "")}
    ${campaignSelectHtml(d)}
    ${field("Campaign Day", "campaign_day", d.campaign_day, "number")}
    ${field("Current Location", "current_location", d.current_location)}
    <p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/">Character Creation</a></p>
    ${navButtons()}`;
  if (state.step === 1) return `
    <div class="vault-full vault-actions"><button class="vault-button" type="button" data-roll>Roll 4d6 Drop Lowest</button><span class="vault-muted">Assign each rolled score once, or use manual DM override.</span></div>
    ${abilityAssignmentHtml(d)}
    <p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/001-ability-scores/">4d6 drop lowest DRG 1e table rule</a></p>
    ${navButtons()}`;
  if (state.step === 2) return `
    <input type="hidden" name="race" value="${h(d.race)}">
    <section class="vault-full vault-choice-step">
      ${choiceStepHeader("Race", "What race do you want to play?", d.race || "None", isDragonlanceMode() ? "Choose from the First Edition foundation or Dragonlance options permitted by this campaign." : "Choose from the First Edition options permitted by this Greyhawk campaign.")}
      <div class="vault-choice-summary">
        <div>
          <span>Selected Race</span>
          <strong>${h(d.race || "None")}</strong>
          <p>${h(raceCardData(d.race, dragonlanceRaceProfile(d.race) ? "DRAGOLANCE" : "OSRIC")?.description || "Choose a race to see adjusted scores and restrictions.")}</p>
        </div>
        <div class="vault-statline">${adjustedStats(d).map(([name, value]) => `<div class="vault-stat"><strong>${value}</strong><span>${abilityLabels[name]}</span></div>`).join("")}</div>
      </div>
      ${sourcebookNoticeHtml()}
      ${raceSourceSection("OSRIC", osricRaceCards(), d.race)}
      ${isDragonlanceMode() ? raceSourceSection("DRAGOLANCE", settingDragonlanceRaces(), d.race) : ""}
    </section>
    <div class="vault-card vault-full"><h3>Race Notes</h3>${raceClassWarnings(d)}<p><strong>Alignment notes:</strong> ${h(compactList(dragonlanceRaceProfile(d.race)?.allowed_alignments || ["See details later"], 6))}</p></div>
    <p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/002-race/">Race</a>.</p>
    ${navButtons()}`;
  if (state.step === 3) return `
    <input type="hidden" name="class_name" value="${h(d.class_name)}">
    <section class="vault-full vault-choice-step">
      <header class="vault-choice-header">
        <div>
          <div class="vault-kicker">Character Class</div>
          <h2>Class Selection</h2>
          <p>Choose a single class or a multi-class combination permitted for your ${h(d.race)} character.</p>
        </div>
        <div class="vault-selected-pill">Selected <strong>${h(draftClassDisplay(d) || "None")}</strong></div>
      </header>
      ${multiclassOptionsHtml(d)}
      <div class="vault-choice-summary">
        <div>
          <span>Selected Class</span>
          <strong>${h(draftClassDisplay(d) || "None")}</strong>
          <p>${h(classCardData(d.class_name)?.description || "Choose a class to see rules notes and equipment permissions.")}</p>
        </div>
        <div class="vault-compact-list">
          <span><strong>Hit Die</strong>${h(hitDiceText(d))}</span>
          <span><strong>Proficiencies</strong>${h(proficiencyCount(d.class_name, d.level) ?? "Review")}</span>
          <span><strong>Wealth</strong>${h((state.rules.classes[d.class_name] || {}).wealth || "Review")}</span>
        </div>
      </div>
      ${classSourceSection("OSRIC", osricClassCards(), d.class_name)}
      ${isDragonlanceMode() ? classSourceSection("DRAGOLANCE STARTING CLASSES", dragonlanceStartingClassCards(), d.class_name) : ""}
      ${isDragonlanceMode() ? classSourceSection("DRAGOLANCE PROGRESSION PATHS", dragonlanceProgressionClassCards(), d.class_name) : ""}
    </section>
    <div class="vault-card vault-full"><h3>Class Notes</h3>${raceClassWarnings(d)}${exceptionalStrengthBuilderHtml(d)}<p><strong>${h(draftClassDisplay(d))}</strong></p><p>Each class keeps its own level and receives an equal share of XP. Hit-point gains are divided by ${draftClassTracks(d).length}.</p></div>
    <p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/003-class/">Class</a></p>
    ${navButtons()}`;
  if (state.step === 4) return `${selectField("Alignment", "alignment", d.alignment, state.rules.alignments)}<div class="vault-card vault-wide">${raceClassWarnings(d)}<p><strong>${h(d.class_name)}:</strong> ${h((state.rules.classes[d.class_name] || {}).alignment || "Any alignment")}</p></div><p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/004-alignment/">Alignment</a>.</p>${navButtons()}`;
  if (state.step === 5) return `${hitPointsStepHtml(d)}${navButtons()}`;
  if (state.step === 6) return `${moneyStepHtml(d)}${navButtons()}`;
  if (state.step === 7) return equipmentManager() + navButtons();
  if (state.step === 8) return proficiencyManager() + navButtons();
  if (state.step === 9) return spellManager() + navButtons();
  return `<div class="vault-full">${sheetHtml(previewCharacter())}</div>${navButtons(true)}`;
}

function navButtons(save = false) {
  return `<div class="vault-actions vault-full">
    <button class="vault-button secondary" type="button" data-prev ${state.step === 0 ? "disabled" : ""}>Previous</button>
    <button class="vault-button secondary" type="button" data-next ${state.step === 10 ? "disabled" : ""}>Next</button>
    <button class="vault-button" type="button" data-save>${save ? "Save Character" : "Save"}</button>
    ${state.character?.id ? `<a class="vault-button secondary" href="${characterViewHref(state.character.id)}">View</a>` : ""}
  </div>`;
}

function campaignSelectHtml(d) {
  if (isPlayerCharacterMode()) {
    if (!state.campaigns.length) {
      return `<input type="hidden" name="campaign_id" value=""><div class="vault-card vault-full"><div class="vault-kicker">Campaign</div><h3>Pending</h3><p>Your DM has not invited this player to a campaign yet.</p></div>`;
    }
    const selected = d.campaign_id || state.campaign?.id || "";
    const options = [
      { value: "", label: "Pending / No campaign" },
      ...state.campaigns.map((campaign) => ({ value: String(campaign.id), label: campaign.name })),
    ];
    return `<div class="vault-full">${selectField("Campaign", "campaign_id", String(selected), options)}<p class="vault-muted">Only campaigns your DM invited you to are available.</p></div>`;
  }
  if (!state.campaigns.length) return `<div class="vault-full vault-muted">No campaigns available. Your DM can assign this character later.</div>`;
  return selectField("Campaign", "campaign_id", d.campaign_id || "", ["", ...state.campaigns.map((c) => String(c.id))]);
}

function sourcebookNoticeHtml() {
  const setting = isDragonlanceMode() ? "Dragonlance" : "Greyhawk";
  return `<div class="vault-source-notice"><strong>Campaign Setting: ${setting}</strong><span>Your DM selected which character options are available.</span></div>`;
}

function playerIdentityHtml() {
  const discord = state.currentPlayer?.discord_user_id;
  return `<div class="vault-card vault-full"><div class="vault-kicker">Player Name</div><h3>${h(playerDisplayName())}</h3>${discord ? `<p>Discord: ${h(discord)}</p>` : ""}</div>`;
}

function playerDisplayName() {
  return state.currentPlayer?.display_name || state.currentPlayer?.player_name || state.currentPlayer?.username || "Website Player";
}

function playerCampaignLabel(d) {
  if (state.campaign?.name) return state.campaign.name;
  if (d.campaign_id) return `Campaign #${d.campaign_id}`;
  return "Pending";
}

function hitPointsStepHtml(d) {
  const con = Number(d.abilities?.constitution || 10);
  const conMod = constitutionHpAdjustment(con, d.class_name);
  return `
    <div class="vault-card vault-full">
      <div class="vault-kicker">Hit Points</div>
      <h3>${h(d.class_name || "Class")} Hit Die</h3>
      <div class="vault-compact-list">
        <span><strong>Hit Die</strong>${h(hitDiceText(d))}</span>
        <span><strong>CON Modifier</strong>${h(formatSigned(conMod))}</span>
      </div>
      <div class="vault-actions"><button class="vault-button" type="button" data-roll-hp>Roll Hit Die</button></div>
      ${state.hpRollMessage ? `<p class="vault-success-text">${h(state.hpRollMessage)}</p>` : ""}
    </div>
    ${field("Max HP", "combat.max_hp", d.combat.max_hp, "number")}
    ${field("Current HP", "combat.current_hp", d.combat.current_hp, "number")}
    <p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/007-hit-points/">Hit Points</a></p>`;
}

function moneyStepHtml(d) {
  const formula = startingWealthFormula(d.class_name);
  return `
    <div class="vault-card vault-full">
      <div class="vault-kicker">Money</div>
      <h3>Starting Gold</h3>
      <div class="vault-compact-list">
        <span><strong>Class</strong>${h(d.class_name || "Choose class")}</span>
        <span><strong>Formula</strong>${h(formula || "Review with DM")}</span>
      </div>
      <div class="vault-actions"><button class="vault-button" type="button" data-roll-gold ${formula ? "" : "disabled"}>Roll Starting Gold</button></div>
      ${state.moneyRollMessage ? `<p class="vault-success-text">${h(state.moneyRollMessage)}</p>` : ""}
    </div>
    ${coins.map((coin) => field(title(coin), `coins.${coin}`, d.coins[coin], "number")).join("")}
    <div class="vault-card vault-wide"><h3>Coin Load</h3><p>${coinCount(d.coins)} coins, ${coinWeight(d.coins)} lb.</p></div>
    <p class="vault-rules vault-full">Rules: <a href="/1e/equipment/">Coins weigh 10 per lb</a></p>`;
}

function formatSigned(value) {
  return Number(value) >= 0 ? `+${Number(value)}` : String(Number(value));
}

function formatConEquation(value) {
  const number = Number(value);
  if (number === 0) return "+ 0";
  return number > 0 ? `+ ${number}` : `- ${Math.abs(number)}`;
}

function equipmentManager() {
  const filters = state.equipmentFilters;
  return `<div class="vault-full">
    <div class="vault-actions">
      <input name="equipment_search" placeholder="Search equipment catalog" value="${h(filters.q)}">
      <select name="equipment_type"><option value="">All types</option><option value="weapon" ${filters.type === "weapon" ? "selected" : ""}>Weapon</option><option value="armor" ${filters.type === "armor" ? "selected" : ""}>Armor</option><option value="shield" ${filters.type === "shield" ? "selected" : ""}>Shield</option><option value="adventuring_gear" ${filters.type === "adventuring_gear" ? "selected" : ""}>Adventuring Gear</option><option value="mount" ${filters.type === "mount" ? "selected" : ""}>Mount</option><option value="transport" ${filters.type === "transport" ? "selected" : ""}>Transport</option></select>
      <label class="vault-check"><input type="checkbox" name="allowed_only" ${filters.allowedOnly ? "checked" : ""}> Class allowed only</label>
      <label class="vault-check"><input type="checkbox" name="dm_override" ${state.dmOverride ? "checked" : ""}> DM override equip restrictions</label>
    </div>
    <div class="vault-equipment-catalog-scroll"><table class="vault-table"><thead><tr><th>Item</th><th>Type</th><th>Wt</th><th>Cost</th><th>Use</th><th></th></tr></thead><tbody data-equipment-results>${equipmentRows(filteredEquipmentRows())}</tbody></table></div>
    <h3 data-builder-inventory>Character Inventory</h3>${state.character?.inventory?.length ? inventoryTable(state.character.inventory, state.character.weapon_proficiencies || []) : `<p class="vault-muted">No equipment added yet.</p>`}
    <p class="vault-rules">Rules: <a href="/1e/equipment/">Player's Handbook equipment catalog</a>. Free-typed player equipment is intentionally blocked.</p>
  </div>`;
}

function equipmentRows(items) {
  return items.map((item) => {
    const ammo = isAmmunition(item);
    const detail = ammo ? ammunitionLabel(item)
      : item.type === "weapon" ? `${item.damage_small_medium || ""} vs S/M, ${item.damage_large || ""} vs L, Spd ${item.properties?.speed ?? "—"}${item.range ? `, Rng ${item.range}` : ""}`
      : item.type === "armor" || item.type === "shield" ? `AC ${item.armor_class_value ?? ""}, adjustment ${item.armor_class_adjustment ?? ""}`
      : item.rules_reference || "";
    const allowed = classAllowsEquipment(state.draft?.class_name, item);
    const inventoryItem = inventoryItemForEquipment(item.id);
    const feedback = state.equipmentFeedback[item.id];
    const added = Boolean(inventoryItem);
    const equipped = inventoryItem?.status === "equipped";
    const equipLabel = equipped ? "Equipped ✓" : feedback === "equipped" ? "Equipped ✓" : "Equip";
    const addLabel = added || feedback === "added" ? "Add +1" : "Add";
    const status = equipmentUseStatus(allowed);
    const restricted = !allowed.allowed && !state.dmOverride;
    const preview = state.equipmentPreviews[item.id];
    const previewButton = item.type === "weapon" && !ammo ? ` <button class="vault-button secondary" type="button" data-preview-equipment="${item.id}">${preview ? "Hide Preview" : "Preview"}</button>` : "";
    return `<tr class="${allowed.allowed ? "" : "vault-warn-row"}"><td><strong>${h(item.name)}</strong><br><span class="vault-mini">${h(displayReference(detail))}</span></td><td>${h(equipmentDisplayType(item))}</td><td>${h(item.weight)}</td><td>${h(item.cost_amount ?? "")} ${h(item.cost_coin ?? "")}</td><td><span class="${h(status.className)}">${h(status.label)}</span><br><span class="vault-mini">${h(status.reason)}</span></td><td><button class="vault-button secondary" type="button" data-add-equipment="${item.id}" data-status="carried" ${restricted ? "disabled" : ""}>${addLabel}</button> <button class="vault-button secondary" type="button" data-add-equipment="${item.id}" data-status="equipped" ${equipped || restricted ? "disabled" : ""}>${equipLabel}</button>${previewButton}${equipped ? ` <button class="vault-button secondary" type="button" data-inventory-action="${inventoryItem.id}:carried">Unequip</button>` : ""}</td></tr>${preview ? `<tr class="vault-preview-row"><td colspan="6">${builderWeaponPreviewHtml(preview)}</td></tr>` : ""}`;
  }).join("");
}

function equipmentUseStatus(allowed) {
  if (allowed.allowed) return { label: "Allowed", reason: allowed.reason || "Allowed", className: "vault-status-good" };
  if (state.dmOverride) return { label: "DM Override Applied", reason: allowed.reason || "Override recorded on equip.", className: "vault-status-review" };
  const reason = allowed.reason || "Ask your DM before using this item.";
  if (/manual dm review/i.test(reason)) return { label: "Needs Review", reason, className: "vault-status-review" };
  return { label: "DM Override Required", reason, className: "vault-status-blocked" };
}

function inventoryItemForEquipment(equipmentId) {
  return (state.character?.inventory || []).find((item) => Number(item.equipment_id) === Number(equipmentId)) || null;
}

function equipmentById(equipmentId) {
  return state.equipment.find((item) => Number(item.id) === Number(equipmentId)) || null;
}

function initialEquipmentQuantity(equipmentId) {
  const item = equipmentById(equipmentId);
  return isAmmunition(item) ? ammunitionBundleSize(item) : 1;
}

function proficiencyManager() {
  const weapons = state.equipment.filter((item) => item.type === "weapon" && !isAmmunition(item)).slice(0, 80);
  const classInfo = state.rules?.classes?.[rulesClassName(state.draft.class_name)] || {};
  return `<div class="vault-full"><table class="vault-table"><thead><tr><th>Weapon</th><th>Damage</th><th>Speed</th><th>Status</th><th></th></tr></thead><tbody>${weapons.map((weapon) => {
    const entry = weaponProficiencyEntry(weapon.id, state.character?.weapon_proficiencies || []);
    const proficient = Boolean(entry?.proficient);
    return `<tr class="${proficient ? "vault-proficient-row" : ""}"><td>${h(weapon.name)}</td><td>${h(weapon.damage_small_medium || "")}</td><td>${h(weapon.properties?.speed ?? "—")}</td><td><span class="${proficient ? "vault-status-good" : "vault-muted"}">${proficient ? "Proficient" : "Non-proficient"}</span></td><td><button class="vault-button secondary" type="button" data-prof="${weapon.id}" data-prof-action="${proficient ? "unmark" : "mark"}">${proficient ? "Unmark" : "Mark"}</button></td></tr>`;
  }).join("")}</tbody></table><p class="vault-rules">Rules: ${h(proficiencyCount(state.draft.class_name, state.draft.level) ?? "Needs Review")} allowed proficiencies at this level. Non-proficiency penalty: ${h(classInfo.non_proficiency_penalty ?? "Needs Review")}.</p></div>`;
}

function spellManager() {
  const casterTracks = draftClassTracks(state.draft).filter((track) => {
    const info = spellClassInfo(track.class_name);
    return info.spellcaster && Number(track.level) >= Number(info.spellcasting_starts_level || 1);
  });
  const classKeys = draftSpellListKeys(state.draft);
  const spells = spellsForCurrentClass().slice(0, 90);
  if (!casterTracks.length || !classKeys.length) return `<div class="vault-full"><p>This class path has no spells at its current levels.</p><p class="vault-rules">Rules: <a href="/1e/how-to-play/magic/">Magic</a></p></div>`;
  const savedSlots = state.character ? spellSlotsHtml(state.character) : "";
  const known = knownSpells();
  const prepared = preparedSpells();
  return `<div class="vault-full">
    <div class="vault-actions"><input name="spell_search" placeholder="Search spells"><select name="spell_class"><option value="">${h(draftClassDisplay(state.draft))} lists</option><option value="cleric">Cleric</option><option value="druid">Druid</option><option value="magic-user">Magic-User</option><option value="illusionist">Illusionist</option></select><select name="spell_level"><option value="">All levels</option>${[1,2,3,4,5,6,7,8,9].map((n) => `<option value="${n}">${n}</option>`).join("")}</select></div>
    <p class="vault-muted">${h(casterTracks.map((track) => `${track.class_name} ${track.level}`).join(", "))}. Add known spells first, then prepare from that known list.</p>
    ${savedSlots}
    <h3>Prepared Spells</h3>
    ${prepared.length ? spellBookTable(prepared, true) : `<p class="vault-muted">None prepared.</p>`}
    <h3>Known Spells</h3>
    ${known.length ? spellBookTable(known, false) : `<p class="vault-muted">No known spells recorded.</p>`}
    <h3>Spell Catalog</h3>
    ${spells.length ? `<table class="vault-table"><thead><tr><th>Spell</th><th>Level</th><th>Range</th><th>Duration</th><th>Area/Effect</th><th>Status</th><th></th></tr></thead><tbody data-spell-results>${spellRows(spells)}</tbody></table>` : `<p class="vault-muted">This class has no spells at this level.</p>`}
    <p class="vault-rules">Rules: <a href="/1e/how-to-play/magic/">Magic</a> and spell reference pages.</p>
  </div>`;
}

function spellRows(spells) {
  return spells.map((spell) => {
    const entry = knownSpellEntry(spell.id);
    const prepared = entry && (entry.prepared || Number(entry.memorized_count || 0) > 0);
    return `<tr><td><strong>${h(spell.name)}</strong><br><a class="vault-mini" href="${h(spell.rules_reference)}">Rules</a></td><td>${spell.spell_level}<br><span class="vault-mini">${h(spell.class_list.join(", "))}</span></td><td>${h(spell.range || "")}</td><td>${h(spell.duration || "")}</td><td>${h(spell.area_of_effect || "")}</td><td>${entry ? "Selected" : "Available"}${prepared ? "<br><span class=\"vault-mini\">Prepared</span>" : ""}</td><td><button class="vault-button secondary" type="button" data-add-known-spell="${spell.id}" ${entry ? "disabled" : ""}>${entry ? "Selected ✓" : "Select Spell"}</button></td></tr>`;
  }).join("");
}

function spellBookTable(entries, preparedOnly = false) {
  return `<table class="vault-table"><thead><tr><th>Spell</th><th>Level</th><th>Range</th><th>Duration</th><th>Area</th><th>Count</th><th></th></tr></thead><tbody>${entries.map((entry) => spellBookRow(entry, preparedOnly)).join("")}</tbody></table>`;
}

function spellBookRow(entry, preparedOnly = false) {
  const prepared = entry.prepared || Number(entry.memorized_count || 0) > 0;
  const removeButton = !prepared ? ` <button class="vault-button secondary" type="button" data-spell-action="${entry.id}:remove">Remove Known</button>` : "";
  const action = preparedOnly
    ? `<button class="vault-button secondary" type="button" data-spell-action="${entry.id}:cast">Cast</button><button class="vault-button secondary" type="button" data-spell-action="${entry.id}:prepare">Prepare +1</button><button class="vault-button secondary" type="button" data-spell-action="${entry.id}:unprepare">Clear</button>`
    : `<button class="vault-button secondary" type="button" data-spell-action="${entry.id}:prepare">Prepare +1</button>${removeButton}`;
  return `<tr><td><strong>${h(entry.spell.name)}</strong><br>${spellBadges(entry)}<br><a class="vault-mini" href="${h(entry.spell.rules_reference)}">Rules</a></td><td>${h(entry.spell.spell_level)}<br><span class="vault-mini">${h((entry.spell.class_list || []).join(", "))}</span></td><td>${h(entry.spell.range || "")}</td><td>${h(entry.spell.duration || "")}</td><td>${h(entry.spell.area_of_effect || "")}</td><td>${h(entry.memorized_count || 0)}</td><td>${action}</td></tr>`;
}

function knownSpells() {
  return (state.character?.spells || []).filter((entry) => entry.known || entry.in_spellbook);
}

function preparedSpells() {
  return knownSpells().filter((entry) => entry.prepared || Number(entry.memorized_count || 0) > 0);
}

function knownSpellEntry(spellId) {
  return knownSpells().find((entry) => Number(entry.spell_id) === Number(spellId)) || null;
}

function normalizedClassName(className) {
  return String(className || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function isSwordKnightClass(className) {
  return normalizedClassName(className) === "knight of the sword";
}

function spellRulesClassName(className) {
  if (isSwordKnightClass(className)) return "Knight of the Sword";
  return rulesClassName(className);
}

function spellClassInfo(className) {
  if (isSwordKnightClass(className)) {
    return {
      spellcaster: true,
      spell_lists: ["cleric"],
      spellcasting_starts_level: 6,
    };
  }
  return state.rules?.classes?.[spellRulesClassName(className)] || {};
}

function rulesClassName(className) {
  if (state.rules?.classes?.[className]) return className;
  const profile = dragonlanceClassProfile(className);
  const base = `${profile?.base_class || ""} ${profile?.name || className}`.toLowerCase();
  if (base.includes("knight of solamnia") || base.includes("knight of the crown") || base.includes("knight of the sword") || base.includes("knight of the rose")) return "Fighter";
  if (base.includes("cleric")) return "Cleric";
  if (base.includes("druid")) return "Druid";
  if (base.includes("illusionist")) return "Illusionist";
  if (base.includes("magic-user") || base.includes("wizard")) return "Magic-User";
  if (base.includes("thief") || base.includes("handler")) return "Thief";
  return className;
}

function spellListKeysForClass(className) {
  const classInfo = spellClassInfo(className);
  return classInfo.spell_lists || [];
}

function draftSpellListKeys(d = state.draft) {
  return [...new Set(draftClassNames(d).flatMap((className) => spellListKeysForClass(className)))];
}

function arcaneSpellbookClass(className) {
  return ["Magic-User", "Illusionist"].includes(spellRulesClassName(className));
}

function spellsForCurrentClass() {
  const classKeys = draftSpellListKeys(state.draft);
  return state.spells.filter((spell) => spellMatchesClass(spell, classKeys) && spellAllowedAtCurrentLevel(spell));
}

function spellMatchesClass(spell, classKeys = spellListKeysForClass(state.draft.class_name)) {
  return classKeys.some((key) => (spell.class_list || []).includes(key));
}

function spellAllowedAtCurrentLevel(spell) {
  if (draftClassTracks(state.draft).length > 1) {
    return draftClassTracks(state.draft).some((track) => {
      const info = spellClassInfo(track.class_name);
      const matching = (info.spell_lists || []).some((list) => (spell.class_list || []).includes(list));
      if (!matching || Number(track.level) < Number(info.spellcasting_starts_level || 1)) return false;
      const saved = (state.character?.spellcasting_tracks || []).find((entry) => entry.class_name === track.class_name);
      if (!saved?.spell_slots?.slots) return Number(spell.spell_level) === 1;
      return Number(saved.spell_slots.slots?.[String(spell.spell_level)] || 0) > 0;
    });
  }
  const level = Number(state.draft.level || 1);
  const starts = Number(spellClassInfo(state.draft.class_name).spellcasting_starts_level || 1);
  if (level < starts) return false;
  const summary = state.character?.class_name === state.draft.class_name && Number(state.character?.level) === level ? state.character.spell_slots : null;
  if (!summary?.slots) return Number(spell.spell_level) === 1;
  const levelKey = String(spell.spell_level);
  const nested = Object.values(summary.slots).some((value) => value && typeof value === "object" && !Array.isArray(value));
  if (nested) {
    return Object.entries(summary.slots).some(([bucket, levels]) => (spell.class_list || []).includes(bucket) && Number(levels?.[levelKey] || 0) > 0);
  }
  return Number(summary.slots[levelKey] || 0) > 0;
}

function choiceStepHeader(kind, titleText, selected, description) {
  return `<header class="vault-choice-header">
    <div>
      <div class="vault-kicker">${h(kind)} Selection</div>
      <h2>${h(titleText)}</h2>
      <p>${h(description)}</p>
    </div>
    <div class="vault-selected-pill">Selected <strong>${h(selected)}</strong></div>
  </header>`;
}

function raceSourceSection(source, races, selectedRace) {
  const cards = races.map((race) => raceCardData(race.name, source, race)).filter(Boolean);
  return `<section class="vault-source-section">
    <div class="vault-source-heading">
      <div>
        <div class="vault-kicker">${h(source)}</div>
        <h3>${source === "OSRIC" ? "Foundation Races" : "Dragolance Races"}</h3>
      </div>
      <span>${h(cards.length)} options</span>
    </div>
    <div class="vault-choice-grid">${cards.map((card) => raceChoiceCard(card, selectedRace)).join("")}</div>
  </section>`;
}

function raceChoiceCard(card, selectedRace) {
  const disabled = card.disabled;
  const selected = card.name === selectedRace && !disabled;
  return `<article class="vault-choice-card ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}" data-select-race="${h(card.name)}" tabindex="${disabled ? "-1" : "0"}" aria-selected="${selected}">
    <div class="vault-choice-art" aria-hidden="true"><span>${h(card.initials)}</span></div>
    <div class="vault-choice-body">
      <div class="vault-choice-title-row">
        <h3>${h(card.name)}</h3>
        <span class="vault-source-badge">${h(card.source)}</span>
      </div>
      <p class="vault-choice-blurb">${h(card.description)}</p>
      <dl class="vault-choice-facts">
        ${choiceFact("Ability Adjustments", card.adjustments)}
        ${choiceFact("Movement", card.movement)}
        ${choiceFact("Alignment", card.alignment)}
        ${choiceFact("Languages", card.languages)}
      </dl>
      ${card.advisory ? `<p class="vault-unavailable">Ask your DM before selecting this option.</p>` : ""}
      <button class="vault-button ${selected ? "" : "secondary"}" type="button" data-select-race="${h(card.name)}" ${disabled ? "disabled" : ""}>${selected ? "Selected" : "Select Race"}</button>
    </div>
  </article>`;
}

function classSourceSection(source, classes, selectedClass) {
  const empty = !classes.length ? `<div class="vault-choice-empty">No class options are available in this section yet.</div>` : "";
  return `<section class="vault-source-section">
    <div class="vault-source-heading">
      <div>
        <div class="vault-kicker">${h(source)}</div>
        <h3>${h(classSectionTitle(source))}</h3>
      </div>
      <span>${h(classes.length)} options</span>
    </div>
    ${empty || `<div class="vault-choice-grid vault-class-choice-grid">${classes.map((classInfo) => classChoiceCard(classInfo, selectedClass)).join("")}</div>`}
  </section>`;
}

function classChoiceCard(card, selectedClass) {
  const disabled = card.disabled;
  const selected = card.name === selectedClass && !disabled;
  return `<article class="vault-choice-card ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}" data-select-class="${h(card.name)}" tabindex="${disabled ? "-1" : "0"}" aria-selected="${selected}">
    <div class="vault-choice-art vault-choice-art-class" aria-hidden="true"><span>${h(card.initials)}</span></div>
    <div class="vault-choice-body">
      <div class="vault-choice-title-row">
        <h3>${h(card.name)}</h3>
        <span class="vault-source-badge">${h(card.source)}</span>
      </div>
      <p class="vault-choice-blurb">${h(card.description)}</p>
      <dl class="vault-choice-facts">
        ${choiceFact("Hit Die", card.hitDie)}
        ${choiceFact("Prime Ability", card.primeAbility)}
        ${choiceFact("Requirements", card.requirements)}
        ${choiceFact("Key Notes", card.keyNotes)}
      </dl>
      ${card.progressionNote ? `<p class="vault-unavailable">${h(card.progressionNote)}</p>` : ""}
      ${card.advisory ? `<p class="vault-unavailable">Ask your DM before selecting this option.</p>` : ""}
      <button class="vault-button ${selected ? "" : "secondary"}" type="button" data-select-class="${h(card.name)}" ${disabled ? "disabled" : ""}>${selected ? "Selected" : "Select Class"}</button>
    </div>
  </article>`;
}

function classSectionTitle(source) {
  if (source === "OSRIC") return "Foundation Classes";
  if (source === "DRAGOLANCE STARTING CLASSES") return "Starting Classes";
  if (source === "DRAGOLANCE PROGRESSION PATHS") return "Progression Paths";
  return "Dragolance Classes";
}

function choiceFact(label, value) {
  return `<div><dt>${h(label)}</dt><dd>${h(cleanChoiceText(value) || "See details later")}</dd></div>`;
}

function osricRaceCards() {
  return Object.entries(state.rules?.races || {}).map(([name, race]) => ({ name, ...race }));
}

function osricClassCards() {
  return Object.entries(state.rules?.classes || {})
    .filter(([name]) => !isDragonlanceMode() || !DRAGONLANCE_HIDDEN_CLASS_NAMES.has(name))
    .map(([name, classInfo]) => classCardData(name, "OSRIC", classInfo));
}

function dragonlanceClassCards() {
  return state.dragonlanceClasses.map((classInfo) => classCardData(classInfo.name, "DRAGOLANCE", classInfo)).filter(Boolean);
}

function dragonlanceClassProfile(name) {
  return state.dragonlanceClasses.find((classInfo) => classInfo.name === name) || null;
}

function enforceDraftCampaignSetting() {
  if (!state.draft || isDragonlanceMode()) return;
  const dragonlanceRace = Boolean(dragonlanceRaceProfile(state.draft.race));
  const dragonlanceClass = draftClassNames(state.draft).some(
    (className) => Boolean(dragonlanceClassProfile(className)),
  );
  if (dragonlanceRace) state.draft.race = "Human";
  if (dragonlanceClass) {
    state.draft.class_name = "Fighter";
    state.draft.class_tracks = [{
      class_name: "Fighter",
      level: Number(state.draft.level || 1),
      xp: Number(state.draft.xp || 0),
      state: "active",
    }];
  }
  if (dragonlanceRace || dragonlanceClass) {
    toast("Dragonlance options were cleared because this is a Greyhawk campaign.");
  }
}

function dragonlanceStartingClassCards() {
  return dragonlanceClassCards().filter((card) => card.category !== "progression");
}

function dragonlanceProgressionClassCards() {
  return dragonlanceClassCards().filter((card) => card.category === "progression");
}

function raceCardData(name, source = "OSRIC", data = null) {
  const race = data || (source === "DRAGOLANCE" ? dragonlanceRaceProfile(name) : state.rules?.races?.[name]);
  if (!race) return null;
  const dragonlance = source === "DRAGOLANCE";
  const movement = dragonlance ? cleanChoiceText(race.movement) : (race.movement ? `${race.movement} ft` : "");
  const descriptions = {
    Human: "The flexible baseline for classic adventuring, with the broadest long-term class freedom.",
    Dwarf: "Hardy underground folk with stout defenses, stonecraft, and a strong martial tradition.",
    Elf: "Graceful demi-humans with keen senses, magic potential, and woodland fighting skill.",
    Gnome: "Clever underground folk known for illusion, craft, and practical dungeon instincts.",
    "Half-Elf": "Adaptable children of two worlds, blending human flexibility with elven gifts.",
    Halfling: "Small, quiet, resilient folk well suited to scouting, stealth, and careful play.",
    "Half-Orc": "Tough frontier survivors built for harsh combat roles and dangerous work.",
  };
  return {
    name,
    source,
    initials: initialsFor(name),
    description: cleanChoiceText(race.description || descriptions[name]) || "A classic First Edition ancestry.",
    adjustments: formatAbilityAdjustments(race.ability_adjustments || race.adjustments),
    movement: movement || "See details later",
    alignment: compactList(race.allowed_alignments) || "Any or class-limited",
    languages: compactList(race.languages || []),
    advisory: sourceAdvisory(source),
    disabled: false,
  };
}

function classCardData(name, source = "OSRIC", data = null) {
  const classInfo = data || state.rules?.classes?.[name];
  if (!classInfo) return null;
  if (source === "DRAGOLANCE") {
    const progression = classInfo.category === "progression" || classInfo.selectable_at_level_1 === false;
    const level = Number(state.draft?.level || 1);
    return {
      name,
      source,
      initials: initialsFor(name),
      category: classInfo.category || "starting",
      description: cleanChoiceText(classInfo.short_description) || "A Krynn-specific class option.",
      hitDie: classInfo.hit_die || "See details later",
      primeAbility: classInfo.prime_ability || "See details later",
      requirements: cleanChoiceText(classInfo.unlock_note || classInfo.base_class) || "See details later",
      keyNotes: compactList(classInfo.key_notes || [], 3),
      progressionNote: progression && level <= 1 ? "Progression option — not selectable at level 1." : "",
      advisory: sourceAdvisory(source) && !progression,
      disabled: progression && level <= 1,
    };
  }
  const descriptions = {
    Assassin: "A stealth killer and infiltrator built around ambush, disguise, and underworld obligations.",
    Bard: "An advanced special path with lore, charm, and spellcasting after a complex entry route.",
    Cleric: "An armored divine spellcaster who heals, turns undead, and anchors the party line.",
    Druid: "A neutral priest of the old ways with nature magic, survival power, and strict limits.",
    Fighter: "The direct martial path with the best weapon freedom and the strongest fighting base.",
    Illusionist: "A specialist arcane caster focused on deception, misdirection, and strange magic.",
    "Magic-User": "A fragile but powerful arcane scholar whose spellbook changes the shape of play.",
    Monk: "A demanding lawful path built around discipline, mobility, and unusual advancement.",
    Paladin: "A lawful good holy warrior with strict vows, martial strength, and divine gifts.",
    Ranger: "A wilderness warrior and protector with strong combat ability and later spellcasting.",
    Thief: "A nimble specialist for locks, scouting, traps, climbing, and opportunistic combat.",
  };
  return {
    name,
    source,
    initials: initialsFor(name),
    description: descriptions[name] || "A classic First Edition adventuring class.",
    hitDie: classInfo.hit_die_text || (classInfo.hit_die ? `d${classInfo.hit_die}` : "See details later"),
    primeAbility: classPrimeAbility(name),
    requirements: classRequirements(name),
    keyNotes: compactList([classInfo.armor, classInfo.weapons, classInfo.spellcaster ? "Spellcaster" : "No normal spellcasting"], 2),
    advisory: sourceAdvisory(source),
    disabled: false,
  };
}

function classPrimeAbility(name) {
  const primes = {
    Assassin: "None",
    Bard: "Dexterity, Charisma",
    Cleric: "Wisdom",
    Druid: "Wisdom, Charisma",
    Fighter: "Strength",
    Illusionist: "Intelligence, Dexterity",
    "Magic-User": "Intelligence",
    Monk: "Strength, Wisdom, Dexterity",
    Paladin: "Strength, Wisdom, Charisma",
    Ranger: "Strength, Intelligence, Wisdom",
    Thief: "Dexterity",
  };
  return primes[name] || "See details later";
}

function classRequirements(name) {
  const requirements = {
    Assassin: "STR 12, DEX 12, INT 11",
    Bard: "Advanced entry path",
    Cleric: "WIS 9",
    Druid: "WIS 12, CHA 15",
    Fighter: "STR 9",
    Illusionist: "INT 15, DEX 16",
    "Magic-User": "INT 9",
    Monk: "Lawful; high abilities",
    Paladin: "CHA 17, Lawful Good",
    Ranger: "STR 13, INT 13, WIS 14",
    Thief: "DEX 9",
  };
  return requirements[name] || "See details later";
}

function compactList(values = [], limit = 5) {
  const cleaned = (Array.isArray(values) ? values : [values]).map(cleanChoiceText).filter(Boolean);
  if (!cleaned.length) return "";
  const visible = cleaned.slice(0, limit).join(", ");
  return cleaned.length > limit ? `${visible}, +${cleaned.length - limit} more` : visible;
}

function cleanChoiceText(value) {
  const text = String(value ?? "").replace(/\s+-\s+TODO[\/_ -]*VERIFY/gi, "").replace(/TODO[\/_ -]*VERIFY/gi, "").trim();
  if (!text || /^manual dm review$/i.test(text)) return "";
  return text;
}

function initialsFor(value) {
  return String(value || "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function dragonlanceRaceProfile(name) {
  return settingDragonlanceRaces().find((race) => race.name === name) || null;
}

function settingDragonlanceRaces() {
  return state.dragonlanceRaces?.length ? state.dragonlanceRaces : fallbackDragonlanceRaces;
}

function formatAbilityAdjustments(adjustments = {}) {
  const entries = Object.entries(adjustments);
  if (!entries.length) return "None";
  return entries.map(([ability, value]) => `${abilityLabels[ability] || title(ability)} ${Number(value) > 0 ? "+" : ""}${value}`).join(", ");
}

function bindBuilderActions() {
  document.querySelector("[data-prev]")?.addEventListener("click", () => { syncDraft(); state.step = Math.max(0, state.step - 1); renderBuilder(); });
  document.querySelector("[data-next]")?.addEventListener("click", () => { syncDraft(); state.step = Math.min(10, state.step + 1); renderBuilder(); });
  document.querySelector("[data-save]")?.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      await saveDraft();
    } catch (error) {
      const message = error?.message || "Unable to save character.";
      console.error("Character save failed.", error);
      toast(message);
    }
  });
  document.querySelector("[name='race']")?.addEventListener("change", () => { syncDraft(); renderBuilder(); });
  document.querySelector("[name='class_name']")?.addEventListener("change", () => { syncDraft(); renderBuilder(); });
  document.querySelector("[name='class_combination']")?.addEventListener("change", (event) => {
    const classes = event.target.value.split("|").filter(Boolean);
    const xpShare = Math.floor(Number(state.draft.xp || 0) / Math.max(1, classes.length));
    state.draft.class_name = classes[0] || state.draft.class_name;
    state.draft.class_tracks = classes.map((className) => ({
      class_name: className,
      level: 1,
      xp: xpShare,
      state: "active",
    }));
    renderBuilder();
  });
  document.querySelector("[name='campaign_id']")?.addEventListener("change", () => {
    syncDraft();
    state.campaign = state.campaigns.find((campaign) => String(campaign.id) === String(state.draft.campaign_id)) || null;
    if (state.campaign) applyCampaignSourceContext(state.campaign);
    enforceDraftCampaignSetting();
    renderBuilder();
  });
  document.querySelectorAll("[data-select-race]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (button.closest(".vault-choice-card.disabled")) return;
    syncDraft();
    state.draft.race = button.dataset.selectRace;
    state.draft.class_tracks = [{
      class_name: state.draft.class_name,
      level: Number(state.draft.level || 1),
      xp: Number(state.draft.xp || 0),
      state: "active",
    }];
    renderBuilder();
  }));
  document.querySelectorAll("[data-select-class]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (button.closest(".vault-choice-card.disabled")) return;
    syncDraft();
    state.draft.class_name = button.dataset.selectClass;
    state.draft.class_tracks = [{
      class_name: state.draft.class_name,
      level: Number(state.draft.level || 1),
      xp: Number(state.draft.xp || 0),
      state: "active",
    }];
    renderBuilder();
  }));
  document.querySelectorAll(".vault-choice-card[data-select-race], .vault-choice-card[data-select-class]").forEach((card) => {
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      card.click();
    });
  });
  document.querySelector("[data-roll]")?.addEventListener("click", () => {
    state.draft.original_rolls = Array.from({ length: 6 }, roll4d6DropLowest);
    state.draft.assigned_rolls = {};
    renderBuilder();
  });
  document.querySelectorAll("[name^='assigned_rolls.']").forEach((select) => {
    select.addEventListener("change", () => {
      syncDraft();
      renderBuilder();
    });
  });
  document.querySelectorAll("[data-unassign-roll]").forEach((button) => {
    button.addEventListener("click", () => {
      syncDraft();
      const rollIndex = String(button.dataset.unassignRoll);
      const ability = abilities.find((key) => String(state.draft.assigned_rolls?.[key]) === rollIndex);
      if (ability) state.draft.assigned_rolls[ability] = "";
      renderBuilder();
    });
  });
  document.querySelector("[data-roll-hp]")?.addEventListener("click", () => {
    syncDraft();
    const tracks = draftClassTracks(state.draft);
    const rolls = tracks.map((track) => {
      const info = state.rules?.classes?.[rulesClassName(track.class_name)] || {};
      const expression = track.class_name === "Ranger" ? "2d8" : `d${Number(info.hit_die || 6)}`;
      const roll = rollHitDice(expression);
      const conMod = constitutionHpAdjustment(Number(state.draft.abilities?.constitution || 10), rulesClassName(track.class_name));
      return { ...roll, className: track.class_name, conMod };
    });
    const hp = Math.max(1, Math.floor(rolls.reduce((sum, roll) => sum + roll.total + roll.conMod, 0) / tracks.length));
    state.draft.combat.max_hp = hp;
    state.draft.combat.current_hp = hp;
    state.hpRollMessage = `${rolls.map((roll) => `${roll.className} ${roll.detail} ${formatConEquation(roll.conMod)} CON`).join("; ")} ÷ ${tracks.length} = ${hp} HP`;
    renderBuilder();
  });
  document.querySelector("[data-roll-exceptional-strength]")?.addEventListener("click", () => {
    syncDraft();
    state.draft.exceptional_strength = Math.floor(Math.random() * 100) + 1;
    renderBuilder();
  });
  document.querySelector("[data-roll-gold]")?.addEventListener("click", () => {
    syncDraft();
    const formula = startingWealthFormula(state.draft.class_name);
    const roll = rollStartingWealth(formula);
    if (!roll) {
      state.moneyRollMessage = "Starting gold formula needs DM review.";
    } else {
      state.draft.coins ||= {};
      coins.forEach((coin) => { state.draft.coins[coin] ||= 0; });
      state.draft.coins[roll.coin] = roll.total;
      state.moneyRollMessage = roll.message;
    }
    renderBuilder();
  });
  document.querySelectorAll("[data-add-equipment]").forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault();
    const equipmentId = Number(button.dataset.addEquipment);
    const status = button.dataset.status || "carried";
    const preserveScrollY = window.scrollY;
    const catalogScrollTop = document.querySelector(".vault-equipment-catalog-scroll")?.scrollTop || 0;
    await addOrUpdateInventoryItem(equipmentId, status);
    state.equipmentFeedback[equipmentId] = status === "equipped" ? "equipped" : "added";
    state.draft = initialDraft();
    toast(status === "equipped" ? "Equipped." : "Added.", "success");
    renderBuilder({ preserveScrollY, catalogScrollTop, keepInventoryVisible: true });
  }));
  document.querySelectorAll("[data-preview-equipment]").forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault();
    const equipmentId = Number(button.dataset.previewEquipment);
    if (state.equipmentPreviews[equipmentId]) {
      delete state.equipmentPreviews[equipmentId];
    } else {
      state.equipmentPreviews[equipmentId] = await combatPreviewApi(equipmentId);
    }
    filterEquipment();
  }));
  document.querySelectorAll("[data-add-known-spell]").forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault();
    const character = await ensureSaved();
    state.character = await characterApi(`/${character.id}/spells`, {
      method: "POST",
      body: JSON.stringify({
        spell_id: Number(button.dataset.addKnownSpell),
        known: true,
        prepared: false,
        memorized_count: 0,
        in_spellbook: arcaneSpellbookClass(state.draft.class_name),
      }),
    });
    state.draft = initialDraft();
    toast("Known spell added.", "success");
    renderBuilder();
  }));
  document.querySelectorAll("[data-prof]").forEach((button) => button.addEventListener("click", async () => {
    try {
      const character = await ensureSaved();
      const equipmentId = Number(button.dataset.prof);
      if (button.dataset.profAction === "unmark") {
        state.character = await weaponProficiencyApi(character.id, equipmentId, { method: "DELETE" });
        toast("Proficiency unmarked.", "success");
      } else {
        state.character = await characterApi(`/${character.id}/weapon-proficiencies`, { method: "POST", body: JSON.stringify({ equipment_id: equipmentId, proficient: true, dm_override: state.dmOverride }) });
        toast("Proficiency marked.", "success");
      }
      state.draft = initialDraft();
      renderBuilder();
    } catch (error) {
      toast(readableError(error));
    }
  }));
  bindInventoryActions((renderOptions) => renderBuilder(renderOptions));
  bindMagicItemActions((renderOptions) => renderBuilder(renderOptions));
  document.querySelector("[name='equipment_search']")?.addEventListener("input", (event) => { state.equipmentFilters.q = event.target.value; filterEquipment(); });
  document.querySelector("[name='equipment_type']")?.addEventListener("change", (event) => { state.equipmentFilters.type = event.target.value; filterEquipment(); });
  document.querySelector("[name='allowed_only']")?.addEventListener("change", (event) => { state.equipmentFilters.allowedOnly = event.target.checked; filterEquipment(); });
  document.querySelector("[name='dm_override']")?.addEventListener("change", (event) => { state.dmOverride = event.target.checked; filterEquipment(); });
  document.querySelector("[name='spell_search']")?.addEventListener("input", () => filterSpells());
  document.querySelector("[name='spell_class']")?.addEventListener("change", () => filterSpells());
  document.querySelector("[name='spell_level']")?.addEventListener("change", () => filterSpells());
  bindSpellActions(() => renderBuilder());
}

function syncDraft() {
  document.querySelectorAll("[data-builder-form] [name]").forEach((input) => {
    const value = input.type === "number" ? Number(input.value || 0) : input.value;
    setPath(state.draft, input.name, value);
  });
  applyAssignedRolls();
  persistLocalDraft();
}

function applyAssignedRolls() {
  const rolls = state.draft?.original_rolls || [];
  const assigned = state.draft?.assigned_rolls || {};
  abilities.forEach((ability) => {
    const index = assigned[ability];
    if (index !== "" && index != null && rolls[Number(index)] != null) state.draft.abilities[ability] = Number(rolls[Number(index)]);
  });
}

function setPath(object, path, value) {
  const parts = path.split(".");
  let cursor = object;
  while (parts.length > 1) {
    const part = parts.shift();
    cursor[part] ||= {};
    cursor = cursor[part];
  }
  cursor[parts[0]] = value;
}

async function ensureSaved() {
  if (state.character?.id) return state.character;
  return saveDraft(false);
}

async function characterApi(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const result = isPlayerCharacterMode()
    ? rootApi(`/player/characters${path}`, { ...options, headers: { ...playerAuthHeaders(), ...(options.headers || {}) } })
    : api(`/characters${path}`, options);
  const payload = await result;
  if (method !== "GET") {
    const match = path.match(/^\/(\d+)/);
    invalidateCharacterCache(match ? Number(match[1]) : state.character?.id);
  }
  return payload;
}

async function inventoryApi(inventoryId, options = {}) {
  if (!state.character?.id) throw new Error("Save the character before editing inventory.");
  return characterApi(`/${state.character.id}/inventory/${inventoryId}`, options);
}

async function spellApi(characterSpellId, options = {}) {
  if (!state.character?.id) throw new Error("Save the character before editing spells.");
  return characterApi(`/${state.character.id}/spells/${characterSpellId}`, options);
}

async function weaponProficiencyApi(characterId, equipmentId, options = {}) {
  return characterApi(`/${characterId}/weapon-proficiencies/${equipmentId}`, options);
}

async function combatPreviewApi(equipmentId) {
  const character = await ensureSaved();
  return characterApi(`/${character.id}/combat-preview/${equipmentId}`);
}

async function addOrUpdateInventoryItem(equipmentId, status = "carried") {
  const character = await ensureSaved();
  const existing = (character.inventory || []).find((item) => Number(item.equipment_id) === Number(equipmentId));
  if (existing) {
    const existingQuantity = Number(existing.quantity || 0);
    const quantityStep = initialEquipmentQuantity(equipmentId);
    const nextStatus = status === "equipped" ? "equipped" : existing.status || "carried";
    state.character = await characterApi(`/${character.id}/inventory/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify({
        quantity: status === "carried" ? existingQuantity + quantityStep : Math.max(existingQuantity, quantityStep),
        status: nextStatus,
        storage_location: nextStatus === "stored" ? "Stored" : null,
        dm_override: state.dmOverride,
      }),
    });
    return state.character;
  }
  state.character = await characterApi(`/${character.id}/inventory`, {
    method: "POST",
    body: JSON.stringify({
      equipment_id: Number(equipmentId),
      quantity: initialEquipmentQuantity(equipmentId),
      status,
      storage_location: status === "stored" ? "Stored" : null,
      dm_override: state.dmOverride,
    }),
  });
  return state.character;
}

async function saveDraft(navigate = true) {
  syncDraft();
  const draftStorageKeyBeforeSave = localDraftStorageKey();
  const method = state.character?.id ? "PUT" : "POST";
  const path = state.character?.id ? `/characters/${state.character.id}` : "/characters";
  const payload = characterSavePayload(state.draft);
  state.character = isPlayerCharacterMode()
    ? await rootApi(state.character?.id ? `/player/characters/${state.character.id}` : "/player/characters", { method, headers: playerAuthHeaders(), body: JSON.stringify(payload) })
    : await api(path, { method, body: JSON.stringify(payload) });
  invalidateCharacterCache(state.character.id);
  if (state.character.player?.id) {
    state.currentPlayer = state.character.player;
    localStorage.setItem("drg1e_player_id", String(state.currentPlayer.id));
  }
  state.draft = { ...state.draft, id: state.character.id };
  if (draftStorageKeyBeforeSave) localStorage.removeItem(draftStorageKeyBeforeSave);
  if (navigate && pageKind() === "new") {
    renderBuilder();
    toast("Character saved.", "success");
  } else if (pageKind() === "edit") {
    state.draft = initialDraft();
    if (navigate) renderBuilder();
    toast("Character saved.", "success");
  } else {
    toast("Character saved.", "success");
  }
  return state.character;
}

function characterSavePayload(d) {
  const tracks = draftClassTracks(d);
  const xp = Number(d.xp || 0);
  const xpShare = Math.floor(xp / tracks.length);
  const payload = {
    name: d.name,
    race: d.race,
    class_name: d.class_name,
    subclass_or_specialty: d.subclass_or_specialty,
    alignment: d.alignment,
    level: Number(d.level || 1),
    xp,
    class_tracks: tracks.map((track) => ({ ...track, xp: xpShare })),
    status: d.status || "active",
    life_status: d.life_status || "alive",
    campaign_day: Number(d.campaign_day || 1),
    current_location: d.current_location || "Town",
    notes: d.notes || "",
    original_rolls: Array.isArray(d.original_rolls) ? d.original_rolls.map((roll) => Number(roll)).filter((roll) => Number.isFinite(roll)) : [],
    abilities: Object.fromEntries(abilities.map((ability) => [ability, Number(d.abilities?.[ability] || 10)])),
    exceptional_strength: d.exceptional_strength === "" || d.exceptional_strength == null ? null : Number(d.exceptional_strength),
    coins: Object.fromEntries(coins.map((coin) => [coin, Number(d.coins?.[coin] || 0)])),
    combat: {
      max_hp: Number(d.combat?.max_hp || 1),
      current_hp: Number(d.combat?.current_hp || d.combat?.max_hp || 1),
    },
  };
  if (isPlayerCharacterMode()) {
    const campaignId = campaignIdParam() || state.campaign?.id || d.campaign_id;
    if (campaignId) payload.campaign_id = Number(campaignId);
  } else {
    payload.owner_name = d.owner_name;
    payload.email = d.email;
    payload.discord_user_id = d.discord_user_id;
    if (d.user_id) payload.user_id = Number(d.user_id);
    if (d.campaign_id) payload.campaign_id = Number(d.campaign_id);
  }
  if (!payload.name) payload.name = "Unnamed Adventurer";
  return payload;
}

function filterEquipment() {
  const results = document.querySelector("[data-equipment-results]");
  if (!results) return;
  results.innerHTML = equipmentRows(filteredEquipmentRows());
  bindBuilderActions();
}

function filteredEquipmentRows() {
  const filters = state.equipmentFilters;
  return classAwareEquipment().filter((item) => {
    const allowed = classAllowsEquipment(state.draft?.class_name, item).allowed;
    return (!filters.q || item.name.toLowerCase().includes(filters.q.toLowerCase())) && (!filters.type || item.type === filters.type) && (!filters.allowedOnly || allowed);
  });
}

function filterSpells() {
  const q = document.querySelector("[name='spell_search']")?.value || "";
  const level = document.querySelector("[name='spell_level']")?.value || "";
  const list = document.querySelector("[name='spell_class']")?.value || "";
  const classKeys = list ? [list] : draftSpellListKeys(state.draft);
  const rows = state.spells.filter((spell) => spellMatchesClass(spell, classKeys) && spellAllowedAtCurrentLevel(spell) && (!q || spell.name.toLowerCase().includes(q.toLowerCase())) && (!level || String(spell.spell_level) === level)).slice(0, 90);
  document.querySelector("[data-spell-results]").innerHTML = spellRows(rows);
  bindBuilderActions();
}

function classAwareEquipment() {
  return state.equipment.map((item) => ({ ...item, ...classAllowsEquipment(state.draft?.class_name, item) }));
}

function classAllowsEquipment(className, item) {
  const tracks = draftClassNames(state.draft);
  if (tracks.length > 1) {
    const results = tracks.map((track) => classAllowsSingleClassEquipment(track, item));
    const race = state.draft?.race;
    const restrictive = ["Dwarf", "Gnome"].includes(race) || (race === "Half-Orc" && ["armor", "shield"].includes(item.type));
    if (race === "Gnome" && item.type === "armor") {
      return { allowed: (item.name || "").toLowerCase().includes("leather"), reason: state.rules?.multiclass_restrictions?.[race] || "" };
    }
    return {
      allowed: restrictive ? results.every((result) => result.allowed) : results.some((result) => result.allowed),
      reason: state.rules?.multiclass_restrictions?.[race] || "Race-specific multi-class restriction applies.",
    };
  }
  return classAllowsSingleClassEquipment(className, item);
}

function classAllowsSingleClassEquipment(className, item) {
  const info = state.rules?.classes?.[rulesClassName(className)] || {};
  const name = (item.name || "").toLowerCase();
  if (item.type === "armor") {
    const armorTypes = info.armor_types || [];
    if (armorTypes.includes("any")) return { allowed: true, reason: "Allowed armor" };
    const allowed = armorTypes.some((term) => name.includes(term.toLowerCase()));
    return { allowed, reason: info.armor || "Manual DM Review" };
  }
  if (item.type === "shield") return { allowed: Boolean(info.shields), reason: info.shield_note || (info.shields ? "Allowed shield" : "Class does not allow shields") };
  if (item.type === "weapon") {
    if (isAmmunition(item)) return { allowed: true, reason: "Ammunition" };
    if (info.weapon_policy === "any") return { allowed: true, reason: "Allowed weapon" };
    if (info.weapon_policy === "manual") return { allowed: false, reason: "Manual DM Review" };
    if (info.weapon_policy === "thief") {
      const allowed = ["club", "dagger", "dart", "oil", "sling"].some((term) => name.includes(term)) || (name.includes("sword") && !name.includes("bastard") && !name.includes("two-handed"));
      return { allowed, reason: info.weapons || "" };
    }
    const allowed = (info.allowed_weapon_terms || []).some((term) => name.includes(term));
    return { allowed, reason: info.weapons || "" };
  }
  return { allowed: true, reason: "Noncombat equipment" };
}

function proficiencyCount(className, level) {
  const info = state.rules?.classes?.[rulesClassName(className)] || {};
  if (info.proficiency_initial == null || info.proficiency_every == null) return null;
  return Number(info.proficiency_initial) + Math.floor((Math.max(1, Number(level || 1)) - 1) / Number(info.proficiency_every));
}

function raceClassWarnings(d) {
  return `<p class="vault-muted">All standard classes are allowed for all races. Ask your DM about campaign-specific exceptions.</p>`;
}

function coinCount(values = {}) {
  return coins.reduce((sum, coin) => sum + Math.max(0, Number(values[coin] || 0)), 0);
}

function coinWeight(values = {}) {
  return Math.round((coinCount(values) / 10) * 10) / 10;
}

function adjustedStats(d) {
  const adjustments = dragonlanceRaceProfile(d.race)?.ability_adjustments || state.rules?.races?.[d.race]?.adjustments || {};
  return abilities.map((ability) => [ability, Math.max(3, Math.min(18, Number(d.abilities[ability] || 10) + Number(adjustments[ability] || 0)))]);
}

function previewCharacter() {
  const d = state.draft;
  return { ...d, adjusted_abilities: Object.fromEntries(adjustedStats(d)), inventory: state.character?.inventory || [], spells: state.character?.spells || [], weapon_proficiencies: state.character?.weapon_proficiencies || [], combat: state.character?.combat || d.combat, rules: { equipment: "/1e/equipment/", magic: "/1e/how-to-play/magic/" } };
}

function renderIndex() {
  document.querySelector("[data-vault-view]").innerHTML = `${playerPanelHtml()}<div class="vault-grid">${state.characters.length ? state.characters.map((character) => `<article class="vault-card"><div class="vault-kicker">${h(labelize(character.status))} / ${h(labelize(character.life_status))}</div><h2>${h(character.name)}</h2><p>${h(character.race)} ${h(character.class_display || character.class_name)} ${h(character.level_display || character.level)}</p><p class="vault-muted">Owner: ${h(character.player?.display_name || character.user_id)}${character.campaign_id ? ` / ${h(campaignName(character.campaign_id))}` : ""}</p><div class="vault-statline"><div class="vault-stat"><strong>${character.combat.armor_class}</strong><span>AC</span></div><div class="vault-stat"><strong>${character.combat.current_hp}/${character.combat.max_hp}</strong><span>HP</span></div><div class="vault-stat"><strong>${character.combat.movement_rate}</strong><span>Move</span></div></div><div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${character.id}/">View</a><a class="vault-button secondary" href="/1e/characters/${character.id}/edit/">Edit</a><button class="vault-button secondary" type="button" data-delete="${character.id}">Archive</button></div></article>`).join("") : `<article class="vault-panel"><h2>No characters yet</h2><p>Create your first vault character, then assign them to a campaign when the DM is ready.</p><div class="vault-actions"><a class="vault-button" href="${newCharacterHref()}">Create Character</a></div></article>`}</div>`;
  document.querySelector("[data-player-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    state.currentPlayer = await api("/players", { method: "POST", body: JSON.stringify(data) });
    localStorage.setItem("drg1e_player_id", String(state.currentPlayer.id));
    state.players = await api("/players");
    state.characters = await api(`/characters?user_id=${state.currentPlayer.id}`);
    renderIndex();
  });
  document.querySelector("[name='current_player_id']")?.addEventListener("change", async (event) => {
    const id = Number(event.target.value || 0);
    state.currentPlayer = state.players.find((player) => player.id === id) || null;
    if (state.currentPlayer) localStorage.setItem("drg1e_player_id", String(id));
    state.characters = await api(`/characters${id ? `?user_id=${id}` : ""}`);
    renderIndex();
  });
  document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", async () => {
    await api(`/characters/${button.dataset.delete}`, { method: "DELETE" });
    state.characters = await api(`/characters${state.currentPlayer?.id ? `?user_id=${state.currentPlayer.id}` : ""}`);
    renderIndex();
  }));
}

function playerPanelHtml() {
  return `<section class="vault-panel"><div class="vault-kicker">Player Identity</div><form class="vault-form" data-player-form>
    ${selectField("Current Player", "current_player_id", String(state.currentPlayer?.id || ""), playerSelectOptions())}
    ${field("Player Name", "display_name", state.currentPlayer?.display_name || "Website Player")}
    ${field("Email", "email", state.currentPlayer?.email || "", "email")}
    ${field("Discord User ID", "discord_user_id", state.currentPlayer?.discord_user_id || "")}
    <div class="vault-actions vault-full"><button class="vault-button" type="submit">Save Player</button><a class="vault-button secondary" href="${newCharacterHref()}">Create Character</a></div>
  </form></section>`;
}

function isDmMode() {
  return pageKind().startsWith("dm") || pageKind() === "campaign";
}

function currentUserIsDm() {
  return ["dm", "admin"].includes(state.currentPlayer?.role);
}

function renderSheet(options = {}) {
  document.querySelector("[data-vault-view]").innerHTML = `<div class="vault-sheet">${sheetHtml(state.character)}</div>`;
  bindSheetDisclosureState();
  bindInventoryActions((renderOptions) => renderSheet(renderOptions));
  bindMagicItemActions((renderOptions) => renderSheet(renderOptions));
  document.querySelectorAll("[data-rules-link]").forEach((button) => button.addEventListener("click", () => openRulesModal(button.dataset.rulesTitle, button.dataset.rulesLink)));
  document.querySelector("[data-quick-edit-open]")?.addEventListener("click", () => openQuickEditModal(state.character));
  document.querySelector("[data-level-up-open]")?.addEventListener("click", () => openLevelUpModal(state.character));
  bindSpellActions(() => renderSheet());
  restoreSheetPosition(options);
}

function bindSheetDisclosureState() {
  document.querySelectorAll("[data-sheet-disclosure]").forEach((details) => {
    const key = details.dataset.sheetDisclosure;
    if (key in state.sheetDisclosure) details.open = Boolean(state.sheetDisclosure[key]);
    details.addEventListener("toggle", () => {
      state.sheetDisclosure[key] = details.open;
    });
  });
}

function bindSpellActions(afterAction) {
  document.querySelectorAll("[data-spell-action]").forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault();
    const [id, action] = button.dataset.spellAction.split(":");
    const spell = (state.character?.spells || []).find((entry) => String(entry.id) === id);
    if (!spell) return;
    try {
      if (action === "remove") {
        state.character = await spellApi(id, { method: "DELETE" });
        toast("Known spell removed.", "success");
      } else {
        const currentCount = Number(spell.memorized_count || 0);
        const next = action === "prepare"
          ? { known: true, in_spellbook: spell.in_spellbook, prepared: true, memorized_count: currentCount + 1 }
          : action === "cast"
            ? { known: true, in_spellbook: spell.in_spellbook, prepared: currentCount > 1, memorized_count: Math.max(0, currentCount - 1) }
            : { prepared: false, memorized_count: 0 };
        state.character = await spellApi(id, { method: "PUT", body: JSON.stringify(next) });
        toast(action === "cast" ? "Spell cast." : "Spell updated.", "success");
      }
      state.draft = initialDraft();
      afterAction?.();
    } catch (error) {
      toast(error?.message || "Spell slot limit reached or spell is not eligible.");
    }
  }));
}

function bindInventoryActions(afterAction) {
  document.querySelectorAll("[data-inventory-action]").forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault();
    if (!state.character?.id) return;
    const [id, status, value] = button.dataset.inventoryAction.split(":");
    const item = (state.character.inventory || []).find((entry) => String(entry.id) === String(id));
    const preserveScrollY = window.scrollY;
    const catalogScrollTop = document.querySelector(".vault-equipment-catalog-scroll")?.scrollTop;
    try {
      if (status === "delete") {
        if (!(await confirmDropItem(item))) return;
        state.character = await inventoryApi(id, { method: "DELETE" });
      } else if (status === "quantity") {
        const nextQuantity = Math.max(0, Number(value || 0));
        state.character = nextQuantity === 0
          ? await inventoryApi(id, { method: "DELETE" })
          : await inventoryApi(id, {
            method: "PUT",
            body: JSON.stringify({ quantity: nextQuantity }),
          });
      } else {
        state.character = await inventoryApi(id, {
          method: "PUT",
          body: JSON.stringify({
            status,
            storage_location: status === "stored" ? "Stored" : null,
          }),
        });
      }
      state.draft = initialDraft();
      state.sheetDisclosure.inventoryOpen = true;
      toast(inventoryActionMessage(status), "success");
      afterAction({ preserveScrollY, catalogScrollTop, changedInventoryId: id, keepInventoryVisible: true });
    } catch (error) {
      toast(readableError(error));
    }
  }));
}

function bindMagicItemActions(afterAction) {
  document.querySelector("[data-magic-item-add]")?.addEventListener("click", () => openMagicItemCatalogModal());
  document.querySelectorAll("[data-magic-item-edit]").forEach((button) => button.addEventListener("click", () => {
    const item = (state.character?.magic_items || []).find((entry) => String(entry.id) === String(button.dataset.magicItemEdit));
    openMagicItemModal(item);
  }));
  document.querySelectorAll("[data-magic-item-action]").forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault();
    const [id, action, value] = button.dataset.magicItemAction.split(":");
    const items = [...(state.character?.magic_items || [])];
    const index = items.findIndex((item) => String(item.id) === String(id));
    if (index < 0) return;
    if (action === "delete" && !(await confirmMagicItemDrop(items[index]))) return;
    const preserveScrollY = window.scrollY;
    const nextItems = action === "delete"
      ? items.filter((item) => String(item.id) !== String(id))
      : items.map((item) => {
        if (String(item.id) !== String(id)) return item;
        if (action === "status") return { ...item, status: value || "carried" };
        if (action === "charges") return { ...item, charges: Math.max(0, Number(value || 0)) };
        if (action === "identified") return { ...item, identified: !item.identified };
        return item;
      });
    await saveMagicItems(nextItems);
    state.sheetDisclosure.magicItemsOpen = true;
    toast(action === "delete" ? "Magic item removed." : "Magic item updated.", "success");
    afterAction?.({ preserveScrollY, keepMagicItemsVisible: true });
  }));
}

async function saveMagicItems(items) {
  state.character = await characterApi(`/${state.character.id}`, {
    method: "PUT",
    body: JSON.stringify({ magic_items: items }),
  });
  state.draft = initialDraft();
}

async function openMagicItemCatalogModal() {
  document.querySelector(".vault-magic-item-modal")?.remove();
  const modal = document.createElement("div");
  modal.className = "vault-rules-modal vault-magic-item-modal";
  modal.innerHTML = `<div class="vault-rules-popout vault-quick-popout vault-magic-catalog-popout"><button class="vault-modal-close" type="button" aria-label="Close">x</button><div class="vault-kicker">Add OSRIC Magic Item</div>
    <div class="vault-magic-catalog-tools">
      <label class="vault-field wide">Search OSRIC Magic Items<input type="search" data-magic-catalog-filter placeholder="Sword, ring, wand, shield..."></label>
      ${selectField("Category", "catalog_category", "All", ["All", ...magicItemCategories()]).replace('name="catalog_category"', 'name="catalog_category" data-magic-catalog-category')}
    </div>
    <div class="vault-panel-toast vault-full" data-panel-toast>Loading OSRIC magic item catalog...</div>
    <div class="vault-magic-catalog-results" data-magic-catalog-results></div>
  </div>`;
  const close = () => modal.remove();
  modal.querySelector(".vault-modal-close").addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  document.body.appendChild(modal);
  try {
    const catalog = await loadMagicItemCatalog();
    await loadEquipmentCatalog();
    const toastNode = modal.querySelector("[data-panel-toast]");
    const resultsNode = modal.querySelector("[data-magic-catalog-results]");
    const filterNode = modal.querySelector("[data-magic-catalog-filter]");
    const categoryNode = modal.querySelector("[data-magic-catalog-category]");
    const renderCatalog = () => {
      const query = filterNode.value.trim().toLowerCase();
      const category = categoryNode.value;
      const rows = catalog.filter((item) => {
        const haystack = `${item.name} ${item.category} ${item.description || ""} ${item.equipment_effects?.notes || ""}`.toLowerCase();
        return (!query || haystack.includes(query)) && (category === "All" || item.category === category);
      });
      toastNode.textContent = `${rows.length} OSRIC magic item${rows.length === 1 ? "" : "s"} found.`;
      resultsNode.innerHTML = rows.slice(0, 80).map(magicCatalogRowHtml).join("") || `<p class="vault-compact-empty">No OSRIC magic items match that search.</p>`;
      resultsNode.querySelectorAll("[data-magic-catalog-add]").forEach((button) => button.addEventListener("click", async () => {
        const record = catalog.find((entry) => entry.id === button.dataset.magicCatalogAdd);
        if (!record) return;
        const defaultBase = magicDefaultAppliedEquipment(record);
        if (defaultBase) {
          const items = state.character?.magic_items || [];
          const magicItem = magicItemFromCatalogRecord(record, defaultBase);
          await saveMagicItems([...items, magicItem]);
          state.sheetDisclosure.magicItemsOpen = true;
          state.sheetDisclosure.inventoryOpen = true;
          toast(`${magicItem.name} added.`, "success");
          close();
          renderSheet({ keepMagicItemsVisible: true });
          return;
        }
        if (magicItemNeedsBaseEquipment(record)) {
          close();
          openMagicBaseEquipmentModal(record);
          return;
        }
        const items = state.character?.magic_items || [];
        await saveMagicItems([...items, magicItemFromCatalogRecord(record)]);
        state.sheetDisclosure.magicItemsOpen = true;
        toast(`${record.name} added.`, "success");
        close();
        renderSheet({ keepMagicItemsVisible: true });
      }));
    };
    filterNode.addEventListener("input", renderCatalog);
    categoryNode.addEventListener("change", renderCatalog);
    renderCatalog();
  } catch (error) {
    modal.querySelector("[data-panel-toast]").textContent = readableError(error);
  }
}

function openMagicBaseEquipmentModal(record) {
  document.querySelector(".vault-magic-item-modal")?.remove();
  const modal = document.createElement("div");
  modal.className = "vault-rules-modal vault-magic-item-modal";
  const baseItems = magicBaseEquipmentOptions(record);
  modal.innerHTML = `<div class="vault-rules-popout vault-quick-popout"><button class="vault-modal-close" type="button" aria-label="Close">x</button><div class="vault-kicker">Choose Base Item</div>
    <form class="vault-form" data-magic-base-form>
      <div class="vault-magic-item-source vault-full"><strong>${h(record.name)}</strong><span>${h(magicItemSourceLabel(record))}</span></div>
      <label class="vault-field wide">Base Weapon / Armor / Shield<select name="base_equipment_id">${selectOptionsHtml([{ value: "", label: "Choose base item" }, ...baseItems.map((item) => ({ value: item.id, label: item.name }))])}</select></label>
      <div class="vault-panel-toast vault-full" data-panel-toast>${baseItems.length ? "The magic item will use this base item's weight, weapon damage, armor AC, and rules." : "No matching base equipment found."}</div>
      <div class="vault-actions vault-full"><button class="vault-button" type="submit" ${baseItems.length ? "" : "disabled"}>Add Magic Item</button></div>
    </form></div>`;
  modal.querySelector(".vault-modal-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("[data-magic-base-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const base = baseItems.find((item) => String(item.id) === String(data.base_equipment_id));
    if (!base) {
      modal.querySelector("[data-panel-toast]").textContent = "Choose a base item first.";
      return;
    }
    const items = state.character?.magic_items || [];
    const magicItem = magicItemFromCatalogRecord(record, base);
    await saveMagicItems([...items, magicItem]);
    state.sheetDisclosure.magicItemsOpen = true;
    state.sheetDisclosure.inventoryOpen = true;
    toast(`${magicItem.name} added.`, "success");
    modal.remove();
    renderSheet({ keepMagicItemsVisible: true });
  });
  document.body.appendChild(modal);
}

function openMagicItemModal(item = null) {
  document.querySelector(".vault-magic-item-modal")?.remove();
  const current = item || { name: "", category: "Misc Magic", status: "carried", identified: false, charges: "", max_charges: "", notes: "" };
  const catalogMeta = current.catalog_id ? `<div class="vault-magic-item-source vault-full"><strong>${h(current.name || "Magic Item")}</strong><span>${h(magicItemSourceLabel(current))}</span></div><input type="hidden" name="name" value="${h(current.name || "")}"><input type="hidden" name="category" value="${h(current.category || "Misc Magic")}">` : `${field("Name", "name", current.name || "", "text", "wide")}${selectField("Category", "category", current.category || "Misc Magic", magicItemCategories())}`;
  const modal = document.createElement("div");
  modal.className = "vault-rules-modal vault-magic-item-modal";
  modal.innerHTML = `<div class="vault-rules-popout vault-quick-popout"><button class="vault-modal-close" type="button" aria-label="Close">x</button><div class="vault-kicker">${item ? "Edit" : "Add"} Magic Item</div><form class="vault-form" data-magic-item-form>
    ${catalogMeta}
    ${selectField("Status", "status", current.status || "carried", ["equipped", "carried", "stored", "lost", "destroyed"])}
    ${field("Charges", "charges", current.charges ?? "", "number")}
    ${field("Max Charges", "max_charges", current.max_charges ?? "", "number")}
    <label class="vault-check vault-full"><input type="checkbox" name="identified" ${current.identified ? "checked" : ""}> Identified</label>
    <label class="vault-field full">Notes<textarea name="notes">${h(current.notes || "")}</textarea></label>
    <div class="vault-panel-toast vault-full" data-panel-toast></div>
    <div class="vault-actions vault-full"><button class="vault-button" type="submit">Save Magic Item</button></div>
  </form></div>`;
  modal.querySelector(".vault-modal-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("[data-magic-item-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const payload = {
      id: item?.id || `magic-${Date.now()}`,
      name: data.name,
      category: data.category,
      catalog_id: item?.catalog_id || "",
      source: item?.source || "",
      source_ref: item?.source_ref || {},
      description: item?.description || "",
      weight: item?.weight ?? null,
      equipment_effects: item?.equipment_effects || {},
      applied_equipment: item?.applied_equipment || null,
      status: data.status || "carried",
      identified: data.identified === "on",
      charges: data.charges === "" ? null : Number(data.charges),
      max_charges: data.max_charges === "" ? null : Number(data.max_charges),
      notes: data.notes,
    };
    if (!payload.name.trim()) {
      modal.querySelector("[data-panel-toast]").textContent = "Magic item name is required.";
      return;
    }
    const items = state.character?.magic_items || [];
    const nextItems = item
      ? items.map((entry) => String(entry.id) === String(item.id) ? payload : entry)
      : [...items, payload];
    await saveMagicItems(nextItems);
    state.sheetDisclosure.magicItemsOpen = true;
    toast("Magic item saved.", "success");
    modal.remove();
    renderSheet({ keepMagicItemsVisible: true });
  });
  document.body.appendChild(modal);
}

function confirmMagicItemDrop(item) {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "vault-rules-modal";
    modal.innerHTML = `<div class="vault-rules-popout"><div class="vault-kicker">Confirm Remove</div><h2>Remove ${h(item?.name || "magic item")}?</h2><p>This removes the magic item from this character only.</p><div class="vault-actions"><button class="vault-button secondary" type="button" data-drop-cancel>Cancel</button><button class="vault-button danger-button" type="button" data-drop-confirm>Remove</button></div></div>`;
    const close = (result) => {
      modal.remove();
      resolve(result);
    };
    modal.querySelector("[data-drop-cancel]").addEventListener("click", () => close(false));
    modal.querySelector("[data-drop-confirm]").addEventListener("click", () => close(true));
    modal.addEventListener("click", (event) => { if (event.target === modal) close(false); });
    document.body.appendChild(modal);
  });
}

function restoreSheetPosition(options = {}) {
  if (options.preserveScrollY === undefined && !options.changedInventoryId && !options.keepMagicItemsVisible) return;
  window.requestAnimationFrame(() => {
    const row = options.changedInventoryId ? document.querySelector(`[data-inventory-row="${options.changedInventoryId}"]`) : null;
    if (row) {
      row.scrollIntoView({ block: "nearest" });
    } else if (options.keepMagicItemsVisible) {
      document.querySelector(".vault-sheet-magic-items")?.scrollIntoView({ block: "nearest" });
    } else if (options.preserveScrollY !== undefined) {
      window.scrollTo({ top: options.preserveScrollY, left: 0 });
    } else if (options.keepInventoryVisible) {
      document.querySelector(".vault-sheet-inventory")?.scrollIntoView({ block: "nearest" });
    }
  });
}

function restoreBuilderPosition(options = {}) {
  if (options.catalogScrollTop !== undefined) {
    const catalog = document.querySelector(".vault-equipment-catalog-scroll");
    if (catalog) catalog.scrollTop = options.catalogScrollTop;
  }
  if (options.preserveScrollY === undefined && !options.changedInventoryId && !options.keepInventoryVisible) return;
  window.requestAnimationFrame(() => {
    const row = options.changedInventoryId ? document.querySelector(`[data-inventory-row="${options.changedInventoryId}"]`) : null;
    if (row) {
      row.scrollIntoView({ block: "nearest" });
    } else if (options.keepInventoryVisible) {
      document.querySelector("[data-builder-inventory]")?.scrollIntoView({ block: "nearest" });
    } else if (options.preserveScrollY !== undefined) {
      window.scrollTo({ top: options.preserveScrollY, left: 0 });
    }
  });
}

function inventoryActionMessage(status) {
  const messages = {
    equipped: "Equipped.",
    carried: "Unequipped.",
    stored: "Stored.",
    delete: "Item dropped.",
    quantity: "Quantity updated.",
  };
  return messages[status] || "Saved.";
}

function confirmDropItem(item) {
  const name = inventoryItemName(item || {});
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "vault-rules-modal";
    modal.innerHTML = `<div class="vault-rules-popout"><div class="vault-kicker">Confirm Drop</div><h2>Drop ${h(name)}?</h2><p>This removes the item from the character's inventory.</p><div class="vault-actions"><button class="vault-button secondary" type="button" data-drop-cancel>Cancel</button><button class="vault-button danger-button" type="button" data-drop-confirm>Drop Item</button></div></div>`;
    const close = (result) => {
      modal.remove();
      resolve(result);
    };
    modal.querySelector("[data-drop-cancel]").addEventListener("click", () => close(false));
    modal.querySelector("[data-drop-confirm]").addEventListener("click", () => close(true));
    modal.addEventListener("click", (event) => { if (event.target === modal) close(false); });
    document.body.appendChild(modal);
  });
}

function readableError(error) {
  try {
    const parsed = JSON.parse(error.message);
    return parsed.detail || error.message;
  } catch {
    return error.message || "Action failed.";
  }
}

function openQuickEditModal(c) {
  document.querySelector(".vault-quick-modal")?.remove();
  const modal = document.createElement("div");
  modal.className = "vault-rules-modal vault-quick-modal";
  modal.innerHTML = `<div class="vault-rules-popout vault-quick-popout"><button class="vault-modal-close" type="button" aria-label="Close">x</button><div class="vault-kicker">Quick Edit</div><form class="vault-form" data-quick-edit>
    ${field("Current HP", "current_hp", c.combat?.current_hp ?? 1, "number")}
    ${field("Max HP", "max_hp", c.combat?.max_hp ?? 1, "number")}
    ${field("Temp HP", "temporary_hp", c.combat?.temporary_hp ?? 0, "number")}
    ${field("XP", "xp", c.xp ?? 0, "number")}
    ${field("Campaign Day", "campaign_day", c.campaign_day ?? 1, "number")}
    ${field("Current Location", "current_location", c.current_location || "Town", "text", "wide")}
    ${coins.map((coin) => field(title(coin), `coin_${coin}`, c.coins?.[coin] ?? 0, "number")).join("")}
    <label class="vault-field full">Notes<textarea name="notes">${h(c.notes || "")}</textarea></label>
    <div class="vault-panel-toast vault-full" data-panel-toast></div>
    <div class="vault-actions vault-full"><button class="vault-button" type="submit">Save</button><a class="vault-button secondary" href="${characterEditHref(c.id)}">Full Edit</a></div>
  </form></div>`;
  modal.querySelector(".vault-modal-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("[data-quick-edit]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const coinsPatch = Object.fromEntries(coins.map((coin) => [coin, Number(data[`coin_${coin}`] || 0)]));
    const patchPayload = {
      xp: Number(data.xp || 0),
      campaign_day: Number(data.campaign_day || 1),
      current_location: data.current_location,
      notes: data.notes,
      coins: coinsPatch,
      combat: { current_hp: Number(data.current_hp || 0), max_hp: Number(data.max_hp || 0), temporary_hp: Number(data.temporary_hp || 0) },
    };
    state.character = isPlayerCharacterMode()
      ? await rootApi(`/player/characters/${state.character.id}`, { method: "PUT", headers: playerAuthHeaders(), body: JSON.stringify(patchPayload) })
      : await api(`/characters/${state.character.id}`, {
      method: "PUT",
      body: JSON.stringify(patchPayload),
    });
    invalidateCharacterCache(state.character.id);
    toast("Saved.");
    modal.remove();
    renderSheet();
  });
  document.body.appendChild(modal);
}

async function openLevelUpModal(c, selectedClass = null) {
  if (!c?.id) return;
  document.querySelector(".vault-level-modal")?.remove();
  try {
    const tracks = Array.isArray(c.class_tracks) && c.class_tracks.length ? c.class_tracks : [{ class_name: c.class_name, level: c.level, xp: c.xp }];
    const activeClass = selectedClass || tracks[0].class_name;
    const preview = await characterApi(`/${c.id}/advancement-preview?class_track=${encodeURIComponent(activeClass)}`);
    const hp = preview.hit_point_advancement || {};
    const modal = document.createElement("div");
    modal.className = "vault-rules-modal vault-level-modal";
    const blockers = preview.advancement_blockers || [];
    const spellLevels = preview.spellcasting?.new_spell_levels_unlocked || [];
    modal.innerHTML = `<div class="vault-rules-popout vault-quick-popout"><button class="vault-modal-close" type="button" aria-label="Close">x</button><div class="vault-kicker">Level Up Preview</div>
      <h2>Level ${h(preview.current_class_level)} &rarr; ${h(preview.next_level)}</h2>
      ${tracks.length > 1 ? `<div class="vault-actions">${tracks.map((track) => `<button class="vault-button ${track.class_name === activeClass ? "" : "secondary"}" type="button" data-level-track="${h(track.class_name)}">${h(track.class_name)} ${h(track.level)}</button>`).join("")}</div>` : ""}
      <div class="vault-mini-stat-grid">
        ${miniStat("XP Needed", preview.xp_required ?? 0)}
        ${miniStat("HP Roll", hp.roll || (hp.fixed_hp_gain ? `+${hp.fixed_hp_gain}` : "None"))}
        ${miniStat("Con", formatSigned(hp.constitution_modifier || 0))}
        ${miniStat("Status", blockers.length ? "Blocked" : "Ready")}
      </div>
      ${blockers.length ? `<div class="vault-warning">${blockers.map((blocker) => `<p>${h(blocker)}</p>`).join("")}</div>` : ""}
      <div class="vault-breakdown-list">
        <div><span>Attack</span><strong>${h(preview.attack_progression?.changed ? "Updates" : "No change")}</strong></div>
        <div><span>Saves</span><strong>${h(preview.saving_throws?.changed ? "Update" : "No change")}</strong></div>
        <div><span>Spell Slots</span><strong>${h(preview.spellcasting?.changed ? "Update" : "No change")}</strong></div>
        <div><span>New Spell Levels</span><strong>${h(spellLevels.length ? spellLevels.join(", ") : "None")}</strong></div>
        <div><span>New Abilities</span><strong>${h((preview.new_class_abilities || []).map((ability) => ability.name).join(", ") || "None")}</strong></div>
      </div>
      <form class="vault-form" data-level-up-form>
        ${field("Current XP", "current_xp", Number(c.xp || 0), "number")}
        ${hp.roll ? field(`HP Roll Result (${hp.roll})`, "hp_gain", "", "number") : ""}
        ${field("Total XP After Level Up", "xp_after", Math.max(Number(c.xp || 0), Number(preview.xp_required || 0) * tracks.length), "number")}
        <label class="vault-field full">Player Notes<textarea name="notes"></textarea></label>
        <div class="vault-panel-toast vault-full" data-panel-toast></div>
        <div class="vault-actions vault-full"><button class="vault-button secondary" type="button" data-level-up-save-xp>Save XP / Refresh Preview</button><button class="vault-button" type="submit" ${blockers.length ? "disabled" : ""}>Apply Level Up</button></div>
      </form>
      ${strictClassRulesHtml(preview)}
    </div>`;
    modal.querySelector(".vault-modal-close").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
    modal.querySelectorAll("[data-level-track]").forEach((button) => button.addEventListener("click", () => {
      modal.remove();
      openLevelUpModal(c, button.dataset.levelTrack);
    }));
    modal.querySelector("[data-level-up-save-xp]")?.addEventListener("click", async () => {
      const form = modal.querySelector("[data-level-up-form]");
      const data = Object.fromEntries(new FormData(form));
      const panel = modal.querySelector("[data-panel-toast]");
      try {
        state.character = await characterApi(`/${c.id}`, {
          method: "PATCH",
          body: JSON.stringify({ xp: Number(data.current_xp || c.xp || 0) }),
        });
        invalidateCharacterCache(c.id);
        modal.remove();
        await openLevelUpModal(state.character);
      } catch (error) {
        panel.textContent = readableError(error);
      }
    });
    modal.querySelector("[data-level-up-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target));
      try {
        state.character = await characterApi(`/${c.id}/advance`, {
          method: "POST",
          body: JSON.stringify({
            target_level: preview.next_level,
            class_track: activeClass,
            xp: Number(data.xp_after || preview.xp_required || c.xp || 0),
            hp_gain: hp.roll ? Number(data.hp_gain || 0) : null,
            notes: data.notes,
          }),
        });
        state.draft = initialDraft();
        invalidateCharacterCache(c.id);
        toast("Level up applied.", "success");
        modal.remove();
        renderSheet();
      } catch (error) {
        const panel = modal.querySelector("[data-panel-toast]");
        panel.textContent = readableError(error);
      }
    });
    document.body.appendChild(modal);
  } catch (error) {
    toast(readableError(error));
  }
}

function strictClassRulesHtml(preview) {
  return `<details class="vault-breakdown vault-class-rules"><summary>Class Advancement Rules</summary>
    <p>This level-up tool currently applies single-class advancement only. Multiclass and dual-class characters need separate class tracks before the app can update them safely.</p>
    <p><strong>Multiclass:</strong> chosen at character creation for eligible non-human races; XP is divided between classes and each class advances on its own track.</p>
    <p><strong>Dual-class:</strong> human-only; the character stops advancing the original class, begins a new class, and regains former class abilities only after surpassing the original class level.</p>
    <p class="vault-muted">Planned support: ${h([...(preview.multiclass?.missing_persistent_fields || []), ...(preview.dual_class?.missing_persistent_fields || [])].join(", ") || "class-track state and advancement history")}.</p>
  </details>`;
}

function sheetHtml(c) {
  return `${sheetHeaderHtml(c)}
  <section class="vault-sheet-card vault-sheet-abilities">${sheetSectionHeading("Ability Scores")}${abilityStripHtml(c)}</section>
  <div class="vault-sheet-layout">
    <section class="vault-sheet-card vault-sheet-combat">${sheetSectionHeading("Combat")}${combatSummaryHtml(c)}</section>
    <section class="vault-sheet-card vault-sheet-inventory"><details data-sheet-disclosure="inventoryOpen" ${state.sheetDisclosure.inventoryOpen ? "open" : ""}><summary>${sheetSectionHeading("Inventory")}</summary>${inventoryHtml(c)}</details></section>
    <section class="vault-sheet-card vault-sheet-magic-items"><details data-sheet-disclosure="magicItemsOpen" ${state.sheetDisclosure.magicItemsOpen ? "open" : ""}><summary>${sheetSectionHeading("Magic Items")}</summary>${magicItemsHtml(c)}</details></section>
    <section class="vault-sheet-card vault-sheet-spells"><details data-sheet-disclosure="spellsOpen" ${state.sheetDisclosure.spellsOpen ? "open" : ""}><summary>${sheetSectionHeading("Spells")}</summary>${spellsHtml(c)}</details></section>
    <section class="vault-sheet-card vault-sheet-notes"><details data-sheet-disclosure="campaignOpen" ${state.sheetDisclosure.campaignOpen ? "open" : ""}><summary>${sheetSectionHeading("Campaign")}</summary><p>Day ${h(c.campaign_day)} at ${h(c.current_location)}.</p><p>${h(c.notes || "No notes.")}</p></details></section>
  </div>`;
}

function sheetSectionHeading(label) {
  return `<h3 class="vault-sheet-section-title">${h(label)}</h3>`;
}

function sheetHeaderHtml(c) {
  const runtime = c.combat?.runtime || {};
  const thac0 = runtime.thac0?.final_thac0 ?? runtime.thac0?.base_thac0 ?? "-";
  return `<section class="vault-sheet-header">
    <div class="vault-sheet-header-grid">
      <div class="vault-sheet-primary">
        <div class="vault-sheet-title">
          <h2>${h(c.name || "Unnamed")}</h2>
          <div class="vault-identity-pills">
            <span>${h(labelize(c.race || ""))}</span><span>${h(c.class_display || c.class_name)}</span><span>Level ${h(c.level_display || c.level)}</span><span>${h(labelize(c.alignment || ""))}</span><span>${h(labelize(c.status || ""))}</span><span>${h(labelize(c.life_status || ""))}</span>
            <span>Level ${h(c.level ?? 1)}</span>
          </div>
        </div>
        <div class="vault-topline">
          <span><strong>XP</strong>${h(c.xp ?? 0)}</span>
          <span><strong>HP</strong>${h(hpSummary(c))}</span>
          <span><strong>AC</strong>${h(armorClassFacingSummary(c))}</span>
          <span><strong>THAC0</strong>${h(thac0)}</span>
          <span><strong>Move</strong>${h(c.combat?.movement_rate ?? 120)}'</span>
          <span><strong>Enc</strong>${h(encumbranceSummary(c))}</span>
        </div>
        <div class="vault-actions vault-sheet-actions"><button class="vault-button secondary" type="button" data-quick-edit-open>Quick Edit</button><a class="vault-button secondary" href="${characterEditHref(c.id || "")}">Full Edit</a><button class="vault-button secondary" type="button" data-level-up-open>Level Up</button></div>
      </div>
      <aside class="vault-sheet-race-class">
        <div class="vault-kicker">Race / Class</div>
        ${raceClassSummaryHtml(c)}
        <details class="vault-breakdown"><summary>Open Details</summary>${raceClassDetailsHtml(c)}</details>
      </aside>
    </div>
    ${warningsHtml(c)}
  </section>`;
}

function hpSummary(c) {
  const current = c.combat?.current_hp ?? 1;
  const max = c.combat?.max_hp ?? 1;
  const temporary = Number(c.combat?.temporary_hp || 0);
  return temporary > 0 ? `${current}/${max} +${temporary}` : `${current}/${max}`;
}

function encumbranceSummary(c) {
  const band = String(c.combat?.encumbrance_band || "Unencumbered").toLowerCase();
  if (band.includes("unencumbered")) return "None";
  if (band.includes("normal")) return "Normal";
  if (band.includes("light")) return "Light";
  if (band.includes("medium")) return "Medium";
  if (band.includes("heavy")) return "Heavy";
  if (band.includes("severe")) return "Severe";
  return title(c.combat?.encumbrance_band || "None").replace(/\s+Encumbered$/i, "");
}

function raceClassSummaryHtml(c) {
  const classDetails = c.class_details || {};
  const raceDetails = c.race_details || {};
  const fields = [
    ["Base", classDetails.rules_class_name || rulesClassName(c.class_name)],
    ["Hit Die", hitDiceText(c)],
    ["Armor", classDetails.armor],
    ["Weapons", classDetails.weapons],
    ["Vision", raceDetails.vision || raceDetails.infravision],
    ["Languages", (raceDetails.languages || []).slice(0, 4).join(", ")],
  ];
  return `<dl class="vault-summary-list">${fields.filter(([, value]) => playerFacingValue(value)).map(([label, value]) => `<div><dt>${h(label)}</dt><dd>${h(value)}</dd></div>`).join("")}</dl>`;
}

function abilityStripHtml(c) {
  const breakdown = c.combat?.ability_breakdown || {};
  return `<div class="vault-abilities">${abilities.map((ability) => {
    const base = c.abilities?.[ability] ?? 10;
    const adjusted = c.adjusted_abilities?.[ability] ?? base;
    const changed = Number(base) !== Number(adjusted);
    const runtime = breakdown[ability] || {};
    const display = runtime.display || (ability === "strength" ? (c.strength_display || adjusted) : adjusted);
    return `<span><strong>${abilityLabels[ability]}</strong>${h(display)}${changed ? `<em>${h(base)}</em>` : ""}${abilityModifierSummaryHtml(ability, runtime)}</span>`;
  }).join("")}</div>`;
}

function abilityModifierSummaryHtml(ability, runtime = {}) {
  const fields = {
    strength: [["Hit", runtime.melee_to_hit, true], ["Dmg", runtime.melee_damage, true]],
    dexterity: [["Missile", runtime.missile_to_hit, true], ["AC", runtime.armor_class_adjustment, true], ["React", runtime.reaction_initiative, true]],
    constitution: [["HP/Die", runtime.hit_point_adjustment, true]],
    wisdom: [["Mental Save", runtime.mental_save_bonus, true]],
    intelligence: [["Languages", runtime.additional_languages, false]],
    charisma: [["Henchmen", runtime.max_henchmen, false]],
  }[ability] || [];
  const rendered = fields
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value, signed]) => `<small>${h(label)} ${h(signed ? formatSigned(value) : value)}</small>`)
    .join("");
  return rendered ? `<em class="vault-ability-mods">${rendered}</em>` : "";
}

function movementEncumbranceHtml(c) {
  const enc = c.combat?.encumbrance || {};
  return `<div class="vault-mini-stat-grid">
    ${miniStat("Move", `${c.combat?.movement_rate ?? 120}'`)}
    ${miniStat("Enc", encumbranceSummary(c))}
    ${miniStat("Carry", `${c.combat?.carried_weight ?? 0} / ${enc.max_carried ?? ""} lb`)}
    ${miniStat("Next", enc.next_encumbrance ? `${enc.next_encumbrance} lb` : "None")}
  </div><details class="vault-breakdown"><summary>Details</summary>
    <div class="vault-breakdown-list">
      <div><span>Race Movement</span><strong>${h(enc.race_movement ?? "")} ft</strong></div>
      <div><span>Weight-Based Move</span><strong>${h(enc.weight_movement ?? "")} ft</strong></div>
      <div><span>Armor Cap</span><strong>${enc.armor_move_limit ? `${h(enc.armor_move_limit)} ft` : "None"}</strong></div>
      <div><span>Unencumbered Through</span><strong>${h(enc.unencumbered_through ?? "")} lb</strong></div>
      <div><span>Maximum Load</span><strong>${h(enc.max_carried ?? "")} lb</strong></div>
      <div><span>Strength Adjustment</span><strong>${h(formatSigned(enc.strength_adjustment || 0))} lb</strong></div>
    </div>
  </details>`;
}

function movementEncumbranceDetailsHtml(c) {
  const enc = c.combat?.encumbrance || {};
  return `<div class="vault-tile-details">
    <div><span>Base Move</span><strong>${h(enc.race_movement ?? "")}'</strong></div>
    <div><span>Weight Move</span><strong>${h(enc.weight_movement ?? "")}'</strong></div>
    ${enc.armor_move_limit ? `<div><span>Armor Cap</span><strong>${h(enc.armor_move_limit)}'</strong></div>` : ""}
    <div><span>Final Move</span><strong>${h(enc.movement ?? c.combat?.movement_rate ?? "")}'</strong></div>
    <div><span>Carried</span><strong>${h(c.combat?.carried_weight ?? 0)} lb</strong></div>
    <div><span>Maximum</span><strong>${h(enc.max_carried ?? "")} lb</strong></div>
    <div><span>Next Band</span><strong>${enc.next_encumbrance ? `${h(enc.next_encumbrance)} lb` : "None"}</strong></div>
    <div><span>Status</span><strong>${h(c.combat?.encumbrance_band ?? "Unencumbered")}</strong></div>
  </div>`;
}

function miniStat(label, value) {
  return `<span class="vault-mini-stat"><strong>${h(label)}</strong>${h(value)}</span>`;
}

function sectionTitle(label, reference) {
  return `<button class="vault-section-title" type="button" data-rules-title="${h(label)}" data-rules-link="${h(reference)}">${h(label)}</button>`;
}

function openRulesModal(titleText, reference) {
  document.querySelector(".vault-rules-modal")?.remove();
  const modal = document.createElement("div");
  modal.className = "vault-rules-modal";
  modal.innerHTML = `<div class="vault-rules-popout"><button class="vault-modal-close" type="button" aria-label="Close">x</button><div class="vault-kicker">Rules Reference</div><h2>${h(titleText)}</h2><p>${h(displayReference(reference))}</p><div class="vault-actions"><a class="vault-button" href="${h(reference)}" target="_blank" rel="noreferrer">Open Reference</a></div></div>`;
  modal.querySelector(".vault-modal-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function inventoryHtml(c) {
  const items = c.inventory || [];
  const proficiencies = c.weapon_proficiencies || [];
  const buckets = [
    ["equipped", "Equipped"],
    ["carried", "Carried"],
    ["stored", "Stored"],
    ["coins", "Coins"],
    ["lost", "Lost / Destroyed"],
  ];
  return buckets.map(([status, label]) => {
    if (status === "coins") return inventoryCoinsHtml(c);
    const bucket = items.filter((item) => item.status === status || (status === "lost" && ["lost", "destroyed"].includes(item.status)));
    if (!bucket.length) return "";
    return `<h3 class="vault-inventory-group">${label}</h3>${inventoryTable(bucket, proficiencies)}`;
  }).join("") || "<p>No inventory yet.</p>";
}

function inventoryCoinsHtml(c) {
  const count = c.combat?.coin_count ?? coinCount(c.coins);
  if (!count) return "";
  return `<h3 class="vault-inventory-group">Coins</h3><div class="vault-mini-stat-grid">
    ${miniStat("Coins", count)}
    ${miniStat("Weight", `${c.combat?.coin_weight ?? coinWeight(c.coins)} lb`)}
  </div>`;
}

function inventoryTable(items, proficiencies = []) {
  return `<table class="vault-table"><thead><tr><th>Item</th><th>Type</th><th>Weight</th><th>Cost</th><th>Status</th><th>Actions</th></tr></thead><tbody>${items.map((item) => inventoryRow(item, proficiencies)).join("")}</tbody></table>`;
}

function inventoryRow(item, proficiencies = []) {
  const equipment = item.equipment || {};
  const isEquipped = item.status === "equipped";
  const isStored = item.status === "stored";
  const isMagicInventory = Boolean(item.is_magic_item || equipment.is_magic_item);
  const ammo = item.is_ammunition || isAmmunition(equipment);
  const damage = equipment.type === "weapon" && !ammo ? [equipment.damage_small_medium, equipment.damage_large].filter(Boolean).join(" / ") : "";
  const speed = equipment.type === "weapon" ? equipment.properties?.speed ?? "—" : "";
  const proficiency = equipment.type === "weapon" && !ammo ? weaponProficiencyLabel(equipment, proficiencies) : "";
  const itemName = inventoryItemName(item);
  const cost = inventoryItemValue(item);
  const status = isStored && item.storage_location ? `${labelize(item.status)} at ${item.storage_location}` : labelize(item.status);
  const proficiencyClass = proficiency === "Proficient" ? "vault-status-good" : "vault-muted";
  const weight = formatWeight(item.total_weight ?? ((equipment.weight || 0) * item.quantity));
  const quantityActions = isMagicInventory ? "" : `<span class="vault-ammo-quantity"><button type="button" class="vault-button secondary" data-inventory-action="${item.id}:quantity:${Math.max(0, Number(item.quantity || 0) - 1)}">-</button><strong>${h(item.quantity || 0)}</strong><button type="button" class="vault-button secondary" data-inventory-action="${item.id}:quantity:${Number(item.quantity || 0) + 1}">+</button></span>`;
  const normalActions = `${quantityActions}${isEquipped ? `<button type="button" class="vault-button secondary" data-inventory-action="${item.id}:carried">Unequip</button>` : `<button type="button" class="vault-button secondary" data-inventory-action="${item.id}:equipped">Equip</button>`} ${isStored ? `<button type="button" class="vault-button secondary" data-inventory-action="${item.id}:carried">Carry</button>` : `<button type="button" class="vault-button secondary" data-inventory-action="${item.id}:stored">Store</button>`} <button type="button" class="vault-button secondary" data-inventory-action="${item.id}:delete">Drop</button>`;
  const magicActions = `${isEquipped ? `<button class="vault-button secondary" type="button" data-magic-item-action="${h(item.magic_item_id || item.id)}:status:carried">Unequip</button>` : `<button class="vault-button secondary" type="button" data-magic-item-action="${h(item.magic_item_id || item.id)}:status:equipped">Equip</button>`} ${isStored ? `<button class="vault-button secondary" type="button" data-magic-item-action="${h(item.magic_item_id || item.id)}:status:carried">Carry</button>` : `<button class="vault-button secondary" type="button" data-magic-item-action="${h(item.magic_item_id || item.id)}:status:stored">Store</button>`} <button class="vault-button secondary" type="button" data-magic-item-action="${h(item.magic_item_id || item.id)}:delete">Remove</button>`;
  return `<tr class="${isEquipped ? "vault-equipped-row" : ""}" data-inventory-row="${h(item.id)}"><td>${ammo ? `<strong>${h(itemName)}</strong> ×${h(item.quantity || 0)}` : `${h(item.quantity)} x <strong>${h(itemName)}</strong>`}<br><span class="vault-mini">${damage ? `Damage ${h(damage)} / Spd ${h(speed)}` : speed ? `Spd ${h(speed)}` : ""}${damage && proficiency ? " / " : ""}${proficiency ? `<span class="${proficiencyClass}">${h(proficiency)}</span>` : ""}${isMagicInventory ? `${damage || proficiency ? " / " : ""}Magic item` : ""}</span></td><td>${h(equipmentDisplayType(equipment))}</td><td>${h(weight)}</td><td>${h(cost)}</td><td>${h(status)}</td><td>${isMagicInventory ? magicActions : normalActions}</td></tr>`;
}

function magicItemFromCatalogRecord(record, baseEquipment = null) {
  const effects = record.equipment_effects || {};
  const appliedEquipment = baseEquipment ? magicAppliedEquipmentPayload(baseEquipment) : null;
  return {
    id: `magic-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    catalog_id: record.id,
    name: appliedEquipment ? appliedMagicItemName(record, appliedEquipment) : record.name,
    category: record.category,
    source: record.source || "OSRIC",
    source_ref: record.source_ref || {},
    description: record.description || "",
    weight: appliedEquipment?.weight ?? record.weight ?? effects.weight ?? null,
    equipment_effects: effects,
    applied_equipment: appliedEquipment,
    status: "carried",
    identified: false,
    charges: null,
    max_charges: null,
    notes: "",
  };
}

function magicDefaultAppliedEquipment(record = {}) {
  if (record.id !== "osric.magic_item.hammer_of_thunderbolts") return null;
  const heavyHammer = state.equipment.find((item) => item.name === "Hammer") || {};
  return {
    ...magicAppliedEquipmentPayload(heavyHammer),
    id: heavyHammer.id || 0,
    name: "Hammer of Thunderbolts",
    type: "weapon",
    subtype: heavyHammer.subtype || "melee",
    cost_amount: null,
    cost_coin: null,
    weight: 15,
    damage_small_medium: "4d6",
    damage_large: "4d6",
    rate_of_fire: null,
    range: "30 ft",
    properties: { ...(heavyHammer.properties || {}), weapon_mode: "melee", attack_ability: "strength", attack_bonus: 3, damage_bonus: 3, proficiency_equipment_name: "Hammer" },
    rules_reference: "/1e/how-to-play/magic/",
  };
}

function magicItemNeedsBaseEquipment(record = {}) {
  return ["weapon", "armor", "shield"].includes(String(record.equipment_effects?.kind || "").toLowerCase());
}

function magicBaseEquipmentOptions(record = {}) {
  const effects = record.equipment_effects || {};
  const kind = String(effects.kind || "").toLowerCase();
  const baseTerm = String(effects.base_item || "").toLowerCase();
  return state.equipment.filter((item) => {
    if (kind === "weapon" && item.type !== "weapon") return false;
    if (kind === "armor" && item.type !== "armor") return false;
    if (kind === "shield" && item.type !== "shield") return false;
    if (baseTerm && baseTerm !== "weapon" && baseTerm !== "armor" && baseTerm !== "armour" && baseTerm !== "shield") {
      return item.name.toLowerCase().includes(baseTerm);
    }
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function magicAppliedEquipmentPayload(item = {}) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    subtype: item.subtype,
    cost_amount: item.cost_amount,
    cost_coin: item.cost_coin,
    weight: item.weight,
    damage_small_medium: item.damage_small_medium,
    damage_large: item.damage_large,
    rate_of_fire: item.rate_of_fire,
    range: item.range,
    armor_class_value: item.armor_class_value,
    armor_class_adjustment: item.armor_class_adjustment,
    properties: item.properties || {},
    rules_reference: item.rules_reference,
  };
}

function appliedMagicItemName(record = {}, base = {}) {
  if (record.name && record.name === base.name) return record.name;
  const bonus = record.name.match(/[+-]\d+/)?.[0] || "";
  const baseName = base.name || "Item";
  if (bonus && !baseName.includes(bonus)) return `${baseName} ${bonus}`;
  return `${baseName} (${record.name})`;
}

function magicCatalogRowHtml(item) {
  const addLabel = magicItemNeedsBaseEquipment(item) ? "Choose Base" : "Add";
  return `<article class="vault-magic-catalog-row">
    <div><h4>${h(item.name)}</h4><p>${h(item.category)} &bull; ${h(magicItemSourceLabel(item))}</p>${magicItemDescriptionHtml(item)}${magicItemMechanicsHtml(item)}</div>
    <button class="vault-button secondary" type="button" data-magic-catalog-add="${h(item.id)}">${h(addLabel)}</button>
  </article>`;
}

function magicItemsHtml(c) {
  const items = c.magic_items || [];
  return `<div class="vault-magic-item-panel">
    <div class="vault-actions"><button class="vault-button" type="button" data-magic-item-add>Add OSRIC Magic Item</button></div>
    ${items.length ? `<div class="vault-magic-item-grid">${items.map(magicItemCardHtml).join("")}</div>` : `<p class="vault-compact-empty">No magic items recorded.</p>`}
  </div>`;
}

function magicItemCardHtml(item) {
  const charges = magicItemChargesHtml(item);
  const status = item.status || "carried";
  const applied = item.applied_equipment ? `<p class="vault-mini">Base: ${h(item.applied_equipment.name || "equipment")}</p>` : "";
  return `<article class="vault-magic-item-card">
    <div class="vault-magic-item-head">
      <div><h4>${h(item.name || "Magic Item")}</h4><p>${h(item.category || "Misc Magic")} &bull; ${h(labelize(status))}${item.identified ? " &bull; Identified" : " &bull; Unidentified"}${item.catalog_id ? ` &bull; ${h(magicItemSourceLabel(item))}` : ""}</p></div>
      <button class="vault-button secondary" type="button" data-magic-item-edit="${h(item.id)}">Edit</button>
    </div>
    ${applied}
    ${magicItemDescriptionHtml(item)}
    ${magicItemMechanicsHtml(item)}
    ${charges}
    ${item.notes ? `<p class="vault-magic-item-notes">${h(item.notes)}</p>` : ""}
    <div class="vault-actions vault-magic-item-actions">
      ${status === "equipped" ? `<button class="vault-button secondary" type="button" data-magic-item-action="${h(item.id)}:status:carried">Unequip</button>` : `<button class="vault-button secondary" type="button" data-magic-item-action="${h(item.id)}:status:equipped">Equip</button>`}
      ${status === "stored" ? `<button class="vault-button secondary" type="button" data-magic-item-action="${h(item.id)}:status:carried">Carry</button>` : `<button class="vault-button secondary" type="button" data-magic-item-action="${h(item.id)}:status:stored">Store</button>`}
      <button class="vault-button secondary" type="button" data-magic-item-action="${h(item.id)}:identified">${item.identified ? "Mark Unknown" : "Identify"}</button>
      <button class="vault-button secondary" type="button" data-magic-item-action="${h(item.id)}:delete">Remove</button>
    </div>
  </article>`;
}

function magicItemChargesHtml(item = {}) {
  if (item.charges === null && item.max_charges === null && item.charges === undefined && item.max_charges === undefined) return "";
  const current = Number(item.charges || 0);
  const max = item.max_charges === null || item.max_charges === undefined ? "" : ` / ${item.max_charges}`;
  return `<div class="vault-magic-charges"><span>Charges</span><strong>${h(current)}${h(max)}</strong><span class="vault-ammo-quantity"><button type="button" class="vault-button secondary" data-magic-item-action="${h(item.id)}:charges:${Math.max(0, current - 1)}">-</button><button type="button" class="vault-button secondary" data-magic-item-action="${h(item.id)}:charges:${current + 1}">+</button></span></div>`;
}

function magicItemMechanicsHtml(item = {}) {
  const effects = item.equipment_effects || {};
  const chips = [];
  if (item.weight !== null && item.weight !== undefined) chips.push(`Wt ${formatWeight(item.weight)}`);
  if (effects.attack_bonus !== null && effects.attack_bonus !== undefined) chips.push(`Hit ${signed(effects.attack_bonus)}`);
  if (effects.damage_bonus !== null && effects.damage_bonus !== undefined) chips.push(`Dmg ${signed(effects.damage_bonus)}`);
  if (effects.armor_class_adjustment !== null && effects.armor_class_adjustment !== undefined) chips.push(`AC ${signed(effects.armor_class_adjustment)}`);
  if (effects.missile_armor_class_adjustment !== null && effects.missile_armor_class_adjustment !== undefined) chips.push(`Missile AC ${signed(effects.missile_armor_class_adjustment)}`);
  if (effects.charge_formula) chips.push(`Charges ${effects.charge_formula}`);
  const note = effects.notes ? `<p class="vault-magic-effect-note">${h(effects.notes)}</p>` : "";
  if (!chips.length && !note) return "";
  return `<div class="vault-magic-effects">${chips.map((chip) => `<span>${h(chip)}</span>`).join("")}</div>${note}`;
}

function magicItemDescriptionHtml(item = {}) {
  return item.description ? `<p class="vault-magic-item-description">${h(item.description)}</p>` : "";
}

function magicItemSourceLabel(item = {}) {
  return item.source || "OSRIC";
}

function signed(value) {
  const number = Number(value || 0);
  return number > 0 ? `+${number}` : `${number}`;
}

function magicItemCategories() {
  return ["Potion", "Scroll", "Rod / Staff / Wand", "Magic Armour / Shield", "Magic Sword", "Magic Weapon", "Misc Magic", "Ring", "Cursed Item", "Artifact", "Other"];
}

function savingThrowsHtml(c) {
  const saves = c.combat?.saving_throws;
  if (!saves?.categories) return `<p class="vault-muted">Saving throws need DM review.</p>`;
  return `<div class="vault-saving-list">${Object.entries(saves.categories).map(([key, value]) => `<details class="vault-saving-row"><summary><span>${h(shortSaveLabel(saves.labels?.[key] || title(key)))}</span><strong>${h(value)}</strong></summary>${saveBreakdownHtml(saves.breakdown?.[key] || [])}</details>`).join("")}</div>`;
}

function dailyMagicSummaryHtml(c) {
  const slots = compactSpellSlotRows(c.spell_slots);
  const prepared = (c.spells || []).filter((spell) => spell.prepared || Number(spell.memorized_count || 0) > 0);
  if (!slots.length && !prepared.length) return "";
  return `<div class="vault-daily-magic"><h4>Daily Magic</h4>
    ${slots.length ? `<div class="vault-magic-slot-list">${slots.map((row) => `<span><strong>${h(row.label)}</strong>${h(row.used)}/${h(row.total)} slots</span>`).join("")}</div>` : ""}
    <div class="vault-prepared-spell-list">${prepared.length ? prepared.slice(0, 8).map((spell) => `<span>${h(spell.spell?.name || spell.name || "Spell")}${Number(spell.memorized_count || 0) > 1 ? ` x${h(spell.memorized_count)}` : ""}</span>`).join("") : `<em>None prepared.</em>`}</div>
  </div>`;
}

function compactSpellSlotRows(summary = {}) {
  if (!summary?.slots) return [];
  const rows = [];
  const nested = Object.values(summary.slots).some((value) => value && typeof value === "object" && !Array.isArray(value));
  if (nested) {
    Object.entries(summary.slots).forEach(([bucket, levels]) => {
      Object.entries(levels || {}).forEach(([level, total]) => {
        if (Number(total || 0) > 0) rows.push({ label: `${title(bucket)} ${level}`, total, used: summary.used?.[bucket]?.[level] || 0 });
      });
    });
    return rows;
  }
  Object.entries(summary.slots).forEach(([level, total]) => {
    if (Number(total || 0) > 0) rows.push({ label: `L${level}`, total, used: summary.used?.[level] || 0 });
  });
  return rows;
}

function saveBreakdownHtml(rows = []) {
  if (!rows.length) return `<p class="vault-muted">No breakdown available.</p>`;
  const filtered = rows.filter((row) => row.value !== undefined || Number(row.modifier || 0) !== 0);
  return `<div class="vault-breakdown-list">${filtered.map((row) => `<div><span>${h(row.label)}</span><strong>${row.value !== undefined ? h(row.value) : h(formatSigned(row.modifier || 0))}</strong></div>`).join("")}</div>`;
}

function shortSaveLabel(label) {
  return String(label || "")
    .replace("Aimed Magic Items / Wands", "Wands")
    .replace("Death / Paralysis / Poison", "Death")
    .replace("Petrifaction / Polymorph", "Polymorph")
    .replace("Breath Weapons", "Breath");
}

function armorClassBreakdownHtml(c) {
  const ac = c.combat?.armor_class_breakdown || {};
  const baseAc = ac.base?.value ?? 10;
  return `<div class="vault-mini-stat-grid">${miniStat("AC", ac.final ?? c.combat?.armor_class ?? baseAc)}</div><details class="vault-breakdown"><summary>Details</summary>
    <div class="vault-breakdown-list">
      <div><span>${h(ac.base?.label || "Base AC")}</span><strong>${h(baseAc)}</strong></div>
      <div><span>${h(ac.armor?.label || "No armor")}</span><strong>${h(formatSigned(ac.armor?.value || 0))}</strong></div>
      <div><span>${h(ac.shield?.label || "No shield")}</span><strong>${h(formatSigned(ac.shield?.value || 0))}</strong></div>
      <div><span>Dexterity</span><strong>${h(formatSigned(ac.dexterity?.value || 0))}</strong></div>
      <div><span>Magic</span><strong>${h(formatSigned(ac.magical?.value || 0))}</strong></div>
      <div><span>Misc</span><strong>${h(formatSigned(ac.miscellaneous?.value || 0))}</strong></div>
      <div><span>Final AC</span><strong>${h(ac.final ?? c.combat?.armor_class ?? baseAc)}</strong></div>
    </div>
  </details>`;
}

function armorClassDetailsHtml(c) {
  const ac = c.combat?.armor_class_breakdown || {};
  const baseAc = ac.base?.value ?? 10;
  const facingAc = armorClassFacingValues(c);
  const rows = [
    [ac.base?.label || "Base AC", baseAc, false, true],
    [ac.armor?.label || "Armor", ac.armor?.value || 0, true],
    [ac.shield?.label || "Shield", ac.shield?.value || 0, true],
    ["Dexterity", ac.dexterity?.value || 0, true],
    ["Magic", ac.magical?.value || 0, true],
    ["Misc", ac.miscellaneous?.value || 0, true],
    ["Final AC", facingAc.finalAc, false, true],
    ["Flank AC", facingAc.flankAc, false, true],
    ["Rear AC", facingAc.rearAc, false, true],
  ].filter(([, value, signed, always]) => always || !signed || Number(value || 0) !== 0);
  return `<div class="vault-tile-details">${rows.map(([label, value, signed]) => `<div><span>${h(label)}</span><strong>${h(signed ? formatSigned(value) : value)}</strong></div>`).join("")}</div>`;
}

function thac0DetailsHtml(runtime = {}) {
  const thac0 = runtime.thac0 || {};
  const rows = [
    ["Class", thac0.class_source],
    ["Level", thac0.level_source],
    ["Base THAC0", thac0.base_thac0],
    ["Final THAC0", thac0.final_thac0],
    ["Status", combatStatusLabel(thac0.automation_status)],
  ];
  return tileDetailsHtml(rows);
}

function toHitDetailsHtml(runtime, strength = {}) {
  const modifiers = runtime?.attack_modifiers || {};
  const rows = runtime ? [
    ["Weapon", runtime.weapon],
    ["Strength", modifiers.strength, true],
    ["Dexterity", modifiers.dexterity_missile, true],
    ["Race", modifiers.racial, true],
    ["Magic", modifiers.magical, true],
    ["Proficiency", modifiers.proficiency, true],
    ["Misc", modifiers.miscellaneous, true],
    ["Total To Hit", runtime.total_attack_bonus, true, true],
    ["Attack Value", runtime.final_attack_value],
  ] : [
    ["Strength", strength.melee_to_hit, true, true],
    ["Total To Hit", strength.melee_to_hit, true, true],
  ];
  return tileDetailsHtml(rows);
}

function damageDetailsHtml(runtime, strength = {}) {
  const damage = runtime?.damage || {};
  const totalBonus = runtime ? Number(damage.strength || 0) + Number(damage.magical || 0) + Number(damage.miscellaneous || 0) : strength.melee_damage;
  const rows = runtime ? [
    ["Weapon", runtime.weapon],
    ["Base", damage.base_small_medium],
    ["Strength", damage.strength, true],
    ["Magic", damage.magical, true],
    ["Misc", damage.miscellaneous, true],
    ["Total Bonus", totalBonus, true, true],
    ["Final", damage.final_small_medium],
  ] : [
    ["Strength", strength.melee_damage, true, true],
    ["Total Bonus", strength.melee_damage, true, true],
  ];
  return tileDetailsHtml(rows);
}

function attackRateDetailsHtml(runtime = {}) {
  const attacks = runtime.attacks_per_round || {};
  const rows = [
    ["Rate", compactAttackRate(attacks.value || "1")],
    ["Source", attacks.source],
    ["Specialized", attacks.specialization_applied ? "Yes" : "No"],
    ["Missile ROF", attacks.rate_of_fire_separate ? "Tracked per weapon" : ""],
  ];
  return tileDetailsHtml(rows);
}

function tileDetailsHtml(rows = []) {
  const rendered = rows
    .filter(([, value, signed, always]) => always || playerFacingValue(value) || (signed && Number(value || 0) !== 0))
    .map(([label, value, signed]) => `<div><span>${h(label)}</span><strong>${h(signed ? formatSigned(value || 0) : value)}</strong></div>`)
    .join("");
  return `<div class="vault-tile-details">${rendered || `<p class="vault-muted">No breakdown available.</p>`}</div>`;
}

function combatStatusLabel(value) {
  return title(String(value || "").replace(/^derived_from_/, "").replace(/_/g, " "));
}

function armorClassValue(c, combatKey, breakdownKey, fallback) {
  const ac = c.combat?.armor_class_breakdown || {};
  return ac[breakdownKey]?.value ?? ac[breakdownKey] ?? c.combat?.[combatKey] ?? fallback;
}

function armorClassFacingValues(c) {
  const baseAc = c.combat?.armor_class_breakdown?.base?.value ?? 10;
  const shieldFacingAdjustment = Number(c.combat?.armor_class_breakdown?.shield?.value || 0);
  const dexterityFacingAdjustment = Number(c.combat?.armor_class_breakdown?.dexterity?.value || 0);
  const finalAc = armorClassValue(c, "armor_class", "final", baseAc);
  const calculatedFlankAc = finalAc - shieldFacingAdjustment;
  const flankAc = armorClassValue(c, "flank_armor_class", "flank", calculatedFlankAc);
  const calculatedRearAc = flankAc - dexterityFacingAdjustment;
  const rearAc = armorClassValue(c, "rear_armor_class", "rear", calculatedRearAc);
  return { finalAc, flankAc, rearAc };
}

function armorClassFacingSummary(c) {
  const { finalAc, flankAc, rearAc } = armorClassFacingValues(c);
  return `${finalAc} / ${flankAc} / ${rearAc}`;
}

function raceClassDetailsHtml(c) {
  const classDetails = c.class_details || {};
  const raceDetails = c.race_details || {};
  const profCount = classDetails.proficiency_count ?? proficiencyCount(c.class_name, c.level);
  const fields = [
    ["OSRIC Base", classDetails.rules_class_name || rulesClassName(c.class_name)],
    ["Hit Dice", hitDiceText(c)],
    ["Armor", classDetails.armor],
    ["Weapons", classDetails.weapons],
    ["Proficiencies", profCount == null ? "" : profCount],
    ["Non-Proficiency Penalty", classDetails.non_proficiency_penalty == null ? "" : formatSigned(classDetails.non_proficiency_penalty)],
    ["Vision", raceDetails.vision || raceDetails.infravision],
    ["Languages", (raceDetails.languages || []).join(", ")],
    ["Movement", raceDetails.movement ? `${raceDetails.movement} ft` : ""],
  ];
  return `<dl class="vault-detail-list">${fields.filter(([, value]) => playerFacingValue(value)).map(([label, value]) => `<div><dt>${h(label)}</dt><dd>${h(value)}</dd></div>`).join("")}</dl>`;
}

function warningsHtml(c) {
  return (c.warnings || []).length ? `<div class="vault-warning">${c.warnings.map((warning) => `<p>${h(warning)}</p>`).join("")}</div>` : "";
}

function playerFacingValue(value) {
  if (value === undefined || value === null || value === "") return false;
  return !String(value).includes("Manual DM Review") && !String(value).includes("Needs Review");
}

function combatSummaryHtml(c) {
  const runtime = c.combat?.runtime || {};
  const thac0 = runtime.thac0 || {};
  const primaryWeapon = primaryWeaponRuntime(c);
  const abilityStrength = c.combat?.ability_breakdown?.strength || {};
  return `<div class="vault-combat-summary">
    ${combatStatDetails("THAC0", thac0.final_thac0 ?? "-", thac0DetailsHtml(runtime))}
    ${combatStatDetails("TO HIT", toHitSummary(primaryWeapon, abilityStrength), toHitDetailsHtml(primaryWeapon, abilityStrength))}
    ${combatStatDetails("DAMAGE", damageBonusSummary(primaryWeapon, abilityStrength), damageDetailsHtml(primaryWeapon, abilityStrength))}
    ${combatStatDetails("Armor Class", armorClassFacingSummary(c), armorClassDetailsHtml(c))}
    ${combatStatDetails("ATTACKS", compactAttackRate(runtime.attacks_per_round?.value || "1"), attackRateDetailsHtml(runtime))}
    ${combatStatDetails("Move", `${c.combat?.movement_rate ?? 120}'`, movementEncumbranceDetailsHtml(c))}
    ${combatStatDetails("Enc", encumbranceSummary(c), movementEncumbranceDetailsHtml(c))}
  </div><div class="vault-combat-body">
    <section class="vault-equipped-weapons">${sheetSectionHeading("Equipped Weapons")}${equippedWeaponsHtml(c)}</section>
    <section class="vault-combat-saves">${sheetSectionHeading("Saves")}${savingThrowsHtml(c)}${dailyMagicSummaryHtml(c)}</section>
  </div>`;
}

function primaryWeaponRuntime(c) {
  const equippedIds = new Set((c.inventory || []).filter((item) => item.status === "equipped" && item.equipment?.type === "weapon" && !isAmmunition(item.equipment)).map((item) => Number(item.equipment_id)));
  const runtimeWeapons = (c.combat?.runtime?.weapons || []).filter((entry) => equippedIds.has(Number(entry.equipment_id)) && !entry.calculations_disabled);
  return runtimeWeapons.find((entry) => entry.mode === "melee") || runtimeWeapons[0] || null;
}

function toHitSummary(runtime, strength = {}) {
  if (runtime?.total_attack_bonus !== undefined && runtime.total_attack_bonus !== null) return formatSigned(runtime.total_attack_bonus);
  if (strength.melee_to_hit !== undefined && strength.melee_to_hit !== null) return formatSigned(strength.melee_to_hit);
  return "-";
}

function damageBonusSummary(runtime, strength = {}) {
  if (runtime?.damage) {
    const bonus = Number(runtime.damage.strength || 0) + Number(runtime.damage.magical || 0) + Number(runtime.damage.miscellaneous || 0);
    return bonus ? formatSigned(bonus) : "+0";
  }
  if (strength.melee_damage !== undefined && strength.melee_damage !== null) return formatSigned(strength.melee_damage);
  return "-";
}

function combatStatDetails(label, value, detailsHtml) {
  return `<details class="vault-combat-tile ${String(value ?? "").length > 10 ? "vault-long-value" : ""}"><summary><strong>${h(label)}</strong>${h(value)}</summary>${detailsHtml}</details>`;
}

function weaponsHtml(c) {
  const weapons = (c.inventory || []).filter((item) => item.equipment.type === "weapon" && !isAmmunition(item.equipment));
  return `${weapons.length ? `<table class="vault-table"><thead><tr><th>Weapon</th><th>Type</th><th>Wt</th><th>Actions</th></tr></thead><tbody>${weapons.map((item) => inventoryRow(item, c.weapon_proficiencies || [])).join("")}</tbody></table>` : "<p>No weapons carried.</p>"}`;
}

function equippedWeaponsHtml(c) {
  const weapons = (c.inventory || []).filter((item) => item.equipment.type === "weapon" && !isAmmunition(item.equipment));
  const profs = c.weapon_proficiencies || [];
  const runtimeWeapons = c.combat?.runtime?.weapons || [];
  const runtimeByEquipment = new Map(runtimeWeapons.map((entry) => [Number(entry.equipment_id), entry]));
  const weaponCards = weapons.filter((item) => item.status === "equipped").map((item) => {
    const runtime = runtimeByEquipment.get(Number(item.equipment_id));
    return runtime ? weaponCardHtml(runtime, item.equipment, weaponProficiencyLabel(item.equipment, profs), c) : "";
  }).filter(Boolean).join("");
  return weaponCards ? `<div class="vault-equipped-weapon-grid">${weaponCards}</div>` : `<p class="vault-muted">No equipped weapons.</p>`;
}

function weaponCardHtml(runtime, equipment = {}, proficiencyLabel = "", character = {}) {
  if (runtime.calculations_disabled || runtime.legal === false) {
    return `<article class="vault-weapon-card vault-illegal-equipment"><div class="vault-weapon-head"><div><div class="vault-kicker">Illegal Equipment</div><h3>${h(runtime.weapon || equipment.name)}</h3></div><strong>Disabled</strong></div><p><strong>Reason:</strong> ${h(playerFacingValue(runtime.legality_reason) ? runtime.legality_reason : "Class restriction")}</p><p>Combat calculations disabled until corrected.</p></article>`;
  }
  const damage = runtime.damage || {};
  const range = runtime.range || {};
  const ammo = runtime.mode === "missile" ? compatibleAmmunitionForWeapon(equipment, character.inventory || []) : null;
  return `<article class="vault-weapon-card">
    <div class="vault-weapon-head">
      <div><h3>${h(runtime.weapon || equipment.name)}</h3><p>${h(labelize(runtime.mode || equipment.subtype || "weapon"))} &bull; ${h(proficiencyLabel || (runtime.proficiency?.proficient ? "Proficient" : "Non-proficient"))}</p></div>
    </div>
    <div class="vault-weapon-stat-block">
      ${statRow("THAC0", runtime.base_thac0 ?? "-")}
      ${statRow("TO HIT", formatSigned(runtime.total_attack_bonus || 0))}
      ${statRow("DAMAGE", damage.final_small_medium || damage.base_small_medium || "-")}
      ${statRow("SPEED", runtime.weapon_speed ?? equipment.properties?.speed ?? "—")}
      ${runtime.rate_of_fire ? statRow("ROF", runtime.rate_of_fire) : statRow("APR", compactAttackRate(runtime.attacks_per_round?.value || "1"))}
      ${range.raw ? statRow("RANGE", rangeLabel(range)) : ""}
      ${runtime.mode === "missile" ? statRow("AMMO", ammo ? `${ammunitionLabel(ammo)} ×${ammo.quantity || 0}` : "None Equipped") : ""}
    </div>
    <details class="vault-breakdown"><summary>Details</summary>
      <h4>Attack Breakdown</h4>${modifierBreakdownHtml(runtime.attack_modifiers || {}, runtime.racial_modifiers, runtime.base_thac0, runtime.final_attack_value)}
      <h4>Damage Breakdown</h4>${damageBreakdownHtml(damage)}
    </details>
  </article>`;
}

function statRow(label, value) {
  return `<div><span>${h(label)}</span><strong>${h(value)}</strong></div>`;
}

function compactAttackRate(value) {
  return String(value || "1").replace(" attack per round", "").replace(" attacks per round", "").replace(" attacks every ", "/").replace(" rounds", "");
}

function rangeLabel(range = {}) {
  return range.short ? `${range.short} / ${range.medium} / ${range.long}` : range.raw;
}

function modifierBreakdownHtml(modifiers, racial = {}, baseThac0 = null, finalThac0 = null) {
  const rows = [["Base THAC0", baseThac0, false], ...Object.entries(modifiers).map(([key, value]) => {
    const label = key === "racial" && racial.applied?.length ? "Racial" : labelize(key).replace("Dexterity Missile", "Dexterity").replace("Magical", "Magic").replace("Miscellaneous", "Misc");
    return [label, value, true];
  }), ["Effective THAC0", finalThac0, false]].filter(([, value, signed]) => value !== undefined && value !== null && (!signed || Number(value || 0) !== 0));
  return `<div class="vault-breakdown-list">${rows.map(([label, value, signed]) => {
    const display = signed ? formatSigned(Number(value || 0)) : value;
    return `<div><span>${h(label)}</span><strong>${h(display)}</strong></div>`;
  }).join("")}</div>`;
}

function damageBreakdownHtml(damage = {}) {
  const rows = [
    ["Weapon", damage.base_small_medium || "-", false, true],
    ["Strength", damage.strength || 0, true],
    ["Magic", damage.magical || 0, true],
    ["Miscellaneous", damage.miscellaneous || 0, true],
    ["Final Damage", damage.final_small_medium || "-", false, true],
  ].filter(([, value, signed, always]) => always || !signed || Number(value || 0) !== 0);
  return `<div class="vault-breakdown-list">${rows.map(([label, value, signed]) => `<div><span>${h(label)}</span><strong>${h(signed ? formatSigned(value) : value)}</strong></div>`).join("")}</div>`;
}

function builderWeaponPreviewHtml(runtime) {
  return `<div class="vault-builder-preview"><div class="vault-kicker">Attack Preview</div>${weaponCardHtml(runtime, runtime, runtime.proficiency?.proficient ? "Proficient" : "Non-proficient")}</div>`;
}

function armorHtml(c) {
  const armor = (c.inventory || []).filter((item) => ["armor", "shield"].includes(item.equipment.type));
  const armorNote = playerFacingValue(c.class_details?.armor) ? `<p class="vault-muted">${h(c.class_details.armor)}</p>` : "";
  return `${armor.length ? inventoryTable(armor, c.weapon_proficiencies || []) : "<p>No armor or shields in inventory.</p>"}${armorNote}`;
}

function spellsHtml(c) {
  const spells = c.spells || [];
  const known = spells.filter((spell) => spell.known || spell.in_spellbook);
  const prepared = known.filter((spell) => spell.prepared || Number(spell.memorized_count || 0) > 0);
  if (!known.length && !hasSpellSlots(c.spell_slots)) return `<p class="vault-compact-empty">No spellcasting ability at this class and level.</p>`;
  const slots = spellSlotsHtml(c);
  if (!known.length) return `${slots}<p>No known spells recorded.</p>`;
  return `${slots}<h3>Prepared Spells</h3>${prepared.length ? spellBookTable(prepared, true) : "<p>None prepared.</p>"}<h3>Known Spells</h3>${spellBookTable(known, false)}`;
}

function hasSpellSlots(summary = {}) {
  if (!summary?.slots) return false;
  const values = Object.values(summary.slots);
  if (!values.length) return false;
  return values.some((value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.values(value).some((count) => Number(count || 0) > 0);
    }
    return Number(value || 0) > 0;
  });
}

function spellBadges(s) {
  const badges = [];
  if (s.prepared || s.memorized_count > 0) badges.push("Prepared");
  if (s.known) badges.push("Known");
  if (s.in_spellbook) badges.push("Spellbook");
  return badges.map((badge) => `<span class="vault-badge">${h(badge)}</span>`).join(" ");
}

function spellSlotsHtml(c) {
  if (Array.isArray(c.spellcasting_tracks) && c.spellcasting_tracks.length > 1) {
    return `<div class="vault-slot-grid">${c.spellcasting_tracks.map((track) => {
      const summary = track.spell_slots || {};
      const nested = Object.values(summary.slots || {}).some((value) => value && typeof value === "object" && !Array.isArray(value));
      const tables = nested
        ? Object.entries(summary.slots || {}).map(([bucket, levels]) => spellSlotTable(levels, summary.used?.[bucket] || {}, summary.remaining?.[bucket] || {})).join("")
        : spellSlotTable(summary.slots || {}, summary.used || {}, summary.remaining || {});
      return `<div class="vault-slot-card"><h3>${h(track.class_name)} ${h(track.level)} Slots</h3>${tables}</div>`;
    }).join("")}</div>`;
  }
  if (Array.isArray(c.spellcasting_tracks) && c.spellcasting_tracks.length === 1) {
    const track = c.spellcasting_tracks[0];
    c = { ...c, spell_slots: track.spell_slots };
  }
  const summary = c.spell_slots;
  if (!summary?.slots || !Object.keys(summary.slots).length) return `<p class="vault-muted">No spell slot table applies at this class/level.</p>`;
  const isNested = Object.values(summary.slots).some((value) => value && typeof value === "object" && !Array.isArray(value));
  if (isNested) {
    return `<div class="vault-slot-grid">${Object.entries(summary.slots).map(([bucket, levels]) => `<div class="vault-slot-card"><h3>${title(bucket)} Slots</h3>${spellSlotTable(levels, summary.used?.[bucket] || {}, summary.remaining?.[bucket] || {})}</div>`).join("")}</div>`;
  }
  return `<div class="vault-slot-grid"><div class="vault-slot-card"><h3>Spell Slots</h3>${spellSlotTable(summary.slots, summary.used || {}, summary.remaining || {})}</div></div>`;
}

function spellSlotTable(slots, used, remaining) {
  return `<table class="vault-table"><thead><tr><th>Level</th><th>Slots</th><th>Prepared</th><th>Remaining</th></tr></thead><tbody>${Object.entries(slots).map(([level, count]) => {
    const usedCount = Number(used[level] || 0);
    const remainingValue = remaining[level];
    const full = Number(count) > 0 && remainingValue !== undefined && Number(remainingValue) <= 0;
    return `<tr class="${full ? "vault-warn-row" : ""}"><td>${h(level)}</td><td>${h(count)}</td><td>${h(usedCount)}</td><td>${remainingValue === undefined ? "-" : h(remainingValue)}</td></tr>`;
  }).join("")}</tbody></table>`;
}

function renderDmDashboard() {
  const activeCampaigns = state.campaigns.filter((campaign) => campaign.status !== "archived");
  const archivedCampaigns = state.campaigns.length - activeCampaigns.length;
  document.querySelector("[data-vault-view]").innerHTML = `
    <section class="vault-dashboard-strip">
      <article class="vault-panel">
        <div class="vault-kicker">Campaign Control</div>
        <h2>DM Dashboard</h2>
        <p>Campaigns, characters, storage, and equipment for DRG 1e play.</p>
        <div class="vault-actions">
          <a class="vault-button" href="/1e/dm/campaigns/#new-campaign">New Campaign</a>
          <a class="vault-button secondary" href="/1e/dm/campaigns/">Campaigns</a>
          <a class="vault-button secondary" href="/1e/characters/">Character Vault</a>
          <a class="vault-button secondary" href="/1e/dm/equipment/">Equipment Catalog</a>
        </div>
      </article>
      <article class="vault-panel vault-dashboard-stats">
        ${summaryStat("Campaigns", state.campaigns.length)}
        ${summaryStat("Active", activeCampaigns.length)}
        ${summaryStat("Archived", archivedCampaigns)}
        ${summaryStat("Catalog Items", state.equipment.length)}
      </article>
    </section>
    <section class="vault-panel">
      <div class="vault-section-heading">
        <div>
          <div class="vault-kicker">Recent Campaigns</div>
          <h2>Campaigns</h2>
        </div>
        <a class="vault-button secondary" href="/1e/dm/campaigns/">Open Campaigns</a>
      </div>
      ${campaignCardsHtml(state.campaigns.slice(0, 6))}
    </section>`;
}

function renderCampaigns() {
  if (state.campaign) {
    const c = state.campaign;
    document.querySelector("[data-vault-view]").innerHTML = `
      <section class="vault-campaign-header">
        <article class="vault-panel">
          <div class="vault-kicker">Campaign Workspace</div>
          <div class="vault-section-heading">
            <div>
              <h2>${h(c.name)}</h2>
              <p>${h(c.description || "No campaign notes yet.")}</p>
            </div>
            <div class="vault-actions">
              <a class="vault-button secondary" href="/1e/dm/campaigns/">All Campaigns</a>
              <a class="vault-button secondary" href="/1e/characters/new/">Create Character</a>
            </div>
          </div>
          <div class="vault-statline">
            ${summaryStat("Day", c.current_campaign_day)}
            ${summaryStat("Location", c.default_location || "Town")}
            ${summaryStat("Status", labelize(c.status || "active"))}
            ${summaryStat("Characters", (c.characters || []).length)}
          </div>
        </article>
      </section>
      <div class="vault-tabs">${["overview", "characters", "storage", "equipment", "journal", "settings"].map((tab) => `<button class="vault-tab" type="button" aria-selected="${state.dmCampaignTab === tab}" data-campaign-tab="${tab}">${labelize(tab)}</button>`).join("")}</div>
      ${campaignTabHtml(c)}`;
    document.querySelectorAll("[data-campaign-tab]").forEach((button) => button.addEventListener("click", () => {
      state.dmCampaignTab = button.dataset.campaignTab;
      renderCampaigns();
    }));
    document.querySelector("[data-campaign-update]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target));
      data.current_campaign_day = Number(data.current_campaign_day || 1);
      state.campaign = await api(`/campaigns/${c.id}`, { method: "PUT", body: JSON.stringify(data) });
      state.campaign = await api(`/campaigns/${c.id}`);
      renderCampaigns();
    });
    document.querySelector("[data-archive-campaign]")?.addEventListener("click", async () => {
      await api(`/campaigns/${c.id}`, { method: "DELETE" });
      location.href = "/1e/dm/campaigns/";
    });
    document.querySelector("[data-campaign-player]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target));
      if (data.user_id) data.user_id = Number(data.user_id);
      await api(`/campaigns/${c.id}/players`, { method: "POST", body: JSON.stringify(data) });
      state.players = await api("/players");
      state.campaign = await api(`/campaigns/${c.id}`);
      renderCampaigns();
    });
    document.querySelectorAll("[data-remove-player]").forEach((button) => button.addEventListener("click", async () => {
      await api(`/campaigns/${c.id}/players/${button.dataset.removePlayer}`, { method: "DELETE" });
      state.campaign = await api(`/campaigns/${c.id}`);
      renderCampaigns();
    }));
    document.querySelector("[data-assign-character]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target));
      if (!data.character_id) return;
      await api(`/campaigns/${c.id}/characters/${data.character_id}`, { method: "POST" });
      state.campaign = await api(`/campaigns/${c.id}`);
      state.characters = await api("/characters?include_archived=true");
      renderCampaigns();
    });
    document.querySelectorAll("[data-char-status]").forEach((button) => button.addEventListener("click", async () => {
      const [id, status] = button.dataset.charStatus.split(":");
      const payload = status === "unassign" ? { campaign_id: null } : status === "dead" ? { status: "dead", life_status: "dead" } : { status, life_status: "alive" };
      await api(`/characters/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      state.campaign = await api(`/campaigns/${c.id}`);
      state.characters = await api("/characters?include_archived=true");
      renderCampaigns();
    }));
    document.querySelector("[data-safe-storage]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      await api(`/campaigns/${c.id}/safe-storage`, { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
      state.campaign = await api(`/campaigns/${c.id}`);
      renderCampaigns();
    });
    document.querySelectorAll("[data-archive-storage]").forEach((button) => button.addEventListener("click", async () => {
      await api(`/campaigns/${c.id}/safe-storage/${button.dataset.archiveStorage}`, { method: "DELETE" });
      state.campaign = await api(`/campaigns/${c.id}`);
      renderCampaigns();
    }));
    document.querySelector("[data-catalog-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target));
      data.cost_amount = data.cost_amount ? Number(data.cost_amount) : null;
      data.weight = Number(data.weight || 0);
      data.armor_class_value = data.armor_class_value ? Number(data.armor_class_value) : null;
      data.armor_class_adjustment = data.armor_class_adjustment ? Number(data.armor_class_adjustment) : null;
      data.campaign_id = c.id;
      data.is_dm_created = true;
      data.properties = data.type === "weapon" ? { speed: data.speed_factor || "—" } : {};
      delete data.speed_factor;
      await api("/equipment", { method: "POST", body: JSON.stringify(data) });
      invalidateEquipmentCache();
      state.equipment = await loadEquipmentCatalog();
      renderCampaigns();
    });
    document.querySelectorAll("[data-archive-item]").forEach((button) => button.addEventListener("click", async () => {
      await api(`/equipment/${button.dataset.archiveItem}`, { method: "DELETE" });
      invalidateEquipmentCache();
      state.equipment = await loadEquipmentCatalog();
      renderCampaigns();
    }));
    return;
  }
  document.querySelector("[data-vault-view]").innerHTML = `
    <section class="vault-panel" id="new-campaign">
      <div class="vault-section-heading">
        <div>
          <div class="vault-kicker">New Campaign</div>
          <h2>Create Campaign</h2>
        </div>
      </div>
      <form class="vault-form vault-form-compact" data-campaign-form>${field("Name", "name", "")}${field("Default Location", "default_location", "Town")}${field("Current Day", "current_campaign_day", 1, "number")}<label class="vault-field full">Description<textarea name="description"></textarea></label><div class="vault-actions vault-full"><button class="vault-button" type="submit">Create Campaign</button></div></form>
    </section>
    <section class="vault-panel">
      <div class="vault-section-heading">
        <div>
          <div class="vault-kicker">DM Tools</div>
          <h2>Campaigns</h2>
        </div>
      </div>
      ${campaignsTableHtml(state.campaigns)}
    </section>`;
  document.querySelector("[data-campaign-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    data.current_campaign_day = Number(data.current_campaign_day || 1);
    await api("/campaigns", { method: "POST", body: JSON.stringify(data) });
    state.campaigns = await api("/campaigns");
    renderCampaigns();
  });
  document.querySelectorAll("[data-archive-campaign-list]").forEach((button) => button.addEventListener("click", async () => {
    await api(`/campaigns/${button.dataset.archiveCampaignList}`, { method: "DELETE" });
    state.campaigns = await api("/campaigns");
    toast("Saved.");
    renderCampaigns();
  }));
}

function campaignTabHtml(c) {
  const tab = state.dmCampaignTab;
  if (tab === "characters") {
    return `<section class="vault-panel"><div class="vault-section-heading"><div><div class="vault-kicker">Characters</div><h2>Campaign Characters</h2></div><a class="vault-button" href="/1e/characters/new/">Create Character</a></div><form class="vault-form vault-form-compact" data-assign-character>${selectField("Assign Existing Character", "character_id", "", ["", ...state.characters.filter((character) => !character.campaign_id || character.campaign_id === c.id).map((character) => String(character.id))])}<div class="vault-actions"><button class="vault-button" type="submit">Assign</button></div></form>${campaignCharactersTable(c.characters || [])}</section>`;
  }
  if (tab === "storage") {
    return `<section class="vault-panel"><div class="vault-section-heading"><div><div class="vault-kicker">Storage</div><h2>Campaign Storage</h2></div></div><form class="vault-form vault-form-compact" data-safe-storage>${field("Location Name", "name", "Party Camp")}${field("Description", "description", "", "text", "wide")}<p class="vault-muted vault-full">Use this for items, coins, or gear not carried by the character.</p><div class="vault-actions vault-full"><button class="vault-button" type="submit">Add Storage Location</button></div></form>${safeStorageHtml(c)}</section>`;
  }
  if (tab === "equipment") {
    return `<section class="vault-panel"><div class="vault-section-heading"><div><div class="vault-kicker">Equipment</div><h2>Campaign Equipment</h2></div><a class="vault-button secondary" href="/1e/dm/equipment/">Equipment Catalog</a></div>${campaignEquipmentTable(c)}</section>`;
  }
  if (tab === "journal") {
    return `<section class="vault-panel"><div class="vault-kicker">Journal</div><h2>Campaign Journal</h2><p class="vault-muted">Campaign notes, session notes, and major events will live here. This is a placeholder until the journal model ships.</p><label class="vault-field full">Campaign Notes<textarea readonly>${h(c.description || "")}</textarea></label></section>`;
  }
  if (tab === "settings") {
    return `<section class="vault-panel"><div class="vault-kicker">Settings</div><h2>Campaign Settings</h2>${campaignSettingsForm(c)}</section>`;
  }
  return `<section class="vault-grid"><article class="vault-card"><div class="vault-kicker">Overview</div><h2>Status</h2><div class="vault-statline">${summaryStat("Day", c.current_campaign_day)}${summaryStat("Location", c.default_location || "Town")}${summaryStat("Status", labelize(c.status || "active"))}</div></article><article class="vault-card"><div class="vault-kicker">Characters</div><h2>${(c.characters || []).length} Assigned</h2><p>${(c.characters || []).filter((character) => character.status === "active").length} active characters.</p></article><article class="vault-card"><div class="vault-kicker">Storage</div><h2>${(c.safe_storage_locations || []).length} Locations</h2><p>${(c.stored_items || []).length} stored item rows.</p></article><article class="vault-panel"><div class="vault-kicker">Notes</div><p>${h(c.description || "No campaign notes yet.")}</p></article></section>`;
}

function campaignSettingsForm(c) {
  return `<form class="vault-form vault-form-compact" data-campaign-update>${field("Campaign Name", "name", c.name || "")}${field("Campaign Day", "current_campaign_day", c.current_campaign_day, "number")}${field("Default / Current Location", "default_location", c.default_location || "Town", "text", "wide")}${selectField("Status", "status", c.status || "active", ["active", "inactive", "archived"])}<label class="vault-field full">Notes<textarea name="description">${h(c.description || "")}</textarea></label><div class="vault-actions vault-full"><button class="vault-button" type="submit">Save Settings</button><button class="vault-button secondary" type="button" data-archive-campaign="${c.id}">Archive Campaign</button></div></form>`;
}

function campaignsTableHtml(campaigns) {
  return `<table class="vault-table"><thead><tr><th>Campaign</th><th>Day</th><th>Location</th><th>Characters</th><th>Status</th><th>Actions</th></tr></thead><tbody>${campaigns.length ? campaigns.map((c) => `<tr><td><strong>${h(c.name)}</strong><br><span class="vault-mini">${h(c.description || "")}</span></td><td>${h(c.current_campaign_day)}</td><td>${h(c.default_location || "")}</td><td>${h(c.characters?.length || 0)}</td><td>${h(labelize(c.status))}</td><td><a class="vault-button secondary" href="/1e/dm/campaigns/${c.id}/">Open</a> <a class="vault-button secondary" href="/1e/dm/campaigns/${c.id}/#settings">Edit</a> <button class="vault-button secondary" type="button" data-archive-campaign-list="${c.id}">Archive</button></td></tr>`).join("") : `<tr><td colspan="6">No campaigns yet. Create one above.</td></tr>`}</tbody></table>`;
}

function campaignCardsHtml(campaigns) {
  return campaigns.length ? `<div class="vault-grid">${campaigns.map((campaign) => `<article class="vault-card"><div class="vault-kicker">${h(labelize(campaign.status))}</div><h2>${h(campaign.name)}</h2><p>Day ${h(campaign.current_campaign_day)} at ${h(campaign.default_location || "Town")}.</p><div class="vault-actions"><a class="vault-button secondary" href="/1e/dm/campaigns/${campaign.id}/">Open</a></div></article>`).join("")}</div>` : `<p class="vault-muted">No campaigns yet. Start one from the Campaigns page.</p>`;
}

function summaryStat(label, value) {
  return `<span class="vault-stat"><span>${h(label)}</span><strong>${h(value)}</strong></span>`;
}

function renderDmPlayers() {
  document.querySelector("[data-vault-view]").innerHTML = `<section class="vault-panel"><h2>DM Players</h2><form class="vault-form" data-dm-player-form>
    ${field("Player Name", "display_name", "")}
    ${field("Email", "email", "", "email")}
    ${field("Discord User ID", "discord_user_id", "")}
    ${selectField("Role", "role", "player", ["player", "dm", "admin"])}
    <div class="vault-actions vault-full"><button class="vault-button" type="submit">Save Player</button></div>
  </form><table class="vault-table"><thead><tr><th>Player</th><th>Role</th><th>Email</th><th>Characters</th><th>Assign to Campaign</th></tr></thead><tbody>${state.players.length ? state.players.map((player) => `<tr><td>${h(player.display_name || player.player_name)}</td><td>${h(labelize(player.role))}</td><td>${h(player.email || "")}</td><td>${playerCharacterLinks(player.id)}</td><td>${state.campaigns.length ? `${selectField("", `player_campaign_${player.id}`, "", ["", ...state.campaigns.map((campaign) => String(campaign.id))])}<button class="vault-button secondary" type="button" data-assign-player="${player.id}">Assign</button>` : `<span class="vault-muted">No campaigns.</span>`}</td></tr>`).join("") : `<tr><td colspan="5">No players created yet.</td></tr>`}</tbody></table></section>`;
  document.querySelector("[data-dm-player-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await api("/players", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
    state.players = await api("/players");
    state.characters = await api("/characters?include_archived=true");
    renderDmPlayers();
  });
  document.querySelectorAll("[data-assign-player]").forEach((button) => button.addEventListener("click", async () => {
    const campaignIdValue = document.querySelector(`[name='player_campaign_${button.dataset.assignPlayer}']`)?.value;
    if (!campaignIdValue) return toast("Choose a campaign.");
    await api(`/campaigns/${campaignIdValue}/players`, { method: "POST", body: JSON.stringify({ user_id: Number(button.dataset.assignPlayer), campaign_role: "player" }) });
    toast("Saved.");
  }));
}

function renderDmCharacters() {
  const characters = filteredDmCharacters();
  document.querySelector("[data-vault-view]").innerHTML = `<section class="vault-panel"><h2>DM Characters</h2><div class="vault-actions">${selectField("Campaign", "dm_filter_campaign", state.dmCharacterFilters.campaign_id, ["", ...state.campaigns.map((campaign) => String(campaign.id))])}${selectField("Player", "dm_filter_player", state.dmCharacterFilters.user_id, playerSelectOptions())}${selectField("Status", "dm_filter_status", state.dmCharacterFilters.status, ["", "active", "inactive", "dead", "retired", "archived"])}</div><table class="vault-table"><thead><tr><th>Character</th><th>Player</th><th>Campaign</th><th>Status</th><th>Location</th><th>Assign</th><th>Actions</th></tr></thead><tbody>${characters.length ? characters.map((character) => `<tr><td><a href="/1e/characters/${character.id}/">${h(character.name)}</a><br><span class="vault-mini">${h(character.race)} ${h(character.class_display || character.class_name)} ${h(character.level_display || character.level)}</span></td><td>${h(character.player?.display_name || character.user_id)}</td><td>${h(campaignName(character.campaign_id))}</td><td>${h(labelize(character.status))} / ${h(labelize(character.life_status))}</td><td>${h(character.current_location)}</td><td>${selectField("", `character_campaign_${character.id}`, character.campaign_id ? String(character.campaign_id) : "", ["", ...state.campaigns.map((campaign) => String(campaign.id))])}<button class="vault-button secondary" type="button" data-assign-character-dm="${character.id}">Save</button></td><td><a class="vault-button secondary" href="/1e/characters/${character.id}/edit/">Edit</a></td></tr>`).join("") : `<tr><td colspan="7">No characters match these filters.</td></tr>`}</tbody></table></section>`;
  ["campaign", "player", "status"].forEach((name) => {
    document.querySelector(`[name='dm_filter_${name}']`)?.addEventListener("change", (event) => {
      const key = name === "player" ? "user_id" : name === "campaign" ? "campaign_id" : "status";
      state.dmCharacterFilters[key] = event.target.value;
      renderDmCharacters();
    });
  });
  document.querySelectorAll("[data-assign-character-dm]").forEach((button) => button.addEventListener("click", async () => {
    const id = button.dataset.assignCharacterDm;
    const campaignIdValue = document.querySelector(`[name='character_campaign_${id}']`)?.value;
    await api(`/characters/${id}`, { method: "PUT", body: JSON.stringify({ campaign_id: campaignIdValue ? Number(campaignIdValue) : null }) });
    state.characters = await api("/characters?include_archived=true");
    toast("Saved.");
    renderDmCharacters();
  }));
}

function campaignName(id) {
  if (!id) return "Unassigned";
  return state.campaigns.find((campaign) => campaign.id === id)?.name || `Campaign ${id}`;
}

function playerCharacterLinks(playerId) {
  const characters = state.characters.filter((character) => character.user_id === playerId);
  return characters.length ? characters.map((character) => `<a href="/1e/characters/${character.id}/">${h(character.name)}</a> <a class="vault-mini" href="/1e/characters/${character.id}/edit/">Edit</a>`).join("<br>") : `<span class="vault-muted">No characters.</span>`;
}

function filteredDmCharacters() {
  return state.characters.filter((character) => {
    const filters = state.dmCharacterFilters;
    return (!filters.campaign_id || String(character.campaign_id || "") === filters.campaign_id)
      && (!filters.user_id || String(character.user_id || "") === filters.user_id)
      && (!filters.status || character.status === filters.status);
  });
}

function renderDmEquipment() {
  const editItem = state.equipment.find((item) => item.id === state.editEquipmentId) || null;
  const items = filteredDmEquipment();
  document.querySelector("[data-vault-view]").innerHTML = `<section class="vault-panel"><h2>DM Equipment Catalog</h2><div class="vault-actions">${field("Search", "dm_equipment_search", state.equipmentFilters.q)}${selectField("Type", "dm_equipment_type", state.equipmentFilters.type, ["", ...equipmentTypeOptions()])}</div><form class="vault-form" data-dm-equipment-form>${equipmentEditorFields(editItem)}<div class="vault-actions vault-full"><button class="vault-button" type="submit">${editItem ? "Save Item" : "Create Item"}</button>${editItem ? `<button class="vault-button secondary" type="button" data-cancel-equipment-edit>Cancel Edit</button>` : ""}</div></form><table class="vault-table"><thead><tr><th>Item</th><th>Type</th><th>Cost</th><th>Wt</th><th>Campaign</th><th>Actions</th></tr></thead><tbody>${items.length ? items.map((item) => `<tr><td><strong>${h(item.name)}</strong><br><span class="vault-mini">${h(item.notes || item.rules_reference || "")}</span></td><td>${h(labelize(item.type))}${item.subtype ? `<br><span class="vault-mini">${h(labelize(item.subtype))}</span>` : ""}</td><td>${h(item.cost_amount ?? "")} ${h(item.cost_coin ?? "")}</td><td>${h(item.weight ?? 0)}</td><td>${h(campaignName(item.campaign_id))}</td><td>${item.is_dm_created ? `<button class="vault-button secondary" type="button" data-edit-equipment="${item.id}">Edit</button> <button class="vault-button secondary" type="button" data-archive-equipment="${item.id}">Archive</button>` : item.properties?.source === "Player's Handbook" ? `<span class="vault-muted">Player's Handbook</span>` : `<span class="vault-muted">Pending PHB Audit</span>`}</td></tr>`).join("") : `<tr><td colspan="6">No equipment matches these filters.</td></tr>`}</tbody></table></section>`;
  document.querySelector("[name='dm_equipment_search']")?.addEventListener("input", (event) => { state.equipmentFilters.q = event.target.value; renderDmEquipment(); });
  document.querySelector("[name='dm_equipment_type']")?.addEventListener("change", (event) => { state.equipmentFilters.type = event.target.value; renderDmEquipment(); });
  document.querySelector("[data-cancel-equipment-edit]")?.addEventListener("click", () => { state.editEquipmentId = null; renderDmEquipment(); });
  document.querySelectorAll("[data-edit-equipment]").forEach((button) => button.addEventListener("click", () => {
    state.editEquipmentId = Number(button.dataset.editEquipment);
    renderDmEquipment();
  }));
  document.querySelectorAll("[data-archive-equipment]").forEach((button) => button.addEventListener("click", async () => {
    await api(`/equipment/${button.dataset.archiveEquipment}`, { method: "DELETE" });
    invalidateEquipmentCache();
    state.equipment = await loadEquipmentCatalog();
    toast("Saved.");
    renderDmEquipment();
  }));
  document.querySelector("[data-dm-equipment-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = equipmentFormPayload(new FormData(event.target));
    const path = editItem ? `/equipment/${editItem.id}` : "/equipment";
    const method = editItem ? "PUT" : "POST";
    await api(path, { method, body: JSON.stringify(data) });
    invalidateEquipmentCache();
    state.equipment = await loadEquipmentCatalog();
    state.editEquipmentId = null;
    toast("Saved.");
    renderDmEquipment();
  });
}

function filteredDmEquipment() {
  return state.equipment.filter((item) => {
    const filters = state.equipmentFilters;
    return (!filters.q || item.name.toLowerCase().includes(filters.q.toLowerCase()))
      && (!filters.type || item.type === filters.type);
  }).slice(0, 120);
}

function equipmentTypeOptions() {
  return ["weapon", "armor", "shield", "adventuring_gear", "container", "mount", "transport", "tool", "clothing", "service", "treasure", "magic_item", "other"];
}

function equipmentEditorFields(item = {}) {
  return `
    ${field("Name", "name", item.name || "")}
    ${selectField("Type", "type", item.type || "adventuring_gear", equipmentTypeOptions())}
    ${field("Subtype", "subtype", item.subtype || "")}
    ${field("Cost Amount", "cost_amount", item.cost_amount ?? "", "number")}
    ${selectField("Cost Coin", "cost_coin", item.cost_coin || "gp", ["pp", "gp", "ep", "sp", "cp"])}
    ${field("Weight", "weight", item.weight ?? 0, "number")}
    ${field("Damage Small/Medium", "damage_small_medium", item.damage_small_medium || "")}
    ${field("Damage Large", "damage_large", item.damage_large || "")}
    ${field("Speed Factor", "speed_factor", item.properties?.speed ?? "")}
    ${field("Armor/Shield AC", "armor_class_value", item.armor_class_value ?? "", "number")}
    ${field("AC Adjustment", "armor_class_adjustment", item.armor_class_adjustment ?? "", "number")}
    ${selectField("Campaign", "campaign_id", item.campaign_id ? String(item.campaign_id) : "", ["", ...state.campaigns.map((campaign) => String(campaign.id))])}
    ${field("Rules Reference", "rules_reference", item.rules_reference || "")}
    <label class="vault-check vault-full"><input type="checkbox" name="is_dm_created" ${item.is_dm_created !== false ? "checked" : ""}> Adventure-specific / DM-created item</label>
    <label class="vault-field full">Properties JSON<textarea name="properties_json">${h(JSON.stringify(item.properties || {}, null, 2))}</textarea></label>
    <label class="vault-field full">Notes<textarea name="notes">${h(item.notes || "")}</textarea></label>
  `;
}

function equipmentFormPayload(formData) {
  const data = Object.fromEntries(formData);
  let properties = {};
  try {
    properties = data.properties_json ? JSON.parse(data.properties_json) : {};
  } catch {
    properties = { note: data.properties_json };
  }
  const payload = {
    ...data,
    cost_amount: data.cost_amount ? Number(data.cost_amount) : null,
    weight: Number(data.weight || 0),
    armor_class_value: data.armor_class_value ? Number(data.armor_class_value) : null,
    armor_class_adjustment: data.armor_class_adjustment ? Number(data.armor_class_adjustment) : null,
    campaign_id: data.campaign_id ? Number(data.campaign_id) : null,
    is_dm_created: data.is_dm_created === "on",
    properties: { ...properties, ...(data.type === "weapon" ? { speed: data.speed_factor || "—" } : {}) },
  };
  delete payload.properties_json;
  delete payload.speed_factor;
  return payload;
}

function campaignPlayersTable(players) {
  return `<table class="vault-table"><thead><tr><th>Player</th><th>Role</th><th>Email</th><th></th></tr></thead><tbody>${players.length ? players.map((entry) => `<tr><td>${h(entry.player?.display_name || entry.user_id)}</td><td>${h(labelize(entry.role))}</td><td>${h(entry.player?.email || "")}</td><td><button class="vault-button secondary" type="button" data-remove-player="${entry.user_id}">Remove</button></td></tr>`).join("") : `<tr><td colspan="4">No players assigned yet.</td></tr>`}</tbody></table>`;
}

function campaignCharactersTable(characters) {
  return `<table class="vault-table"><thead><tr><th>Character</th><th>Player/Owner</th><th>Race</th><th>Class</th><th>Level</th><th>Status</th><th>Location</th><th>Actions</th></tr></thead><tbody>${characters.length ? characters.map((character) => `<tr><td><a href="/1e/characters/${character.id}/">${h(character.name)}</a></td><td>${h(character.player?.display_name || "Unknown Player")}</td><td>${h(character.race)}</td><td>${h(character.class_display || character.class_name)}</td><td>${h(character.level_display || character.level)}</td><td>${h(labelize(character.status))}</td><td>${h(character.current_location)}</td><td><a class="vault-button secondary" href="/1e/characters/${character.id}/">View</a> <a class="vault-button secondary" href="/1e/characters/${character.id}/edit/">Edit</a> <button class="vault-button secondary" type="button" data-char-status="${character.id}:unassign">Remove</button></td></tr>`).join("") : `<tr><td colspan="8">No characters assigned yet.</td></tr>`}</tbody></table>`;
}

function safeStorageHtml(c) {
  const locations = c.safe_storage_locations || [];
  const stored = c.stored_items || [];
  return `${locations.length ? `<div class="vault-storage-grid">${locations.map((location) => {
    const items = stored.filter((item) => item.storage_location === location.name || (location.stored_items || []).some((storedItem) => storedItem.id === item.id));
    const weight = items.reduce((total, item) => total + Number(item.quantity || 1) * Number(item.equipment?.weight || 0), 0);
    return `<article class="vault-row"><div><strong>${h(location.name)}</strong><p>${h(location.description || "No description.")}</p><p class="vault-muted">${items.length} item rows. ${weight} lb stored.</p></div><div class="vault-actions"><button class="vault-button secondary" type="button" data-archive-storage="${location.id}">Archive</button></div></article>`;
  }).join("")}</div>` : `<p>No campaign storage locations yet. Common options: Inn Room, Temple Vault, Hireling Pack Mule, Townhouse, Party Camp, Hidden Cache.</p>`}<h3>Stored Items</h3>${stored.length ? `<table class="vault-table"><thead><tr><th>Item</th><th>Character</th><th>Location</th><th>Notes</th></tr></thead><tbody>${stored.map((item) => `<tr><td>${h(item.quantity)} x ${h(item.equipment.name)}</td><td><a href="/1e/characters/${item.character_id}/">${h(item.character_name)}</a></td><td>${h(item.storage_location)}</td><td>${h(item.notes || "")}</td></tr>`).join("")}</tbody></table>` : `<p class="vault-muted">No stored items in this campaign.</p>`}`;
}

function campaignEquipmentTable(c) {
  const campaignItems = state.equipment.filter((item) => item.campaign_id === c.id);
  return `<table class="vault-table"><thead><tr><th>Item</th><th>Type</th><th>Weight</th><th>Damage / AC</th><th>Campaign</th><th>Actions</th></tr></thead><tbody>${campaignItems.length ? campaignItems.map((item) => `<tr><td><strong>${h(item.name)}</strong><br><span class="vault-mini">${h(item.notes || item.rules_reference || "")}</span></td><td>${h(labelize(item.type))}${item.subtype ? `<br><span class="vault-mini">${h(labelize(item.subtype))}</span>` : ""}</td><td>${h(item.weight ?? 0)}</td><td>${equipmentCombatText(item)}</td><td>${h(c.name)}</td><td><a class="vault-button secondary" href="/1e/dm/equipment/">Edit Catalog</a></td></tr>`).join("") : `<tr><td colspan="6">No campaign-specific equipment yet. Use the DM Equipment Catalog to create or assign items.</td></tr>`}</tbody></table>`;
}

function equipmentCombatText(item) {
  const parts = [];
  if (item.damage_small_medium) parts.push(`Dmg ${item.damage_small_medium}`);
  if (item.type === "weapon") parts.push(`Spd ${item.properties?.speed ?? "—"}`);
  if (item.armor_class_value) parts.push(`AC ${item.armor_class_value}`);
  if (item.armor_class_adjustment) parts.push(`Adj ${item.armor_class_adjustment}`);
  return parts.length ? h(parts.join(" / ")) : `<span class="vault-muted">-</span>`;
}

function dmCatalogHtml(c) {
  const campaignItems = state.equipment.filter((item) => item.campaign_id === c.id || item.is_dm_created).slice(0, 30);
  return `<section class="vault-panel"><div class="vault-kicker">DM Item Catalog</div><form class="vault-form" data-catalog-form>
    ${field("Name", "name", "")}
    <label class="vault-field">Type<select name="type"><option value="weapon">Weapon</option><option value="armor">Armor</option><option value="shield">Shield</option><option value="adventuring_gear" selected>Adventuring Gear</option><option value="container">Container</option><option value="mount">Mount</option><option value="transport">Transport</option><option value="tool">Tool</option><option value="clothing">Clothing</option><option value="service">Service</option><option value="treasure">Treasure</option><option value="magic_item">Magic Item</option><option value="other">Other</option></select></label>
    ${field("Subtype", "subtype", "")}
    ${field("Cost", "cost_amount", "", "number")}
    ${selectField("Coin", "cost_coin", "gp", ["pp", "gp", "ep", "sp", "cp"])}
    ${field("Weight", "weight", 0, "number")}
    ${field("Damage S/M", "damage_small_medium", "")}
    ${field("Damage L", "damage_large", "")}
    ${field("Speed Factor", "speed_factor", "")}
    ${field("Armor AC", "armor_class_value", "", "number")}
    ${field("AC Adjustment", "armor_class_adjustment", "", "number")}
    ${field("Rules Reference", "rules_reference", "", "text", "wide")}
    <label class="vault-field full">Notes<textarea name="notes"></textarea></label>
    <div class="vault-actions vault-full"><button class="vault-button" type="submit">Create Campaign Item</button></div>
  </form><table class="vault-table"><thead><tr><th>Item</th><th>Type</th><th>Wt</th><th>Campaign</th><th></th></tr></thead><tbody>${campaignItems.length ? campaignItems.map((item) => `<tr><td>${h(item.name)}<br><span class="vault-mini">${h(item.notes || "")}</span></td><td>${h(labelize(item.type))}</td><td>${h(item.weight)}</td><td>${h(item.campaign_id || "Global")}</td><td><button class="vault-button secondary" type="button" data-archive-item="${item.id}">Archive</button></td></tr>`).join("") : `<tr><td colspan="5">No custom items yet.</td></tr>`}</tbody></table></section>`;
}

function title(value) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function labelize(value) {
  const labels = {
    active: "Active",
    inactive: "Inactive",
    retired: "Retired",
    dead: "Dead",
    archived: "Archived",
    alive: "Alive",
    missing: "Missing",
    petrified: "Petrified",
    player: "Player",
    dm: "DM",
    admin: "Admin",
    observer: "Observer",
    adventuring_gear: "Adventuring Gear",
    magic_item: "Magic Item",
    carried: "Carried",
    equipped: "Equipped",
    stored: "Stored",
    dropped: "Dropped",
    sold: "Not Carried",
    lost: "Lost",
    destroyed: "Destroyed",
    weapon: "Weapon",
    armor: "Armor",
    shield: "Shield",
    container: "Container",
    mount: "Mount",
    transport: "Transport",
    tool: "Tool",
    clothing: "Clothing",
    service: "Service",
    treasure: "Treasure",
    other: "Other",
  };
  return labels[value] || title(String(value || ""));
}

function hitDiceText(c) {
  const level = Number(c.level || 1);
  const className = c.class_name;
  if (className === "Ranger" && level === 1) return "2d8";
  const dragonlanceClass = dragonlanceClassProfile(className);
  if (dragonlanceClass?.hit_die) return dragonlanceClass.hit_die;
  const hitDie = c.class_details?.hit_die || state.rules?.classes?.[className]?.hit_die;
  if (hitDie && level === 1) return `1d${hitDie}`;
  return c.class_details?.hit_die_text || state.rules?.classes?.[className]?.hit_die_text || (hitDie ? `d${hitDie}` : "Manual DM Review");
}

function displayReference(value) {
  const labels = {
    "/1e/equipment/": "Equipment",
    "/1e/how-to-play/magic/": "Magic",
    "/1e/how-to-play/equipment-encumbrance/": "Movement & Encumbrance",
    "/1e/character-creation/": "Character Creation",
    "/1e/character-creation/001-ability-scores/": "Ability Scores",
    "/1e/character-creation/003-class/": "Class",
  };
  return labels[value] || value || "";
}

function weaponProficiencyLabel(equipmentOrId, proficiencies = []) {
  const proficiency = weaponProficiencyEntry(equipmentOrId, proficiencies);
  if (!proficiency) return "Non-proficient";
  return proficiency.proficient ? "Proficient" : "Non-proficient";
}

function weaponProficiencyEntry(equipmentOrId, proficiencies = []) {
  const equipment = typeof equipmentOrId === "object" ? equipmentOrId : null;
  const equipmentId = equipment ? equipment.id : equipmentOrId;
  const proficiencyName = String(equipment?.properties?.proficiency_equipment_name || "").toLowerCase();
  return proficiencies.find((entry) => {
    if (Number(entry.equipment_id) === Number(equipmentId)) return true;
    return proficiencyName && String(entry.equipment?.name || "").toLowerCase() === proficiencyName;
  }) || null;
}

function isAmmunition(item = {}) {
  const name = String(item.name || "").toLowerCase();
  const subtype = String(item.subtype || "").toLowerCase();
  if (item.is_ammunition) return true;
  if (subtype.includes("ammunition")) return true;
  return AMMUNITION_COMPATIBILITY.some((profile) => profile.terms.some((term) => name.includes(term)));
}

function ammunitionProfile(item = {}) {
  if (item.ammunition_kind) return AMMUNITION_COMPATIBILITY.find((profile) => profile.kind === item.ammunition_kind) || null;
  const name = String(item.equipment?.name || item.name || "").toLowerCase();
  return AMMUNITION_COMPATIBILITY.find((profile) => profile.terms.some((term) => name.includes(term))) || null;
}

function ammunitionLabel(item = {}) {
  return item.ammunition_display_name || item.equipment?.ammunition_display_name || ammunitionProfile(item)?.label || "Ammunition";
}

function ammunitionBundleSize(item = {}) {
  const equipment = item.equipment || item;
  const name = String(equipment.name || "").toLowerCase();
  return Number(item.bundle_size || equipment.bundle_size || equipment.properties?.bundle_size || (name.includes("score") ? 20 : name.includes("dozen") ? 12 : 1));
}

function inventoryItemName(item = {}) {
  const equipment = item.equipment || item;
  return isAmmunition(equipment) || item.is_ammunition ? ammunitionLabel(item) : equipment.name || "Item";
}

function formatWeight(value) {
  const number = Number(value || 0);
  if (Number.isInteger(number)) return `${number} lb`;
  return `${Number(number.toFixed(2))} lb`;
}

function inventoryItemValue(item = {}) {
  const equipment = item.equipment || {};
  const coin = item.stack_value_coin || equipment.cost_coin || "";
  const value = item.stack_value ?? (equipment.cost_amount != null ? Number(equipment.cost_amount) * Math.max(1, Number(item.quantity || 1)) : null);
  if (value == null) return "";
  const amount = Number(value);
  const display = Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(2)));
  return `${display} ${coin}`.trim();
}

function equipmentDisplayType(item = {}) {
  return isAmmunition(item) ? "Ammunition" : labelize(item.type);
}

function compatibleAmmunitionForWeapon(weapon = {}, inventory = []) {
  const weaponName = String(weapon.name || "").toLowerCase();
  const profiles = AMMUNITION_COMPATIBILITY.filter((candidate) => candidate.weaponTerms.some((term) => weaponName.includes(term)));
  if (!profiles.length) return null;
  const kinds = new Set(profiles.map((profile) => profile.kind));
  return inventory.find((item) => {
    const status = item.status || "carried";
    if (!["equipped", "carried"].includes(status)) return false;
    return isAmmunition(item.equipment || item) && kinds.has(ammunitionProfile(item.equipment || item)?.kind);
  }) || null;
}

function startingWealthFormula(className) {
  const dragonlanceClass = dragonlanceClassProfile(className);
  if (dragonlanceClass?.wealth) return dragonlanceClass.wealth;
  const baseClass = dragonlanceClass?.base_class;
  const aliases = {
    "Knight of Solamnia": "Fighter",
    "Knight of the Crown": "Fighter",
    "Knight of the Sword": "Fighter",
    "Knight of the Rose": "Fighter",
    "Thief / Handler": "Thief",
    "Robe Order Wizard": "Magic-User",
    Tinker: "Magic-User",
  };
  return state.rules?.classes?.[className]?.wealth
    || state.rules?.classes?.[baseClass]?.wealth
    || state.rules?.classes?.[aliases[className]]?.wealth
    || state.rules?.classes?.[aliases[baseClass]]?.wealth
    || "";
}

function rollStartingWealth(formula) {
  const normalized = String(formula || "").replace(/×/g, "x");
  const match = normalized.match(/\(?\s*(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?\s*\)?\s*(?:x\s*(\d+))?\s*(pp|gp|ep|sp|cp)?/i);
  if (!match) return null;
  const count = Number(match[1]);
  const sides = Number(match[2]);
  const modifier = match[3] ? Number(`${match[3]}${match[4]}`) : 0;
  const multiplier = Number(match[5] || 1);
  const coin = (match[6] || "gp").toLowerCase();
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const subtotal = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
  const total = Math.max(0, subtotal * multiplier);
  const formulaDetail = `${rolls.join(" + ")}${modifier ? ` ${modifier > 0 ? "+" : "-"} ${Math.abs(modifier)}` : ""}`;
  return {
    total,
    coin,
    message: multiplier === 1 ? `Rolled ${formulaDetail} = ${total} ${coin}` : `Rolled ${formulaDetail} x ${multiplier} = ${total} ${coin}`,
  };
}

function roll4d6DropLowest() {
  const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => a - b);
  return dice.slice(1).reduce((sum, die) => sum + die, 0);
}

function rollHitDice(text) {
  const match = String(text || "").match(/(\d*)d(\d+)/i);
  const count = Math.max(1, Number(match?.[1] || 1));
  const sides = Math.max(1, Number(match?.[2] || 6));
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return {
    total: rolls.reduce((sum, roll) => sum + roll, 0),
    detail: rolls.length > 1 ? `${rolls.join(" + ")} (${count}d${sides})` : String(rolls[0]),
  };
}

function constitutionHpAdjustment(constitution, className = "") {
  const warrior = ["Fighter", "Paladin", "Ranger", "Barbarian", "Cavalier", "Knight of the Crown", "Knight of the Sword", "Knight of the Rose"].includes(className);
  if (constitution <= 3) return -2;
  if (constitution <= 6) return -1;
  if (constitution === 15) return 1;
  if (constitution === 16) return 2;
  if (constitution === 17) return warrior ? 3 : 2;
  if (constitution === 18) return warrior ? 4 : 2;
  if (constitution >= 19) return warrior ? 5 : 2;
  return 0;
}

boot();
