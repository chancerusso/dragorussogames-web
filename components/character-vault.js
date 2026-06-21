const API = "/api/1e";
const abilities = ["strength", "intelligence", "wisdom", "dexterity", "constitution", "charisma"];
const coins = ["platinum", "gold", "electrum", "silver", "copper"];
const state = { characters: [], equipment: [], spells: [], campaigns: [], players: [], campaign: null, rules: null, character: null, currentPlayer: null, step: 0, draft: null, inventoryFilter: "equipped", dmOverride: false };

function h(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(await response.text());
  return response.status === 204 ? null : response.json();
}

function pageKind() {
  const path = location.pathname.replace(/\/$/, "");
  if (path.endsWith("/new")) return "new";
  if (path.endsWith("/edit")) return "edit";
  if (path.includes("/dm/campaigns")) return "campaign";
  const match = path.match(/\/1e\/characters\/(\d+)$/);
  return match ? "show" : "index";
}

function characterId() {
  const match = location.pathname.match(/\/1e\/characters\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function campaignId() {
  const match = location.pathname.match(/\/1e\/dm\/campaigns\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function toast(message) {
  const node = document.querySelector("[data-vault-toast]");
  if (node) node.textContent = message;
}

async function boot() {
  renderShell();
  try {
    [state.rules, state.equipment, state.spells, state.campaigns, state.players] = await Promise.all([
      api("/rules-data"),
      api("/equipment"),
      api("/spells"),
      api("/campaigns"),
      api("/players"),
    ]);
    hydrateCurrentPlayer();
    const kind = pageKind();
    if (kind === "show" || kind === "edit") state.character = await api(`/characters/${characterId()}`);
    if (kind === "campaign" && campaignId()) {
      state.campaign = await api(`/campaigns/${campaignId()}`);
      state.characters = await api("/characters?include_archived=true");
    }
    if (kind === "index") state.characters = await api(`/characters${state.currentPlayer?.id ? `?user_id=${state.currentPlayer.id}` : ""}`);
    render();
  } catch (error) {
    toast("API unavailable. Start the RUSSO backend to use permanent character storage.");
    console.error(error);
  }
}

function hydrateCurrentPlayer() {
  const storedId = Number(localStorage.getItem("drg1e_player_id") || 0);
  state.currentPlayer = state.players.find((player) => player.id === storedId) || state.players[0] || null;
  if (state.currentPlayer) localStorage.setItem("drg1e_player_id", String(state.currentPlayer.id));
}

function renderShell() {
  document.querySelector("[data-vault-app]").innerHTML = `
    <section class="vault-hero">
      <div>
        <div class="vault-eyebrow">DRG1e Character Vault</div>
        <h1>${pageTitle()}</h1>
        <p>Persistent OSRIC character building with DRG1e house-rule ability rolls, catalog-only equipment, coins, spells, and campaign state.</p>
        <div class="vault-toast" data-vault-toast></div>
      </div>
      <div class="vault-actions">
        <a class="vault-button secondary" href="/1e/">Rules Home</a>
        <a class="vault-button secondary" href="/1e/dm/campaigns/">DM Campaigns</a>
        <a class="vault-button" href="/1e/characters/new/">New Character</a>
      </div>
    </section>
    <section data-vault-view></section>`;
}

function pageTitle() {
  if (pageKind() === "new") return "Build a Character";
  if (pageKind() === "edit") return "Edit Character";
  if (pageKind() === "show") return "Character Sheet";
  if (pageKind() === "campaign") return "Campaigns";
  return "Your Characters";
}

function render() {
  const kind = pageKind();
  if (kind === "new" || kind === "edit") renderBuilder();
  if (kind === "show") renderSheet();
  if (kind === "index") renderIndex();
  if (kind === "campaign") renderCampaigns();
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
    campaign_day: 1,
    current_location: "Town",
    safe_storage_location: "",
    original_rolls: [],
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
    <form class="vault-panel vault-form" data-builder-form>${builderStep()}</form>`;
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

function builderStep() {
  const d = state.draft;
  const races = Object.keys(state.rules?.races || {});
  const classes = Object.keys(state.rules?.classes || {});
  if (state.step === 0) return `
    ${field("Character Name", "name", d.name)}
    ${selectField("Owner / Player", "user_id", String(d.user_id || state.currentPlayer?.id || ""), ["", ...state.players.map((player) => String(player.id))])}
    ${field("New/Updated Player Name", "owner_name", d.owner_name || state.currentPlayer?.display_name || "Website Player")}
    ${field("Email", "email", d.email || state.currentPlayer?.email || "", "email")}
    ${field("Discord User ID", "discord_user_id", d.discord_user_id || state.currentPlayer?.discord_user_id || "")}
    ${selectField("Role", "role", d.role || state.currentPlayer?.role || "player", ["player", "dm", "admin"])}
    ${selectField("Campaign", "campaign_id", d.campaign_id || "", ["", ...state.campaigns.map((c) => String(c.id))])}
    ${field("Campaign Day", "campaign_day", d.campaign_day, "number")}
    ${field("Current Location", "current_location", d.current_location)}
    ${field("Safe Storage", "safe_storage_location", d.safe_storage_location || "", "text", "wide")}
    <p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/">Character Creation</a></p>
    ${navButtons()}`;
  if (state.step === 1) return `
    <div class="vault-full vault-actions"><button class="vault-button" type="button" data-roll>Roll 4d6 Drop Lowest</button><span class="vault-muted">Rolls: ${(d.original_rolls || []).join(", ") || "none yet"}</span></div>
    ${abilities.map((a) => field(title(a), `abilities.${a}`, d.abilities[a], "number")).join("")}
    <p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/001-ability-scores/">4d6 drop lowest DRG1e house rule</a></p>
    ${navButtons()}`;
  if (state.step === 2) return `
    ${selectField("Race", "race", d.race, races)}
    <div class="vault-card vault-wide"><h3>Adjusted Scores</h3><div class="vault-statline">${adjustedStats(d).map(([name, value]) => `<div class="vault-stat"><strong>${value}</strong><span>${title(name)}</span></div>`).join("")}</div></div>
    <div class="vault-card vault-full"><h3>Race Details</h3>${raceClassWarnings(d)}<p><strong>Eligible classes:</strong> ${h((state.rules.races[d.race]?.classes || []).join(", "))}</p><p><strong>Vision:</strong> ${h(state.rules.races[d.race]?.vision || "Manual DM Review")}</p><p><strong>Languages:</strong> ${h((state.rules.races[d.race]?.languages || []).join(", "))}</p><p><strong>Level limits:</strong> ${h(state.rules.races[d.race]?.level_limits || "Manual DM Review")}</p></div>
    <p class="vault-rules vault-full">Rules: <a href="/1e/character-creation/002-race/">Race</a> and race reference pages</p>
    ${navButtons()}`;
  if (state.step === 3) return `
    ${selectField("Class", "class_name", d.class_name, classes)}
    <div class="vault-card vault-wide"><h3>Class Notes</h3>${raceClassWarnings(d)}<p>${h((state.rules.classes[d.class_name] || {}).armor)}</p><p><strong>Weapons:</strong> ${h((state.rules.classes[d.class_name] || {}).weapons)}</p><p>Hit die: ${h((state.rules.classes[d.class_name] || {}).hit_die_text || `d${(state.rules.classes[d.class_name] || {}).hit_die}`)}. Starting wealth: ${h((state.rules.classes[d.class_name] || {}).wealth)}.</p><p>Proficiencies: ${h(proficiencyCount(d.class_name, d.level) ?? "Manual DM Review")} at this level. Non-proficiency penalty: ${h((state.rules.classes[d.class_name] || {}).non_proficiency_penalty ?? "Manual DM Review")}.</p></div>
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
    <button class="vault-button" type="button" data-save>${save ? "Save Character" : "Save Draft"}</button>
  </div>`;
}

function equipmentManager() {
  return `<div class="vault-full">
    <div class="vault-actions">
      <input name="equipment_search" placeholder="Search equipment catalog" value="">
      <select name="equipment_type"><option value="">All types</option><option>weapon</option><option>armor</option><option>shield</option><option>adventuring_gear</option><option>mount</option><option>transport</option></select>
      <label class="vault-check"><input type="checkbox" name="allowed_only"> Class allowed only</label>
      <label class="vault-check"><input type="checkbox" name="dm_override"> DM override equip restrictions</label>
    </div>
    <table class="vault-table"><thead><tr><th>Item</th><th>Type</th><th>Wt</th><th>Cost</th><th>Use</th><th></th></tr></thead><tbody data-equipment-results>${equipmentRows(classAwareEquipment().slice(0, 40))}</tbody></table>
    <p class="vault-rules">Rules: <a href="/1e/equipment/">OSRIC equipment catalog</a>. Free-typed player equipment is intentionally blocked.</p>
  </div>`;
}

function equipmentRows(items) {
  return items.map((item) => {
    const detail = item.type === "weapon" ? `${item.damage_small_medium || ""} vs S/M, ${item.damage_large || ""} vs L`
      : item.type === "armor" || item.type === "shield" ? `AC ${item.armor_class_value ?? ""}, adjustment ${item.armor_class_adjustment ?? ""}`
      : item.rules_reference || "";
    const allowed = classAllowsEquipment(state.draft?.class_name, item);
    return `<tr class="${allowed.allowed ? "" : "vault-warn-row"}"><td><strong>${h(item.name)}</strong><br><span class="vault-mini">${h(detail)}</span></td><td>${h(item.type)}</td><td>${h(item.weight)}</td><td>${h(item.cost_amount ?? "")} ${h(item.cost_coin ?? "")}</td><td>${allowed.allowed ? "Allowed" : "Blocked"}<br><span class="vault-mini">${h(allowed.reason)}</span></td><td><button class="vault-button secondary" type="button" data-add-equipment="${item.id}" data-status="carried">Add</button> <button class="vault-button secondary" type="button" data-add-equipment="${item.id}" data-status="equipped" ${!allowed.allowed && !state.dmOverride ? "disabled" : ""}>Equip</button></td></tr>`;
  }).join("");
}

function proficiencyManager() {
  const weapons = state.equipment.filter((item) => item.type === "weapon").slice(0, 80);
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

function bindBuilderActions() {
  document.querySelector("[data-prev]")?.addEventListener("click", () => { syncDraft(); state.step = Math.max(0, state.step - 1); renderBuilder(); });
  document.querySelector("[data-next]")?.addEventListener("click", () => { syncDraft(); state.step = Math.min(10, state.step + 1); renderBuilder(); });
  document.querySelector("[data-save]")?.addEventListener("click", saveDraft);
  document.querySelector("[data-roll]")?.addEventListener("click", () => {
    state.draft.original_rolls = Array.from({ length: 6 }, roll4d6DropLowest);
    abilities.forEach((ability, index) => state.draft.abilities[ability] = state.draft.original_rolls[index]);
    renderBuilder();
  });
  document.querySelectorAll("[data-add-equipment]").forEach((button) => button.addEventListener("click", async () => {
    const character = await ensureSaved();
    state.character = await api(`/characters/${character.id}/inventory`, { method: "POST", body: JSON.stringify({ equipment_id: Number(button.dataset.addEquipment), quantity: 1, status: button.dataset.status || "carried", dm_override: state.dmOverride }) });
    toast("Equipment added and weight recalculated.");
  }));
  document.querySelectorAll("[data-add-spell]").forEach((button) => button.addEventListener("click", async () => {
    const character = await ensureSaved();
    state.character = await api(`/characters/${character.id}/spells`, { method: "POST", body: JSON.stringify({ spell_id: Number(button.dataset.addSpell), known: true, prepared: true, memorized_count: 1, in_spellbook: state.draft.class_name === "Magic-User" }) });
    toast("Spell saved.");
  }));
  document.querySelectorAll("[data-prof]").forEach((button) => button.addEventListener("click", async () => {
    const character = await ensureSaved();
    state.character = await api(`/characters/${character.id}/weapon-proficiencies`, { method: "POST", body: JSON.stringify({ equipment_id: Number(button.dataset.prof), proficient: true }) });
    toast("Proficiency saved.");
  }));
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
  if (state.draft.user_id) state.draft.user_id = Number(state.draft.user_id);
  if (!state.draft.user_id) delete state.draft.user_id;
  if (state.draft.campaign_id) state.draft.campaign_id = Number(state.draft.campaign_id);
  if (!state.draft.campaign_id) state.draft.campaign_id = null;
  const method = state.character?.id ? "PUT" : "POST";
  const path = state.character?.id ? `/characters/${state.character.id}` : "/characters";
  state.character = await api(path, { method, body: JSON.stringify(state.draft) });
  if (state.character.player?.id) {
    state.currentPlayer = state.character.player;
    localStorage.setItem("drg1e_player_id", String(state.currentPlayer.id));
  }
  state.draft = { ...state.draft, id: state.character.id };
  toast("Character saved permanently.");
  if (navigate && pageKind() === "new") location.href = `/1e/characters/${state.character.id}/`;
  return state.character;
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
  const race = state.rules?.races?.[d.race] || {};
  const cls = state.rules?.classes?.[d.class_name] || {};
  if (race.classes && !race.classes.includes(d.class_name)) warnings.push(`${d.race} cannot normally choose ${d.class_name} as a single class.`);
  if (cls.allowed_alignments?.length && !cls.allowed_alignments.includes(d.alignment)) warnings.push(`${d.class_name} alignment restriction: ${cls.alignment}.`);
  return warnings.length ? `<div class="vault-warning">${warnings.map((warning) => `<p>${h(warning)}</p>`).join("")}</div>` : `<p class="vault-muted">No race/class/alignment warnings.</p>`;
}

function coinCount(values = {}) {
  return coins.reduce((sum, coin) => sum + Math.max(0, Number(values[coin] || 0)), 0);
}

function coinWeight(values = {}) {
  return Math.round((coinCount(values) / 10) * 10) / 10;
}

function adjustedStats(d) {
  const adjustments = state.rules?.races?.[d.race]?.adjustments || {};
  return abilities.map((ability) => [ability, Math.max(3, Math.min(18, Number(d.abilities[ability] || 10) + Number(adjustments[ability] || 0)))]);
}

function previewCharacter() {
  const d = state.draft;
  return { ...d, adjusted_abilities: Object.fromEntries(adjustedStats(d)), inventory: state.character?.inventory || [], spells: state.character?.spells || [], weapon_proficiencies: state.character?.weapon_proficiencies || [], combat: state.character?.combat || d.combat, rules: { equipment: "/1e/equipment/", magic: "/1e/how-to-play/magic/" } };
}

function renderIndex() {
  document.querySelector("[data-vault-view]").innerHTML = `${playerPanelHtml()}<div class="vault-grid">${state.characters.length ? state.characters.map((character) => `<article class="vault-card"><div class="vault-kicker">${h(character.status)} / ${h(character.life_status)}</div><h2>${h(character.name)}</h2><p>${h(character.race)} ${h(character.class_name)} ${h(character.level)}</p><p class="vault-muted">Owner: ${h(character.player?.display_name || character.user_id)}${character.campaign_id ? ` / Campaign ${h(character.campaign_id)}` : ""}</p><div class="vault-statline"><div class="vault-stat"><strong>${character.combat.armor_class}</strong><span>AC</span></div><div class="vault-stat"><strong>${character.combat.current_hp}/${character.combat.max_hp}</strong><span>HP</span></div><div class="vault-stat"><strong>${character.combat.movement_rate}</strong><span>Move</span></div></div><div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${character.id}/">View</a><a class="vault-button secondary" href="/1e/characters/${character.id}/edit/">Edit</a><button class="vault-button secondary" data-delete="${character.id}">Archive</button></div></article>`).join("") : `<article class="vault-panel"><h2>No characters yet</h2><p>Create your first vault character, then assign them to a campaign when the DM is ready.</p><div class="vault-actions"><a class="vault-button" href="/1e/characters/new/">Create Character</a></div></article>`}</div>`;
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
    state.characters = await api("/characters");
    renderIndex();
  }));
}

function playerPanelHtml() {
  return `<section class="vault-panel"><div class="vault-kicker">Player Identity</div><form class="vault-form" data-player-form>
    ${selectField("Current Player", "current_player_id", String(state.currentPlayer?.id || ""), ["", ...state.players.map((player) => String(player.id))])}
    ${field("Display Name", "display_name", state.currentPlayer?.display_name || "Website Player")}
    ${field("Email", "email", state.currentPlayer?.email || "", "email")}
    ${field("Discord User ID", "discord_user_id", state.currentPlayer?.discord_user_id || "")}
    ${selectField("Role", "role", state.currentPlayer?.role || "player", ["player", "dm", "admin"])}
    <div class="vault-actions vault-full"><button class="vault-button" type="submit">Save Player</button><a class="vault-button secondary" href="/1e/characters/new/">Create Character</a>${isDm() ? `<a class="vault-button secondary" href="/1e/dm/campaigns/">DM Tools</a>` : ""}</div>
  </form></section>`;
}

function isDm() {
  return ["dm", "admin"].includes(state.currentPlayer?.role);
}

function renderSheet() {
  document.querySelector("[data-vault-view]").innerHTML = `<div class="vault-sheet">${quickEditHtml(state.character)}${sheetHtml(state.character)}</div>`;
  document.querySelectorAll("[data-inventory-action]").forEach((button) => button.addEventListener("click", async () => {
    const [id, status] = button.dataset.inventoryAction.split(":");
    state.character = await api(`/characters/${state.character.id}/inventory/${id}`, { method: "PUT", body: JSON.stringify({ status, storage_location: status === "stored" ? state.character.safe_storage_location || "Safe storage" : null }) });
    renderSheet();
  }));
  document.querySelector("[data-quick-edit]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const coinsPatch = Object.fromEntries(coins.map((coin) => [coin, Number(data[`coin_${coin}`] || 0)]));
    state.character = await api(`/characters/${state.character.id}`, {
      method: "PUT",
      body: JSON.stringify({
        xp: Number(data.xp || 0),
        campaign_day: Number(data.campaign_day || 1),
        current_location: data.current_location,
        notes: data.notes,
        safe_storage_location: data.safe_storage_location,
        coins: coinsPatch,
        combat: { current_hp: Number(data.current_hp || 0), max_hp: Number(data.max_hp || 0) },
      }),
    });
    toast("Quick edits saved.");
    renderSheet();
  });
  document.querySelectorAll("[data-spell-action]").forEach((button) => button.addEventListener("click", async () => {
    const [id, action] = button.dataset.spellAction.split(":");
    const spell = state.character.spells.find((entry) => String(entry.id) === id);
    const next = action === "prepare" ? { prepared: true, memorized_count: Math.max(1, Number(spell.memorized_count || 0)) } : { prepared: false, memorized_count: 0 };
    try {
      state.character = await api(`/characters/${state.character.id}/spells/${id}`, { method: "PUT", body: JSON.stringify(next) });
      renderSheet();
    } catch (error) {
      toast("Spell slot limit reached or spell is not eligible.");
    }
  }));
}

function quickEditHtml(c) {
  return `<section class="vault-panel"><div class="vault-kicker">Quick Edit</div><form class="vault-form" data-quick-edit>
    ${field("Current HP", "current_hp", c.combat?.current_hp ?? 1, "number")}
    ${field("Max HP", "max_hp", c.combat?.max_hp ?? 1, "number")}
    ${field("XP", "xp", c.xp ?? 0, "number")}
    ${field("Campaign Day", "campaign_day", c.campaign_day ?? 1, "number")}
    ${field("Current Location", "current_location", c.current_location || "Town", "text", "wide")}
    ${field("Personal Safe Storage", "safe_storage_location", c.safe_storage_location || "", "text", "wide")}
    ${coins.map((coin) => field(title(coin), `coin_${coin}`, c.coins?.[coin] ?? 0, "number")).join("")}
    <label class="vault-field full">Notes<textarea name="notes">${h(c.notes || "")}</textarea></label>
    <div class="vault-actions vault-full"><button class="vault-button" type="submit">Save Quick Edits</button><a class="vault-button secondary" href="/1e/characters/${c.id}/edit/">Full Edit</a></div>
  </form></section>`;
}

function sheetHtml(c) {
  return `<div class="vault-grid">
    <section class="vault-card"><div class="vault-kicker">Identity <a class="vault-rules" href="/1e/character-creation/">Rules</a></div><h2>${h(c.name || "Unnamed")}</h2><p>${h(c.race)} ${h(c.class_name)} ${h(c.level)} / ${h(c.alignment)}</p><p>${h(c.status)} / ${h(c.life_status)}</p>${warningsHtml(c)}<div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
    <section class="vault-card vault-critical"><div class="vault-kicker">Combat <a class="vault-rules" href="/1e/how-to-play/combat/">Rules</a></div><div class="vault-statline"><div class="vault-stat"><strong>${h(c.combat?.armor_class ?? 10)}</strong><span>AC</span></div><div class="vault-stat"><strong>${h(c.combat?.current_hp ?? 1)}/${h(c.combat?.max_hp ?? 1)}</strong><span>HP</span></div><div class="vault-stat"><strong>${h(c.combat?.movement_rate ?? 120)}</strong><span>Move</span></div><div class="vault-stat"><strong>${h(c.combat?.encumbrance_band ?? "Unencumbered")}</strong><span>Load</span></div></div><p>Dex AC ${h(c.combat?.dex_adjustment ?? 0)}. Carried ${h(c.combat?.carried_weight ?? 0)} lb.</p><div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
    <section class="vault-card"><div class="vault-kicker">Saving Throws <a class="vault-rules" href="/1e/character-creation/003-class/">Rules</a></div>${savingThrowsHtml(c)}<div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
    <section class="vault-card"><div class="vault-kicker">Ability Scores <a class="vault-rules" href="/1e/character-creation/001-ability-scores/">Rules</a></div><div class="vault-statline">${abilities.map((a) => `<div class="vault-stat"><strong>${h(c.adjusted_abilities?.[a] ?? c.abilities?.[a] ?? 10)}</strong><span>${title(a)}</span></div>`).join("")}</div><div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
    <section class="vault-card"><div class="vault-kicker">Race/Class Details <a class="vault-rules" href="/1e/character-creation/003-class/">Rules</a></div><p><strong>Hit die:</strong> ${h(c.class_details?.hit_die_text || "")}</p><p><strong>Armor:</strong> ${h(c.class_details?.armor || "")}</p><p><strong>Weapons:</strong> ${h(c.class_details?.weapons || "")}</p><p><strong>Vision:</strong> ${h(c.race_details?.vision || "")}</p><p><strong>Languages:</strong> ${h((c.race_details?.languages || []).join(", "))}</p><div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
    <section class="vault-card"><div class="vault-kicker">Movement & Encumbrance <a class="vault-rules" href="/1e/how-to-play/equipment-encumbrance/">Rules</a></div><p>${h(c.combat?.carried_weight ?? 0)} lb carried including coins. Band: <strong>${h(c.combat?.encumbrance_band ?? "Unencumbered")}</strong>.</p><p>Coin load: ${coinCount(c.coins)} coins / ${coinWeight(c.coins)} lb.</p><p>Initiative: ${h(c.combat?.initiative_adjustment)}</p><div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
    <section class="vault-panel"><div class="vault-kicker">Weapons</div>${weaponsHtml(c)}<div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
    <section class="vault-panel"><div class="vault-kicker">Armor</div>${armorHtml(c)}<div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
    <section class="vault-card"><div class="vault-kicker">Coins <a class="vault-rules" href="/1e/equipment/">Rules</a></div><div class="vault-statline">${coins.map((coin) => `<div class="vault-stat"><strong>${h(c.coins?.[coin] ?? 0)}</strong><span>${title(coin)}</span></div>`).join("")}</div><p>${coinCount(c.coins)} coins / ${coinWeight(c.coins)} lb.</p><div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
    <section class="vault-panel"><div class="vault-kicker">Equipment <a class="vault-rules" href="/1e/equipment/">Rules</a></div>${inventoryHtml(c)}<div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
    <section class="vault-panel"><div class="vault-kicker">Spells <a class="vault-rules" href="/1e/how-to-play/magic/">Rules</a></div>${spellsHtml(c)}<div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
    <section class="vault-card"><div class="vault-kicker">Campaign State</div><p>Day ${h(c.campaign_day)} at ${h(c.current_location)}.</p><p>Storage: ${h(c.safe_storage_location || "No safe storage set")}</p><div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
    <section class="vault-panel"><div class="vault-kicker">Notes</div><p>${h(c.notes || "No notes.")}</p><div class="vault-actions"><a class="vault-button secondary" href="/1e/characters/${c.id || ""}/edit/">Edit</a></div></section>
  </div>`;
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
  return `<table class="vault-table"><thead><tr><th>Item</th><th>Status</th><th>Wt</th><th>Actions</th></tr></thead><tbody>${items.map((item) => `<tr><td>${h(item.quantity)} x <strong>${h(item.equipment.name)}</strong><br>${h(item.storage_location || "")}</td><td>${h(item.status)}</td><td>${h((item.equipment.weight * item.quantity).toFixed(2))}</td><td><button class="vault-button secondary" data-inventory-action="${item.id}:equipped">Equip</button> <button class="vault-button secondary" data-inventory-action="${item.id}:carried">Carry</button> <button class="vault-button secondary" data-inventory-action="${item.id}:stored">Store</button> <button class="vault-button secondary" data-inventory-action="${item.id}:sold">Not Carried</button></td></tr>`).join("")}</tbody></table>`;
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
  return `${weapons.length ? inventoryTable(weapons) : "<p>No weapons carried.</p>"}<h3>Proficiencies</h3><p>Allowed proficiencies at this level: ${h(c.class_details?.proficiency_count ?? "Manual DM Review")}. Non-proficiency penalty: ${h(c.class_details?.non_proficiency_penalty ?? "Manual DM Review")}.</p>${profs.map((p) => `<p><strong>${h(p.equipment.name)}</strong>: ${p.proficient ? "proficient" : "non-proficient"} ${h(p.notes || "")}</p>`).join("") || "<p>No proficiencies recorded.</p>"}`;
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
  const row = (s, preparedRow = false) => `<tr><td><strong>${h(s.spell.name)}</strong><br>${spellBadges(s)}<br><a class="vault-mini" href="${h(s.spell.rules_reference)}">Rules</a></td><td>${h(s.spell.spell_level)}<br><span class="vault-mini">${h((s.spell.class_list || []).join(", "))}</span></td><td>${h(s.spell.range || "")}</td><td>${h(s.spell.duration || "")}</td><td>${h(s.spell.area_of_effect || "")}</td><td>${h(s.spell.components || "")}</td><td>${h((s.spell.description || "").slice(0, 180))}</td><td>${h(s.memorized_count)}</td><td><button class="vault-button secondary" data-spell-action="${s.id}:${preparedRow ? "unprepare" : "prepare"}">${preparedRow ? "Unprepare" : "Prepare"}</button></td></tr>`;
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

function renderCampaigns() {
  if (state.campaign) {
    const c = state.campaign;
    document.querySelector("[data-vault-view]").innerHTML = `<section class="vault-panel"><h2>${h(c.name)}</h2><form class="vault-form" data-campaign-update>${field("Campaign Day", "current_campaign_day", c.current_campaign_day, "number")}${field("Default / Current Location", "default_location", c.default_location || "Town", "text", "wide")}${selectField("Status", "status", c.status || "active", ["active", "inactive", "archived"])}<label class="vault-field full">Description<textarea name="description">${h(c.description || "")}</textarea></label><div class="vault-actions vault-full"><button class="vault-button" type="submit">Update Campaign</button><button class="vault-button secondary" type="button" data-archive-campaign="${c.id}">Archive Campaign</button></div></form></section>
    <section class="vault-panel"><div class="vault-kicker">Campaign Players</div><form class="vault-form" data-campaign-player>${selectField("Existing Player", "user_id", "", ["", ...state.players.map((player) => String(player.id))])}${field("Or New Display Name", "display_name", "")}${field("Email", "email", "", "email")}${field("Discord User ID", "discord_user_id", "")}${selectField("Campaign Role", "campaign_role", "player", ["player", "dm", "observer"])}<div class="vault-actions vault-full"><button class="vault-button" type="submit">Add Player</button></div></form>${campaignPlayersTable(c.players || [])}</section>
    <section class="vault-panel"><div class="vault-kicker">Assigned Characters</div><form class="vault-form" data-assign-character>${selectField("Assign Character", "character_id", "", ["", ...state.characters.filter((character) => !character.campaign_id || character.campaign_id === c.id).map((character) => String(character.id))])}<div class="vault-actions vault-full"><button class="vault-button" type="submit">Assign</button></div></form>${campaignCharactersTable(c.characters || [])}</section>
    <section class="vault-panel"><div class="vault-kicker">Safe Storage</div><form class="vault-form" data-safe-storage>${field("Location Name", "name", "Party Camp")}${field("Description", "description", "", "text", "wide")}<div class="vault-actions vault-full"><button class="vault-button" type="submit">Create / Update Location</button></div></form>${safeStorageHtml(c)}</section>
    ${isDm() ? dmCatalogHtml(c) : ""}`;
    document.querySelector("[data-campaign-update]").addEventListener("submit", async (event) => {
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
  document.querySelector("[data-vault-view]").innerHTML = `${playerPanelHtml()}<section class="vault-panel"><h2>DM Campaign Foundation</h2><form class="vault-form" data-campaign-form>${field("Name", "name", "")}${field("Default Location", "default_location", "Town")}${field("Current Day", "current_campaign_day", 1, "number")}<label class="vault-field full">Description<textarea name="description"></textarea></label><button class="vault-button" type="submit">Create Campaign</button></form><table class="vault-table"><thead><tr><th>Name</th><th>Day</th><th>Status</th></tr></thead><tbody>${state.campaigns.map((c) => `<tr><td><a href="/1e/dm/campaigns/${c.id}/">${h(c.name)}</a></td><td>${c.current_campaign_day}</td><td>${h(c.status)}</td></tr>`).join("")}</tbody></table></section>`;
  document.querySelector("[data-campaign-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    data.current_campaign_day = Number(data.current_campaign_day || 1);
    await api("/campaigns", { method: "POST", body: JSON.stringify(data) });
    state.campaigns = await api("/campaigns");
    renderCampaigns();
  });
  document.querySelector("[data-player-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.currentPlayer = await api("/players", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
    localStorage.setItem("drg1e_player_id", String(state.currentPlayer.id));
    state.players = await api("/players");
    renderCampaigns();
  });
}

function campaignPlayersTable(players) {
  return `<table class="vault-table"><thead><tr><th>Player</th><th>Role</th><th>Email</th><th></th></tr></thead><tbody>${players.length ? players.map((entry) => `<tr><td>${h(entry.player?.display_name || entry.user_id)}</td><td>${h(entry.role)}</td><td>${h(entry.player?.email || "")}</td><td><button class="vault-button secondary" data-remove-player="${entry.user_id}">Remove</button></td></tr>`).join("") : `<tr><td colspan="4">No players assigned yet.</td></tr>`}</tbody></table>`;
}

function campaignCharactersTable(characters) {
  return `<table class="vault-table"><thead><tr><th>Character</th><th>Status</th><th>Life</th><th>Coins</th><th>Location</th><th>Actions</th></tr></thead><tbody>${characters.length ? characters.map((character) => `<tr><td><a href="/1e/characters/${character.id}/">${h(character.name)}</a><br><span class="vault-mini">${h(character.player?.display_name || "Unknown Player")} / ${h(character.race)} ${h(character.class_name)} ${h(character.level)}</span></td><td>${h(character.status)}</td><td>${h(character.life_status)}</td><td>${coinCount(character.coins)} coins<br>${coinWeight(character.coins)} lb</td><td>${h(character.current_location)}</td><td><button class="vault-button secondary" data-char-status="${character.id}:active">Active</button> <button class="vault-button secondary" data-char-status="${character.id}:inactive">Inactive</button> <button class="vault-button secondary" data-char-status="${character.id}:retired">Retired</button> <button class="vault-button secondary" data-char-status="${character.id}:dead">Dead</button> <button class="vault-button secondary" data-char-status="${character.id}:archived">Archive</button> <button class="vault-button secondary" data-char-status="${character.id}:unassign">Unassign</button></td></tr>`).join("") : `<tr><td colspan="6">No characters assigned yet.</td></tr>`}</tbody></table>`;
}

function safeStorageHtml(c) {
  const locations = c.safe_storage_locations || [];
  const stored = c.stored_items || [];
  return `${locations.length ? locations.map((location) => `<article class="vault-row"><div><strong>${h(location.name)}</strong><p>${h(location.description || "No description.")}</p><p class="vault-muted">${(location.stored_items || []).length} stored item rows.</p></div><button class="vault-button secondary" data-archive-storage="${location.id}">Archive</button></article>`).join("") : `<p>No campaign safe storage yet. Common options: Inn Room, Temple Vault, Hireling Pack Mule, Townhouse, Party Camp, Hidden Cache.</p>`}<h3>Stored Items</h3>${stored.length ? `<table class="vault-table"><thead><tr><th>Item</th><th>Character</th><th>Location</th><th>Notes</th></tr></thead><tbody>${stored.map((item) => `<tr><td>${h(item.quantity)} x ${h(item.equipment.name)}</td><td><a href="/1e/characters/${item.character_id}/">${h(item.character_name)}</a></td><td>${h(item.storage_location)}</td><td>${h(item.notes || "")}</td></tr>`).join("")}</tbody></table>` : `<p class="vault-muted">No stored items in this campaign.</p>`}`;
}

function dmCatalogHtml(c) {
  const campaignItems = state.equipment.filter((item) => item.campaign_id === c.id || item.is_dm_created).slice(0, 30);
  return `<section class="vault-panel"><div class="vault-kicker">DM Item Catalog</div><form class="vault-form" data-catalog-form>
    ${field("Name", "name", "")}
    ${selectField("Type", "type", "adventuring_gear", ["weapon", "armor", "shield", "adventuring_gear", "container", "mount", "transport", "tool", "clothing", "service", "treasure", "magic_item", "other"])}
    ${field("Subtype", "subtype", "")}
    ${field("Cost", "cost_amount", "", "number")}
    ${selectField("Coin", "cost_coin", "gp", ["pp", "gp", "ep", "sp", "cp"])}
    ${field("Weight", "weight", 0, "number")}
    ${field("Damage S/M", "damage_small_medium", "")}
    ${field("Damage L", "damage_large", "")}
    ${field("Armor AC", "armor_class_value", "", "number")}
    ${field("AC Adjustment", "armor_class_adjustment", "", "number")}
    ${field("Rules Reference", "rules_reference", "/1e/equipment/", "text", "wide")}
    <label class="vault-field full">Notes<textarea name="notes"></textarea></label>
    <div class="vault-actions vault-full"><button class="vault-button" type="submit">Create Campaign Item</button></div>
  </form><table class="vault-table"><thead><tr><th>Item</th><th>Type</th><th>Wt</th><th>Campaign</th><th></th></tr></thead><tbody>${campaignItems.length ? campaignItems.map((item) => `<tr><td>${h(item.name)}<br><span class="vault-mini">${h(item.notes || "")}</span></td><td>${h(item.type)}</td><td>${h(item.weight)}</td><td>${h(item.campaign_id || "global")}</td><td><button class="vault-button secondary" data-archive-item="${item.id}">Archive</button></td></tr>`).join("") : `<tr><td colspan="5">No custom items yet.</td></tr>`}</tbody></table></section>`;
}

function title(value) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function roll4d6DropLowest() {
  const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => a - b);
  return dice.slice(1).reduce((sum, die) => sum + die, 0);
}

boot();
