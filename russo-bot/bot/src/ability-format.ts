export const abilityLabels = [
  ["str", "STR", "strength"],
  ["int", "INT", "intelligence"],
  ["wis", "WIS", "wisdom"],
  ["dex", "DEX", "dexterity"],
  ["con", "CON", "constitution"],
  ["cha", "CHA", "charisma"]
] as const;

export function abilityModifier(score: unknown): number | null {
  if (score === null || score === undefined || score === "") {
    return null;
  }
  const rawScore = Number(score);
  if (Number.isNaN(rawScore)) {
    return null;
  }
  if (rawScore <= 3) return -3;
  if (rawScore <= 5) return -2;
  if (rawScore <= 8) return -1;
  if (rawScore <= 14) return 0;
  if (rawScore <= 17) return 1;
  if (rawScore === 18) return 2;
  if (rawScore <= 20) return 3;
  if (rawScore <= 23) return 4;
  return 5;
}

export function formatModifier(modifier: unknown): string {
  if (modifier === null || modifier === undefined || modifier === "") {
    return "+0";
  }
  const value = Number(modifier);
  if (Number.isNaN(value)) {
    return "+0";
  }
  return value >= 0 ? `+${value}` : String(value);
}
