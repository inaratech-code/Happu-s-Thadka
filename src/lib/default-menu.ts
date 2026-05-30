import type { InventoryItem } from "./types";

/** Stable IDs for POS menu items — synced to Neon inventory_items on load */
export const MENU_CATALOG_PREFIX = "menu-";

type CatalogDef = {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  unit?: string;
};

function item(def: CatalogDef): InventoryItem {
  return {
    id: `${MENU_CATALOG_PREFIX}${def.id}`,
    name: def.name,
    category: def.category,
    sellingPrice: def.sellingPrice,
    unit: def.unit ?? "pcs",
    stockOnHand: 0,
    avgCost: 0,
    reorderAt: 0,
    type: "sellable",
  };
}

const CATALOG_DEFS: CatalogDef[] = [
  // Beer
  { id: "carlsberg", name: "Carlsberg", category: "Beer", sellingPrice: 700, unit: "bottle" },
  { id: "tuborg-gold", name: "Tuborg Gold", category: "Beer", sellingPrice: 675, unit: "bottle" },
  { id: "tuborg-strong", name: "Tuborg Strong", category: "Beer", sellingPrice: 575, unit: "bottle" },
  { id: "gorkha-strong", name: "Gorkha Strong", category: "Beer", sellingPrice: 475, unit: "bottle" },

  // Vodka
  { id: "8848-180ml", name: "8848 180ml", category: "Vodka", sellingPrice: 700, unit: "bottle" },
  { id: "8848-750ml", name: "8848 750ml", category: "Vodka", sellingPrice: 2800, unit: "bottle" },
  { id: "ruslan-180ml", name: "Ruslan 180ml", category: "Vodka", sellingPrice: 700, unit: "bottle" },
  { id: "ruslan-750ml", name: "Ruslan 750ml", category: "Vodka", sellingPrice: 2800, unit: "bottle" },
  { id: "nude-vodka-180ml", name: "Nude Vodka 180ml", category: "Vodka", sellingPrice: 700, unit: "bottle" },
  { id: "nude-vodka-750ml", name: "Nude Vodka 750ml", category: "Vodka", sellingPrice: 2800, unit: "bottle" },
  {
    id: "od-black-180ml",
    name: "OD Black (Black Chimney) 180ml",
    category: "Vodka",
    sellingPrice: 1250,
    unit: "bottle",
  },
  {
    id: "od-black-750ml",
    name: "OD Black (Black Chimney) 750ml",
    category: "Vodka",
    sellingPrice: 5000,
    unit: "bottle",
  },
  { id: "od-red-180ml", name: "OD Red 180ml", category: "Vodka", sellingPrice: 950, unit: "bottle" },
  { id: "od-red-750ml", name: "OD Red 750ml", category: "Vodka", sellingPrice: 3800, unit: "bottle" },
  { id: "signature-red-180ml", name: "Signature Red 180ml", category: "Vodka", sellingPrice: 950, unit: "bottle" },
  { id: "signature-red-750ml", name: "Signature Red 750ml", category: "Vodka", sellingPrice: 3800, unit: "bottle" },
  {
    id: "signature-grain-180ml",
    name: "Signature Grain 180ml",
    category: "Vodka",
    sellingPrice: 1050,
    unit: "bottle",
  },
  {
    id: "signature-grain-750ml",
    name: "Signature Grain 750ml",
    category: "Vodka",
    sellingPrice: 4200,
    unit: "bottle",
  },
  { id: "black-oak-180ml", name: "Black Oak 180ml", category: "Vodka", sellingPrice: 475, unit: "bottle" },
  { id: "black-oak-750ml", name: "Black Oak 750ml", category: "Vodka", sellingPrice: 1900, unit: "bottle" },
  { id: "golden-oak-180ml", name: "Golden Oak 180ml", category: "Vodka", sellingPrice: 475, unit: "bottle" },
  { id: "golden-oak-750ml", name: "Golden Oak 750ml", category: "Vodka", sellingPrice: 1900, unit: "bottle" },
  { id: "diamond-180ml", name: "Diamond 180ml", category: "Vodka", sellingPrice: 450, unit: "bottle" },
  { id: "diamond-750ml", name: "Diamond 750ml", category: "Vodka", sellingPrice: 1800, unit: "bottle" },
  { id: "gurkhas-guns-180ml", name: "Gurkhas Guns 180ml", category: "Vodka", sellingPrice: 1050, unit: "bottle" },
  { id: "gurkhas-guns-750ml", name: "Gurkhas Guns 750ml", category: "Vodka", sellingPrice: 4200, unit: "bottle" },
  { id: "khukuri-rum-180ml", name: "Khukuri Rum 180ml", category: "Vodka", sellingPrice: 800, unit: "bottle" },
  { id: "khukuri-rum-750ml", name: "Khukuri Rum 750ml", category: "Vodka", sellingPrice: 3200, unit: "bottle" },

  // Beverages
  { id: "coca-cola-2-5l", name: "Coca-Cola 2.5L", category: "Beverages", sellingPrice: 380, unit: "bottle" },
  { id: "coca-cola-180ml", name: "Coca-Cola 180ml", category: "Beverages", sellingPrice: 65, unit: "bottle" },
  { id: "coca-cola-1l", name: "Coca-Cola 1L", category: "Beverages", sellingPrice: 225, unit: "bottle" },
  { id: "dew-2-5l", name: "Dew 2.5L", category: "Beverages", sellingPrice: 380, unit: "bottle" },
  { id: "dew-180ml", name: "Dew 180ml", category: "Beverages", sellingPrice: 65, unit: "bottle" },
  { id: "dew-1l", name: "Dew 1L", category: "Beverages", sellingPrice: 225, unit: "bottle" },
  { id: "fanta-2-5l", name: "Fanta 2.5L", category: "Beverages", sellingPrice: 380, unit: "bottle" },
  { id: "fanta-180ml", name: "Fanta 180ml", category: "Beverages", sellingPrice: 65, unit: "bottle" },
  { id: "fanta-1l", name: "Fanta 1L", category: "Beverages", sellingPrice: 225, unit: "bottle" },
  { id: "sprite-2-5l", name: "Sprite 2.5L", category: "Beverages", sellingPrice: 380, unit: "bottle" },
  { id: "sprite-180ml", name: "Sprite 180ml", category: "Beverages", sellingPrice: 65, unit: "bottle" },
  { id: "sprite-1l", name: "Sprite 1L", category: "Beverages", sellingPrice: 225, unit: "bottle" },
  { id: "xtreme", name: "Xtreme", category: "Beverages", sellingPrice: 180, unit: "bottle" },
  { id: "red-bull", name: "Red Bull", category: "Beverages", sellingPrice: 150, unit: "can" },

  // Wine
  { id: "divine-wines-red-750ml", name: "Divine Wines Red 750ml", category: "Wine", sellingPrice: 1350, unit: "bottle" },
  { id: "divine-wine-white-750ml", name: "Divine Wine White 750ml", category: "Wine", sellingPrice: 1350, unit: "bottle" },

  // Curry
  { id: "eggs-gravy-curry", name: "Eggs Gravy Curry (2 pcs)", category: "Curry", sellingPrice: 150, unit: "plate" },
  { id: "eggs-tadka-curry", name: "Eggs Tadka Curry (2 pcs)", category: "Curry", sellingPrice: 150, unit: "plate" },

  // Chicken (local)
  {
    id: "chicken-gravy-normal",
    name: "Chicken Gravy (Normal Spicy) 1kg",
    category: "Chicken",
    sellingPrice: 1250,
    unit: "plate",
  },
  {
    id: "chicken-gravy-zero-piro",
    name: "Chicken Gravy (0 Piro) 1kg",
    category: "Chicken",
    sellingPrice: 1250,
    unit: "plate",
  },
  { id: "chicken-tadka", name: "Chicken Tadka 1kg", category: "Chicken", sellingPrice: 1250, unit: "plate" },
  {
    id: "chicken-double-tadka",
    name: "Chicken Double Tadka 1kg",
    category: "Chicken",
    sellingPrice: 1250,
    unit: "plate",
  },

  // Whiskey
  { id: "jack-daniels-180ml", name: "Jack Daniel's 180ml", category: "Whiskey", sellingPrice: 2375, unit: "bottle" },
  { id: "jack-daniels-750ml", name: "Jack Daniel's 750ml", category: "Whiskey", sellingPrice: 9500, unit: "bottle" },
  { id: "red-label-180ml", name: "Red Label 180ml", category: "Whiskey", sellingPrice: 2250, unit: "bottle" },
  { id: "red-label-750ml", name: "Red Label 750ml", category: "Whiskey", sellingPrice: 9000, unit: "bottle" },
  { id: "red-label-1l", name: "Red Label 1L", category: "Whiskey", sellingPrice: 12375, unit: "bottle" },
  { id: "black-label-180ml", name: "Black Label 180ml", category: "Whiskey", sellingPrice: 2285, unit: "bottle" },
  { id: "black-label-750ml", name: "Black Label 750ml", category: "Whiskey", sellingPrice: 9100, unit: "bottle" },
  { id: "black-label-1l", name: "Black Label 1L", category: "Whiskey", sellingPrice: 12500, unit: "bottle" },

  // Sides & extras
  { id: "aloo-kulcha", name: "Aloo Kulcha", category: "Sides", sellingPrice: 80, unit: "pcs" },
  { id: "salad", name: "Salad", category: "Sides", sellingPrice: 80, unit: "pcs" },
  { id: "water-bottle", name: "Water Bottle", category: "Sides", sellingPrice: 30, unit: "bottle" },
];

export const MENU_CATALOG: InventoryItem[] = CATALOG_DEFS.map(item);

/** Metadata for image generation script (npm run menu:images) */
export const MENU_CATALOG_META = CATALOG_DEFS.map((d) => ({
  slug: d.id,
  name: d.name,
  category: d.category,
}));

const catalogIdSet = new Set(MENU_CATALOG.map((c) => c.id));

function isCatalogItem(id: string): boolean {
  return id.startsWith(MENU_CATALOG_PREFIX);
}

/** True when DB/local storage is missing or outdated catalog rows */
export function needsMenuCatalogPersist(inventory: InventoryItem[]): boolean {
  for (const catalog of MENU_CATALOG) {
    const row = inventory.find((i) => i.id === catalog.id);
    if (!row) return true;
    if (
      row.name !== catalog.name ||
      row.category !== catalog.category ||
      row.sellingPrice !== catalog.sellingPrice ||
      row.unit !== catalog.unit ||
      row.type !== catalog.type
    ) {
      return true;
    }
  }
  return false;
}

/** Merge catalog prices/names into inventory; keep stock and custom items */
export function ensureMenuCatalog(inventory: InventoryItem[]): InventoryItem[] {
  const byId = new Map(inventory.map((i) => [i.id, i]));

  const catalogRows = MENU_CATALOG.map((catalog) => {
    const existing = byId.get(catalog.id);
    if (!existing) return catalog;
    return {
      ...existing,
      name: catalog.name,
      category: catalog.category,
      sellingPrice: catalog.sellingPrice,
      unit: catalog.unit,
      type: "sellable" as const,
      imageUrl: undefined,
    };
  });

  const customItems = inventory.filter((i) => !catalogIdSet.has(i.id) && !isCatalogItem(i.id));

  return [...catalogRows, ...customItems];
}
