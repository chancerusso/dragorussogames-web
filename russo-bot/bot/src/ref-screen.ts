import { EmbedBuilder } from "discord.js";

import { loadRefereeScreenRules } from "./rules/loader.js";
import type {
  CharacterToHitGroup,
  DungeonMovementEntry,
  MonsterToHitEntry,
  SavingThrowGroup
} from "./rules/types.js";

const FOOTER = {
  text: "RUSSO™ Referee Utility System for Sessions & Operations\nReferee rulings override quick references."
};

function formatCharacterToHitGroup(group: CharacterToHitGroup): string {
  return group.bands.map((band) => `${band.label}: ${band.thac0}`).join("\n");
}

function formatMonsterToHit(entries: MonsterToHitEntry[]): string {
  return entries.map((entry) => `${entry.hitDice} HD: ${entry.thac0}`).join("\n");
}

function formatSavingThrows(group: SavingThrowGroup): string {
  return group.rows
    .map((row) =>
      [
        `**${row.level}**`,
        `Death ${row.deathPoison}`,
        `Rod ${row.wand}`,
        `Poly ${row.petrificationPolymorph}`,
        `Breath ${row.breathWeapon}`,
        `Spell ${row.spell}`
      ].join("\n")
    )
    .join("\n\n");
}

function formatDungeonMovement(entries: DungeonMovementEntry[]): string {
  return entries
    .map((entry) => `Move ${entry.movement}: ${entry.cautiousPerTurn}/turn\nKnown: ${entry.knownRoute}; Flee: ${entry.fleePerTurn}`)
    .join("\n\n");
}

export function buildRefereeScreenEmbeds(rulesetId = "osric"): EmbedBuilder[] {
  const rules = loadRefereeScreenRules(rulesetId);

  return [
    new EmbedBuilder()
      .setTitle("Combat")
      .setDescription(`${rules.name} quick reference`)
      .addFields(
        ...rules.characterToHit.map((group) => ({
          name: group.classes.join(" / "),
          value: formatCharacterToHitGroup(group),
          inline: true
        })),
        {
          name: "Monster HD 1-10",
          value: formatMonsterToHit(rules.monsterToHit.slice(0, 10)),
          inline: true
        },
        {
          name: "Monster HD 11+",
          value: formatMonsterToHit(rules.monsterToHit.slice(10)),
          inline: true
        }
      )
      .setFooter(FOOTER),

    new EmbedBuilder()
      .setTitle("Saving Throws")
      .setDescription("Each range lists Death, Rod, Poly, Breath, and Spell vertically.")
      .addFields(
        ...rules.savingThrows.map((group) => ({
          name: group.classes.join(" / "),
          value: formatSavingThrows(group),
          inline: true
        }))
      )
      .setFooter(FOOTER),

    new EmbedBuilder()
      .setTitle("Turning Undead")
      .setDescription(rules.turning.legend)
      .addFields(
        ...rules.turning.undeadTypes.map((undeadType, typeIndex) => ({
          name: undeadType,
          value: rules.turning.rows
            .map((row) => `Lvl ${row.clericLevel}: ${row.results[typeIndex]}`)
            .join("\n"),
          inline: true
        }))
      )
      .setFooter(FOOTER),

    new EmbedBuilder()
      .setTitle("Combat Procedure")
      .setDescription("Reference only. No rolling or automation.")
      .addFields(
        {
          name: "Checklist",
          value: [
            "① Surprise",
            "② Declare",
            "③ Initiative",
            "④ Movement",
            "⑤ Missiles",
            "⑥ Magic",
            "⑦ Melee",
            "⑧ Morale",
            "⑨ End"
          ].join("\n"),
          inline: false
        },
        {
          name: "Surprise",
          value: rules.combatProcedure.surprise.join("\n"),
          inline: true
        },
        {
          name: "Initiative",
          value: rules.combatProcedure.initiative.join("\n"),
          inline: false
        },
        {
          name: "Morale",
          value: rules.combatProcedure.morale.join("\n"),
          inline: false
        }
      )
      .setFooter(FOOTER),

    new EmbedBuilder()
      .setTitle("Exploration")
      .setDescription("Dungeon and timekeeping reference for table pacing.")
      .addFields(
        {
          name: "Time",
          value: rules.exploration.timeScale.map((entry) => `${entry.unit}: ${entry.duration}`).join("\n"),
          inline: true
        },
        {
          name: "Movement",
          value: formatDungeonMovement(rules.exploration.dungeonMovement),
          inline: false
        },
        {
          name: "Turns",
          value: "Dungeon turn: 10 minutes\nHour: 6 turns\nTrack light, spells, searches, and noise.",
          inline: true
        },
        {
          name: "Rest",
          value: rules.exploration.rest.join("\n"),
          inline: true
        },
        {
          name: "Wandering Monsters",
          value: rules.exploration.wanderingMonsters.join("\n"),
          inline: true
        }
      )
      .setFooter(FOOTER)
  ];
}
