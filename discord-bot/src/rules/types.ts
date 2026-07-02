export interface Thac0Band {
  label: string;
  thac0: number;
}

export interface CharacterToHitGroup {
  classes: string[];
  bands: Thac0Band[];
}

export interface MonsterToHitEntry {
  hitDice: string;
  thac0: number;
}

export interface SavingThrowRow {
  level: string;
  deathPoison: number;
  wand: number;
  petrificationPolymorph: number;
  breathWeapon: number;
  spell: number;
}

export interface SavingThrowGroup {
  classes: string[];
  rows: SavingThrowRow[];
}

export interface TurningRow {
  clericLevel: string;
  results: string[];
}

export interface TurningMatrix {
  undeadTypes: string[];
  rows: TurningRow[];
  legend: string;
}

export interface CombatProcedure {
  roundFlow: string[];
  surprise: string[];
  initiative: string[];
  morale: string[];
}

export interface TimeScaleEntry {
  unit: string;
  duration: string;
}

export interface DungeonMovementEntry {
  movement: string;
  cautiousPerTurn: string;
  knownRoute: string;
  fleePerTurn: string;
}

export interface ExplorationProcedure {
  timeScale: TimeScaleEntry[];
  dungeonMovement: DungeonMovementEntry[];
  wanderingMonsters: string[];
  rest: string[];
}

export interface RefereeScreenRules {
  id: string;
  name: string;
  sourceNote: string;
  characterToHit: CharacterToHitGroup[];
  monsterToHit: MonsterToHitEntry[];
  savingThrows: SavingThrowGroup[];
  turning: TurningMatrix;
  combatProcedure: CombatProcedure;
  exploration: ExplorationProcedure;
}
