const VAULT_API_BASE =
  window.DRG1E_VAULT_API_BASE ||
  "/api";
const API = `${VAULT_API_BASE}/1e`;
const abilities = ["strength", "intelligence", "wisdom", "dexterity", "constitution", "charisma"];
const abilityLabels = { strength: "STR", intelligence: "INT", wisdom: "WIS", dexterity: "DEX", constitution: "CON", charisma: "CHA" };
const coins = ["platinum", "gold", "electrum", "silver", "copper"];
const DRAGONLANCE_RACE_PATH = "/content/settings/dragonlance/races/";
const DRAGONLANCE_CLASS_PATH = "/content/settings/dragonlance/classes/";
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
const state = { characters: [], equipment: [], spells: [], campaigns: [], players: [], dragonlanceRaces: [], dragonlanceClasses: [], campaign: null, rules: null, character: null, currentPlayer: null, step: 0, draft: null, inventoryFilter: "equipped", dmOverride: false, dmCharacterFilters: { campaign_id: "", user_id: "", status: "" }, equipmentFilters: { q: "", type: "" }, editEquipmentId: null, dmCampaignTab: "overview" };
const builderContext = detectBuilderContext();

function h(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function detectBuilderContext() {
  const params = new URLSearchParams(window.location.search);
  const hostSetting = window.location.hostname.toLowerCase().includes("dragolance") ? "dragolance" : "osric";
  const setting = (params.get("setting") || params.get("source") || hostSetting).toLowerCase();
  if (setting === "dragolance" || setting === "dragonlance") {
    return { setting: "dragolance", label: "Dragolance", selectableSources: new Set(["DRAGOLANCE"]) };
  }
  if (setting === "greyhawk") {
    return { setting: "greyhawk", label: "Greyhawk", selectableSources: new Set(["OSRIC", "GREYHAWK"]) };
  }
  return { setting: "osric", label: "OSRIC", selectableSources: new Set(["OSRIC", "DRAGOLANCE"]) };
}

function sourceSelectable(source) {
  return builderContext.selectableSources.has(source);
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

function playerAuthHeaders() {
  const token = localStorage.getItem(PLAYER_TOKEN_KEY);
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
  return !isDmMode() && (isClassicHost() || isDragolanceHost() || params.has("campaign_id") || params.get("setting") === "dragolance");
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
      ? ["DRAGOLANCE"]
      : ["OSRIC", "GREYHAWK"];
  builderContext.setting = setting === "dragonlance" ? "dragolance" : setting || builderContext.setting;
  builderContext.label = title(builderContext.setting);
  builderContext.selectableSources = new Set(sourcebooks.map((source) => String(source).toUpperCase()));
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
}

async function fetchDragonlanceRaces() {
  try {
    const files = await fetchJson(`${DRAGONLANCE_RACE_PATH}index.json`);
    return Promise.all(files.map((file) => fetchJson(`${DRAGONLANCE_RACE_PATH}${file}`)));
  } catch (error) {
    console.warn("Dragonlance race content unavailable; using fallback race data.", error);
    return fallbackDragonlanceRaces;
  }
}

async function fetchDragonlanceClasses() {
  try {
    const files = await fetchJson(`${DRAGONLANCE_CLASS_PATH}index.json`);
    return Promise.all(files.map((file) => fetchJson(`${DRAGONLANCE_CLASS_PATH}${file}`)));
  } catch (error) {
    console.warn("Dragonlance class content unavailable.", error);
    return [];
  }
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
  return isPlayerCharacterMode() ? `/characters/${id}` : `/1e/characters/${id}/`;
}

function characterEditHref(id) {
  return isPlayerCharacterMode() ? `/characters/${id}/edit` : `/1e/characters/${id}/edit/`;
}

function campaignId() {
  const match = location.pathname.match(/\/1e\/dm\/campaigns\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function toast(message) {
  const node = document.querySelector("[data-vault-toast]");
  if (node) node.textContent = message;
  const panelNode = document.querySelector("[data-panel-toast]");
  if (panelNode) panelNode.textContent = message;
}

async function boot() {
  renderShell();
  try {
    [state.rules, state.equipment, state.spells, state.dragonlanceRaces, state.dragonlanceClasses] = await Promise.all([
      api("/rules-data"),
      api("/equipment"),
      api("/spells"),
      fetchDragonlanceRaces(),
      fetchDragonlanceClasses(),
    ]);
    const kind = pageKind();

    if (isPlayerCharacterMode()) {
      await hydratePlayerBuilderContext();
    } else {
      [state.campaigns, state.players] = await Promise.all([
        optionalApi(() => api("/campaigns"), []),
        optionalApi(() => api("/players"), []),
      ]);
      hydrateCurrentPlayer();
    }

    if (kind === "show" || kind === "edit") {
      state.character = isPlayerCharacterMode()
        ? await rootApi(`/player/characters/${characterId()}`, { headers: playerAuthHeaders() })
        : await api(`/characters/${characterId()}`);
      if (state.character?.campaign_id) applyCampaignSourceContext(state.campaigns.find((campaign) => campaign.id === state.character.campaign_id));
    }
    if (kind === "campaign" && campaignId()) {
      state.campaign = await api(`/campaigns/${campaignId()}`);
      state.characters = await api("/characters?include_archived=true");
    }
    if (kind === "dmPlayers") state.characters = await api("/characters?include_archived=true");
    if (kind === "dmCharacters") state.characters = await api("/characters?include_archived=true");
    if (kind === "index") state.characters = await api(`/characters${state.currentPlayer?.id ? `?user_id=${state.currentPlayer.id}` : ""}`);
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
  state.campaign = selectedCampaignId ? campaigns.find((campaign) => Number(campaign.id) === selectedCampaignId) || null : null;
  applyCampaignSourceContext(state.campaign || campaigns[0]);
  if (player?.id) localStorage.setItem("drg1e_player_id", String(player.id));
}

function hydrateCurrentPlayer() {
  const storedId = Number(localStorage.getItem("drg1e_player_id") || 0);
  state.currentPlayer = state.players.find((player) => player.id === storedId) || state.players[0] || null;
  if (state.currentPlayer) localStorage.setItem("drg1e_player_id", String(state.currentPlayer.id));
}

function renderShell() {
  const dmPage = isDmMode();
  const sheetId = characterId();
  const heroCopy = dmPage
    ? "Campaigns, characters, storage, and equipment for DRG 1e play."
    : isPlayerCharacterMode()
      ? "Build and maintain your classic First Edition character through the unified DRG 1e rules engine."
      : builderContext.setting === "dragolance"
        ? "Build one Dragolance character through the unified DRG 1e rules engine. Dragonlance sourcebook options are active for this campaign."
        : "Persistent OSRIC character building with DRG 1e table-rule ability rolls, catalog-only equipment, coins, spells, and campaign state.";
  document.querySelector("[data-vault-app]").innerHTML = `
    <section class="vault-hero ${dmPage ? "vault-hero-compact" : ""}">
      <div>
        <div class="vault-eyebrow">${dmPage ? "DM Tools" : isPlayerCharacterMode() ? "My Characters" : builderContext.setting === "dragolance" ? "Dragolance Character Builder" : "DRG 1e Character Vault"}</div>
        <h1>${pageTitle()}</h1>
        <p>${heroCopy}</p>
        ${dmPage ? `<p class="vault-warning-text">DM tools are currently unprotected until login is enabled.</p>` : ""}
        <div class="vault-toast" data-vault-toast></div>
      </div>
      <div class="vault-actions">
        ${dmPage ? dmNavHtml() : playerNavHtml(sheetId)}
      </div>
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
  if (isPlayerCharacterMode()) {
    const campaignHref = state.campaign?.id ? `/campaigns/${state.campaign.id}` : "";
    return `
      <a class="vault-button" href="/">Back to Player Home</a>
      ${campaignHref ? `<a class="vault-button secondary" href="${campaignHref}">Back to Campaign</a>` : ""}
      <a class="vault-button secondary" href="/characters">My Characters</a>
      ${sheetId ? `<a class="vault-button secondary" href="${characterViewHref(sheetId)}">Character Sheet</a>` : ""}
      <a class="vault-button secondary" href="/1e/">Rules</a>`;
  }
  return `
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

function initialDraft() {
  const character = state.character;
  return character ? {
    ...character,
    abilities: { ...character.abilities },
    coins: { ...character.coins },
    combat: { ...character.combat },
  } : {
    owner_name: "Website Player",
    email: "",
    discord_user_id: "",
    role: "player",
    name: "",
    race: "Human",
    class_name: "Fighter",
    alignment: "True Neutral",
    level: 1,
    xp: 0,
    status: "active",
    life_status: "alive",
    campaign_id: campaignIdParam() || state.campaign?.id || "",
    campaign_day: 1,
    current_location: "Town",
    safe_storage_location: "",
    original_rolls: [],
    assigned_rolls: {},
    abilities: Object.fromEntries(abilities.map((ability) => [ability, 10])),
    coins: Object.fromEntries(coins.map((coin) => [coin, 0])),
    combat: { max_hp: 1, current_hp: 1 },
    notes: "",
  };
}

function renderBuilder() {
  state.draft ||= initialDraft();
  const steps = ["Start", "Abilities", "Race", "Class", "Alignment", "Hit Points", "Money", "Equipment", "Proficiencies", "Spells", "Review"];
  document.querySelector("[data-vault-view]").innerHTML = `
    <div class="vault-builder-nav">${steps.map((label, index) => `<button class="vault-tab" aria-selected="${state.step === index}" data-step="${index}">${index + 1}. ${label}</button>`).join("")}</div>
    <form class="vault-panel vault-form" data-builder-form><div class="vault-panel-toast vault-full" data-panel-toast></div>${builderStep()}</form>`;
  document.querySelectorAll("[data-step]").forEach((button) => button.addEventListener("click", () => { syncDraft(); state.step = Number(button.dataset.step); renderBuilder(); }));
  document.querySelector("[data-builder-form]").addEventListener("input", syncDraft);
  document.querySelector("[data-builder-form]").addEventListener("change", syncDraft);
  bindBuilderActions();
}

function field(label, name, value, type = "text", extra = "") {
  return `<label class="vault-field ${extra}">${label}<input name="${name}" type="${type}" value="${h(value)}"></label>`;
}

function selectField(label, name, value, options, extra = "") {
  return `<label class="vault-field ${extra}">${label}<select name="${name}">${options.map((option) => `<option ${option === value ? "selected" : ""}>${h(option)}</option>`).join("")}</select></label>`;
}

function abilityAssignmentHtml(d) {
  const rolls = d.original_rolls || [];
  const assigned = d.assigned_rolls || {};
  const used = new Set(Object.values(assigned).filter((value) => value !== "" && value != null).map(String));
  return `<div class="vault-full">
    <div class="vault-roll-bank">${rolls.length ? rolls.map((roll, index) => `<span class="vault-roll-chip ${used.has(String(index)) ? "used" : ""}">${h(roll)}</span>`).join("") : `<span class="vault-muted">No rolls yet.</span>`}</div>
    <div class="vault-ability-assignments">${abilities.map((ability) => {
      const selected = assigned[ability] ?? "";
      return `<label class="vault-assign"><span>${abilityLabels[ability]}</span><select name="assigned_rolls.${ability}"><option value="">Manual</option>${rolls.map((roll, index) => `<option value="${index}" ${String(selected) === String(index) ? "selected" : ""} ${used.has(String(index)) && String(selected) !== String(index) ? "disabled" : ""}>${h(roll)}</option>`).join("")}</select><input name="abilities.${ability}" type="number" min="3" max="18" value="${h(d.abilities[ability])}"></label>`;
    }).join("")}</div>
    <p class="vault-muted">Manual values remain available for DM-approved overrides. Race adjustments apply after assignment.</p>
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
    ${field("Campaign Day", "campaign_day", d.campaign_day, "number")}
    ${field("Current Location", "current_location", d.current_location)}
    ${field("Personal Storage Location", "safe_storage_location", d.safe_storage_location || "", "text", "wide")}
    <p class="vault-muted vault-full">Use this for items, coins, or gear not carried by the character.</p>
    <p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/">Character Creation</a></p>
    ${navButtons()}`;
  if (state.step === 0) return `
    ${field("Character Name", "name", d.name)}
    ${selectField("Owner / Player", "user_id", String(d.user_id || state.currentPlayer?.id || ""), ["", ...state.players.map((player) => String(player.id))])}
    ${field("Player Name", "owner_name", d.owner_name || state.currentPlayer?.display_name || "Website Player")}
    ${field("Email", "email", d.email || state.currentPlayer?.email || "", "email")}
    ${field("Discord User ID", "discord_user_id", d.discord_user_id || state.currentPlayer?.discord_user_id || "")}
    ${campaignSelectHtml(d)}
    ${field("Campaign Day", "campaign_day", d.campaign_day, "number")}
    ${field("Current Location", "current_location", d.current_location)}
    ${field("Personal Storage Location", "safe_storage_location", d.safe_storage_location || "", "text", "wide")}
    <p class="vault-muted vault-full">Use this for items, coins, or gear not carried by the character.</p>
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
      ${choiceStepHeader("Race", "What race do you want to play?", d.race || "None", "Choose your ancestry from the OSRIC foundation or Dragonlance sourcebook options.")}
      <div class="vault-choice-summary">
        <div>
          <span>Selected Race</span>
          <strong>${h(d.race || "None")}</strong>
          <p>${h(raceCardData(d.race, dragonlanceRaceProfile(d.race) ? "DRAGOLANCE" : "OSRIC")?.description || "Choose a race to see adjusted scores and restrictions.")}</p>
        </div>
        <div class="vault-statline">${adjustedStats(d).map(([name, value]) => `<div class="vault-stat"><strong>${value}</strong><span>${abilityLabels[name]}</span></div>`).join("")}</div>
      </div>
      ${isPlayerCharacterMode() ? `<div class="vault-source-notice">${h(builderContext.label)} campaign mode is active. Source availability is controlled by this campaign.</div>` : builderContext.setting === "dragolance" ? `<div class="vault-source-notice">Dragolance campaign mode is active. OSRIC appears as the rules foundation, but OSRIC-only options are not available for this campaign.</div>` : ""}
      ${raceSourceSection("OSRIC", osricRaceCards(), d.race)}
      ${raceSourceSection("DRAGOLANCE", settingDragonlanceRaces(), d.race)}
    </section>
    <div class="vault-card vault-full"><h3>Race Notes</h3>${raceClassWarnings(d)}<p><strong>Alignment notes:</strong> ${h(compactList(dragonlanceRaceProfile(d.race)?.allowed_alignments || ["See details later"], 6))}</p></div>
    <p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/002-race/">Race</a>. Dragonlance-specific Knights and Wizards restrictions will be added in a later pass.</p>
    ${navButtons()}`;
  if (state.step === 3) return `
    <input type="hidden" name="class_name" value="${h(d.class_name)}">
    <section class="vault-full vault-choice-step">
      ${choiceStepHeader("Class", "What class do you want to play?", d.class_name || "None", "Choose the role, hit die, restrictions, and core adventuring shape for this character.")}
      <div class="vault-choice-summary">
        <div>
          <span>Selected Class</span>
          <strong>${h(d.class_name || "None")}</strong>
          <p>${h(classCardData(d.class_name)?.description || "Choose a class to see rules notes and equipment permissions.")}</p>
        </div>
        <div class="vault-compact-list">
          <span><strong>Hit Die</strong>${h(hitDiceText(d))}</span>
          <span><strong>Proficiencies</strong>${h(proficiencyCount(d.class_name, d.level) ?? "Review")}</span>
          <span><strong>Wealth</strong>${h((state.rules.classes[d.class_name] || {}).wealth || "Review")}</span>
        </div>
      </div>
      ${isPlayerCharacterMode() ? `<div class="vault-source-notice">${h(builderContext.label)} campaign mode is active. Source availability is controlled by this campaign.</div>` : builderContext.setting === "dragolance" ? `<div class="vault-source-notice">Dragolance campaign mode is active. OSRIC classes are shown for reference until Dragolance class data is added.</div>` : ""}
      ${classSourceSection("OSRIC", osricClassCards(), d.class_name)}
      ${classSourceSection("DRAGOLANCE STARTING CLASSES", dragonlanceStartingClassCards(), d.class_name)}
      ${classSourceSection("DRAGOLANCE PROGRESSION PATHS", dragonlanceProgressionClassCards(), d.class_name)}
    </section>
    <div class="vault-card vault-full"><h3>Class Notes</h3>${raceClassWarnings(d)}<p>${h((state.rules.classes[d.class_name] || {}).armor)}</p><p><strong>Weapons:</strong> ${h((state.rules.classes[d.class_name] || {}).weapons)}</p><p>Hit Dice: ${h(hitDiceText(d))}. Starting wealth: ${h((state.rules.classes[d.class_name] || {}).wealth)}.</p><p>Proficiencies: ${h(proficiencyCount(d.class_name, d.level) ?? "Manual DM Review")} at this level. Non-proficiency penalty: ${h((state.rules.classes[d.class_name] || {}).non_proficiency_penalty ?? "Manual DM Review")}.</p></div>
    <p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/003-class/">Class</a></p>
    ${navButtons()}`;
  if (state.step === 4) return `${selectField("Alignment", "alignment", d.alignment, state.rules.alignments)}<div class="vault-card vault-wide">${raceClassWarnings(d)}<p><strong>${h(d.class_name)}:</strong> ${h((state.rules.classes[d.class_name] || {}).alignment || "Any alignment")}</p></div><p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/004-alignment/">Alignment</a>.</p>${navButtons()}`;
  if (state.step === 5) return `${field("Max HP", "combat.max_hp", d.combat.max_hp, "number")}${field("Current HP", "combat.current_hp", d.combat.current_hp, "number")}<p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/007-hit-points/">Hit Points</a></p>${navButtons()}`;
  if (state.step === 6) return `${coins.map((coin) => field(title(coin), `coins.${coin}`, d.coins[coin], "number")).join("")}<div class="vault-card vault-wide"><h3>Coin Load</h3><p>${coinCount(d.coins)} coins, ${coinWeight(d.coins)} lb.</p></div><p class="vault-rules vault-full">Rules: <a href="/1e/equipment/">Coins weigh 10 per lb</a></p>${navButtons()}`;
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
  if (isPlayerCharacterMode() && state.campaign) {
    return `<input type="hidden" name="campaign_id" value="${h(state.campaign.id)}"><div class="vault-card vault-full"><div class="vault-kicker">Campaign</div><h3>${h(state.campaign.name)}</h3><p>${h(title(state.campaign.setting || "classic"))} / Session #${h(state.campaign.session_number || 1)} / ${h(state.campaign.next_session_date || "Next session TBD")}</p></div>`;
  }
  if (isPlayerCharacterMode()) {
    return `<input type="hidden" name="campaign_id" value="${h(d.campaign_id || "")}"><div class="vault-card vault-full"><div class="vault-kicker">Campaign</div><h3>${h(playerCampaignLabel(d))}</h3><p>Campaign context will be attached when launched from a campaign.</p></div>`;
  }
  if (!state.campaigns.length) return `<div class="vault-full vault-muted">No campaigns available. Your DM can assign this character later.</div>`;
  return selectField("Campaign", "campaign_id", d.campaign_id || "", ["", ...state.campaigns.map((c) => String(c.id))]);
}

function playerIdentityHtml() {
  return `<div class="vault-card vault-full"><div class="vault-kicker">Player</div><h3>${h(playerDisplayName())}</h3><p>Ownership is taken from your player login.</p></div>`;
}

function playerDisplayName() {
  return state.currentPlayer?.display_name || state.currentPlayer?.player_name || state.currentPlayer?.username || "Website Player";
}

function playerCampaignLabel(d) {
  if (state.campaign?.name) return state.campaign.name;
  if (d.campaign_id) return `Campaign #${d.campaign_id}`;
  return "DRG";
}

function equipmentManager() {
  return `<div class="vault-full">
    <div class="vault-actions">
      <input name="equipment_search" placeholder="Search equipment catalog" value="">
      <select name="equipment_type"><option value="">All types</option><option value="weapon">Weapon</option><option value="armor">Armor</option><option value="shield">Shield</option><option value="adventuring_gear">Adventuring Gear</option><option value="mount">Mount</option><option value="transport">Transport</option></select>
      <label class="vault-check"><input type="checkbox" name="allowed_only"> Class allowed only</label>
      <label class="vault-check"><input type="checkbox" name="dm_override"> DM override equip restrictions</label>
    </div>
    <table class="vault-table"><thead><tr><th>Item</th><th>Type</th><th>Wt</th><th>Cost</th><th>Use</th><th></th></tr></thead><tbody data-equipment-results>${equipmentRows(classAwareEquipment().slice(0, 40))}</tbody></table>
    ${state.character?.inventory?.length ? `<h3>Character Inventory</h3>${inventoryTable(state.character.inventory, state.character.weapon_proficiencies || [])}` : ""}
    <p class="vault-rules">Rules: <a href="/1e/equipment/">OSRIC equipment catalog</a>. Free-typed player equipment is intentionally blocked.</p>
  </div>`;
}

function equipmentRows(items) {
  return items.map((item) => {
    const detail = item.type === "weapon" ? `${item.damage_small_medium || ""} vs S/M, ${item.damage_large || ""} vs L`
      : item.type === "armor" || item.type === "shield" ? `AC ${item.armor_class_value ?? ""}, adjustment ${item.armor_class_adjustment ?? ""}`
      : item.rules_reference || "";
    const allowed = classAllowsEquipment(state.draft?.class_name, item);
    return `<tr class="${allowed.allowed ? "" : "vault-warn-row"}"><td><strong>${h(item.name)}</strong><br><span class="vault-mini">${h(displayReference(detail))}</span></td><td>${h(labelize(item.type))}</td><td>${h(item.weight)}</td><td>${h(item.cost_amount ?? "")} ${h(item.cost_coin ?? "")}</td><td>${allowed.allowed ? "Allowed" : "Blocked"}<br><span class="vault-mini">${h(allowed.reason)}</span></td><td><button class="vault-button secondary" type="button" data-add-equipment="${item.id}" data-status="carried">Add</button> <button class="vault-button secondary" type="button" data-add-equipment="${item.id}" data-status="equipped" ${!allowed.allowed && !state.dmOverride ? "disabled" : ""}>Equip</button></td></tr>`;
  }).join("");
}

function proficiencyManager() {
  const weapons = state.equipment.filter((item) => item.type === "weapon" && !isAmmunition(item)).slice(0, 80);
  return `<div class="vault-full"><table class="vault-table"><thead><tr><th>Weapon</th><th>Damage</th><th>Proficient</th></tr></thead><tbody>${weapons.map((weapon) => `<tr><td>${h(weapon.name)}</td><td>${h(weapon.damage_small_medium || "")}</td><td><button class="vault-button secondary" type="button" data-prof="${weapon.id}">Mark</button></td></tr>`).join("")}</tbody></table><p class="vault-rules">Rules: class proficiency counts and penalties are Manual DM Review.</p></div>`;
}

function spellManager() {
  const classKey = (state.draft.class_name || "").toLowerCase().replace(" ", "-");
  const caster = (state.rules.classes[state.draft.class_name] || {}).spellcaster;
  const starts = (state.rules.classes[state.draft.class_name] || {}).spellcasting_starts_level || 1;
  const spells = state.spells.filter((spell) => !classKey || spell.class_list.includes(classKey)).slice(0, 90);
  if (!caster) return `<div class="vault-full"><p>${h(state.draft.class_name)} has no normal spell preparation.</p><p class="vault-rules">Rules: <a href="/1e/how-to-play/magic/">Magic</a></p></div>`;
  const savedSlots = state.character?.class_name === state.draft.class_name && Number(state.character?.level) === Number(state.draft.level) ? spellSlotsHtml(state.character) : "";
  return `<div class="vault-full">
    <div class="vault-actions"><input name="spell_search" placeholder="Search spells"><select name="spell_class"><option value="">${h(state.draft.class_name)} list</option><option value="cleric">Cleric</option><option value="druid">Druid</option><option value="magic-user">Magic-User</option><option value="illusionist">Illusionist</option></select><select name="spell_level"><option value="">All levels</option>${[1,2,3,4,5,6,7,8,9].map((n) => `<option value="${n}">${n}</option>`).join("")}</select></div>
    <p class="vault-muted">${h(state.draft.class_name)} spellcasting starts at level ${starts}. Preparation is enforced when spells are saved to a character.</p>
    ${savedSlots}
    <table class="vault-table"><thead><tr><th>Spell</th><th>Level</th><th>Range</th><th>Duration</th><th>Area/Effect</th><th></th></tr></thead><tbody data-spell-results>${spellRows(spells)}</tbody></table>
    <p class="vault-rules">Rules: <a href="/1e/how-to-play/magic/">Magic</a> and spell reference pages.</p>
  </div>`;
}

function spellRows(spells) {
  return spells.map((spell) => `<tr><td><strong>${h(spell.name)}</strong><br><a class="vault-mini" href="${h(spell.rules_reference)}">Rules</a></td><td>${spell.spell_level}<br><span class="vault-mini">${h(spell.class_list.join(", "))}</span></td><td>${h(spell.range || "")}</td><td>${h(spell.duration || "")}</td><td>${h(spell.area_of_effect || "")}</td><td><button class="vault-button secondary" type="button" data-add-spell="${spell.id}">Add/Prepare</button></td></tr>`).join("");
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
        <h3>${source === "OSRIC" ? "Foundation Races" : "Dragonlance Races"}</h3>
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
    ${empty || `<div class="vault-choice-grid">${classes.map((classInfo) => classChoiceCard(classInfo, selectedClass)).join("")}</div>`}
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
  return "Dragonlance Classes";
}

function choiceFact(label, value) {
  return `<div><dt>${h(label)}</dt><dd>${h(cleanChoiceText(value) || "See details later")}</dd></div>`;
}

function osricRaceCards() {
  return Object.entries(state.rules?.races || {}).map(([name, race]) => ({ name, ...race }));
}

function osricClassCards() {
  return Object.entries(state.rules?.classes || {}).map(([name, classInfo]) => classCardData(name, "OSRIC", classInfo));
}

function dragonlanceClassCards() {
  return state.dragonlanceClasses.map((classInfo) => classCardData(classInfo.name, "DRAGOLANCE", classInfo)).filter(Boolean);
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
  document.querySelectorAll("[data-select-race]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (button.closest(".vault-choice-card.disabled")) return;
    syncDraft();
    state.draft.race = button.dataset.selectRace;
    renderBuilder();
  }));
  document.querySelectorAll("[data-select-class]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (button.closest(".vault-choice-card.disabled")) return;
    syncDraft();
    state.draft.class_name = button.dataset.selectClass;
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
  document.querySelectorAll("[data-add-equipment]").forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault();
    const character = await ensureSaved();
    state.character = await api(`/characters/${character.id}/inventory`, { method: "POST", body: JSON.stringify({ equipment_id: Number(button.dataset.addEquipment), quantity: 1, status: button.dataset.status || "carried", dm_override: state.dmOverride }) });
    state.character = await api(`/characters/${state.character.id}`);
    state.draft = initialDraft();
    toast(button.dataset.status === "equipped" ? "Equipped." : "Added.");
    renderBuilder();
  }));
  document.querySelectorAll("[data-add-spell]").forEach((button) => button.addEventListener("click", async () => {
    const character = await ensureSaved();
    state.character = await api(`/characters/${character.id}/spells`, { method: "POST", body: JSON.stringify({ spell_id: Number(button.dataset.addSpell), known: true, prepared: true, memorized_count: 1, in_spellbook: state.draft.class_name === "Magic-User" }) });
    toast("Saved.");
  }));
  document.querySelectorAll("[data-prof]").forEach((button) => button.addEventListener("click", async () => {
    const character = await ensureSaved();
    state.character = await api(`/characters/${character.id}/weapon-proficiencies`, { method: "POST", body: JSON.stringify({ equipment_id: Number(button.dataset.prof), proficient: true }) });
    toast("Saved.");
  }));
  bindInventoryActions(() => renderBuilder());
  document.querySelector("[name='equipment_search']")?.addEventListener("input", () => filterEquipment());
  document.querySelector("[name='equipment_type']")?.addEventListener("change", () => filterEquipment());
  document.querySelector("[name='allowed_only']")?.addEventListener("change", () => filterEquipment());
  document.querySelector("[name='dm_override']")?.addEventListener("change", (event) => { state.dmOverride = event.target.checked; filterEquipment(); });
  document.querySelector("[name='spell_search']")?.addEventListener("input", () => filterSpells());
  document.querySelector("[name='spell_class']")?.addEventListener("change", () => filterSpells());
  document.querySelector("[name='spell_level']")?.addEventListener("change", () => filterSpells());
}

function syncDraft() {
  document.querySelectorAll("[data-builder-form] [name]").forEach((input) => {
    const value = input.type === "number" ? Number(input.value || 0) : input.value;
    setPath(state.draft, input.name, value);
  });
  applyAssignedRolls();
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

async function saveDraft(navigate = true) {
  syncDraft();
  const method = state.character?.id ? "PUT" : "POST";
  const path = state.character?.id ? `/characters/${state.character.id}` : "/characters";
  const payload = characterSavePayload(state.draft);
  state.character = isPlayerCharacterMode()
    ? await rootApi(state.character?.id ? `/player/characters/${state.character.id}` : "/player/characters", { method, headers: playerAuthHeaders(), body: JSON.stringify(payload) })
    : await api(path, { method, body: JSON.stringify(payload) });
  if (state.character.player?.id) {
    state.currentPlayer = state.character.player;
    localStorage.setItem("drg1e_player_id", String(state.currentPlayer.id));
  }
  state.draft = { ...state.draft, id: state.character.id };
  toast("Saved.");
  if (navigate && pageKind() === "new") {
    location.href = isPlayerCharacterMode() ? "/characters" : `/1e/characters/${state.character.id}/`;
  } else if (pageKind() === "edit") {
    state.character = isPlayerCharacterMode()
      ? await rootApi(`/player/characters/${state.character.id}`, { headers: playerAuthHeaders() })
      : await api(`/characters/${state.character.id}`);
    state.draft = initialDraft();
    toast("Saved.");
    if (navigate && isPlayerCharacterMode()) location.href = "/characters";
  }
  return state.character;
}

function characterSavePayload(d) {
  const payload = {
    name: d.name,
    race: d.race,
    class_name: d.class_name,
    subclass_or_specialty: d.subclass_or_specialty,
    alignment: d.alignment,
    level: Number(d.level || 1),
    xp: Number(d.xp || 0),
    status: d.status || "active",
    life_status: d.life_status || "alive",
    campaign_day: Number(d.campaign_day || 1),
    current_location: d.current_location || "Town",
    safe_storage_location: d.safe_storage_location || null,
    notes: d.notes || "",
    original_rolls: Array.isArray(d.original_rolls) ? d.original_rolls.map((roll) => Number(roll)).filter((roll) => Number.isFinite(roll)) : [],
    abilities: Object.fromEntries(abilities.map((ability) => [ability, Number(d.abilities?.[ability] || 10)])),
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
  const q = document.querySelector("[name='equipment_search']")?.value || "";
  const type = document.querySelector("[name='equipment_type']")?.value || "";
  const allowedOnly = document.querySelector("[name='allowed_only']")?.checked || false;
  const rows = classAwareEquipment().filter((item) => {
    const allowed = classAllowsEquipment(state.draft?.class_name, item).allowed;
    return (!q || item.name.toLowerCase().includes(q.toLowerCase())) && (!type || item.type === type) && (!allowedOnly || allowed);
  }).slice(0, 60);
  document.querySelector("[data-equipment-results]").innerHTML = equipmentRows(rows);
  bindBuilderActions();
}

function filterSpells() {
  const q = document.querySelector("[name='spell_search']")?.value || "";
  const level = document.querySelector("[name='spell_level']")?.value || "";
  const list = document.querySelector("[name='spell_class']")?.value || "";
  const classKey = (state.draft.class_name || "").toLowerCase().replace(" ", "-");
  const rows = state.spells.filter((spell) => {
    const classFilter = list || classKey;
    return (!classFilter || spell.class_list.includes(classFilter)) && (!q || spell.name.toLowerCase().includes(q.toLowerCase())) && (!level || String(spell.spell_level) === level);
  }).slice(0, 90);
  document.querySelector("[data-spell-results]").innerHTML = spellRows(rows);
  bindBuilderActions();
}

function classAwareEquipment() {
  return state.equipment.map((item) => ({ ...item, ...classAllowsEquipment(state.draft?.class_name, item) }));
}

function classAllowsEquipment(className, item) {
  const info = state.rules?.classes?.[className] || {};
  const name = (item.name || "").toLowerCase();
  if (item.type === "armor") {
    const armorTypes = info.armor_types || [];
    if (armorTypes.includes("any")) return { allowed: true, reason: "Allowed armor" };
    const allowed = armorTypes.some((term) => name.includes(term.toLowerCase()));
    return { allowed, reason: info.armor || "Manual DM Review" };
  }
  if (item.type === "shield") return { allowed: Boolean(info.shields), reason: info.shield_note || (info.shields ? "Allowed shield" : "Class does not allow shields") };
  if (item.type === "weapon") {
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
  const info = state.rules?.classes?.[className] || {};
  if (info.proficiency_initial == null || info.proficiency_every == null) return null;
  return Number(info.proficiency_initial) + Math.floor((Math.max(1, Number(level || 1)) - 1) / Number(info.proficiency_every));
}

function raceClassWarnings(d) {
  const warnings = [];
  const cls = state.rules?.classes?.[d.class_name] || {};
  if (cls.allowed_alignments?.length && !cls.allowed_alignments.includes(d.alignment)) warnings.push(`${d.class_name} alignment restriction: ${cls.alignment}.`);
  return warnings.length ? `<div class="vault-warning">${warnings.map((warning) => `<p>${h(warning)}</p>`).join("")}</div>` : `<p class="vault-muted">All standard classes are allowed for all races. Ask your DM about campaign-specific exceptions.</p>`;
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
  document.querySelector("[data-vault-view]").innerHTML = `${playerPanelHtml()}<div class="vault-grid">${state.characters.length ? state.characters.map((character) => `<article class="vault-card"><div class="vault-kicker">${h(labelize(character.status))} / ${h(labelize(character.life_status))}</div><h2>${h(character.name)}</h2><p>${h(character.race)} ${h(character.class_name)} ${h(character.level)}</p><p class="vault-muted">Owner: ${h(character.player?.display_name || character.user_id)}${character.campaign_id ? ` / ${h(campaignName(character.campaign_id))}` : ""}</p><div class="vault-statline"><div class="vault-stat"><strong>${character.combat.armor_class}</strong><span>AC</span></div><div class="vault-stat"><strong>${character.combat.current_hp}/${character.combat.max_hp}</strong><span>HP</span></div><div class="vault-stat"><strong>${character.combat.movement_rate}</strong><span>Move</span></div></div><div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${character.id}/">View</a><a class="vault-button secondary" href="/1e/characters/${character.id}/edit/">Edit</a><button class="vault-button secondary" type="button" data-delete="${character.id}">Archive</button></div></article>`).join("") : `<article class="vault-panel"><h2>No characters yet</h2><p>Create your first vault character, then assign them to a campaign when the DM is ready.</p><div class="vault-actions"><a class="vault-button" href="${newCharacterHref()}">Create Character</a></div></article>`}</div>`;
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
    ${selectField("Current Player", "current_player_id", String(state.currentPlayer?.id || ""), ["", ...state.players.map((player) => String(player.id))])}
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

function renderSheet() {
  document.querySelector("[data-vault-view]").innerHTML = `<div class="vault-sheet">${sheetHtml(state.character)}</div>`;
  bindInventoryActions(() => renderSheet());
  document.querySelectorAll("[data-rules-link]").forEach((button) => button.addEventListener("click", () => openRulesModal(button.dataset.rulesTitle, button.dataset.rulesLink)));
  document.querySelector("[data-quick-edit-open]")?.addEventListener("click", () => openQuickEditModal(state.character));
  document.querySelectorAll("[data-spell-action]").forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault();
    const [id, action] = button.dataset.spellAction.split(":");
    const spell = state.character.spells.find((entry) => String(entry.id) === id);
    const next = action === "prepare" ? { prepared: true, memorized_count: Math.max(1, Number(spell.memorized_count || 0)) } : { prepared: false, memorized_count: 0 };
    try {
      state.character = await api(`/characters/${state.character.id}/spells/${id}`, { method: "PUT", body: JSON.stringify(next) });
      state.character = await api(`/characters/${state.character.id}`);
      toast("Saved.");
      renderSheet();
    } catch (error) {
      toast("Spell slot limit reached or spell is not eligible.");
    }
  }));
}

function bindInventoryActions(afterAction) {
  document.querySelectorAll("[data-inventory-action]").forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault();
    if (!state.character?.id) return;
    const [id, status] = button.dataset.inventoryAction.split(":");
    try {
      if (status === "delete") {
        state.character = await api(`/characters/${state.character.id}/inventory/${id}`, { method: "DELETE" });
      } else {
        state.character = await api(`/characters/${state.character.id}/inventory/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            status,
            storage_location: status === "stored" ? state.character.safe_storage_location || "Personal Storage Location" : null,
          }),
        });
      }
      state.character = await api(`/characters/${state.character.id}`);
      state.draft = initialDraft();
      toast(inventoryActionMessage(status));
      afterAction();
    } catch (error) {
      toast(readableError(error));
    }
  }));
}

function inventoryActionMessage(status) {
  const messages = {
    equipped: "Equipped.",
    carried: "Unequipped.",
    stored: "Stored.",
    delete: "Deleted.",
  };
  return messages[status] || "Saved.";
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
    ${field("XP", "xp", c.xp ?? 0, "number")}
    ${field("Campaign Day", "campaign_day", c.campaign_day ?? 1, "number")}
    ${field("Current Location", "current_location", c.current_location || "Town", "text", "wide")}
    ${field("Personal Storage Location", "safe_storage_location", c.safe_storage_location || "", "text", "wide")}
    <p class="vault-muted vault-full">Use this for items, coins, or gear not carried by the character.</p>
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
      safe_storage_location: data.safe_storage_location,
      coins: coinsPatch,
      combat: { current_hp: Number(data.current_hp || 0), max_hp: Number(data.max_hp || 0) },
    };
    state.character = isPlayerCharacterMode()
      ? await rootApi(`/player/characters/${state.character.id}`, { method: "PUT", headers: playerAuthHeaders(), body: JSON.stringify(patchPayload) })
      : await api(`/characters/${state.character.id}`, {
      method: "PUT",
      body: JSON.stringify(patchPayload),
    });
    state.character = isPlayerCharacterMode()
      ? await rootApi(`/player/characters/${state.character.id}`, { headers: playerAuthHeaders() })
      : await api(`/characters/${state.character.id}`);
    toast("Saved.");
    modal.remove();
    renderSheet();
  });
  document.body.appendChild(modal);
}

function sheetHtml(c) {
  return `${sheetHeaderHtml(c)}<div class="vault-grid">
    <section class="vault-card">${sectionTitle("Saving Throws", "/1e/character-creation/003-class/")}${savingThrowsHtml(c)}</section>
    <section class="vault-card">${sectionTitle("Movement & Encumbrance", "/1e/how-to-play/equipment-encumbrance/")}<div class="vault-compact-list"><span><strong>Move</strong>${h(c.combat?.movement_rate ?? 120)}</span><span><strong>Carried</strong>${h(c.combat?.carried_weight ?? 0)} lb</span><span><strong>Coins</strong>${coinWeight(c.coins)} lb</span><span><strong>Load</strong>${h(c.combat?.encumbrance_band ?? "Unencumbered")}</span></div></section>
    <section class="vault-card">${sectionTitle("Race/Class Details", "/1e/character-creation/003-class/")}<p><strong>Hit Dice:</strong> ${h(hitDiceText(c))}</p><p><strong>Armor:</strong> ${h(c.class_details?.armor || "")}</p><p><strong>Weapons:</strong> ${h(c.class_details?.weapons || "")}</p><p><strong>Vision:</strong> ${h(c.race_details?.vision || "")}</p><p><strong>Languages:</strong> ${h((c.race_details?.languages || []).join(", "))}</p></section>
    <section class="vault-panel">${sectionTitle("Weapons", "/1e/equipment/")}${weaponsHtml(c)}</section>
    <section class="vault-panel">${sectionTitle("Armor", "/1e/equipment/")}${armorHtml(c)}</section>
    <section class="vault-panel">${sectionTitle("Equipment", "/1e/equipment/")}${inventoryHtml(c)}</section>
    <section class="vault-panel">${sectionTitle("Spells", "/1e/how-to-play/magic/")}${spellsHtml(c)}</section>
    <section class="vault-card"><div class="vault-kicker">Campaign State</div><p>Day ${h(c.campaign_day)} at ${h(c.current_location)}.</p><p>Storage: ${h(c.safe_storage_location || "No storage location set")}</p></section>
    <section class="vault-panel"><div class="vault-kicker">Notes</div><p>${h(c.notes || "No notes.")}</p><div class="vault-actions"><a class="vault-button secondary" href="${characterEditHref(c.id || "")}">Full Edit</a></div></section>
  </div>`;
}

function sheetHeaderHtml(c) {
  return `<section class="vault-sheet-header">
    <div class="vault-sheet-title">
      <h2>${h(c.name || "Unnamed")}</h2>
      <p>${h(c.race)} ${h(c.class_name)} ${h(c.level)} / ${h(c.alignment)} / ${h(labelize(c.status))} / ${h(labelize(c.life_status))}</p>
    </div>
    <div class="vault-topline">
      <span><strong>AC</strong>${h(c.combat?.armor_class ?? 10)}</span>
      <span><strong>HP</strong>${h(c.combat?.current_hp ?? 1)}/${h(c.combat?.max_hp ?? 1)}</span>
      <span><strong>Move</strong>${h(c.combat?.movement_rate ?? 120)}</span>
      <span><strong>Load</strong>${h(c.combat?.encumbrance_band ?? "Unencumbered")}</span>
      <span><strong>XP</strong>${h(c.xp ?? 0)}</span>
      <span><strong>Coins</strong>${coinCount(c.coins)} / ${coinWeight(c.coins)} lb</span>
    </div>
    ${abilityStripHtml(c)}
    ${warningsHtml(c)}
    <div class="vault-actions"><button class="vault-button secondary" type="button" data-quick-edit-open>Quick Edit</button><a class="vault-button secondary" href="${characterEditHref(c.id || "")}">Full Edit</a></div>
  </section>`;
}

function abilityStripHtml(c) {
  return `<div class="vault-abilities">${abilities.map((ability) => {
    const base = c.abilities?.[ability] ?? 10;
    const adjusted = c.adjusted_abilities?.[ability] ?? base;
    const changed = Number(base) !== Number(adjusted);
    return `<span><strong>${abilityLabels[ability]}</strong>${h(adjusted)}${changed ? `<em>${h(base)}</em>` : ""}</span>`;
  }).join("")}</div>`;
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
  if (!items.length) return "<p>No inventory yet.</p>";
  const buckets = [
    ["equipped", "Equipped"],
    ["carried", "Carried"],
    ["stored", "Stored"],
    ["treasure", "Treasure"],
    ["lost", "Lost / Destroyed"],
    ["sold", "Not Carried"],
  ];
  return buckets.map(([status, label]) => {
    const bucket = items.filter((item) => item.status === status || (status === "lost" && ["lost", "destroyed"].includes(item.status)));
    return `<h3>${label}</h3>${bucket.length ? inventoryTable(bucket) : `<p class="vault-muted">None.</p>`}`;
  }).join("");
}

function inventoryTable(items) {
  return `<table class="vault-table"><thead><tr><th>Item</th><th>Type</th><th>Wt</th><th>Actions</th></tr></thead><tbody>${items.map((item) => inventoryRow(item)).join("")}</tbody></table>`;
}

function inventoryRow(item, proficiencies = []) {
  const equipment = item.equipment || {};
  const isEquipped = item.status === "equipped";
  const damage = equipment.type === "weapon" ? [equipment.damage_small_medium, equipment.damage_large].filter(Boolean).join(" / ") : "";
  const proficiency = equipment.type === "weapon" ? weaponProficiencyLabel(equipment.id, proficiencies) : "";
  return `<tr><td>${h(item.quantity)} x <strong>${h(equipment.name)}</strong><br><span class="vault-mini">${h(labelize(item.status))}${item.status === "stored" && item.storage_location ? ` at ${h(item.storage_location)}` : ""}${damage ? ` / Damage ${h(damage)}` : ""}${proficiency ? ` / ${h(proficiency)}` : ""}</span></td><td>${h(labelize(equipment.type))}</td><td>${h(((equipment.weight || 0) * item.quantity).toFixed(2))}</td><td>${isEquipped ? `<button type="button" class="vault-button secondary" data-inventory-action="${item.id}:carried">Unequip</button>` : `<button type="button" class="vault-button secondary" data-inventory-action="${item.id}:equipped">Equip</button>`} <button type="button" class="vault-button secondary" data-inventory-action="${item.id}:stored">Store</button> <button type="button" class="vault-button secondary" data-inventory-action="${item.id}:delete">Delete</button></td></tr>`;
}

function savingThrowsHtml(c) {
  const saves = c.combat?.saving_throws;
  if (!saves?.categories) return `<p>Manual DM Review: ${h(saves?.reason || "saving table not encoded")}</p>`;
  return `<p class="vault-muted">Level band ${h(saves.level_band)}. Roll this number or higher on d20.</p><table class="vault-table"><tbody>${Object.entries(saves.categories).map(([key, value]) => `<tr><th>${h(saves.labels?.[key] || title(key))}</th><td>${h(value)}</td></tr>`).join("")}</tbody></table>${(saves.notes || []).map((note) => `<p class="vault-muted">${h(note)}</p>`).join("")}`;
}

function warningsHtml(c) {
  return (c.warnings || []).length ? `<div class="vault-warning">${c.warnings.map((warning) => `<p>${h(warning)}</p>`).join("")}</div>` : "";
}

function weaponsHtml(c) {
  const weapons = (c.inventory || []).filter((item) => item.equipment.type === "weapon");
  const profs = c.weapon_proficiencies || [];
  return `${weapons.length ? `<table class="vault-table"><thead><tr><th>Weapon</th><th>Type</th><th>Wt</th><th>Actions</th></tr></thead><tbody>${weapons.map((item) => inventoryRow(item, profs)).join("")}</tbody></table>` : "<p>No weapons carried.</p>"}<p class="vault-muted">Allowed proficiencies at this level: ${h(c.class_details?.proficiency_count ?? "Manual DM Review")}. Non-proficiency penalty: ${h(c.class_details?.non_proficiency_penalty ?? "Manual DM Review")}.</p>`;
}

function armorHtml(c) {
  const armor = (c.inventory || []).filter((item) => ["armor", "shield"].includes(item.equipment.type));
  return `${armor.length ? inventoryTable(armor) : "<p>No armor or shields in inventory.</p>"}<p class="vault-muted">${h(c.class_details?.armor || "")}</p>`;
}

function spellsHtml(c) {
  const spells = c.spells || [];
  const slots = spellSlotsHtml(c);
  if (!spells.length) return `${slots}<p>No spells recorded.</p>`;
  const prepared = spells.filter((spell) => spell.prepared || spell.memorized_count > 0);
  const known = spells.filter((spell) => !spell.prepared && spell.memorized_count <= 0);
  const row = (s, preparedRow = false) => `<tr><td><strong>${h(s.spell.name)}</strong><br>${spellBadges(s)}<br><a class="vault-mini" href="${h(s.spell.rules_reference)}">Rules</a></td><td>${h(s.spell.spell_level)}<br><span class="vault-mini">${h((s.spell.class_list || []).join(", "))}</span></td><td>${h(s.spell.range || "")}</td><td>${h(s.spell.duration || "")}</td><td>${h(s.spell.area_of_effect || "")}</td><td>${h(s.spell.components || "")}</td><td>${h((s.spell.description || "").slice(0, 180))}</td><td>${h(s.memorized_count)}</td><td><button class="vault-button secondary" type="button" data-spell-action="${s.id}:${preparedRow ? "unprepare" : "prepare"}">${preparedRow ? "Unprepare" : "Prepare"}</button></td></tr>`;
  return `${slots}<h3>Prepared / Memorized</h3>${prepared.length ? `<table class="vault-table"><thead><tr><th>Spell</th><th>Lvl</th><th>Range</th><th>Duration</th><th>Area</th><th>Comp</th><th>Detail</th><th>Count</th><th></th></tr></thead><tbody>${prepared.map((spell) => row(spell, true)).join("")}</tbody></table>` : "<p>None prepared.</p>"}<h3>Known / Spellbook</h3>${known.length ? `<table class="vault-table"><tbody>${known.map((spell) => row(spell, false)).join("")}</tbody></table>` : "<p>None separate from prepared spells.</p>"}`;
}

function spellBadges(s) {
  const badges = [];
  if (s.prepared || s.memorized_count > 0) badges.push("Prepared");
  if (s.known) badges.push("Known");
  if (s.in_spellbook) badges.push("Spellbook");
  return badges.map((badge) => `<span class="vault-badge">${h(badge)}</span>`).join(" ");
}

function spellSlotsHtml(c) {
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
    const remainingCount = Number(remaining[level] ?? Math.max(0, Number(count) - usedCount));
    const full = Number(count) > 0 && remainingCount <= 0;
    return `<tr class="${full ? "vault-warn-row" : ""}"><td>${h(level)}</td><td>${h(count)}</td><td>${h(usedCount)}</td><td>${h(remainingCount)}</td></tr>`;
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
      await api("/equipment", { method: "POST", body: JSON.stringify(data) });
      state.equipment = await api("/equipment");
      renderCampaigns();
    });
    document.querySelectorAll("[data-archive-item]").forEach((button) => button.addEventListener("click", async () => {
      await api(`/equipment/${button.dataset.archiveItem}`, { method: "DELETE" });
      state.equipment = await api("/equipment");
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
  document.querySelector("[data-vault-view]").innerHTML = `<section class="vault-panel"><h2>DM Characters</h2><div class="vault-actions">${selectField("Campaign", "dm_filter_campaign", state.dmCharacterFilters.campaign_id, ["", ...state.campaigns.map((campaign) => String(campaign.id))])}${selectField("Player", "dm_filter_player", state.dmCharacterFilters.user_id, ["", ...state.players.map((player) => String(player.id))])}${selectField("Status", "dm_filter_status", state.dmCharacterFilters.status, ["", "active", "inactive", "dead", "retired", "archived"])}</div><table class="vault-table"><thead><tr><th>Character</th><th>Player</th><th>Campaign</th><th>Status</th><th>Location</th><th>Assign</th><th>Actions</th></tr></thead><tbody>${characters.length ? characters.map((character) => `<tr><td><a href="/1e/characters/${character.id}/">${h(character.name)}</a><br><span class="vault-mini">${h(character.race)} ${h(character.class_name)} ${h(character.level)}</span></td><td>${h(character.player?.display_name || character.user_id)}</td><td>${h(campaignName(character.campaign_id))}</td><td>${h(labelize(character.status))} / ${h(labelize(character.life_status))}</td><td>${h(character.current_location)}</td><td>${selectField("", `character_campaign_${character.id}`, character.campaign_id ? String(character.campaign_id) : "", ["", ...state.campaigns.map((campaign) => String(campaign.id))])}<button class="vault-button secondary" type="button" data-assign-character-dm="${character.id}">Save</button></td><td><a class="vault-button secondary" href="/1e/characters/${character.id}/edit/">Edit</a></td></tr>`).join("") : `<tr><td colspan="7">No characters match these filters.</td></tr>`}</tbody></table></section>`;
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
  document.querySelector("[data-vault-view]").innerHTML = `<section class="vault-panel"><h2>DM Equipment Catalog</h2><div class="vault-actions">${field("Search", "dm_equipment_search", state.equipmentFilters.q)}${selectField("Type", "dm_equipment_type", state.equipmentFilters.type, ["", ...equipmentTypeOptions()])}</div><form class="vault-form" data-dm-equipment-form>${equipmentEditorFields(editItem)}<div class="vault-actions vault-full"><button class="vault-button" type="submit">${editItem ? "Save Item" : "Create Item"}</button>${editItem ? `<button class="vault-button secondary" type="button" data-cancel-equipment-edit>Cancel Edit</button>` : ""}</div></form><table class="vault-table"><thead><tr><th>Item</th><th>Type</th><th>Cost</th><th>Wt</th><th>Campaign</th><th>Actions</th></tr></thead><tbody>${items.length ? items.map((item) => `<tr><td><strong>${h(item.name)}</strong><br><span class="vault-mini">${h(item.notes || item.rules_reference || "")}</span></td><td>${h(labelize(item.type))}${item.subtype ? `<br><span class="vault-mini">${h(labelize(item.subtype))}</span>` : ""}</td><td>${h(item.cost_amount ?? "")} ${h(item.cost_coin ?? "")}</td><td>${h(item.weight ?? 0)}</td><td>${h(campaignName(item.campaign_id))}</td><td>${item.is_dm_created ? `<button class="vault-button secondary" type="button" data-edit-equipment="${item.id}">Edit</button> <button class="vault-button secondary" type="button" data-archive-equipment="${item.id}">Archive</button>` : `<span class="vault-muted">Core OSRIC</span>`}</td></tr>`).join("") : `<tr><td colspan="6">No equipment matches these filters.</td></tr>`}</tbody></table></section>`;
  document.querySelector("[name='dm_equipment_search']")?.addEventListener("input", (event) => { state.equipmentFilters.q = event.target.value; renderDmEquipment(); });
  document.querySelector("[name='dm_equipment_type']")?.addEventListener("change", (event) => { state.equipmentFilters.type = event.target.value; renderDmEquipment(); });
  document.querySelector("[data-cancel-equipment-edit]")?.addEventListener("click", () => { state.editEquipmentId = null; renderDmEquipment(); });
  document.querySelectorAll("[data-edit-equipment]").forEach((button) => button.addEventListener("click", () => {
    state.editEquipmentId = Number(button.dataset.editEquipment);
    renderDmEquipment();
  }));
  document.querySelectorAll("[data-archive-equipment]").forEach((button) => button.addEventListener("click", async () => {
    await api(`/equipment/${button.dataset.archiveEquipment}`, { method: "DELETE" });
    state.equipment = await api("/equipment");
    toast("Saved.");
    renderDmEquipment();
  }));
  document.querySelector("[data-dm-equipment-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = equipmentFormPayload(new FormData(event.target));
    const path = editItem ? `/equipment/${editItem.id}` : "/equipment";
    const method = editItem ? "PUT" : "POST";
    await api(path, { method, body: JSON.stringify(data) });
    state.equipment = await api("/equipment");
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
  return {
    ...data,
    cost_amount: data.cost_amount ? Number(data.cost_amount) : null,
    weight: Number(data.weight || 0),
    armor_class_value: data.armor_class_value ? Number(data.armor_class_value) : null,
    armor_class_adjustment: data.armor_class_adjustment ? Number(data.armor_class_adjustment) : null,
    campaign_id: data.campaign_id ? Number(data.campaign_id) : null,
    is_dm_created: data.is_dm_created === "on",
    properties,
  };
}

function campaignPlayersTable(players) {
  return `<table class="vault-table"><thead><tr><th>Player</th><th>Role</th><th>Email</th><th></th></tr></thead><tbody>${players.length ? players.map((entry) => `<tr><td>${h(entry.player?.display_name || entry.user_id)}</td><td>${h(labelize(entry.role))}</td><td>${h(entry.player?.email || "")}</td><td><button class="vault-button secondary" type="button" data-remove-player="${entry.user_id}">Remove</button></td></tr>`).join("") : `<tr><td colspan="4">No players assigned yet.</td></tr>`}</tbody></table>`;
}

function campaignCharactersTable(characters) {
  return `<table class="vault-table"><thead><tr><th>Character</th><th>Player/Owner</th><th>Race</th><th>Class</th><th>Level</th><th>Status</th><th>Location</th><th>Actions</th></tr></thead><tbody>${characters.length ? characters.map((character) => `<tr><td><a href="/1e/characters/${character.id}/">${h(character.name)}</a></td><td>${h(character.player?.display_name || "Unknown Player")}</td><td>${h(character.race)}</td><td>${h(character.class_name)}</td><td>${h(character.level)}</td><td>${h(labelize(character.status))}</td><td>${h(character.current_location)}</td><td><a class="vault-button secondary" href="/1e/characters/${character.id}/">View</a> <a class="vault-button secondary" href="/1e/characters/${character.id}/edit/">Edit</a> <button class="vault-button secondary" type="button" data-char-status="${character.id}:unassign">Remove</button></td></tr>`).join("") : `<tr><td colspan="8">No characters assigned yet.</td></tr>`}</tbody></table>`;
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

function weaponProficiencyLabel(equipmentId, proficiencies = []) {
  const proficiency = proficiencies.find((entry) => entry.equipment_id === equipmentId);
  if (!proficiency) return "Non-proficient";
  return proficiency.proficient ? "Proficient" : "Non-proficient";
}

function isAmmunition(item = {}) {
  const name = String(item.name || "").toLowerCase();
  const subtype = String(item.subtype || "").toLowerCase();
  if (subtype.includes("ammunition")) return true;
  return [
    "arrow",
    "arrows",
    "bolt",
    "bolts",
    "sling stone",
    "sling stones",
    "sling bullet",
    "sling bullets",
    "bullet, dozen",
    "stone, dozen",
  ].some((term) => name.includes(term));
}

function roll4d6DropLowest() {
  const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => a - b);
  return dice.slice(1).reduce((sum, die) => sum + die, 0);
}

boot();
