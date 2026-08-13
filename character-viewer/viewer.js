(() => {
  "use strict";

  const abilityNames = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
  const abilityShort = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };
  const skillNames = {
    acr: "Acrobatics", ani: "Animal Handling", arc: "Arcana", ath: "Athletics", dec: "Deception", his: "History",
    ins: "Insight", itm: "Intimidation", inv: "Investigation", med: "Medicine", nat: "Nature", prc: "Perception",
    prf: "Performance", per: "Persuasion", rel: "Religion", slt: "Sleight of Hand", ste: "Stealth", sur: "Survival"
  };
  const skillAbilities = { acr: "dex", ani: "wis", arc: "int", ath: "str", dec: "cha", his: "int", ins: "wis", itm: "cha", inv: "int", med: "wis", nat: "int", prc: "wis", prf: "cha", per: "cha", rel: "int", slt: "dex", ste: "dex", sur: "wis" };
  const classicSaveNames = { paralyzation: "Paralyzation", poison: "Poison", death: "Death Magic", rod: "Rod", staff: "Staff", wand: "Wand", petrification: "Petrification", polymorph: "Polymorph", breath: "Breath Weapon", spell: "Spell" };
  const alignmentNames = { lg: "Lawful Good", ng: "Neutral Good", cg: "Chaotic Good", ln: "Lawful Neutral", n: "True Neutral", nn: "True Neutral", cn: "Chaotic Neutral", le: "Lawful Evil", ne: "Neutral Evil", ce: "Chaotic Evil" };

  const importStage = document.querySelector("[data-import-stage]");
  const sheetStage = document.querySelector("[data-sheet-stage]");
  const dropZone = document.querySelector("[data-drop-zone]");
  const fileInput = document.querySelector("[data-file-input]");
  const pasteToggle = document.querySelector("[data-paste-toggle]");
  const pasteFields = document.querySelector("[data-paste-fields]");
  const jsonInput = document.querySelector("[data-json-input]");
  const renderButton = document.querySelector("[data-render-json]");
  const errorBox = document.querySelector("[data-error]");
  const sheet = document.querySelector("[data-sheet]");
  const fileLabel = document.querySelector("[data-file-label]");
  const systemLabel = document.querySelector("[data-system-label]");

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const signed = (value) => `${Number(value) >= 0 ? "+" : ""}${Number(value) || 0}`;
  const modifier = (score) => Math.floor(((Number(score) || 10) - 10) / 2);
  const numeric = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const formatValue = (value, fallback = "—") => value === 0 || value ? escapeHtml(value) : fallback;
  const array = (value) => Array.isArray(value) ? value : [];
  const objectValues = (value) => value && typeof value === "object" ? Object.values(value) : [];
  const itemsOf = (actor, type) => array(actor.items).filter((item) => item.type === type);
  const itemState = (item) => item.system?.location?.state || (item.system?.equipped ? "equipped" : "carried");

  function detectSystem(actor) {
    if (!actor || typeof actor !== "object" || !actor.system || !Array.isArray(actor.items)) return null;
    if (actor.system.attributes?.thaco || actor.system.saves?.paralyzation || actor.flags?.ars) return "ars";
    if (actor.system.skills && actor.system.traits && (actor.flags?.dnd5e || actor.system.attributes?.spellcasting !== undefined)) return "dnd5e";
    return null;
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = "";
  }

  function parseActor(text, label = "Pasted JSON") {
    clearError();
    let actor;
    try { actor = JSON.parse(text); }
    catch { showError("That file is not valid JSON. In Foundry, right-click the character and choose Export Data, then select the exported .json file."); return; }
    const system = detectSystem(actor);
    if (!system) { showError("This does not look like a supported Foundry character export. The first release supports OSRIC and D&D 5e Actor JSON files."); return; }
    if (actor.type !== "character") { showError("This viewer currently accepts player-character Actor exports. NPC and monster sheets will come later."); return; }
    renderActor(actor, system, label);
  }

  function renderActor(actor, system, label) {
    const model = system === "ars" ? adaptArs(actor) : adaptDnd5e(actor);
    sheet.className = `character-sheet ${system === "ars" ? "sheet-classic" : "sheet-modern"}`;
    sheet.innerHTML = renderSheet(model);
    importStage.hidden = true;
    sheetStage.hidden = false;
    document.querySelectorAll(".viewer-header [data-new], .viewer-header [data-print]").forEach((element) => { element.hidden = false; });
    systemLabel.textContent = model.system;
    fileLabel.textContent = label;
    document.title = `${model.name} — Drago Character Viewer`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetViewer() {
    sheetStage.hidden = true;
    importStage.hidden = false;
    sheet.innerHTML = "";
    fileInput.value = "";
    jsonInput.value = "";
    clearError();
    document.querySelectorAll(".viewer-header [data-new], .viewer-header [data-print]").forEach((element) => { element.hidden = true; });
    document.title = "Drago Character Viewer";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function adaptArs(actor) {
    const system = actor.system || {};
    const race = itemsOf(actor, "race")[0]?.name || "Adventurer";
    const classes = itemsOf(actor, "class");
    const classLevels = classes.map(arsClassLevel);
    const classTracks = classes.map((item, index) => ({ name: item.name, level: classLevels[index] }));
    const level = Math.max(1, ...classLevels);
    const abilities = Object.entries(system.abilities || {}).filter(([key]) => key !== "com").map(([key, data]) => ({ key, name: abilityNames[key] || key.toUpperCase(), short: abilityShort[key] || key.toUpperCase(), score: numeric(data?.value, 0), detail: key === "str" && numeric(data?.percent) ? `${data.percent}%` : "" }));
    const weapons = itemsOf(actor, "weapon").filter((item) => itemState(item) === "equipped" && item.system?.attributes?.type !== "ammunition").flatMap((item) => {
      const attack = item.system?.attack || {};
      const damage = item.system?.damage || {};
      const ranges = attack.range || {};
      const attackBonus = numeric(attack.modifier) + numeric(attack.magicBonus);
      const range = [ranges.short, ranges.medium, ranges.long].filter((value) => value !== "" && value !== null && value !== undefined).join(" / ") || "Melee";
      const baseWeapon = { name: item.name, attack: `THAC0 ${formatValue(system.attributes?.thaco?.value, "20")}`, attackBonus: attackBonus ? signed(attackBonus) : "", damage: damage.normal || "—", secondary: damage.large ? `L ${damage.large}` : "", speed: formatValue(attack.speed, "—"), rate: attack.perRound || "1/1", range };
      const meleeAction = array(item.system?.actionGroups).flatMap((group) => array(group.actions)).find((action) => action.type === "melee");
      if (!meleeAction || range === "Melee") return [baseWeapon];
      const meleeDamageActions = array(item.system?.actionGroups).flatMap((group) => array(group.actions)).filter((action) => action.type === "damage");
      const meleeNormal = meleeDamageActions[0]?.formula || damage.normal || "—";
      const meleeLarge = meleeDamageActions[1]?.formula || damage.large || "";
      const weaponName = item.name.replace(/^(thrown|missile)\s+/i, "");
      return [
        { ...baseWeapon, name: `${weaponName} (Melee)`, damage: meleeNormal, secondary: meleeLarge ? `L ${meleeLarge}` : "", rate: "1/1", range: "Melee" },
        { ...baseWeapon, name: `${weaponName} (Thrown)` }
      ];
    });
    const armor = itemsOf(actor, "armor").filter((item) => itemState(item) === "equipped");
    const inventory = array(actor.items).filter((item) => ["item", "container", "armor", "weapon", "potion", "gear"].includes(item.type) && !(item.type === "weapon" && item.system?.attributes?.type === "noDrop")).map((item) => ({ name: item.name, quantity: numeric(item.system?.quantity, 1), weight: numeric(item.system?.weight, 0), state: itemState(item) }));
    const features = array(actor.items)
      .filter((item) => ["ability", "skill", "proficiency"].includes(item.type))
      .filter((item) => !/^(wrestle\/tackle|base movement\b)/i.test(item.name || ""))
      .map((item) => ({ name: item.name, detail: classicFeatureDetail(item), group: item.type === "skill" ? "check" : "feature" }));
    const spells = itemsOf(actor, "spell").map((item) => ({ name: item.name, level: numeric(item.system?.level, numeric(item.system?.rank?.level, 0)), prepared: item.system?.memorized || item.system?.location?.state === "memorized" }));
    const quickStats = [
      { label: "Hit Points", value: `${formatValue(system.attributes?.hp?.value, 0)} / ${formatValue(system.attributes?.hp?.max, system.attributes?.hp?.base || 0)}` },
      { label: "Armor Class", value: formatValue(system.attributes?.ac?.value, 10), note: armor.map((item) => item.name).join(" + ") },
      { label: "THAC0", value: formatValue(system.attributes?.thaco?.value, 20) },
      { label: "Movement", value: formatValue(arsMovement(actor, system), "—") },
      { label: "Attacks", value: classes[0]?.system?.ranks?.[Math.max(0, level - 1)]?.numatks || "1/1", note: "per round" },
      { label: "Experience", value: formatValue(system.details?.xp ?? classes.reduce((sum, item) => sum + numeric(item.system?.xp), 0), 0) },
      { label: "Encumbrance", value: `${formatNumber(inventory.reduce((sum, item) => sum + (item.quantity * item.weight), 0))} lb`, note: "carried load" }
    ];
    const rank = classes[0]?.system?.ranks?.[Math.max(0, classLevels[0] - 1)] || {};
    const saves = Object.entries(system.saves || {}).filter(([key]) => classicSaveNames[key]).map(([key, data]) => ({ name: classicSaveNames[key], value: formatValue(rank[key] ?? data?.value, 20) }));
    return {
      ruleset: "classic", system: "OSRIC Foundry Character", name: actor.name || "Unnamed Adventurer", identity: `${race} · ${classTracks.map((track) => track.name).join(" / ") || "Adventurer"} · ${alignmentNames[system.details?.alignment] || titleCase(system.details?.alignment || "Unaligned")}`, level, classTracks,
      quickStats, abilities, saves, skills: [], weapons, inventory, features, spells, currency: normalizeCurrency(system.currency),
      details: [system.details?.deity && `Deity: ${system.details.deity}`, system.details?.age && `Age: ${system.details.age}`].filter(Boolean)
    };
  }

  function adaptDnd5e(actor) {
    const system = actor.system || {};
    const classItems = itemsOf(actor, "class");
    const classes = classItems.map((item) => ({ name: item.name, level: numeric(item.system?.levels, 1) }));
    const level = Math.max(1, classes.reduce((sum, item) => sum + item.level, 0));
    const proficiency = Math.ceil(level / 4) + 1;
    const race = itemsOf(actor, "race")[0]?.name || "Adventurer";
    const background = itemsOf(actor, "background")[0]?.name || "";
    const abilities = Object.entries(abilityNames).map(([key, name]) => {
      const data = system.abilities?.[key] || {};
      const score = numeric(data.value, 10);
      return { key, name, short: abilityShort[key], score, modifier: modifier(score), proficient: numeric(data.proficient) > 0 };
    });
    const abilityMap = Object.fromEntries(abilities.map((ability) => [ability.key, ability]));
    const skills = Object.entries(system.skills || {}).map(([key, data]) => {
      const ability = data.ability || skillAbilities[key] || "wis";
      const profLevel = numeric(data.value, 0);
      const score = abilityMap[ability]?.score || 10;
      return { name: skillNames[key] || key.toUpperCase(), ability: ability.toUpperCase(), value: signed(modifier(score) + Math.floor(proficiency * profLevel)), proficient: profLevel > 0 };
    }).sort((a, b) => a.name.localeCompare(b.name));
    const armor = itemsOf(actor, "equipment").filter((item) => item.system?.equipped && item.system?.armor?.value);
    const dexMod = abilityMap.dex?.modifier || 0;
    const armorValue = armor[0]?.system?.armor?.value;
    const dexCap = armor[0]?.system?.armor?.dex;
    const computedAc = armorValue ? numeric(armorValue) + (dexCap === 0 ? 0 : Math.min(dexMod, numeric(dexCap, dexMod))) : 10 + dexMod;
    const movementEffect = array(actor.effects).flatMap((effect) => array(effect.changes)).find((change) => String(change.key).includes("movement.walk"));
    const movement = system.attributes?.movement?.walk || itemsOf(actor, "race")[0]?.system?.movement?.walk || movementEffect?.value || "—";
    const weapons = itemsOf(actor, "weapon").map((item) => {
      const base = item.system?.damage?.base || {};
      const damage = base.custom?.enabled ? base.custom?.formula : base.number && base.denomination ? `${base.number}d${base.denomination}${base.bonus || ""}` : "—";
      const activity = objectValues(item.system?.activities)[0] || {};
      const attackAbility = activity.attack?.ability || (array(item.system?.properties).includes("fin") ? (abilityMap.dex.modifier > abilityMap.str.modifier ? "dex" : "str") : "str");
      const attack = signed((abilityMap[attackAbility]?.modifier || 0) + proficiency + numeric(activity.attack?.bonus, 0));
      const range = item.system?.range || {};
      return { name: item.name, attack, damage, secondary: array(base.types).join(", "), speed: titleCase(item.system?.mastery || "—"), rate: item.system?.quantity > 1 ? `×${item.system.quantity}` : "1", range: range.value ? `${range.value}${range.long ? ` / ${range.long}` : ""} ${range.units || "ft"}` : "Melee" };
    });
    const inventory = array(actor.items).filter((item) => ["weapon", "equipment", "consumable", "container", "loot", "tool"].includes(item.type)).map((item) => ({ name: item.name, quantity: numeric(item.system?.quantity, 1), weight: numeric(item.system?.weight?.value ?? item.system?.weight, 0), state: item.system?.equipped ? "equipped" : "carried" }));
    const features = array(actor.items).filter((item) => ["feat", "subclass"].includes(item.type)).map((item) => ({ name: item.name, detail: featureDetail(item) }));
    const spells = itemsOf(actor, "spell").map((item) => ({ name: item.name, level: numeric(item.system?.level, 0), prepared: item.system?.preparation?.prepared !== false }));
    const hp = system.attributes?.hp || {};
    const quickStats = [
      { label: "Hit Points", value: `${formatValue(hp.value, 0)} / ${formatValue(hp.max, hp.value || 0)}`, note: hp.temp ? `${hp.temp} temporary` : "" },
      { label: "Armor Class", value: formatValue(system.attributes?.ac?.value ?? system.attributes?.ac?.flat, computedAc), note: armor.map((item) => item.name).join(" + ") },
      { label: "Proficiency", value: signed(proficiency) },
      { label: "Initiative", value: signed(dexMod + numeric(system.attributes?.init?.bonus, 0)) },
      { label: "Speed", value: movement === "—" ? movement : `${movement} ft` },
      { label: "Passive Perception", value: 10 + numeric(skills.find((skill) => skill.name === "Perception")?.value, modifier(abilityMap.wis?.score)) }
    ];
    const saves = abilities.map((ability) => ({ name: ability.name, value: signed(ability.modifier + (ability.proficient ? proficiency : 0)), proficient: ability.proficient }));
    const classText = classes.map((item) => `${item.name} ${item.level}`).join(" / ") || "Adventurer";
    return {
      ruleset: "modern", system: "D&D 5e / SRD 5.2 Foundry Character", name: actor.name || "Unnamed Adventurer", identity: `${race} · ${classText}${background ? ` · ${background}` : ""}`, level, classTracks: classes,
      quickStats, abilities, saves, skills, weapons, inventory, features, spells, currency: normalizeCurrency(system.currency),
      details: [system.details?.alignment && `Alignment: ${system.details.alignment}`, system.details?.age && `Age: ${system.details.age}`, system.traits?.languages?.value?.length && `Languages: ${system.traits.languages.value.map(titleCase).join(", ")}`].filter(Boolean)
    };
  }

  function normalizeCurrency(currency = {}) {
    return ["pp", "gp", "ep", "sp", "cp"].map((key) => ({ name: key.toUpperCase(), value: numeric(currency[key]?.value ?? currency[key], 0) }));
  }

  function arsClassLevel(item) {
    const explicit = numeric(item.system?.rank?.levels?.max, 0);
    if (explicit > 0) return explicit;
    const xp = numeric(item.system?.xp, 0);
    const ranks = array(item.system?.ranks);
    const earned = ranks.reduce((current, rank, index) => index > 0 && xp >= numeric(ranks[index - 1]?.xp, Infinity) ? index + 1 : current, 1);
    return Math.max(1, Math.min(earned, ranks.length || 1));
  }

  function arsMovement(actor, system) {
    const direct = system.attributes?.movement?.value || system.attributes?.movement?.text;
    if (direct) return direct;
    const base = itemsOf(actor, "ability").find((item) => /^base movement\b/i.test(item.name || ""));
    return base?.name?.match(/(\d+)/)?.[1] || "—";
  }

  function titleCase(value) {
    return String(value || "").replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function featureDetail(item) {
    const uses = item.system?.uses;
    if (uses?.max && !String(uses.max).startsWith("@")) return `${Math.max(0, numeric(uses.max) - numeric(uses.spent))} of ${uses.max} uses`;
    if (uses?.max) return "Limited-use feature";
    return item.type === "subclass" ? "Subclass" : "Feature";
  }

  function classicFeatureDetail(item) {
    if (item.type !== "skill") return titleCase(item.type);
    const formula = String(item.system?.features?.formula || "").toLowerCase().replace(/\s/g, "");
    const target = numeric(item.system?.features?.target, NaN);
    if (!Number.isFinite(target)) return "Skill check";
    if (/^1d100(?:\b|$)/.test(formula)) return `${target}%`;
    const die = formula.match(/^1d(\d+)/)?.[1];
    if (die) return `${target} in ${die}`;
    return `Target ${target}`;
  }

  function renderSheet(model) {
    const masthead = `
      <header class="sheet-masthead">
        <div>
          <p class="sheet-kicker">Drago Russo Games · ${escapeHtml(model.system)}</p>
          <h1>${escapeHtml(model.name)}</h1>
          <p class="identity-line">${escapeHtml(model.identity)}</p>
        </div>
        <div class="level-seal ${model.classTracks.length > 1 ? "is-multiclass" : ""}">
          ${model.classTracks.map((track) => `<div><strong>${escapeHtml(track.name)}</strong><span>Level ${track.level}</span></div>`).join("")}
        </div>
      </header>`;
    const continuation = `
      <header class="print-continuation"><div><small>Character Sheet · Continued</small><strong>${escapeHtml(model.name)}</strong></div><span>${escapeHtml(model.identity)}</span></header>`;
    const abilities = panel("Ability Scores", `<div class="ability-grid">${model.abilities.map(renderAbility).join("")}</div>`);
    const saves = model.ruleset === "modern" ? panel("Saving Throws", renderLinedList(model.saves, true)) : panel("Saving Throws", renderLinedList(model.saves));
    const checks = model.skills.length ? panel("Skills", renderLinedList(model.skills, true)) : panel("Checks & Proficiencies", renderFeatures(model.features.filter((feature) => feature.group === "check")));
    const attacks = panel("Attacks & Weapons", renderWeapons(model.weapons));
    const equipment = panel("Equipment", renderInventory(model.inventory));
    const features = model.ruleset === "modern" ? panel("Features & Traits", renderFeatures(model.features)) : panel("Class & Racial Features", renderFeatures(model.features.filter((feature) => feature.group !== "check")));
    const spells = panel("Spells", renderSpells(model.spells));
    const coin = panel("Coin", `<div class="currency-row">${model.currency.map((entry) => `<div class="coin"><span>${entry.name}</span><strong>${entry.value}</strong></div>`).join("")}</div>`);
    const notes = panel("Notes & Details", model.details.length ? `<ul class="lined-list">${model.details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join("")}</ul>` : `<p class="empty-note">Use this space for conditions, reminders, and notes at the table.</p>`);

    return `
      ${masthead}
      <div class="sheet-body">
        <section class="quick-stats">${model.quickStats.map(renderQuickStat).join("")}</section>
        <div class="sheet-grid">
          <div class="sheet-column">
            ${abilities}
            ${saves}
            ${checks}
          </div>
          <div class="sheet-column">
            ${attacks}
            ${equipment}
            ${features}
          </div>
          <div class="sheet-column sheet-column--reference">
            ${continuation}
            ${spells}
            ${coin}
            ${notes}
          </div>
        </div>
        <p class="sheet-footnote">READ-ONLY SNAPSHOT · EXPORT A NEW ACTOR JSON FROM FOUNDRY TO REFRESH THIS SHEET</p>
      </div>
      <div class="print-layout">
        <section class="print-page print-page--primary">
          ${masthead}
          <section class="quick-stats">${model.quickStats.map(renderQuickStat).join("")}</section>
          <div class="print-page-grid print-page-grid--primary"><div>${abilities}${saves}</div><div>${attacks}</div></div>
        </section>
        <section class="print-page print-page--records">
          ${continuation}
          <div class="print-page-grid print-page-grid--records"><div>${checks}</div><div>${equipment}${features}</div></div>
        </section>
        <section class="print-page print-page--reference">
          ${continuation}
          <div class="print-reference-top">${spells}${coin}</div>
          <div class="print-notes">${notes}</div>
          <p class="sheet-footnote">READ-ONLY SNAPSHOT · EXPORT A NEW ACTOR JSON FROM FOUNDRY TO REFRESH THIS SHEET</p>
        </section>
      </div>`;
  }

  function renderQuickStat(stat) {
    return `<div class="quick-stat"><span>${escapeHtml(stat.label)}</span><strong>${formatValue(stat.value)}</strong>${stat.note ? `<small>${escapeHtml(stat.note)}</small>` : ""}</div>`;
  }

  function renderAbility(ability) {
    const mod = ability.modifier === undefined ? ability.detail : signed(ability.modifier);
    return `<div class="ability"><span>${escapeHtml(ability.short)}</span><strong>${ability.score}</strong>${mod ? `<b>${escapeHtml(mod)}</b>` : ""}<small>${escapeHtml(ability.name)}</small></div>`;
  }

  function panel(title, content) {
    return `<section class="sheet-panel"><h2 class="panel-title">${escapeHtml(title)}</h2><div class="panel-content">${content}</div></section>`;
  }

  function renderLinedList(items, showDots = false) {
    if (!items.length) return `<p class="empty-note">No entries found in this export.</p>`;
    return `<ul class="lined-list">${items.map((item) => `<li class="${item.proficient ? "is-proficient" : ""}"><strong>${showDots ? `<i class="skill-dot"></i>` : ""}${escapeHtml(item.name)}</strong><span>${formatValue(item.value)}${item.ability ? ` <small>${escapeHtml(item.ability)}</small>` : ""}</span></li>`).join("")}</ul>`;
  }

  function renderWeapons(weapons) {
    if (!weapons.length) return `<p class="empty-note">No equipped attacks were found in this export.</p>`;
    return `<div class="weapon-list">${weapons.map((weapon) => `<div class="weapon-row"><strong>${escapeHtml(weapon.name)}</strong><span class="weapon-cell weapon-cell--attack"><span>Attack</span><b>${formatValue(weapon.attack)}</b>${weapon.attackBonus ? `<em>${escapeHtml(weapon.attackBonus)} to hit</em>` : ""}</span><span class="weapon-cell"><span>Damage</span><b>${formatValue(weapon.damage)}${weapon.secondary ? ` <small>${escapeHtml(weapon.secondary)}</small>` : ""}</b></span><span class="weapon-cell"><span>${weapon.speed && !String(weapon.speed).match(/^[-+]?\d+$/) ? "Mastery" : "Speed"}</span><b>${formatValue(weapon.speed)}</b></span><span class="weapon-cell weapon-cell--rate-range"><span class="weapon-meta-line"><span>Rate</span><b>${escapeHtml(weapon.rate)}</b></span><span class="weapon-meta-line"><span>Range</span><b>${escapeHtml(weapon.range)}</b></span></span></div>`).join("")}</div>`;
  }

  function renderInventory(inventory) {
    if (!inventory.length) return `<p class="empty-note">No carried equipment was found in this export.</p>`;
    return `<table class="inventory-table"><thead><tr><th>Item</th><th>Qty.</th><th>Wt.</th><th>Status</th></tr></thead><tbody>${inventory.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${formatNumber(item.quantity)}</td><td>${item.weight ? formatNumber(item.weight) : "—"}</td><td>${titleCase(item.state)}</td></tr>`).join("")}</tbody></table>`;
  }

  function formatNumber(value) {
    const number = numeric(value, 0);
    return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  function renderFeatures(features) {
    if (!features.length) return `<p class="empty-note">No additional features were found in this export.</p>`;
    return `<div class="feature-list">${features.map((feature) => `<div class="feature-chip"><strong>${escapeHtml(feature.name)}</strong><small>${escapeHtml(feature.detail || "Feature")}</small></div>`).join("")}</div>`;
  }

  function renderSpells(spells) {
    if (!spells.length) return `<p class="empty-note">No spells were found in this export.</p>`;
    const grouped = Map.groupBy ? Map.groupBy(spells, (spell) => spell.level) : spells.reduce((map, spell) => map.set(spell.level, [...(map.get(spell.level) || []), spell]), new Map());
    return `<div class="spell-groups">${[...grouped.entries()].sort(([a], [b]) => a - b).map(([level, entries]) => `<div class="spell-group"><div class="spell-level"><span>${Number(level) === 0 ? "Cantrips" : `Level ${level}`}</span><span>${entries.length}</span></div><div class="spell-names">${entries.map((entry) => `<span>${entry.prepared ? "◆ " : ""}${escapeHtml(entry.name)}</span>`).join("")}</div></div>`).join("")}</div>`;
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { showError("That export is unusually large. Please choose the individual character's Actor JSON rather than a world or compendium export."); return; }
    const reader = new FileReader();
    reader.onload = () => parseActor(reader.result, file.name);
    reader.onerror = () => showError("The browser could not read that file. Please export the character again and retry.");
    reader.readAsText(file);
  });

  ["dragenter", "dragover"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add("is-dragging"); }));
  ["dragleave", "drop"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove("is-dragging"); }));
  dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => parseActor(reader.result, file.name);
    reader.readAsText(file);
  });
  dropZone.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.click(); } });
  pasteToggle.addEventListener("click", () => { const expanded = pasteToggle.getAttribute("aria-expanded") === "true"; pasteToggle.setAttribute("aria-expanded", String(!expanded)); pasteFields.hidden = expanded; if (!expanded) jsonInput.focus(); });
  renderButton.addEventListener("click", () => parseActor(jsonInput.value));
  document.querySelectorAll("[data-new]").forEach((button) => button.addEventListener("click", resetViewer));
  document.querySelectorAll("[data-print]").forEach((button) => button.addEventListener("click", () => window.print()));
})();
