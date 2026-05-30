import { DEFAULT_FINANCIAL_ACCOUNTS } from "@/lib/default-accounts";
import { DEFAULT_PARTIES } from "@/lib/default-parties";
import type { AppState } from "@/lib/types";

/** Wipe operational data; keep staff and restaurant profile (name, location). */
export function buildClearedAppState(current: AppState): AppState {
  return {
    staff: current.staff,
    settings: {
      restaurantName: current.settings.restaurantName,
      location: current.settings.location,
      tables: [],
      menuCategories: [],
    },
    inventory: [],
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
