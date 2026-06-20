import { EmbedBuilder } from "discord.js";

import type { CharacterResponse } from "./api.js";

function section(ledger: Record<string, unknown>, name: string): Record<string, unknown> {
  const value = ledger[name];
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function firstValue(...values: unknown[]): unknown {
  return values.find((value) => value !== null && value !== undefined && value !== "");
}

function valueOrEmpty(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "None";
  }
  return String(value);
}

function coinSummary(wealth: Record<string, unknown>): string {
  const coins = ["pp", "gp", "ep", "sp", "cp"]
    .map((coin) => `${valueOrEmpty(wealth[coin] ?? 0)} ${coin}`)
    .join(", ");
  return coins;
}

function encumbranceSummary(equipment: Record<string, unknown>, legacyEquipment: Record<string, unknown>): string {
  const category = firstValue(equipment.encumbrance_category, legacyEquipment.encumbrance);
  const total = equipment.encumbrance_total;
  if (category && total !== null && total !== undefined) {
    return `${category} (${total})`;
  }
  return valueOrEmpty(category ?? total);
}

function hpSummary(combat: Record<string, unknown>, legacyCombat: Record<string, unknown>): string {
  const current = firstValue(combat.hp_current, legacyCombat.hp);
  const max = firstValue(combat.hp_max, legacyCombat.max_hp);
  if (current === null || current === undefined || current === "") {
    return "Not set";
  }
  return max === null || max === undefined || max === "" ? String(current) : `${current}/${max}`;
}

function xpSummary(basics: Record<string, unknown>, legacyBasics: Record<string, unknown>): string {
  const current = firstValue(basics.xp_current, legacyBasics.xp);
  const needed = basics.xp_needed;
  if (current === null || current === undefined || current === "") {
    return "Not set";
  }
  return needed === null || needed === undefined || needed === "" ? String(current) : `${current} / ${needed}`;
}

function abilitiesSummary(abilities: Record<string, unknown>, legacyAbilities: Record<string, unknown>): string {
  const scores = [
    ["STR", firstValue(abilities.str, legacyAbilities.strength)],
    ["EX", abilities.exceptional_str],
    ["INT", firstValue(abilities.int, legacyAbilities.intelligence)],
    ["WIS", firstValue(abilities.wis, legacyAbilities.wisdom)],
    ["DEX", firstValue(abilities.dex, legacyAbilities.dexterity)],
    ["CON", firstValue(abilities.con, legacyAbilities.constitution)],
    ["CHA", firstValue(abilities.cha, legacyAbilities.charisma)]
  ];
  return scores.map(([label, score]) => `${label} ${valueOrEmpty(score)}`).join(" | ");
}

export function buildLedgerEmbed(character: CharacterResponse): EmbedBuilder {
  const identity = section(character.ledger, "identity");
  const legacyIdentity = section(character.ledger, "Identity");
  const basics = section(character.ledger, "basics");
  const legacyBasics = section(character.ledger, "Character Basics");
  const abilities = section(character.ledger, "abilities");
  const legacyAbilities = section(character.ledger, "Ability Scores");
  const combat = section(character.ledger, "combat");
  const legacyCombat = section(character.ledger, "Combat");
  const equipment = section(character.ledger, "equipment");
  const legacyEquipment = section(character.ledger, "Equipment");
  const wealth = section(character.ledger, "wealth");
  const legacyWealth = section(character.ledger, "Wealth");
  const conditions = character.ledger["Conditions"];

  return new EmbedBuilder()
    .setTitle("RUSSO Character Ledger")
    .addFields(
      { name: "Character Name", value: valueOrEmpty(character.character_name), inline: true },
      { name: "Status / Active", value: `${valueOrEmpty(firstValue(character.status, identity.status, legacyIdentity.status))} / ${character.is_active ? "Active" : "Inactive"}`, inline: true },
      { name: "Player", value: valueOrEmpty(character.player_name), inline: true },
      { name: "Discord Handle", value: valueOrEmpty(firstValue(identity.discord_username, character.discord_username)), inline: true },
      { name: "Race", value: valueOrEmpty(firstValue(basics.race, legacyBasics.race)), inline: true },
      { name: "Class", value: valueOrEmpty(firstValue(basics.class_name, legacyBasics.class_name)), inline: true },
      { name: "Level", value: valueOrEmpty(firstValue(basics.level, legacyBasics.level)), inline: true },
      { name: "Alignment", value: valueOrEmpty(firstValue(basics.alignment, legacyBasics.alignment)), inline: true },
      { name: "HP", value: hpSummary(combat, legacyCombat), inline: true },
      { name: "AC", value: valueOrEmpty(firstValue(combat.armor_class, legacyCombat.ac)), inline: true },
      { name: "XP", value: xpSummary(basics, legacyBasics), inline: true },
      { name: "Abilities", value: abilitiesSummary(abilities, legacyAbilities), inline: false },
      { name: "Coins", value: coinSummary({ ...legacyWealth, ...wealth }), inline: false },
      { name: "Movement", value: valueOrEmpty(firstValue(combat.movement, legacyCombat.movement)), inline: true },
      { name: "Encumbrance", value: encumbranceSummary(equipment, legacyEquipment), inline: true },
      { name: "Conditions", value: valueOrEmpty(conditions), inline: false }
    )
    .setFooter({ text: "RUSSO™ | Official Character Ledger" });
}
