import { EmbedBuilder } from "discord.js";

import { loadRefereeScreenRules } from "./rules/loader.js";
import type {
  CharacterToHitGroup,
  DungeonMovementEntry,
  MonsterToHitEntry,
  RefereeScreenRules,
  SavingThrowGroup
} from "./rules/types.js";

const FOOTER = {
  text: "RUSSO™ Referee Utility System for Sessions & Operations\nReferee rulings override quick references."
};

function codeBlock(lines: string[]): string {
  return ["```text", ...lines, "```"].join("\n");
}

function formatCharacterToHit(groups: CharacterToHitGroup[]): string {
  return codeBlock(
    groups.flatMap((group) => [
      group.classes.join("/"),
      `  ${group.bands.map((band) => `${band.label} ${band.thac0}`).join(" | ")}`
    ])
  );
}

function formatMonsterToHit(entries: MonsterToHitEntry[]): string {
  const split = Math.ceil(entries.length / 2);
  const chunks = [entries.slice(0, split), entries.slice(split)];
  return codeBlock(
    chunks.flatMap((chunk, index) => [
      ...(index > 0 ? [""] : []),
      `HD:    ${chunk.map((entry) => entry.hitDice.padStart(3, " ")).join(" ")}`,
      `THAC0: ${chunk.map((entry) => String(entry.thac0).padStart(3, " ")).join(" ")}`
    ])
  );
}

function formatSavingThrows(group: SavingThrowGroup): string {
  return codeBlock([
    "Lvl       D/P  W  P/P  B  S",
    ...group.rows.map((row) =>
      `${row.level.padEnd(9)}${String(row.deathPoison).padStart(3)}${String(row.wand).padStart(3)}${String(row.petrificationPolymorph).padStart(5)}${String(row.breathWeapon).padStart(3)}${String(row.spell).padStart(3)}`
    )
  ]);
}

function formatTurning(rules: RefereeScreenRules): string {
  return codeBlock([
    `Lvl | ${rules.turning.undeadTypes.join(" ")}`,
    ...rules.turning.rows.map((row) => `${row.clericLevel.padStart(3)} | ${row.results.map((result) => result.padStart(4)).join(" ")}`)
  ]);
}

function formatTimeScale(rules: RefereeScreenRules): string {
  return codeBlock(rules.exploration.timeScale.map((entry) => `${entry.unit.padEnd(8)} ${entry.duration}`));
}

function formatDungeonMovement(entries: DungeonMovementEntry[]): string {
  return codeBlock([
    "Move  Cautious/turn  Known route  Flee/turn",
    ...entries.map((entry) =>
      `${entry.movement.padStart(4)}  ${entry.cautiousPerTurn.padEnd(13)} ${entry.knownRoute.padEnd(11)} ${entry.fleePerTurn}`
    )
  ]);
}

export function buildRefereeScreenEmbeds(rulesetId = "osric"): EmbedBuilder[] {
  const rules = loadRefereeScreenRules(rulesetId);

  return [
    new EmbedBuilder()
      .setTitle("Combat")
      .setDescription(`${rules.name}: ${rules.sourceNote}`)
      .addFields(
        {
          name: "Character To-Hit: Level Band -> THAC0",
          value: formatCharacterToHit(rules.characterToHit),
          inline: false
        },
        {
          name: "Monster To-Hit: HD -> THAC0",
          value: formatMonsterToHit(rules.monsterToHit),
          inline: false
        }
      )
      .setFooter(FOOTER),

    new EmbedBuilder()
      .setTitle("Saving Throws")
      .setDescription("Categories: D/P = Poison/Death, W = Rod/Staff/Wand, P/P = Petrification/Polymorph, B = Breath Weapon, S = Spell.")
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
      .addFields({
        name: "Cleric Level -> Undead Type",
        value: formatTurning(rules)
      })
      .setFooter(FOOTER),

    new EmbedBuilder()
      .setTitle("Combat Procedure")
      .setDescription("Reference sequence only. This does not roll, resolve, or automate combat.")
      .addFields(
        {
          name: "Round Flow",
          value: rules.combatProcedure.roundFlow.map((step, index) => `${index + 1}. ${step}`).join("\n"),
          inline: true
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
          name: "Time Scale",
          value: formatTimeScale(rules),
          inline: true
        },
        {
          name: "Dungeon Movement",
          value: formatDungeonMovement(rules.exploration.dungeonMovement),
          inline: false
        },
        {
          name: "Wandering Monsters",
          value: rules.exploration.wanderingMonsters.join("\n"),
          inline: true
        },
        {
          name: "Rest",
          value: rules.exploration.rest.join("\n"),
          inline: true
        }
      )
      .setFooter(FOOTER)
  ];
}
