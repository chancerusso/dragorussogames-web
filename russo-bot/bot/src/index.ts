import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  ModalBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
  type ModalSubmitInteraction
} from "discord.js";

import {
  activateCharacter,
  addEquipment,
  createCharacter,
  equipEquipment,
  groupStore,
  listCharacters,
  lookupCharacter,
  marchingOrder,
  patchCharacterLedger,
  removeEquipment,
  startTracker,
  trackerStatus,
  unequipEquipment,
  updateTracker,
  type GroupStoreResponse,
  type MarchingOrderResponse,
  type TrackerResponse,
  type CharacterResponse
} from "./api.js";
import { config } from "./config.js";
import { buildCharacterCardEmbed } from "./card-embed.js";
import { buildHelpEmbed } from "./help-embed.js";
import { buildCharacterSheetEmbed } from "./sheet-embed.js";
import { buildLedgerEmbed } from "./ledger-embed.js";
import { buildRefereeScreenEmbeds } from "./ref-screen.js";
import { coinWeight } from "./rules/equipment/coin-weight.js";
import { catalogItemToEquipment, findEquipment, suggestEquipment } from "./rules/equipment/equipment-lookup.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function section(ledger: Record<string, unknown>, name: string): Record<string, unknown> {
  const value = ledger[name];
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function isAdmin(interaction: ChatInputCommandInteraction): boolean {
  return (
    config.adminUserIds.has(interaction.user.id) ||
    Boolean(interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator))
  );
}

async function targetCharacter(interaction: ChatInputCommandInteraction): Promise<CharacterResponse> {
  return lookupCharacter(
    interaction.user.id,
    isAdmin(interaction),
    interaction.options.getString("character")
  );
}

function actor(interaction: ChatInputCommandInteraction) {
  return {
    actor_discord_user_id: interaction.user.id,
    actor_is_admin: isAdmin(interaction)
  };
}

function actorFrom(interaction: ChatInputCommandInteraction | ModalSubmitInteraction) {
  return {
    actor_discord_user_id: interaction.user.id,
    actor_is_admin: isAdmin(interaction as ChatInputCommandInteraction)
  };
}

function scope(interaction: ChatInputCommandInteraction) {
  return {
    guild_id: interaction.guildId ?? "dm",
    channel_id: interaction.channelId,
    actor_discord_user_id: interaction.user.id,
    actor_is_admin: isAdmin(interaction)
  };
}

function channelName(interaction: ChatInputCommandInteraction): string | null {
  const channel = interaction.channel;
  return channel && "name" in channel && typeof channel.name === "string" ? channel.name : null;
}

function discordDisplayName(interaction: ChatInputCommandInteraction): string {
  const member = interaction.member;
  if (member && "displayName" in member && typeof member.displayName === "string") {
    return member.displayName;
  }
  return interaction.user.globalName ?? interaction.user.username;
}

function numberPatch(
  interaction: ChatInputCommandInteraction,
  names: string[],
  mode = "set",
  current: Record<string, unknown> = {}
): Record<string, number> {
  const patch: Record<string, number> = {};
  for (const name of names) {
    const value = interaction.options.getInteger(name);
    if (value === null) {
      continue;
    }
    if (mode === "add" || mode === "subtract") {
      const existing = Number(current[name] ?? 0);
      patch[name] = mode === "add" ? existing + value : Math.max(0, existing - value);
    } else {
      patch[name] = value;
    }
  }
  return patch;
}

function applyMode(current: unknown, value: number, mode = "set"): number {
  const existing = Number(current ?? 0);
  if (mode === "add") {
    return existing + value;
  }
  if (mode === "subtract") {
    return Math.max(0, existing - value);
  }
  return value;
}

function numeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function movementValue(character: CharacterResponse): string {
  const combat = section(character.ledger, "combat");
  const legacyCombat = section(character.ledger, "Combat");
  return String(combat.movement ?? legacyCombat.movement ?? "Not set");
}

function wealthValues(character: CharacterResponse): Record<string, number> {
  const wealth = { ...section(character.ledger, "Wealth"), ...section(character.ledger, "wealth") };
  return Object.fromEntries(["pp", "gp", "ep", "sp", "cp"].map((coin) => [coin, Math.max(0, Number(wealth[coin] ?? 0))]));
}

function equipmentItemWeight(character: CharacterResponse): number {
  const equipment = section(character.ledger, "equipment");
  let total = 0;
  for (const bucket of ["inventory", "equipped"]) {
    const items = Array.isArray(equipment[bucket]) ? (equipment[bucket] as Record<string, unknown>[]) : [];
    for (const item of items) {
      total += Number(item.weight ?? 0) * Number(item.quantity ?? 1);
    }
  }
  return total;
}

function carriedWeight(character: CharacterResponse): number {
  return equipmentItemWeight(character) + coinWeight(wealthValues(character));
}

function encumbranceWarning(beforeWeight: number, afterWeight: number, beforeMove: string, afterMove: string): string {
  if (beforeMove !== afterMove) {
    return "⚠ Movement reduced by encumbrance.";
  }
  if (beforeWeight !== afterWeight) {
    return "⚠ Encumbrance changed. Movement thresholds are not automated yet; Referee should check movement.";
  }
  return "No encumbrance change.";
}

async function syncEncumbrance(interaction: ChatInputCommandInteraction | ModalSubmitInteraction, character: CharacterResponse, action = "ledger.encumbrance"): Promise<CharacterResponse> {
  const total = carriedWeight(character);
  const coins = wealthValues(character);
  return patchCharacterLedger(character.id, {
    ...actorFrom(interaction),
    audit_action: action,
    patch: {
      equipment: {
        encumbrance_total: total,
        coin_weight: coinWeight(coins)
      }
    }
  });
}

function coinSummaryLine(coins: Record<string, number>): string {
  return ["pp", "gp", "ep", "sp", "cp"].map((coin) => `${coin.toUpperCase()} ${coins[coin] ?? 0}`).join(" | ");
}

function casterReminder(character: CharacterResponse): string | null {
  const basics = section(character.ledger, "basics");
  const legacyBasics = section(character.ledger, "Character Basics");
  const magic = section(character.ledger, "Magic");
  const className = String(basics.class_name ?? legacyBasics.class_name ?? magic.spellcasting_class ?? "").toLowerCase();
  const casterClasses = ["cleric", "druid", "magic-user", "magic user", "illusionist"];
  if (casterClasses.some((casterClass) => className.includes(casterClass))) {
    return "Prepare spells: minimum 4 hours quiet rest, then 15 minutes per spell level memorized.";
  }
  return null;
}

async function restCharacter(interaction: ChatInputCommandInteraction, character: CharacterResponse): Promise<string> {
  const combat = section(character.ledger, "combat");
  const legacyCombat = section(character.ledger, "Combat");
  const current = numeric(combat.hp_current ?? legacyCombat.hp);
  const max = numeric(combat.hp_max ?? legacyCombat.max_hp);
  if (current === null || max === null) {
    return `${character.character_name}: HP not changed; current/max HP is not fully tracked.`;
  }

  const next = Math.min(max, current + 1);
  await patchCharacterLedger(character.id, {
    ...actor(interaction),
    audit_action: "ledger.rest.long",
    patch: {
      combat: { hp_current: next },
      Combat: { hp: next },
      resources: { daily_notes: "", daily: {} },
      Resources: { daily_notes: "", daily: {}, class_resources: {} },
      Recovery: { resting: false, healing_notes: null }
    }
  });

  const healed = next > current ? `+${next - current} HP` : "already at max HP";
  const reminder = casterReminder(character);
  return `${character.character_name}: ${next}/${max} HP (${healed}).${reminder ? `\n${reminder}` : ""}`;
}

function parseCoins(input: string | null): Record<string, number> {
  const coins: Record<string, number> = {};
  if (!input) {
    return coins;
  }
  const matches = input.matchAll(/(\d+)\s*(pp|gp|ep|sp|cp)\b/gi);
  for (const match of matches) {
    const coin = match[2].toLowerCase();
    coins[coin] = (coins[coin] ?? 0) + Number(match[1]);
  }
  return coins;
}

function parseLanguages(input: string | null): string[] {
  if (!input) {
    return [];
  }
  return input.split(",").map((language) => language.trim()).filter(Boolean);
}

function parseSaves(input: string | null): Record<string, number> {
  const saves: Record<string, number> = {};
  if (!input) {
    return saves;
  }
  const aliases: Record<string, string> = {
    death: "death",
    poison: "death",
    wands: "wands",
    wand: "wands",
    paralysis: "paralysis_petrify",
    petrify: "paralysis_petrify",
    petrification: "paralysis_petrify",
    breath: "breath",
    spells: "spells",
    spell: "spells"
  };
  const matches = input.matchAll(/([a-z_/ -]+?)\s*[:=]?\s*(\d+)/gi);
  for (const match of matches) {
    const normalized = match[1].toLowerCase().replace(/[^a-z]/g, " ").trim().split(/\s+/)[0];
    const key = aliases[normalized];
    if (key) {
      saves[key] = Number(match[2]);
    }
  }
  return saves;
}

function optionItem(interaction: ChatInputCommandInteraction, required = true): string {
  const value = interaction.options.getString("item") ?? interaction.options.getString("item_name");
  if (!value && required) {
    throw new Error("Item name is required.");
  }
  return value ?? "";
}

async function showEquipmentModal(interaction: ChatInputCommandInteraction, character: CharacterResponse, action: "add" | "elim"): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId(`equipment:${action}:${encodeURIComponent(character.character_name)}`)
    .setTitle(action === "add" ? "Add Equipment" : "Eliminate Equipment");
  const itemInput = new TextInputBuilder()
    .setCustomId("item")
    .setLabel("Item Name")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  const qtyInput = new TextInputBuilder()
    .setCustomId("qty")
    .setLabel("Quantity")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("1");
  const notesInput = new TextInputBuilder()
    .setCustomId("notes")
    .setLabel("Notes")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(itemInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(qtyInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(notesInput)
  );
  await interaction.showModal(modal as any);
}

function equipmentChangeEmbed(params: {
  title: string;
  character: CharacterResponse;
  itemName: string;
  quantity: number;
  weightEach?: number | null;
  damage?: string | null;
  value?: string | null;
  equipped?: boolean;
  beforeWeight: number;
  afterWeight: number;
  beforeMove: string;
  afterMove: string;
}): EmbedBuilder {
  const totalAdded = Number(params.weightEach ?? 0) * params.quantity;
  return new EmbedBuilder()
    .setTitle(params.title)
    .setDescription(`${params.character.character_name}: ${params.itemName} x${params.quantity}`)
    .addFields(
      { name: "Item", value: [`Name: ${params.itemName}`, `Quantity: ${params.quantity}`, `Weight Each: ${params.weightEach ?? "Unknown"} lb`, `Total Item Weight: ${totalAdded} lb`].join("\n"), inline: true },
      { name: "Details", value: [`Damage: ${params.damage || "None"}`, `Cost/Value: ${params.value || "Unknown"}`, `Equipped: ${params.equipped ? "Yes" : "No"}`].join("\n"), inline: true },
      { name: "Encumbrance", value: `Carried Weight: ${params.beforeWeight} → ${params.afterWeight} lb\nMovement: ${params.beforeMove} → ${params.afterMove}\n${encumbranceWarning(params.beforeWeight, params.afterWeight, params.beforeMove, params.afterMove)}`, inline: false }
    )
    .setFooter({ text: "Persistent ledger record. Referee has final authority." });
}

function damageDisplay(item: { damageSmallMedium?: string | null; damageLarge?: string | null }): string | null {
  if (item.damageSmallMedium && item.damageLarge) {
    return `${item.damageSmallMedium} / ${item.damageLarge}`;
  }
  return item.damageSmallMedium ?? item.damageLarge ?? null;
}

function coinInputsFromOptions(interaction: ChatInputCommandInteraction): Record<string, number> {
  const patch: Record<string, number> = {};
  for (const coin of ["gp", "sp", "cp", "ep", "pp"]) {
    const value = interaction.options.getInteger(coin);
    if (value !== null) {
      patch[coin] = value;
    }
  }
  return patch;
}

function coinInputsFromModal(interaction: ModalSubmitInteraction): Record<string, number> {
  const patch: Record<string, number> = {};
  for (const coin of ["gp", "sp", "cp", "ep", "pp"]) {
    const raw = interaction.fields.getTextInputValue(coin).trim();
    if (raw !== "") {
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${coin.toUpperCase()} must be a non-negative number.`);
      }
      patch[coin] = Math.floor(value);
    }
  }
  return patch;
}

async function showCoinModal(interaction: ChatInputCommandInteraction, character: CharacterResponse, action: "add" | "elim" | "set"): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId(`coin:${action}:${encodeURIComponent(character.character_name)}`)
    .setTitle(action === "add" ? "Add Coins" : action === "elim" ? "Eliminate Coins" : "Set Coins");
  const inputs = ["gp", "sp", "cp", "ep", "pp"].map((coin) =>
    new TextInputBuilder()
      .setCustomId(coin)
      .setLabel(`${coin.toUpperCase()} amount`)
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
  );
  modal.addComponents(...inputs.map((input) => new ActionRowBuilder<TextInputBuilder>().addComponents(input)));
  await interaction.showModal(modal as any);
}

async function applyCoinChange(
  interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
  character: CharacterResponse,
  action: "add" | "elim" | "set",
  values: Record<string, number>
): Promise<CharacterResponse> {
  const current = wealthValues(character);
  const next = { ...current };
  for (const coin of ["pp", "gp", "ep", "sp", "cp"]) {
    if (values[coin] === undefined) {
      continue;
    }
    if (action === "add") {
      next[coin] += values[coin];
    } else if (action === "elim") {
      next[coin] = Math.max(0, next[coin] - values[coin]);
    } else {
      next[coin] = Math.max(0, values[coin]);
    }
  }
  return patchCharacterLedger(character.id, {
    ...actorFrom(interaction),
    audit_action: `ledger.coins.${action}`,
    patch: {
      wealth: next,
      Wealth: next,
      equipment: {
        encumbrance_total: equipmentItemWeight(character) + coinWeight(next),
        coin_weight: coinWeight(next)
      }
    }
  });
}

function coinEmbed(params: {
  title: string;
  character: CharacterResponse;
  beforeCoins: Record<string, number>;
  afterCoins: Record<string, number>;
  beforeWeight: number;
  afterWeight: number;
  beforeMove: string;
  afterMove: string;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(params.title)
    .setDescription(params.character.character_name)
    .addFields(
      { name: "Coins Before", value: coinSummaryLine(params.beforeCoins), inline: false },
      { name: "Coins After", value: coinSummaryLine(params.afterCoins), inline: false },
      { name: "Coin Weight", value: `${coinWeight(params.beforeCoins)} → ${coinWeight(params.afterCoins)} lb`, inline: true },
      { name: "Encumbrance", value: `Carried Weight: ${params.beforeWeight} → ${params.afterWeight} lb\nMovement: ${params.beforeMove} → ${params.afterMove}\n${encumbranceWarning(params.beforeWeight, params.afterWeight, params.beforeMove, params.afterMove)}`, inline: false }
    )
    .setFooter({ text: "Character coins affect character encumbrance. Mule coins do not." });
}

async function handleCoin(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand() as "add" | "elim" | "set" | "status";
  const character = await targetCharacter(interaction);
  if (subcommand === "status") {
    const coins = wealthValues(character);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Coin Status")
          .setDescription(character.character_name)
          .addFields(
            { name: "Coins", value: coinSummaryLine(coins), inline: false },
            { name: "Coin Weight", value: `${coinWeight(coins)} lb`, inline: true },
            { name: "Carried Weight", value: `${carriedWeight(character)} lb`, inline: true },
            { name: "Movement", value: movementValue(character), inline: true }
          )
          .setFooter({ text: "Character coins affect character encumbrance. Mule coins do not." })
      ],
      ephemeral: true
    });
    return;
  }

  const values = coinInputsFromOptions(interaction);
  if (Object.keys(values).length === 0) {
    await showCoinModal(interaction, character, subcommand);
    return;
  }
  const beforeCoins = wealthValues(character);
  const beforeWeight = carriedWeight(character);
  const beforeMove = movementValue(character);
  const updated = await applyCoinChange(interaction, character, subcommand, values);
  await interaction.reply({
    embeds: [
      coinEmbed({
        title: subcommand === "add" ? "Coins Added" : subcommand === "elim" ? "Coins Eliminated" : "Coins Set",
        character: updated,
        beforeCoins,
        afterCoins: wealthValues(updated),
        beforeWeight,
        afterWeight: carriedWeight(updated),
        beforeMove,
        afterMove: movementValue(updated)
      })
    ],
    ephemeral: true
  });
}

function modalQuantity(interaction: ModalSubmitInteraction): number {
  const raw = interaction.fields.getTextInputValue("qty").trim();
  if (!raw) {
    return 1;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) {
    throw new Error("Quantity must be a positive number.");
  }
  return Math.floor(value);
}

async function handleEquipmentModal(interaction: ModalSubmitInteraction, action: "add" | "elim", characterName: string): Promise<void> {
  const character = await lookupCharacter(interaction.user.id, isAdmin(interaction as unknown as ChatInputCommandInteraction), characterName);
  const requested = interaction.fields.getTextInputValue("item").trim();
  const quantity = modalQuantity(interaction);
  const notes = interaction.fields.getTextInputValue("notes").trim();
  const item = findEquipment(requested);
  if (!item) {
    const suggestion = suggestEquipment(requested);
    await interaction.reply({
      content: suggestion
        ? `I could not find "${requested}". Did you mean ${suggestion.name}?`
        : `I could not find "${requested}" in the equipment catalog.`,
      ephemeral: true
    });
    return;
  }

  const beforeWeight = carriedWeight(character);
  const beforeMove = movementValue(character);
  if (action === "add") {
    const catalog = catalogItemToEquipment(item);
    const added = await addEquipment(character.id, {
      ...actorFrom(interaction),
      ...catalog,
      quantity,
      equipped: false,
      location: "carried",
      notes: [notes || null, catalog.notes].filter(Boolean).join(" | ") || null
    });
    const updated = await syncEncumbrance(interaction, added);
    await interaction.reply({
      embeds: [
        equipmentChangeEmbed({
          title: "Equipment Added",
          character: updated,
          itemName: catalog.item_name,
          quantity,
          weightEach: catalog.weight,
          damage: damageDisplay(item),
          value: catalog.value,
          equipped: false,
          beforeWeight,
          afterWeight: carriedWeight(updated),
          beforeMove,
          afterMove: movementValue(updated)
        })
      ],
      ephemeral: true
    });
    return;
  }

  const removed = await removeEquipment(character.id, {
    ...actorFrom(interaction),
    item_name: item.name,
    quantity
  });
  const updated = await syncEncumbrance(interaction, removed);
  await interaction.reply({
    embeds: [
      equipmentChangeEmbed({
        title: "Equipment Eliminated",
        character: updated,
        itemName: item.name,
        quantity,
        weightEach: item.weight,
        damage: damageDisplay(item),
        value: item.cost.amount !== null && item.cost.coin !== null ? `${item.cost.amount} ${item.cost.coin}` : null,
        beforeWeight,
        afterWeight: carriedWeight(updated),
        beforeMove,
        afterMove: movementValue(updated)
      })
    ],
    ephemeral: true
  });
}

async function handleCoinModal(interaction: ModalSubmitInteraction, action: "add" | "elim" | "set", characterName: string): Promise<void> {
  const character = await lookupCharacter(interaction.user.id, isAdmin(interaction as unknown as ChatInputCommandInteraction), characterName);
  const values = coinInputsFromModal(interaction);
  if (Object.keys(values).length === 0) {
    await interaction.reply({ content: "No coin fields supplied.", ephemeral: true });
    return;
  }
  const beforeCoins = wealthValues(character);
  const beforeWeight = carriedWeight(character);
  const beforeMove = movementValue(character);
  const updated = await applyCoinChange(interaction, character, action, values);
  await interaction.reply({
    embeds: [
      coinEmbed({
        title: action === "add" ? "Coins Added" : action === "elim" ? "Coins Eliminated" : "Coins Set",
        character: updated,
        beforeCoins,
        afterCoins: wealthValues(updated),
        beforeWeight,
        afterWeight: carriedWeight(updated),
        beforeMove,
        afterMove: movementValue(updated)
      })
    ],
    ephemeral: true
  });
}

async function handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  const [kind, action, encodedCharacterName] = interaction.customId.split(":");
  const characterName = decodeURIComponent(encodedCharacterName ?? "");
  if (kind === "equipment" && (action === "add" || action === "elim")) {
    await handleEquipmentModal(interaction, action, characterName);
    return;
  }
  if (kind === "coin" && (action === "add" || action === "elim" || action === "set")) {
    await handleCoinModal(interaction, action, characterName);
  }
}

async function replyEquipment(interaction: ChatInputCommandInteraction, character: CharacterResponse, subcommand: string): Promise<boolean> {
  if (subcommand === "add") {
    const requested = optionItem(interaction, false);
    if (!requested) {
      await showEquipmentModal(interaction, character, "add");
      return true;
    }
    const item = findEquipment(requested);
    if (!item) {
      const suggestion = suggestEquipment(requested);
      await interaction.reply({
        content: suggestion
          ? `I could not find "${requested}" in the equipment catalog. Did you mean "${suggestion.name}"?`
          : `I could not find "${requested}" in the equipment catalog. Use /equipment custom for non-catalog items.`,
        ephemeral: true
      });
      return true;
    }
    const catalog = catalogItemToEquipment(item);
    const quantity = interaction.options.getInteger("qty") ?? interaction.options.getInteger("quantity") ?? 1;
    const equipped = interaction.options.getBoolean("equipped") ?? false;
    const beforeWeight = carriedWeight(character);
    const beforeMove = movementValue(character);
    const added = await addEquipment(character.id, {
      ...actor(interaction),
      ...catalog,
      quantity,
      equipped,
      location: interaction.options.getString("location") ?? (equipped ? "equipped" : "carried"),
      notes: [interaction.options.getString("notes"), catalog.notes].filter(Boolean).join(" | ") || null
    });
    const updated = await syncEncumbrance(interaction, added);
    await interaction.reply({
      embeds: [
        equipmentChangeEmbed({
          title: "Equipment Added",
          character: updated,
          itemName: catalog.item_name,
          quantity,
          weightEach: catalog.weight,
          damage: damageDisplay(item),
          value: catalog.value,
          equipped,
          beforeWeight,
          afterWeight: carriedWeight(updated),
          beforeMove,
          afterMove: movementValue(updated)
        })
      ],
      ephemeral: true
    });
    return true;
  }

  if (subcommand === "custom") {
    const quantity = interaction.options.getInteger("qty") ?? 1;
    const equipped = interaction.options.getBoolean("equipped") ?? false;
    const beforeWeight = carriedWeight(character);
    const beforeMove = movementValue(character);
    const added = await addEquipment(character.id, {
      ...actor(interaction),
      item_name: interaction.options.getString("name", true),
      quantity,
      weight: interaction.options.getNumber("weight", true),
      damage: interaction.options.getString("damage"),
      value: interaction.options.getString("value"),
      equipped,
      location: equipped ? "equipped" : "carried",
      notes: interaction.options.getString("notes")
    });
    const updated = await syncEncumbrance(interaction, added);
    await interaction.reply({
      embeds: [
        equipmentChangeEmbed({
          title: "Custom Equipment Added",
          character: updated,
          itemName: interaction.options.getString("name", true),
          quantity,
          weightEach: interaction.options.getNumber("weight", true),
          damage: interaction.options.getString("damage"),
          value: interaction.options.getString("value"),
          equipped,
          beforeWeight,
          afterWeight: carriedWeight(updated),
          beforeMove,
          afterMove: movementValue(updated)
        })
      ],
      ephemeral: true
    });
    return true;
  }

  if (subcommand === "remove" || subcommand === "elim") {
    const requested = optionItem(interaction, false);
    if (!requested) {
      await showEquipmentModal(interaction, character, "elim");
      return true;
    }
    const item = findEquipment(requested);
    const itemName = item?.name ?? requested;
    const quantity = interaction.options.getInteger("qty") ?? interaction.options.getInteger("quantity") ?? 1;
    const beforeWeight = carriedWeight(character);
    const beforeMove = movementValue(character);
    const removed = await removeEquipment(character.id, {
      ...actor(interaction),
      item_name: itemName,
      quantity
    });
    const updated = await syncEncumbrance(interaction, removed);
    await interaction.reply({
      embeds: [
        equipmentChangeEmbed({
          title: "Equipment Eliminated",
          character: updated,
          itemName,
          quantity,
          weightEach: item?.weight ?? null,
          damage: item ? damageDisplay(item) : null,
          value: item && item.cost.amount !== null && item.cost.coin !== null ? `${item.cost.amount} ${item.cost.coin}` : null,
          beforeWeight,
          afterWeight: carriedWeight(updated),
          beforeMove,
          afterMove: movementValue(updated)
        })
      ],
      ephemeral: true
    });
    return true;
  }

  if (subcommand === "equip") {
    const beforeWeight = carriedWeight(character);
    const beforeMove = movementValue(character);
    const equipped = await equipEquipment(character.id, {
      ...actor(interaction),
      item_name: optionItem(interaction)
    });
    const updated = await syncEncumbrance(interaction, equipped);
    await interaction.reply({ content: `Equipped item for ${updated.character_name}.\nCarried Weight: ${beforeWeight} → ${carriedWeight(updated)} lb\nMovement: ${beforeMove} → ${movementValue(updated)}\n${encumbranceWarning(beforeWeight, carriedWeight(updated), beforeMove, movementValue(updated))}`, ephemeral: true });
    return true;
  }

  if (subcommand === "unequip") {
    const beforeWeight = carriedWeight(character);
    const beforeMove = movementValue(character);
    const unequipped = await unequipEquipment(character.id, {
      ...actor(interaction),
      item_name: optionItem(interaction)
    });
    const updated = await syncEncumbrance(interaction, unequipped);
    await interaction.reply({ content: `Unequipped item for ${updated.character_name}.\nCarried Weight: ${beforeWeight} → ${carriedWeight(updated)} lb\nMovement: ${beforeMove} → ${movementValue(updated)}\n${encumbranceWarning(beforeWeight, carriedWeight(updated), beforeMove, movementValue(updated))}`, ephemeral: true });
    return true;
  }

  if (subcommand === "list") {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${character.character_name} Equipment`)
          .setDescription(equipmentLines(character))
      ],
      ephemeral: true
    });
    return true;
  }

  return false;
}

async function replyLedgerMutation(interaction: ChatInputCommandInteraction, character: CharacterResponse, subcommand: string): Promise<boolean> {
  const mode = interaction.options.getString("mode") ?? "set";

  if (subcommand === "show") {
    await interaction.reply({ embeds: [buildLedgerEmbed(character)], ephemeral: true });
    return true;
  }

  if (subcommand === "hp") {
    const combat = section(character.ledger, "combat");
    const value = interaction.options.getInteger("value", true);
    const patch: Record<string, number> = { hp_current: applyMode(combat.hp_current, value, mode) };
    const maxHp = interaction.options.getInteger("max_hp");
    if (maxHp !== null) {
      patch.hp_max = maxHp;
    }
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.hp",
      patch: { combat: patch }
    });
    await interaction.reply({ content: `Updated HP for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "ac") {
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.ac",
      patch: { combat: { armor_class: interaction.options.getInteger("value", true) } }
    });
    await interaction.reply({ content: `Updated AC for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "xp") {
    const basics = section(character.ledger, "basics");
    const value = interaction.options.getInteger("value", true);
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.xp",
      patch: { basics: { xp_current: applyMode(basics.xp_current, value, mode) } }
    });
    await interaction.reply({ content: `Updated XP for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "coins") {
    const wealth = section(character.ledger, "wealth");
    const coin = interaction.options.getString("coin", true);
    const value = interaction.options.getInteger("value", true);
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.coins",
      patch: { wealth: { [coin]: applyMode(wealth[coin], value, mode) } }
    });
    await interaction.reply({ content: `Updated coins for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "abilities") {
    const abilities = numberPatch(interaction, ["str", "int", "wis", "dex", "con", "cha"]);
    if (Object.keys(abilities).length === 0) {
      await interaction.reply({ content: "No ability scores supplied.", ephemeral: true });
      return true;
    }
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.abilities",
      patch: { abilities }
    });
    await interaction.reply({ content: `Updated abilities for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "status") {
    const status = interaction.options.getString("value", true);
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.status",
      patch: { identity: { status }, Identity: { status } }
    });
    await interaction.reply({ content: `Updated ${character.character_name} status to ${status}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "resources") {
    const resources = { ...section(character.ledger, "Resources"), ...section(character.ledger, "resources") };
    const resource = interaction.options.getString("resource", true);
    const value = interaction.options.getInteger("value", true);
    const next = applyMode(resources[resource], value, mode);
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.resources",
      patch: { resources: { [resource]: next }, Resources: { [resource]: next } }
    });
    await interaction.reply({ content: `Updated resources for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "saves") {
    const savingThrows = numberPatch(interaction, ["death", "wands", "paralysis_petrify", "breath", "spells"]);
    if (Object.keys(savingThrows).length === 0) {
      await interaction.reply({ content: "No saving throws supplied.", ephemeral: true });
      return true;
    }
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.saves",
      patch: { combat: { saving_throws: savingThrows } }
    });
    await interaction.reply({ content: `Updated saves for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "movement") {
    const movement = interaction.options.getString("movement", true);
    const encumbranceCategory = interaction.options.getString("encumbrance_category");
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.movement",
      patch: {
        combat: { movement },
        equipment: encumbranceCategory ? { encumbrance_category: encumbranceCategory } : {}
      }
    });
    await interaction.reply({ content: `Updated movement for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  return false;
}

function equipmentLines(character: CharacterResponse): string {
  const equipment = section(character.ledger, "equipment");
  const formatBucket = (label: string, key: string) => {
    const items = Array.isArray(equipment[key]) ? (equipment[key] as Record<string, unknown>[]) : [];
    if (items.length === 0) {
      return `${label}: None`;
    }
    const rendered = items
      .map((item) => {
        const quantity = item.quantity ?? 1;
        const notes = item.notes ? ` (${item.notes})` : "";
        return `${quantity}x ${item.item_name}${notes}`;
      })
      .join(", ");
    return `${label}: ${rendered}`;
  };
  return [
    formatBucket("Carried", "inventory"),
    formatBucket("Equipped", "equipped"),
    formatBucket("Stored", "stored"),
    `Encumbrance total: ${equipment.encumbrance_total ?? 0}`
  ].join("\n");
}

function elapsed(turn: number): string {
  const minutes = turn * 10;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}h ${remainder}m` : `${minutes}m`;
}

function marchingOrderLines(order?: MarchingOrderResponse | null): string {
  const positions = order?.positions ?? {};
  const value = (key: string) => positions[key] || "-";
  return [
    `[1] ${value("pos1")}    [2] ${value("pos2")}`,
    `[3] ${value("pos3")}    [4] ${value("pos4")}`,
    `[5] ${value("pos5")}    [6] ${value("pos6")}`,
    `[7] ${value("pos7")}    [8] ${value("pos8")}`,
    order?.notes ? `Notes: ${order.notes}` : ""
  ].filter(Boolean).join("\n");
}

function lightLines(tracker: TrackerResponse): string {
  if (tracker.active_lights.length === 0) {
    return "No active lights.";
  }
  return tracker.active_lights
    .map((light) => `${light.holder || "Unassigned"} ${light.type}: ${light.remaining_turns} turns`)
    .join("\n");
}

function storeWeight(store: GroupStoreResponse): number {
  return store.items.reduce((total, item) => {
    const quantity = Number(item.quantity ?? 1);
    const weight = Number(item.weight ?? 0);
    return total + quantity * weight;
  }, 0);
}

function coinLine(coins: Record<string, number>): string {
  return ["pp", "gp", "ep", "sp", "cp"].map((coin) => `${coin.toUpperCase()} ${coins[coin] ?? 0}`).join(" | ");
}

function muleLines(store: GroupStoreResponse): string {
  if (store.items.length === 0) {
    return "No group items stored.";
  }
  return store.items
    .slice(0, 15)
    .map((item) => {
      const notes = item.notes ? ` (${item.notes})` : "";
      return `${item.quantity ?? 1}x ${item.item_name}${notes}`;
    })
    .join("\n");
}

function muleEmbed(store: GroupStoreResponse): EmbedBuilder {
  const reminders = store.reminders.length > 0 ? store.reminders.join("\n") : "None";
  return new EmbedBuilder()
    .setTitle("Group Storage")
    .setDescription(store.channel_name_snapshot ? `Channel: #${store.channel_name_snapshot}` : "Channel group store")
    .addFields(
      { name: "Items", value: muleLines(store), inline: false },
      { name: "Weight", value: `${storeWeight(store)} lb carried by group storage`, inline: true },
      { name: "Coins", value: coinLine(store.coins), inline: false },
      { name: "XP Bank", value: `${store.xp_bank} XP`, inline: true },
      { name: "Notes", value: store.notes ?? "None", inline: true },
      { name: "Register", value: reminders, inline: false }
    )
    .setFooter({ text: "Channel-scoped group storage. Referee rulings override quick records." });
}

function orderRoster(order?: MarchingOrderResponse | null): string[] {
  return Array.from(new Set(Object.values(order?.positions ?? {}).filter((value): value is string => typeof value === "string" && value.trim().length > 0)));
}

function rationInventoryLine(store: GroupStoreResponse): string {
  const rations = store.items.filter((item) => String(item.item_name ?? "").toLowerCase().includes("ration"));
  if (rations.length === 0) {
    return "No mule/group rations found. Check character inventories.";
  }
  return rations.map((item) => `${item.quantity ?? 1}x ${item.item_name}`).join(", ");
}

function campEmbed(params: {
  trackerBefore?: TrackerResponse | null;
  trackerAfter?: TrackerResponse | null;
  order?: MarchingOrderResponse | null;
  store: GroupStoreResponse;
  watches?: string | null;
  location?: string | null;
  notes?: string | null;
  consumeRations: boolean;
  advanceDay: boolean;
  dayAdvanceNote: string;
}): EmbedBuilder {
  const roster = orderRoster(params.order);
  const beforeDay = params.trackerBefore?.day;
  const afterDay = params.trackerAfter?.day;
  const dayLine = beforeDay && afterDay && afterDay !== beforeDay
    ? `Day ${beforeDay} ends / Day ${afterDay} begins`
    : beforeDay
      ? `Day ${beforeDay} camp. Day not advanced.`
      : "No active tracker day found.";
  const rationLine = params.consumeRations
    ? `Check/consume rations for ${roster.length || "the"} character(s). ${rationInventoryLine(params.store)}\nRations were not automatically consumed.`
    : `Check rations for ${roster.length || "the"} character(s). No automatic consumption.`;

  return new EmbedBuilder()
    .setTitle("Camp Set")
    .setDescription(dayLine)
    .addFields(
      { name: "Location", value: params.location || "Not specified", inline: true },
      { name: "Watches", value: params.watches || "Set watch order at the table.", inline: false },
      { name: "Roster", value: roster.length > 0 ? roster.join(", ") : "No `/order` roster found.", inline: false },
      { name: "Rations", value: rationLine, inline: false },
      { name: "Light / Fire", value: "Confirm lanterns, torches, campfire, smoke, and visibility.", inline: false },
      { name: "Night Encounter", value: "DM check if desired.", inline: true },
      { name: "Recovery", value: "After camp is complete, each player may use `/rest` for +1 HP daily natural recovery.", inline: false },
      { name: "Casters", value: "Prepare spells after quiet rest: minimum 4 hours quiet rest, then 15 minutes per spell level memorized.", inline: false },
      { name: "XP / Mule", value: `XP Bank: ${params.store.xp_bank} XP\nMule Weight: ${storeWeight(params.store)} lb\nCoins: ${coinLine(params.store.coins)}`, inline: false },
      { name: "Day Advance", value: params.dayAdvanceNote, inline: false },
      { name: "Notes", value: params.notes || "None", inline: false }
    )
    .setFooter({ text: "Camp is procedure only. Referee rulings override reminders." });
}

function trackerEmbed(tracker: TrackerResponse, order?: MarchingOrderResponse | null, title = "Expedition Tracker", store?: GroupStoreResponse | null): EmbedBuilder {
  const warnings = tracker.reminders.length > 0 ? tracker.reminders.join("\n") : "None";
  return new EmbedBuilder()
    .setTitle(title)
    .addFields(
      { name: "Time", value: `Day ${tracker.day}\nTurn ${tracker.turn}\nElapsed ${elapsed(tracker.turn)}`, inline: true },
      { name: "Movement", value: `${tracker.move_rate} ft per turn`, inline: true },
      { name: "Light", value: lightLines(tracker), inline: false },
      { name: "Rest", value: tracker.combat_rest_required ? "Combat rest required" : tracker.turn % 6 === 0 && tracker.turn > 0 ? "1-in-6 rest due" : "OK", inline: true },
      { name: "Wandering Monsters", value: tracker.turn > 0 && tracker.turn % 3 === 0 ? "Check due" : `Next check in ${3 - (tracker.turn % 3)} turn(s)`, inline: true },
      { name: "Supplies", value: `Oil: ${tracker.oil_pints} pint(s)\nRations: ${tracker.rations}`, inline: true },
      { name: "XP Bank", value: store ? `${store.xp_bank} XP` : "Not loaded", inline: true },
      { name: "Marching Order", value: marchingOrderLines(order), inline: false },
      { name: "Warnings", value: warnings, inline: false }
    )
    .setFooter({ text: "Referee rulings override tracker reminders." });
}

function orderEmbed(order: MarchingOrderResponse): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("Marching Order")
    .setDescription(marchingOrderLines(order))
    .setFooter({ text: "Front is positions 1-2. Rear is positions 7-8. Referee rulings override formation." });
}

async function currentOrder(interaction: ChatInputCommandInteraction): Promise<MarchingOrderResponse | null> {
  try {
    return await marchingOrder({ ...scope(interaction), positions: {} });
  } catch {
    return null;
  }
}

async function handleTracker(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();
  const base = scope(interaction);
  let tracker: TrackerResponse;
  if (subcommand === "xp") {
    const action = interaction.options.getString("action", true);
    const store = await groupStore({
      ...base,
      channel_name_snapshot: channelName(interaction),
      action: action === "status" ? "status" : `xp_${action}`,
      amount: interaction.options.getInteger("amount")
    });
    await interaction.reply({ embeds: [muleEmbed(store)], ephemeral: true });
    return;
  }

  if (subcommand === "start") {
    tracker = await startTracker({
      ...base,
      move_rate: interaction.options.getInteger("move_rate") ?? 120,
      rations: interaction.options.getInteger("rations") ?? 0,
      oil_pints: interaction.options.getInteger("oil_pints") ?? 0,
      notes: interaction.options.getString("notes")
    });
  } else if (subcommand === "status") {
    tracker = await trackerStatus(base);
  } else if (subcommand === "next" || subcommand === "rest" || subcommand === "stop") {
    tracker = await updateTracker({ ...base, action: subcommand });
  } else if (subcommand === "combat") {
    tracker = await updateTracker({ ...base, action: "combat", advance_turn: interaction.options.getBoolean("advance_turn") ?? false });
  } else if (subcommand === "move") {
    tracker = await updateTracker({ ...base, action: "move", move_rate: interaction.options.getInteger("rate", true) });
  } else if (subcommand === "torch") {
    const action = interaction.options.getString("action", true);
    tracker = await updateTracker({ ...base, action: `torch_${action}`, holder: interaction.options.getString("holder") });
  } else if (subcommand === "lantern") {
    const action = interaction.options.getString("action", true);
    tracker = await updateTracker({ ...base, action: `lantern_${action}`, holder: interaction.options.getString("holder") });
  } else if (subcommand === "oil") {
    tracker = await updateTracker({ ...base, action: `oil_${interaction.options.getString("action", true)}`, amount: interaction.options.getInteger("amount", true) });
  } else if (subcommand === "ration") {
    tracker = await updateTracker({ ...base, action: `ration_${interaction.options.getString("action", true)}`, amount: interaction.options.getInteger("amount", true) });
  } else if (subcommand === "day") {
    const action = interaction.options.getString("action", true);
    tracker = await updateTracker({
      ...base,
      action: `day_${action}`,
      amount: action === "set" ? interaction.options.getInteger("number", true) : interaction.options.getInteger("number")
    });
  } else {
    await interaction.reply({ content: "Unknown tracker command.", ephemeral: true });
    return;
  }
  const store = await groupStore({ ...base, channel_name_snapshot: channelName(interaction), action: "status" });
  await interaction.reply({ embeds: [trackerEmbed(tracker, await currentOrder(interaction), subcommand === "stop" ? "Expedition Final Summary" : "Expedition Tracker", store)], ephemeral: true });
}

async function handleOrder(interaction: ChatInputCommandInteraction): Promise<void> {
  const positions: Record<string, string | null> = {};
  for (let i = 1; i <= 8; i += 1) {
    const value = interaction.options.getString(`pos${i}`);
    if (value !== null) {
      positions[`pos${i}`] = value;
    }
  }
  const notes = interaction.options.getString("notes");
  const order = await marchingOrder({ ...scope(interaction), positions, notes });
  await interaction.reply({ embeds: [orderEmbed(order)], ephemeral: true });
}

async function handleMule(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();
  const base = { ...scope(interaction), channel_name_snapshot: channelName(interaction) };

  if (subcommand === "status") {
    const store = await groupStore({ ...base, action: "status" });
    await interaction.reply({ embeds: [muleEmbed(store)], ephemeral: true });
    return;
  }

  if (subcommand === "coins") {
    const action = interaction.options.getString("action", true);
    const store = await groupStore({
      ...base,
      action: `coin_${action === "subtract" ? "elim" : action}`,
      coin: interaction.options.getString("coin", true),
      amount: interaction.options.getInteger("amount", true)
    });
    await interaction.reply({ embeds: [muleEmbed(store)], ephemeral: true });
    return;
  }

  const requested = interaction.options.getString("item", true);
  const item = findEquipment(requested);
  if (!item) {
    const suggestion = suggestEquipment(requested);
    await interaction.reply({
      content: suggestion
        ? `I could not find "${requested}" in the equipment catalog. Did you mean "${suggestion.name}"?`
        : `I could not find "${requested}" in the equipment catalog.`,
      ephemeral: true
    });
    return;
  }
  const catalog = catalogItemToEquipment(item);
  const store = await groupStore({
    ...base,
    action: subcommand,
    item: {
      ...catalog,
      quantity: interaction.options.getInteger("qty") ?? 1,
      notes: [interaction.options.getString("notes"), catalog.notes].filter(Boolean).join(" | ") || null
    }
  });
  await interaction.reply({ embeds: [muleEmbed(store)], ephemeral: true });
}

async function handleRest(interaction: ChatInputCommandInteraction): Promise<void> {
  if (interaction.options.getBoolean("all") ?? false) {
    if (!isAdmin(interaction)) {
      await interaction.reply({ content: "`/rest all` is limited to the Referee/admin.", ephemeral: true });
      return;
    }
    const order = await currentOrder(interaction);
    const names = Array.from(new Set(Object.values(order?.positions ?? {}).filter((value): value is string => typeof value === "string" && value.trim().length > 0)));
    if (names.length === 0) {
      await interaction.reply({
        content: "No channel group roster found. Set `/order` first, or rest one character with `/rest character:<name>`.",
        ephemeral: true
      });
      return;
    }

    const lines: string[] = [];
    for (const name of names) {
      try {
        const character = await lookupCharacter(interaction.user.id, true, name);
        if (!character.is_active) {
          lines.push(`${character.character_name}: skipped; character is not Active.`);
          continue;
        }
        lines.push(await restCharacter(interaction, character));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown lookup error.";
        lines.push(`${name}: skipped; ${message}`);
      }
    }
    await interaction.reply({ content: lines.join("\n\n"), ephemeral: true });
    return;
  }

  const character = await targetCharacter(interaction);
  await interaction.reply({ content: await restCharacter(interaction, character), ephemeral: true });
}

async function handleCamp(interaction: ChatInputCommandInteraction): Promise<void> {
  const base = scope(interaction);
  const advanceDay = interaction.options.getBoolean("advance_day") ?? true;
  const consumeRations = interaction.options.getBoolean("consume_rations") ?? false;
  const order = await currentOrder(interaction);
  const store = await groupStore({ ...base, channel_name_snapshot: channelName(interaction), action: "status" });

  let trackerBefore: TrackerResponse | null = null;
  let trackerAfter: TrackerResponse | null = null;
  let dayAdvanceNote = "Day was not advanced.";
  try {
    trackerBefore = await trackerStatus(base);
    if (advanceDay) {
      if (isAdmin(interaction)) {
        trackerAfter = await updateTracker({ ...base, action: "day_next" });
        dayAdvanceNote = `Day advanced. Turn counter reset to ${trackerAfter.turn}.`;
      } else {
        trackerAfter = trackerBefore;
        dayAdvanceNote = "Day not advanced; Referee/admin permission is required.";
      }
    } else {
      trackerAfter = trackerBefore;
      dayAdvanceNote = "Day advance skipped by command option.";
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "No tracker available.";
    dayAdvanceNote = advanceDay ? `Day not advanced: ${message}` : "Day advance skipped. No active tracker required for camp display.";
  }

  await interaction.reply({
    embeds: [
      campEmbed({
        trackerBefore,
        trackerAfter,
        order,
        store,
        watches: interaction.options.getString("watches"),
        location: interaction.options.getString("location"),
        notes: interaction.options.getString("notes"),
        consumeRations,
        advanceDay,
        dayAdvanceNote
      })
    ],
    ephemeral: true
  });
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`RUSSO online as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    if (interaction.commandName === "ping") {
      await interaction.reply({ content: "RUSSO online", ephemeral: true });
      return;
    }

    if (interaction.commandName === "guide") {
      await interaction.reply({ embeds: [buildHelpEmbed()], ephemeral: true });
      return;
    }

    if (interaction.commandName === "help") {
      await interaction.reply({
        content: "`/help` is deprecated. Use `/guide` for the RUSSO player command guide.",
        embeds: [buildHelpEmbed()],
        ephemeral: true
      });
      return;
    }

    if (interaction.commandName === "rest") {
      await handleRest(interaction);
      return;
    }

    if (interaction.commandName === "camp") {
      await handleCamp(interaction);
      return;
    }

    if (interaction.commandName === "ref") {
      if (!isAdmin(interaction)) {
        await interaction.reply({ content: "RUSSO referee references are limited to the Referee/admin.", ephemeral: true });
        return;
      }

      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "screen") {
        await interaction.reply({ embeds: buildRefereeScreenEmbeds(config.rulesetId), ephemeral: true });
      }
      return;
    }

    if (interaction.commandName === "tracker") {
      await handleTracker(interaction);
      return;
    }

    if (interaction.commandName === "mule") {
      await handleMule(interaction);
      return;
    }

    if (interaction.commandName === "order") {
      await handleOrder(interaction);
      return;
    }

    if (interaction.commandName === "show") {
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "card") {
        const character = await targetCharacter(interaction);
        await interaction.reply({ embeds: [buildCharacterCardEmbed(character)], ephemeral: true });
      }
      return;
    }

    if (interaction.commandName === "ledger") {
      const subcommand = interaction.options.getSubcommand(false) ?? "show";
      const character = await targetCharacter(interaction);
      await replyLedgerMutation(interaction, character, subcommand);
      return;
    }

    if (interaction.commandName === "equipment") {
      const character = await targetCharacter(interaction);
      await replyEquipment(interaction, character, interaction.options.getSubcommand());
      return;
    }

    if (interaction.commandName === "coin") {
      await handleCoin(interaction);
      return;
    }

    if (interaction.commandName !== "character") {
      return;
    }

    const group = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "create") {
      const character = await createCharacter({
        character_name: interaction.options.getString("character_name", true),
        player_name: interaction.options.getString("player_name") ?? discordDisplayName(interaction),
        race: interaction.options.getString("race", true),
        class_name: interaction.options.getString("class_name", true),
        level: interaction.options.getInteger("level", true),
        alignment: interaction.options.getString("alignment"),
        hp_max: interaction.options.getInteger("hp_max"),
        hp_current: interaction.options.getInteger("hp_current"),
        armor_class: interaction.options.getInteger("armor_class"),
        movement: interaction.options.getString("movement"),
        thac0: interaction.options.getInteger("thac0"),
        xp: interaction.options.getInteger("xp") ?? 0,
        coins: parseCoins(interaction.options.getString("coins")),
        languages: parseLanguages(interaction.options.getString("languages")),
        saves: parseSaves(interaction.options.getString("saves")),
        notes: interaction.options.getString("notes"),
        strength: interaction.options.getInteger("strength"),
        intelligence: interaction.options.getInteger("intelligence"),
        wisdom: interaction.options.getInteger("wisdom"),
        dexterity: interaction.options.getInteger("dexterity"),
        constitution: interaction.options.getInteger("constitution"),
        charisma: interaction.options.getInteger("charisma"),
        discord_username: interaction.user.username,
        discord_user_id: interaction.user.id
      });

      await interaction.reply({
        content: `Created RUSSO ledger for ${character.character_name} as ${character.status}.`,
        ephemeral: true
      });
      return;
    }

    if (subcommand === "list") {
      const characters = await listCharacters(interaction.user.id);
      const lines = characters.map((character) => {
        const basics = section(character.ledger, "basics");
        const active = character.is_active ? "Active" : "Inactive";
        return `${character.character_name} - ${basics.race ?? "Race?"} ${basics.class_name ?? "Class?"} ${basics.level ?? "?"} - ${character.status} / ${active}`;
      });
      await interaction.reply({
        content: lines.length > 0 ? lines.join("\n") : "No RUSSO characters found.",
        ephemeral: true
      });
      return;
    }

    if (subcommand === "active") {
      const character = await lookupCharacter(interaction.user.id, isAdmin(interaction), interaction.options.getString("character", true));
      const updated = await activateCharacter(character.id, actor(interaction));
      await interaction.reply({ content: `${updated.character_name} is now Active.`, ephemeral: true });
      return;
    }

    if (subcommand === "sheet") {
      const character = await targetCharacter(interaction);
      await interaction.reply({ embeds: [buildCharacterSheetEmbed(character)], ephemeral: true });
      return;
    }

    if (group === "equipment") {
      const character = await targetCharacter(interaction);
      if (await replyEquipment(interaction, character, subcommand)) {
        return;
      }
    }

    const character = await targetCharacter(interaction);

    if (subcommand === "hp") {
      const combat: Record<string, number> = { hp_current: interaction.options.getInteger("current_hp", true) };
      const maxHp = interaction.options.getInteger("max_hp");
      if (maxHp !== null) {
        combat.hp_max = maxHp;
      }
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.hp",
        patch: { combat }
      });
      await interaction.reply({ content: `Updated HP for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "ac") {
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.ac",
        patch: { combat: { armor_class: interaction.options.getInteger("armor_class", true) } }
      });
      await interaction.reply({ content: `Updated AC for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "xp") {
      const basics: Record<string, number> = { xp_current: interaction.options.getInteger("current_xp", true) };
      const xpNeeded = interaction.options.getInteger("xp_needed");
      if (xpNeeded !== null) {
        basics.xp_needed = xpNeeded;
      }
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.xp",
        patch: { basics }
      });
      await interaction.reply({ content: `Updated XP for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "coins") {
      const wealth = section(character.ledger, "wealth");
      const patch = numberPatch(interaction, ["pp", "gp", "ep", "sp", "cp"], interaction.options.getString("mode") ?? "set", wealth);
      if (Object.keys(patch).length === 0) {
        await interaction.reply({ content: "No coin fields supplied.", ephemeral: true });
        return;
      }
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.coins",
        patch: { wealth: patch }
      });
      await interaction.reply({ content: `Updated coins for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "abilities") {
      const abilities = numberPatch(interaction, ["str", "exceptional_str", "int", "wis", "dex", "con", "cha"]);
      if (Object.keys(abilities).length === 0) {
        await interaction.reply({ content: "No ability scores supplied.", ephemeral: true });
        return;
      }
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.abilities",
        patch: { abilities }
      });
      await interaction.reply({ content: `Updated abilities for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "status") {
      const status = interaction.options.getString("status", true);
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.status",
        patch: { identity: { status }, Identity: { status } }
      });
      await interaction.reply({ content: `Updated ${character.character_name} status to ${status}.`, ephemeral: true });
      return;
    }

    if (subcommand === "resources") {
      const resources = { ...section(character.ledger, "Resources"), ...section(character.ledger, "resources") };
      const patch = numberPatch(
        interaction,
        ["torches", "lantern_oil", "rations", "water", "arrows", "bolts", "sling_stones"],
        interaction.options.getString("mode") ?? "set",
        resources
      );
      if (Object.keys(patch).length === 0) {
        await interaction.reply({ content: "No resource fields supplied.", ephemeral: true });
        return;
      }
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.resources",
        patch: { resources: patch, Resources: patch }
      });
      await interaction.reply({ content: `Updated resources for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "saves") {
      const savingThrows = numberPatch(interaction, ["death", "wands", "paralysis_petrify", "breath", "spells"]);
      if (Object.keys(savingThrows).length === 0) {
        await interaction.reply({ content: "No saving throws supplied.", ephemeral: true });
        return;
      }
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.saves",
        patch: { combat: { saving_throws: savingThrows } }
      });
      await interaction.reply({ content: `Updated saves for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "movement") {
      const movement = interaction.options.getString("movement", true);
      const encumbranceCategory = interaction.options.getString("encumbrance_category");
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.movement",
        patch: {
          combat: { movement },
          equipment: encumbranceCategory ? { encumbrance_category: encumbranceCategory } : {}
        }
      });
      await interaction.reply({ content: `Updated movement for ${character.character_name}.`, ephemeral: true });
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RUSSO error.";
    const reply = { content: `RUSSO error: ${message}`, ephemeral: true };
    if (interaction.isRepliable()) {
      if ("replied" in interaction && "deferred" in interaction && (interaction.replied || interaction.deferred)) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }
});

await client.login(config.discordToken);
