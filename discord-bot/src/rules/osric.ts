import type { RefereeScreenRules } from "./types.js";

export const osricRules: RefereeScreenRules = {
  id: "osric",
  name: "OSRIC",
  sourceNote: "Fast OSRIC/AD&D-style quick references. Replace this ruleset with DRG1e house-rule data when ready.",
  // Source: OSRIC core rules, Chapter III, attack matrices / THAC0 equivalents.
  // TODO(osric-pdf): Verify every class level band and THAC0 value against the OSRIC PDF before treating as authoritative.
  characterToHit: [
    {
      classes: ["Fighter", "Ranger", "Paladin"],
      bands: [
        { label: "1-2", thac0: 20 },
        { label: "3-4", thac0: 18 },
        { label: "5-6", thac0: 16 },
        { label: "7-8", thac0: 14 },
        { label: "9-10", thac0: 12 },
        { label: "11-12", thac0: 10 },
        { label: "13-14", thac0: 8 },
        { label: "15-16", thac0: 6 },
        { label: "17+", thac0: 4 }
      ]
    },
    {
      classes: ["Cleric", "Druid"],
      bands: [
        { label: "1-3", thac0: 20 },
        { label: "4-6", thac0: 18 },
        { label: "7-9", thac0: 16 },
        { label: "10-12", thac0: 14 },
        { label: "13-15", thac0: 12 },
        { label: "16-18", thac0: 10 },
        { label: "19+", thac0: 8 }
      ]
    },
    {
      classes: ["Thief", "Assassin"],
      bands: [
        { label: "1-4", thac0: 20 },
        { label: "5-8", thac0: 18 },
        { label: "9-12", thac0: 16 },
        { label: "13-16", thac0: 14 },
        { label: "17-20", thac0: 12 },
        { label: "21+", thac0: 10 }
      ]
    },
    {
      classes: ["Magic User", "Illusionist"],
      bands: [
        { label: "1-5", thac0: 20 },
        { label: "6-10", thac0: 18 },
        { label: "11-15", thac0: 16 },
        { label: "16-20", thac0: 14 },
        { label: "21+", thac0: 12 }
      ]
    }
  ],
  // Source: OSRIC core rules, Chapter III, monster attack matrix / hit dice attack progression.
  // TODO(osric-pdf): Verify monster HD-to-THAC0 progression against the OSRIC PDF; current values are quick-reference placeholders.
  monsterToHit: [
    { hitDice: "1", thac0: 19 },
    { hitDice: "2", thac0: 18 },
    { hitDice: "3", thac0: 17 },
    { hitDice: "4", thac0: 16 },
    { hitDice: "5", thac0: 15 },
    { hitDice: "6", thac0: 14 },
    { hitDice: "7", thac0: 13 },
    { hitDice: "8", thac0: 12 },
    { hitDice: "9", thac0: 11 },
    { hitDice: "10", thac0: 10 },
    { hitDice: "11", thac0: 9 },
    { hitDice: "12", thac0: 8 },
    { hitDice: "13", thac0: 7 },
    { hitDice: "14", thac0: 6 },
    { hitDice: "15", thac0: 5 },
    { hitDice: "16", thac0: 4 },
    { hitDice: "17", thac0: 3 },
    { hitDice: "18", thac0: 2 },
    { hitDice: "19", thac0: 1 },
    { hitDice: "20+", thac0: 0 }
  ],
  // Source: OSRIC core rules, Chapter I/III saving throw matrices by class and level.
  // TODO(osric-pdf): Verify all saving throw rows against the OSRIC PDF; current values are provisional quick-reference data.
  savingThrows: [
    {
      classes: ["Fighter", "Ranger", "Paladin"],
      rows: [
        { level: "1-2", deathPoison: 14, wand: 16, petrificationPolymorph: 15, breathWeapon: 17, spell: 17 },
        { level: "3-4", deathPoison: 13, wand: 15, petrificationPolymorph: 14, breathWeapon: 16, spell: 16 },
        { level: "5-6", deathPoison: 11, wand: 13, petrificationPolymorph: 12, breathWeapon: 13, spell: 14 },
        { level: "7-8", deathPoison: 10, wand: 12, petrificationPolymorph: 11, breathWeapon: 12, spell: 13 },
        { level: "9-10", deathPoison: 8, wand: 10, petrificationPolymorph: 9, breathWeapon: 9, spell: 11 },
        { level: "11-12", deathPoison: 7, wand: 9, petrificationPolymorph: 8, breathWeapon: 8, spell: 10 },
        { level: "13-14", deathPoison: 5, wand: 7, petrificationPolymorph: 6, breathWeapon: 5, spell: 8 },
        { level: "15-16", deathPoison: 4, wand: 6, petrificationPolymorph: 5, breathWeapon: 4, spell: 7 },
        { level: "17+", deathPoison: 3, wand: 5, petrificationPolymorph: 4, breathWeapon: 4, spell: 6 }
      ]
    },
    {
      classes: ["Cleric", "Druid"],
      rows: [
        { level: "1-3", deathPoison: 10, wand: 14, petrificationPolymorph: 13, breathWeapon: 16, spell: 15 },
        { level: "4-6", deathPoison: 9, wand: 13, petrificationPolymorph: 12, breathWeapon: 15, spell: 14 },
        { level: "7-9", deathPoison: 7, wand: 11, petrificationPolymorph: 10, breathWeapon: 13, spell: 12 },
        { level: "10-12", deathPoison: 6, wand: 10, petrificationPolymorph: 9, breathWeapon: 12, spell: 11 },
        { level: "13-15", deathPoison: 5, wand: 9, petrificationPolymorph: 8, breathWeapon: 11, spell: 10 },
        { level: "16-18", deathPoison: 4, wand: 8, petrificationPolymorph: 7, breathWeapon: 10, spell: 9 },
        { level: "19+", deathPoison: 2, wand: 6, petrificationPolymorph: 5, breathWeapon: 8, spell: 7 }
      ]
    },
    {
      classes: ["Magic User", "Illusionist"],
      rows: [
        { level: "1-5", deathPoison: 14, wand: 11, petrificationPolymorph: 13, breathWeapon: 15, spell: 12 },
        { level: "6-10", deathPoison: 13, wand: 9, petrificationPolymorph: 11, breathWeapon: 13, spell: 10 },
        { level: "11-15", deathPoison: 11, wand: 7, petrificationPolymorph: 9, breathWeapon: 11, spell: 8 },
        { level: "16-20", deathPoison: 10, wand: 5, petrificationPolymorph: 7, breathWeapon: 9, spell: 6 },
        { level: "21+", deathPoison: 8, wand: 3, petrificationPolymorph: 5, breathWeapon: 7, spell: 4 }
      ]
    },
    {
      classes: ["Thief", "Assassin"],
      rows: [
        { level: "1-4", deathPoison: 13, wand: 14, petrificationPolymorph: 12, breathWeapon: 16, spell: 15 },
        { level: "5-8", deathPoison: 12, wand: 12, petrificationPolymorph: 11, breathWeapon: 15, spell: 13 },
        { level: "9-12", deathPoison: 11, wand: 10, petrificationPolymorph: 10, breathWeapon: 14, spell: 11 },
        { level: "13-16", deathPoison: 10, wand: 8, petrificationPolymorph: 9, breathWeapon: 13, spell: 9 },
        { level: "17-20", deathPoison: 9, wand: 6, petrificationPolymorph: 8, breathWeapon: 12, spell: 7 },
        { level: "21+", deathPoison: 8, wand: 4, petrificationPolymorph: 7, breathWeapon: 11, spell: 5 }
      ]
    }
  ],
  // Source: OSRIC core rules, cleric turning undead matrix.
  // TODO(osric-pdf): Verify undead column names, level rows, and T/D/numeric entries against the OSRIC PDF.
  turning: {
    undeadTypes: ["Skel", "Zomb", "Ghoul", "Wight", "Wraith", "Mummy", "Spect", "Vamp", "Ghost", "Lich", "Spec"],
    legend: "Roll 2d6. Number = required result. T = automatic turn. D = destroyed. Dash = no effect.",
    rows: [
      { clericLevel: "1", results: ["10", "13", "16", "19", "20", "-", "-", "-", "-", "-", "-"] },
      { clericLevel: "2", results: ["7", "10", "13", "16", "19", "20", "-", "-", "-", "-", "-"] },
      { clericLevel: "3", results: ["4", "7", "10", "13", "16", "19", "20", "-", "-", "-", "-"] },
      { clericLevel: "4", results: ["T", "4", "7", "10", "13", "16", "19", "20", "-", "-", "-"] },
      { clericLevel: "5", results: ["T", "T", "4", "7", "10", "13", "16", "19", "20", "-", "-"] },
      { clericLevel: "6", results: ["D", "T", "T", "4", "7", "10", "13", "16", "19", "20", "-"] },
      { clericLevel: "7", results: ["D", "D", "T", "T", "4", "7", "10", "13", "16", "19", "20"] },
      { clericLevel: "8", results: ["D", "D", "D", "T", "T", "4", "7", "10", "13", "16", "19"] },
      { clericLevel: "9", results: ["D", "D", "D", "D", "T", "T", "4", "7", "10", "13", "16"] },
      { clericLevel: "10", results: ["D", "D", "D", "D", "D", "T", "T", "4", "7", "10", "13"] },
      { clericLevel: "11", results: ["D", "D", "D", "D", "D", "D", "T", "T", "4", "7", "10"] },
      { clericLevel: "12+", results: ["D", "D", "D", "D", "D", "D", "D", "T", "T", "4", "7"] }
    ]
  },
  // Source: Local DRG1e OSRIC summary pages:
  // - content/1e/how-to-play/combat.md
  // - content/1e/how-to-play/morale.md
  // TODO(osric-pdf): Re-check surprise segments, initiative timing, spell interruption, and morale outcomes against the OSRIC PDF.
  combatProcedure: {
    roundFlow: [
      "Determine surprise",
      "Declare intent",
      "Roll initiative",
      "Resolve movement",
      "Resolve missiles",
      "Resolve magic",
      "Resolve melee",
      "Morale",
      "End round"
    ],
    surprise: [
      "Usually d6 by side.",
      "Surprised side loses initial action.",
      "Difference can indicate segments of surprise.",
      "Encumbrance, scouting, light, and noise may modify."
    ],
    initiative: [
      "Combat round = 1 minute.",
      "Segment = 6 seconds.",
      "Use side initiative unless the situation demands detail.",
      "Ties are simultaneous or referee-adjudicated.",
      "Spell casting begins on initiative segment; damage can spoil casting."
    ],
    morale: [
      "Check when foes are clearly losing, leaderless, badly hurt, outnumbered, or hopeless.",
      "No more than two morale checks per battle.",
      "Base morale: 50% + 5% per HD, adjusted by situation.",
      "Failure by <=25%: fighting withdrawal. 26-50%: flee. 51%+: surrender."
    ]
  },
  // Source: Local DRG1e OSRIC summary pages:
  // - content/1e/how-to-play/movement.md
  // - content/1e/how-to-play/exploration.md
  // TODO(osric-pdf): Re-check dungeon movement conversions, wandering monster interval, and rest cadence against the OSRIC PDF.
  exploration: {
    timeScale: [
      { unit: "Segment", duration: "6 seconds" },
      { unit: "Round", duration: "1 minute" },
      { unit: "Turn", duration: "10 minutes" },
      { unit: "Hour", duration: "6 turns" },
      { unit: "Day", duration: "24 hours" }
    ],
    dungeonMovement: [
      { movement: "120", cautiousPerTurn: "120 ft", knownRoute: "600 ft", fleePerTurn: "1200 ft" },
      { movement: "90", cautiousPerTurn: "90 ft", knownRoute: "450 ft", fleePerTurn: "900 ft" },
      { movement: "60", cautiousPerTurn: "60 ft", knownRoute: "300 ft", fleePerTurn: "600 ft" },
      { movement: "30", cautiousPerTurn: "30 ft", knownRoute: "150 ft", fleePerTurn: "300 ft" }
    ],
    wanderingMonsters: [
      "Check every third dungeon turn unless the key says otherwise.",
      "Usual chance: 1 in 6.",
      "If encountered, determine distance, surprise, reaction, and immediate situation."
    ],
    rest: [
      "Rest 1 turn in every 6.",
      "Rest 1 turn after combat.",
      "Rest 2 turns after evasion or pursuit.",
      "Sleep and recovery remain referee-adjudicated unless a campaign procedure says otherwise."
    ]
  }
};
