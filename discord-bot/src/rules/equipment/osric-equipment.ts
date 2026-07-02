import type { EquipmentCatalogItem } from "./equipment-types.js";

// Source: OSRIC equipment lists. TODO(osric-pdf): verify all costs, weights, and damage values against the OSRIC PDF.
export const osricEquipment: EquipmentCatalogItem[] = [
  // Source: OSRIC equipment, weapon table.
  { key: "longsword", name: "Longsword", aliases: ["long sword", "sword long"], category: "weapon", cost: { amount: 15, coin: "gp" }, weight: 4, damageSmallMedium: "1d8", damageLarge: "1d12", notes: "", source: "OSRIC equipment, weapon table" },
  { key: "shortsword", name: "Short Sword", aliases: ["short sword"], category: "weapon", cost: { amount: 10, coin: "gp" }, weight: 3, damageSmallMedium: "1d6", damageLarge: "1d8", notes: "", source: "OSRIC equipment, weapon table" },
  { key: "dagger", name: "Dagger", aliases: ["knife"], category: "weapon", cost: { amount: 2, coin: "gp" }, weight: 1, damageSmallMedium: "1d4", damageLarge: "1d3", notes: "", source: "OSRIC equipment, weapon table" },
  { key: "handaxe", name: "Hand Axe", aliases: ["handaxe", "hatchet"], category: "weapon", cost: { amount: 1, coin: "gp" }, weight: 5, damageSmallMedium: "1d6", damageLarge: "1d4", notes: "", source: "OSRIC equipment, weapon table" },
  { key: "mace", name: "Mace", aliases: ["footman's mace", "footmans mace"], category: "weapon", cost: { amount: 8, coin: "gp" }, weight: 10, damageSmallMedium: "1d6+1", damageLarge: "1d6", notes: "", source: "OSRIC equipment, weapon table" },
  { key: "spear", name: "Spear", aliases: [], category: "weapon", cost: { amount: 1, coin: "gp" }, weight: 5, damageSmallMedium: "1d6", damageLarge: "1d8", notes: "Can be set against charge.", source: "OSRIC equipment, weapon table" },
  { key: "quarterstaff", name: "Quarterstaff", aliases: ["staff"], category: "weapon", cost: { amount: 0, coin: "gp" }, weight: 4, damageSmallMedium: "1d6", damageLarge: "1d6", notes: "", source: "OSRIC equipment, weapon table" },
  { key: "shortbow", name: "Shortbow", aliases: ["short bow"], category: "weapon", cost: { amount: 15, coin: "gp" }, weight: 2, damageSmallMedium: "1d6", damageLarge: "1d6", notes: "Missile weapon.", source: "OSRIC equipment, weapon table" },
  { key: "longbow", name: "Longbow", aliases: ["long bow"], category: "weapon", cost: { amount: 60, coin: "gp" }, weight: 3, damageSmallMedium: "1d6", damageLarge: "1d6", notes: "Missile weapon.", source: "OSRIC equipment, weapon table" },
  { key: "lightcrossbow", name: "Light Crossbow", aliases: ["light crossbow", "crossbow light"], category: "weapon", cost: { amount: 12, coin: "gp" }, weight: 6, damageSmallMedium: "1d4+1", damageLarge: "1d4+1", notes: "Missile weapon.", source: "OSRIC equipment, weapon table" },
  // Source: OSRIC equipment, armor table.
  { key: "leatherarmor", name: "Leather Armor", aliases: ["leather"], category: "armor", cost: { amount: 5, coin: "gp" }, weight: 15, notes: "", source: "OSRIC equipment, armor table" },
  { key: "chainmail", name: "Chain Mail", aliases: ["chain", "mail", "chainmail"], category: "armor", cost: { amount: 75, coin: "gp" }, weight: 40, notes: "", source: "OSRIC equipment, armor table" },
  { key: "platemail", name: "Plate Mail", aliases: ["plate", "plate armor"], category: "armor", cost: { amount: 400, coin: "gp" }, weight: 50, notes: "", source: "OSRIC equipment, armor table" },
  { key: "shield", name: "Shield", aliases: [], category: "shield", cost: { amount: 10, coin: "gp" }, weight: 10, notes: "", source: "OSRIC equipment, armor table" },
  // Source: OSRIC equipment, adventuring gear/container/light/ration/oil tables.
  { key: "backpack", name: "Backpack", aliases: ["pack"], category: "container", cost: { amount: 2, coin: "gp" }, weight: 2, notes: "", source: "OSRIC equipment, gear table" },
  { key: "sack", name: "Sack", aliases: ["large sack"], category: "container", cost: { amount: 1, coin: "sp" }, weight: 0.5, notes: "TODO(osric-pdf): verify sack size/cost/weight.", source: "OSRIC equipment, gear table" },
  { key: "torch", name: "Torch", aliases: ["torches"], category: "light", cost: { amount: 1, coin: "cp" }, weight: 1, notes: "Burns 6 turns in tracker.", source: "OSRIC equipment, gear table" },
  { key: "lantern", name: "Lantern", aliases: ["hooded lantern"], category: "light", cost: { amount: 7, coin: "gp" }, weight: 2, notes: "Requires oil.", source: "OSRIC equipment, gear table" },
  { key: "oil", name: "Oil Flask", aliases: ["oil flask", "flask of oil", "oil pint"], category: "oil", cost: { amount: 1, coin: "sp" }, weight: 1, notes: "1 pint burns 24 turns in tracker.", source: "OSRIC equipment, gear table" },
  { key: "ironspikes", name: "Iron Spikes", aliases: ["spikes"], category: "gear", cost: { amount: 1, coin: "gp" }, weight: 5, notes: "TODO(osric-pdf): verify bundle quantity.", source: "OSRIC equipment, gear table" },
  { key: "rope50", name: "Rope, 50 ft.", aliases: ["rope", "50 ft rope", "50' rope"], category: "gear", cost: { amount: 1, coin: "gp" }, weight: 10, notes: "", source: "OSRIC equipment, gear table" },
  { key: "rationsiron", name: "Iron Rations", aliases: ["rations", "iron rations"], category: "ration", cost: { amount: 15, coin: "gp" }, weight: 7, notes: "TODO(osric-pdf): verify ration duration and weight.", source: "OSRIC equipment, gear table" },
  // Source: OSRIC equipment, missile ammunition table.
  { key: "arrows20", name: "Arrows, 20", aliases: ["arrows", "20 arrows"], category: "ammunition", cost: { amount: 1, coin: "gp" }, weight: 1, notes: "", source: "OSRIC equipment, missile table" },
  { key: "bolts20", name: "Crossbow Bolts, 20", aliases: ["bolts", "crossbow bolts"], category: "ammunition", cost: { amount: 2, coin: "gp" }, weight: 1, notes: "", source: "OSRIC equipment, missile table" }
];
