import type { InventoryItem, KitchenOrder, MenuItem, Transaction } from "./types";
import { resolveMenuImage } from "./menu-images";

export function menuFromInventory(inventory: InventoryItem[]): MenuItem[] {
  return inventory
    .filter((i) => i.type === "sellable" && i.sellingPrice > 0)
    .map((i) => {
      const visual = resolveMenuImage(i.id, i.category, i.imageUrl);
      return {
        id: i.id,
        name: i.name,
        category: i.category,
        price: i.sellingPrice,
        emoji: visual.emoji,
        imageUrl: visual.imageUrl,
        categoryImageUrl: visual.categoryImageUrl,
      };
    });
}

export function isLowStock(item: InventoryItem) {
  return item.stockOnHand <= item.reorderAt;
}

export { ledgerBalance } from "./account-stats";

export function todaySales(transactions: Transaction[]) {
  const d = new Date().toISOString().slice(0, 10);
  return transactions
    .filter((t) => t.type === "sale" && t.date === d)
    .reduce((s, t) => s + t.amount, 0);
}

export function nextKitchenStatus(status: KitchenOrder["status"]): KitchenOrder["status"] | null {
  const flow: KitchenOrder["status"][] = ["new", "preparing", "ready", "served"];
  const i = flow.indexOf(status);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1]! : null;
}
