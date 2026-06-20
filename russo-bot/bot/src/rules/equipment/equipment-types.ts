export interface EquipmentCost {
  amount: number | null;
  coin: "cp" | "sp" | "ep" | "gp" | "pp" | null;
}

export interface EquipmentCatalogItem {
  key: string;
  name: string;
  aliases: string[];
  category: "weapon" | "armor" | "shield" | "gear" | "light" | "container" | "ration" | "oil" | "ammunition";
  cost: EquipmentCost;
  weight: number | null;
  damageSmallMedium?: string | null;
  damageLarge?: string | null;
  notes: string;
  source: string;
}
