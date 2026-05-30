import { MENU_CATALOG_PREFIX } from "./default-menu";

const CATEGORY_EMOJI: Record<string, string> = {
  Beer: "🍺",
  Vodka: "🍸",
  Beverages: "🥤",
  Wine: "🍷",
  Curry: "🍛",
  Chicken: "🍗",
  Whiskey: "🥃",
  Sides: "🥗",
};

export function menuCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? "🍽️";
}

export function catalogSlugFromInventoryId(inventoryId: string): string | null {
  if (!inventoryId.startsWith(MENU_CATALOG_PREFIX)) return null;
  return inventoryId.slice(MENU_CATALOG_PREFIX.length);
}

/** Local path for AI-generated menu thumbnails (see npm run menu:images) */
export function menuImagePath(slug: string): string {
  return `/menu-images/${slug}.jpg`;
}

const CATEGORY_IMAGE_SLUG: Record<string, string> = {
  Beer: "beer",
  Vodka: "vodka",
  Beverages: "beverages",
  Wine: "wine",
  Curry: "curry",
  Chicken: "chicken",
  Whiskey: "whiskey",
  Sides: "sides",
};

/** Shared AI thumbnail per category when item-specific image is missing */
export function categoryImagePath(category: string): string | undefined {
  const key = CATEGORY_IMAGE_SLUG[category];
  return key ? `/menu-images/_cat-${key}.jpg` : undefined;
}

export function resolveMenuImage(
  inventoryId: string,
  category: string,
  storedImageUrl?: string
): {
  imageUrl?: string;
  categoryImageUrl?: string;
  emoji: string;
} {
  const slug = catalogSlugFromInventoryId(inventoryId);
  const emoji = menuCategoryEmoji(category);
  const categoryImageUrl = categoryImagePath(category);
  if (storedImageUrl?.trim()) {
    return { imageUrl: storedImageUrl.trim(), categoryImageUrl, emoji };
  }
  if (!slug) return { emoji, categoryImageUrl };
  return { imageUrl: menuImagePath(slug), categoryImageUrl, emoji };
}

export function menuImagePrompt(name: string, category: string): string {
  return [
    "Professional restaurant menu product photograph",
    `of ${name}`,
    `(${category})`,
    "single item centered on a clean neutral background",
    "soft studio lighting, photorealistic, appetizing, high detail",
    "no text, no labels, no watermark, no people",
  ].join(", ");
}
