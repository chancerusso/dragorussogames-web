export const abilityLabels = [
  ["str", "STR", "strength"],
  ["int", "INT", "intelligence"],
  ["wis", "WIS", "wisdom"],
  ["dex", "DEX", "dexterity"],
  ["con", "CON", "constitution"],
  ["cha", "CHA", "charisma"]
] as const;

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
