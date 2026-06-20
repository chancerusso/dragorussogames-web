import { osricEquipment } from "./osric-equipment.js";
import type { EquipmentCatalogItem } from "./equipment-types.js";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function findEquipment(input: string): EquipmentCatalogItem | null {
  const key = normalize(input);
  return osricEquipment.find((item) => normalize(item.key) === key || normalize(item.name) === key || item.aliases.some((alias) => normalize(alias) === key)) ?? null;
}

export function suggestEquipment(input: string): EquipmentCatalogItem | null {
  const key = normalize(input);
  return osricEquipment
    .map((item) => ({ item, score: score(key, normalize(item.name)) }))
    .sort((a, b) => b.score - a.score)[0]?.item ?? null;
}

function score(a: string, b: string): number {
  let points = 0;
  for (const char of new Set(a.split(""))) {
    if (b.includes(char)) points += 1;
  }
  if (b.startsWith(a.slice(0, 3))) points += 5;
  return points;
}

export function catalogItemToEquipment(item: EquipmentCatalogItem) {
  return {
    item_name: item.name,
    weight: item.weight ?? 0,
    damage: item.damageSmallMedium ?? null,
    value: item.cost.amount === null || item.cost.coin === null ? null : `${item.cost.amount} ${item.cost.coin}`,
    notes: [item.notes, item.source].filter(Boolean).join(" | ")
  };
}
