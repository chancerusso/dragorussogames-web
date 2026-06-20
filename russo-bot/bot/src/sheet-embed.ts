import { EmbedBuilder } from "discord.js";

import type { CharacterResponse } from "./api.js";
import { abilityLabels, formatModifier } from "./ability-format.js";

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

function abilitySummary(ledger: Record<string, unknown>): string {
  const abilities = section(ledger, "abilities");
  const legacyAbilities = section(ledger, "Ability Scores");
  const modifiers = section(abilities, "modifiers");
  const legacyModifiers = section(legacyAbilities, "modifiers");
  return abilityLabels
    .map(([key, label, legacyKey]) => {
      const score = firstValue(abilities[key], legacyAbilities[legacyKey]);
      const modifier = firstValue(modifiers[key], legacyModifiers[legacyKey]);
      return `${label} ${valueOrEmpty(score)} (${formatModifier(modifier)})`;
    })
    .join("\n");
}

function hpSummary(combat: Record<string, unknown>, legacyCombat: Record<string, unknown>): string {
  const current = firstValue(combat.hp_current, legacyCombat.hp);
  const max = firstValue(combat.hp_max, legacyCombat.max_hp);
  if (current === null || current === undefined || current === "") {
    return "Not set";
  }
  return max === null || max === undefined || max === "" ? String(current) : `${current}/${max}`;
}

function savingThrowSummary(combat: Record<string, unknown>, legacyCombat: Record<string, unknown>): string {
  const saves = { ...section(legacyCombat, "saving_throws"), ...section(combat, "saving_throws") };
  const labels = [
    ["death", "Death/Poison"],
    ["wands", "Wands"],
    ["paralysis_petrify", "Paralysis/Petrify"],
    ["breath", "Breath"],
    ["spells", "Spells"]
  ] as const;
  const rendered = labels
    .filter(([key]) => saves[key] !== null && saves[key] !== undefined && saves[key] !== "")
    .map(([key, label]) => `${label}: ${saves[key]}`);
  return rendered.length > 0 ? rendered.join("\n") : "Not set";
}

function coinSummary(wealth: Record<string, unknown>, legacyWealth: Record<string, unknown>): string {
  const coins = { ...legacyWealth, ...wealth };
  return ["pp", "gp", "ep", "sp", "cp"].map((coin) => `${coins[coin] ?? 0} ${coin}`).join(", ");
}

function equipmentSummary(equipment: Record<string, unknown>): string {
  const renderBucket = (label: string, key: string) => {
    const items = Array.isArray(equipment[key]) ? (equipment[key] as Record<string, unknown>[]) : [];
    if (items.length === 0) {
      return `${label}: None`;
    }
    return `${label}: ${items
      .slice(0, 8)
      .map((item) => {
        const quantity = item.quantity ?? 1;
        const damage = item.damage ? `, ${item.damage}` : "";
        const notes = item.notes ? ` (${item.notes})` : "";
        return `${quantity}x ${item.item_name}${damage}${notes}`;
      })
      .join("; ")}`;
  };
  return [renderBucket("Equipped", "equipped"), renderBucket("Carried", "inventory"), renderBucket("Stored", "stored")].join("\n");
}

export function buildCharacterSheetEmbed(character: CharacterResponse): EmbedBuilder {
  const identity = section(character.ledger, "identity");
  const basics = section(character.ledger, "basics");
  const legacyBasics = section(character.ledger, "Character Basics");
  const combat = section(character.ledger, "combat");
  const legacyCombat = section(character.ledger, "Combat");
  const equipment = section(character.ledger, "equipment");
  const legacyEquipment = section(character.ledger, "Equipment");
  const wealth = section(character.ledger, "wealth");
  const legacyWealth = section(character.ledger, "Wealth");
  const notes = firstValue(basics.notes, character.ledger.Notes);

  return new EmbedBuilder()
    .setTitle("RUSSO™ Character Sheet")
    .setDescription(`${character.character_name} | ${valueOrEmpty(character.player_name)}`)
    .addFields(
      {
        name: "Identity",
        value: [
          `Race: ${valueOrEmpty(firstValue(basics.race, legacyBasics.race))}`,
          `Class: ${valueOrEmpty(firstValue(basics.class_name, legacyBasics.class_name))}`,
          `Level: ${valueOrEmpty(firstValue(basics.level, legacyBasics.level))}`,
          `Alignment: ${valueOrEmpty(firstValue(basics.alignment, legacyBasics.alignment))}`,
          `Status: ${valueOrEmpty(firstValue(character.status, identity.status))}`
        ].join("\n"),
        inline: true
      },
      {
        name: "Combat",
        value: [
          `HP: ${hpSummary(combat, legacyCombat)}`,
          `AC: ${valueOrEmpty(firstValue(combat.armor_class, legacyCombat.ac))}`,
          `Move: ${valueOrEmpty(firstValue(combat.movement, legacyCombat.movement))}`,
          `THAC0: ${valueOrEmpty(firstValue(combat.thac0, legacyCombat.thac0))}`
        ].join("\n"),
        inline: true
      },
      { name: "XP / Coins", value: `XP: ${valueOrEmpty(firstValue(basics.xp_current, legacyBasics.xp))}\n${coinSummary(wealth, legacyWealth)}`, inline: true },
      { name: "Ability Scores", value: abilitySummary(character.ledger), inline: true },
      { name: "Saving Throws", value: savingThrowSummary(combat, legacyCombat), inline: true },
      { name: "Languages", value: valueOrEmpty(firstValue(basics.languages, legacyBasics.languages)), inline: true },
      { name: "Equipment", value: equipmentSummary(equipment), inline: false },
      {
        name: "Encumbrance",
        value: `${equipment.encumbrance_total ?? 0} lb carried${equipment.encumbrance_category ? `, ${equipment.encumbrance_category}` : ""}${legacyEquipment.encumbrance ? `\nLegacy: ${legacyEquipment.encumbrance}` : ""}`,
        inline: true
      },
      { name: "Notes", value: valueOrEmpty(notes), inline: false }
    )
    .setFooter({ text: "Persistent ledger record. Referee has final authority." });
}
