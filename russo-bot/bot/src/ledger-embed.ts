import { EmbedBuilder } from "discord.js";

import type { CharacterResponse } from "./api.js";

function section(ledger: Record<string, unknown>, name: string): Record<string, unknown> {
  const value = ledger[name];
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
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

export function buildLedgerEmbed(character: CharacterResponse): EmbedBuilder {
  const basics = section(character.ledger, "Character Basics");
  const combat = section(character.ledger, "Combat");
  const equipment = section(character.ledger, "Equipment");
  const wealth = section(character.ledger, "Wealth");
  const conditions = character.ledger["Conditions"];

  return new EmbedBuilder()
    .setTitle("RUSSO Character Ledger")
    .addFields(
      { name: "Character Name", value: valueOrEmpty(character.character_name), inline: true },
      { name: "Player", value: valueOrEmpty(character.player_name), inline: true },
      { name: "Race", value: valueOrEmpty(basics.race), inline: true },
      { name: "Class", value: valueOrEmpty(basics.class_name), inline: true },
      { name: "Level", value: valueOrEmpty(basics.level), inline: true },
      { name: "HP", value: valueOrEmpty(combat.hp), inline: true },
      { name: "AC", value: valueOrEmpty(combat.ac), inline: true },
      { name: "Movement", value: valueOrEmpty(combat.movement), inline: true },
      { name: "Encumbrance", value: valueOrEmpty(equipment.encumbrance), inline: true },
      { name: "Coins", value: coinSummary(wealth), inline: false },
      { name: "Conditions", value: valueOrEmpty(conditions), inline: false },
      { name: "XP", value: valueOrEmpty(basics.xp), inline: true }
    )
    .setFooter({ text: "RUSSO™ | Official Character Ledger" });
}
