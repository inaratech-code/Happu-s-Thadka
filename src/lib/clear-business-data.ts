import { DEFAULT_FINANCIAL_ACCOUNTS } from "@/lib/default-accounts";
import { DEFAULT_PARTIES } from "@/lib/default-parties";
import type { AppState } from "@/lib/types";

/** Wipe operational data; keep staff, menu catalog, and restaurant profile (name, location). */
export function buildClearedAppState(current: AppState): AppState {
  const menuInventory = current.inventory.filter((item) => item.type === "sellable");

  return {
    staff: current.staff,
    settings: {
      restaurantName: current.settings.restaurantName,
      location: current.settings.location,
      tables: [],
      menuCategories: current.settings.menuCategories.map((c) => ({ ...c })),
    },
    inventory: menuInventory.map((item) => ({ ...item })),
    posOrders: [],
    kitchenOrders: [],
    transactions: [],
    ledgerEntries: [],
    stockMovements: [],
    financialAccounts: DEFAULT_FINANCIAL_ACCOUNTS.map((a) => ({ ...a })),
    parties: DEFAULT_PARTIES.map((p) => ({ ...p })),
    kotCounter: 1000,
    txCounter: 1,
    orderCounter: 1,
  };
}
