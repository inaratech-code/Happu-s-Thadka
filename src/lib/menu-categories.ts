import { MENU_CATALOG } from "./default-menu";
import { categoryImagePath } from "./menu-images";
import type { InventoryItem, MenuCategoryDef } from "./types";

export function slugifyCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Default categories from the built-in menu catalog (with local fallback images). */
export function defaultMenuCategoriesFromCatalog(): MenuCategoryDef[] {
  const names = [...new Set(MENU_CATALOG.map((i) => i.category))].sort();
  return names.map((name, index) => ({
    id: `cat-${slugifyCategoryName(name)}`,
    name,
    imageUrl: categoryImagePath(name),
    sortOrder: index,
  }));
}

export function ensureMenuCategories(
  categories: MenuCategoryDef[],
  inventory: InventoryItem[] = []
): MenuCategoryDef[] {
  const byName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c]));
  const next: MenuCategoryDef[] = [...categories];

  const addIfMissing = (name: string, imageUrl?: string) => {
    const key = name.trim().toLowerCase();
    if (!key || byName.has(key)) return;
    const entry: MenuCategoryDef = {
      id: `cat-${slugifyCategoryName(name)}`,
      name: name.trim(),
      imageUrl,
      sortOrder: next.length,
    };
    next.push(entry);
    byName.set(key, entry);
  };

  for (const d of defaultMenuCategoriesFromCatalog()) {
    addIfMissing(d.name, d.imageUrl);
  }

  for (const item of inventory) {
    if (item.type === "sellable" && item.category.trim()) {
      addIfMissing(item.category.trim());
    }
  }

  return next
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function categoryImageByName(
  categories: MenuCategoryDef[],
  categoryName: string
): string | undefined {
  const key = categoryName.trim().toLowerCase();
  const row = categories.find((c) => c.name.trim().toLowerCase() === key);
  return row?.imageUrl?.trim() || undefined;
}

export function needsMenuCategoriesPersist(
  categories: MenuCategoryDef[],
  inventory: InventoryItem[]
): boolean {
  const ensured = ensureMenuCategories(categories, inventory);
  if (ensured.length !== categories.length) return true;
  const a = new Map(categories.map((c) => [c.id, c]));
  for (const c of ensured) {
    const prev = a.get(c.id);
    if (!prev || prev.name !== c.name || (prev.imageUrl ?? "") !== (c.imageUrl ?? "")) {
      return true;
    }
  }
  return false;
}
