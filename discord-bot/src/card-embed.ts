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
  return String(value);
}

function hpSummary(combat: Record<string, unknown>, legacyCombat: Record<string, unknown>): string {
  const current = firstValue(combat.hp_current, legacyCombat.hp);
  const max = firstValue(combat.hp_max, legacyCombat.max_hp);
  if (current === null || current === undefined || current === "") {
    return "Not set";
  }
  return max === null || max === undefined || max === "" ? String(current) : `${current}/${max}`;
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

function savingThrowSummary(combat: Record<string, unknown>, legacyCombat: Record<string, unknown>): string {
  const saves = {
    ...section(legacyCombat, "saving_throws"),
    ...section(combat, "saving_throws")
  };
  const labels = [
    ["death", "D/P"],
    ["wands", "W"],
    ["paralysis_petrify", "P/P"],
    ["breath", "B"],
    ["spells", "S"]
  ] as const;
  const rendered = labels
    .filter(([key]) => saves[key] !== null && saves[key] !== undefined && saves[key] !== "")
    .map(([key, label]) => `${label} ${saves[key]}`);
  return rendered.length > 0 ? rendered.join(" | ") : "Not set";
}

function weaponLines(equipment: Record<string, unknown>, legacyEquipment: Record<string, unknown>): string {
  const equipped = Array.isArray(equipment.equipped) ? (equipment.equipped as Record<string, unknown>[]) : [];
  const legacyWeapons = Array.isArray(legacyEquipment.weapons) ? (legacyEquipment.weapons as Record<string, unknown>[]) : [];
  const equippedWeapons = equipped.filter((item) => item.damage || item.dmg);
  const weapons = [...(equippedWeapons.length > 0 ? equippedWeapons : equipped), ...legacyWeapons].filter((item) => item.item_name || item.name);
  if (weapons.length === 0) {
    return "None equipped";
  }
  return weapons
    .slice(0, 8)
    .map((item) => {
      const name = valueOrEmpty(firstValue(item.item_name, item.name));
      const damage = firstValue(item.damage, item.dmg);
      const notes = item.notes ? `, ${item.notes}` : "";
      return damage ? `${name} - ${damage}${notes}` : `${name}${notes}`;
    })
    .join("\n");
}

function encumbranceSummary(equipment: Record<string, unknown>): string {
  const total = equipment.encumbrance_total ?? 0;
  const category = equipment.encumbrance_category ? `, ${equipment.encumbrance_category}` : "";
  return `${total} lb carried${category}`;
}

function spellSummary(ledger: Record<string, unknown>): string {
  const magic = section(ledger, "Magic");
  const prepared = Array.isArray(magic.prepared_spells) ? magic.prepared_spells : [];
  const slots = section(magic, "spell_slots");
  if (prepared.length === 0 && Object.keys(slots).length === 0) {
    return "Not tracked yet";
  }
  const preparedText = prepared.length > 0 ? prepared.join(", ") : "None prepared";
  const slotsText = Object.keys(slots).length > 0 ? Object.entries(slots).map(([level, count]) => `L${level}: ${count}`).join(", ") : "slots not tracked";
  return `Prepared: ${preparedText}\nSlots: ${slotsText}`;
}

function coinSummary(wealth: Record<string, unknown>, legacyWealth: Record<string, unknown>): string {
  const coins = { ...legacyWealth, ...wealth };
  return ["pp", "gp", "ep", "sp", "cp"].map((coin) => `${coins[coin] ?? 0} ${coin}`).join(", ");
}

export function buildCharacterCardEmbed(character: CharacterResponse): EmbedBuilder {
  const identity = section(character.ledger, "identity");
  const basics = section(character.ledger, "basics");
  const legacyBasics = section(character.ledger, "Character Basics");
  const combat = section(character.ledger, "combat");
  const legacyCombat = section(character.ledger, "Combat");
  const equipment = section(character.ledger, "equipment");
  const legacyEquipment = section(character.ledger, "Equipment");
  const wealth = section(character.ledger, "wealth");
  const legacyWealth = section(character.ledger, "Wealth");

  return new EmbedBuilder()
    .setTitle("RUSSO™ Character Card")
    .setDescription(`${character.character_name} | ${valueOrEmpty(character.player_name)}`)
    .addFields(
      {
        name: "Header",
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
          `AC: ${valueOrEmpty(firstValue(combat.armor_class, legacyCombat.ac))}`,
          `HP: ${hpSummary(combat, legacyCombat)}`,
          `Move: ${valueOrEmpty(firstValue(combat.movement, legacyCombat.movement))}`,
          `THAC0: ${valueOrEmpty(firstValue(combat.thac0, legacyCombat.thac0))}`,
          `Saves: ${savingThrowSummary(combat, legacyCombat)}`
        ].join("\n"),
        inline: true
      },
      { name: "Ability Scores", value: abilitySummary(character.ledger), inline: true },
      { name: "Weapons", value: weaponLines(equipment, legacyEquipment), inline: false },
      { name: "Encumbrance", value: `${encumbranceSummary(equipment)}\nMove: ${valueOrEmpty(firstValue(combat.movement, legacyCombat.movement))}`, inline: true },
      { name: "Spells", value: spellSummary(character.ledger), inline: true },
      { name: "XP / Coins", value: `XP: ${valueOrEmpty(firstValue(basics.xp_current, legacyBasics.xp))}\n${coinSummary(wealth, legacyWealth)}`, inline: false }
    )
    .setFooter({ text: "Persistent ledger record. Referee has final authority." });
}
