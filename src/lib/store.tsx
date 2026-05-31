"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppSettings,
  AppState,
  FinancialAccount,
  InventoryItem,
  KitchenOrder,
  LedgerEntry,
  MenuCategoryDef,
  Party,
  PaymentMethod,
  PosOrder,
  StaffMember,
  StockMovement,
  Transaction,
} from "./types";
import { DEFAULT_ADMIN } from "./default-admin";
import { ensureMenuCatalog, needsMenuCatalogPersist } from "./default-menu";
import { DEFAULT_PARTIES, ensureDefaultParties, isFixedLedgerParty } from "./default-parties";
import {
  DEFAULT_DIGITAL_ACCOUNT_ID,
  DEFAULT_FINANCIAL_ACCOUNTS,
  defaultCashAccountId,
} from "./default-accounts";
import { hashPassword } from "./password";
import { ALL_PERMISSIONS } from "./permissions";
import { loadAppStateClient, saveAppStateClient, isRemoteDataSource } from "./data-source";
import { useAuth } from "@/components/auth-provider";
import { normalizeIsoDate } from "./iso-date";
import { formatPosOrderRef } from "./pos-order";
import { ensureMenuCategories, needsMenuCategoriesPersist } from "./menu-categories";
import { menuFromInventory } from "./store-utils";

const STORAGE_KEY = "happus-tadka-state";

const defaultSettings: AppSettings = {
  restaurantName: "Happus Tadka",
  location: "Mahendinagar-4-Bhashi, Ghuiyaghat",
  tables: [],
  menuCategories: [],
};

const emptyState: AppState = {
  inventory: [],
  posOrders: [],
  kitchenOrders: [],
  transactions: [],
  ledgerEntries: [],
  financialAccounts: DEFAULT_FINANCIAL_ACCOUNTS,
  parties: DEFAULT_PARTIES,
  stockMovements: [],
  staff: [],
  settings: defaultSettings,
  kotCounter: 1000,
  txCounter: 1,
  orderCounter: 1,
};

const LEGACY_DIGITAL_ACCOUNT_ID = "fac-upi";

function migrateAccountId(accountId?: string): string | undefined {
  if (accountId === LEGACY_DIGITAL_ACCOUNT_ID) return DEFAULT_DIGITAL_ACCOUNT_ID;
  return accountId;
}

function migratePaymentMethod(method?: LedgerEntry["paymentMethod"]): LedgerEntry["paymentMethod"] {
  if ((method as string) === "upi") return "qr";
  return method;
}

function migrateFinancialAccounts(accounts: FinancialAccount[]): FinancialAccount[] {
  return accounts.map((a) => {
    const id = a.id === LEGACY_DIGITAL_ACCOUNT_ID ? DEFAULT_DIGITAL_ACCOUNT_ID : a.id;
    const name = a.name.replace(/\bUPI\b/gi, "QR");
    return id === a.id && name === a.name ? a : { ...a, id, name };
  });
}

function normalizeLedgerEntry(entry: LedgerEntry, defaultAccountId: string): LedgerEntry {
  const accountId = migrateAccountId(entry.accountId) ?? defaultAccountId;
  const kind =
    entry.kind ??
    (entry.debit > 0 && !entry.credit ? "payment" : entry.credit > 0 && !entry.debit ? "receipt" : "general");
  return {
    ...entry,
    date: normalizeIsoDate(entry.date),
    accountId,
    kind,
    paymentMethod: migratePaymentMethod(entry.paymentMethod),
  };
}

function normalizeTransaction(tx: Transaction): Transaction {
  return { ...tx, date: normalizeIsoDate(tx.date) };
}

function normalizeStockMovement(m: StockMovement): StockMovement {
  return { ...m, date: normalizeIsoDate(m.date) };
}

function hydrateState(parsed: AppState): AppState {
  try {
    const rawInventory = Array.isArray(parsed.inventory) ? parsed.inventory : [];
    const rawAccounts =
      Array.isArray(parsed.financialAccounts) && parsed.financialAccounts.length > 0
        ? parsed.financialAccounts
        : DEFAULT_FINANCIAL_ACCOUNTS;
    const financialAccounts = migrateFinancialAccounts(rawAccounts);
    const cashId = defaultCashAccountId(financialAccounts);
    const ledgerEntries = (Array.isArray(parsed.ledgerEntries) ? parsed.ledgerEntries : []).map((e) =>
      normalizeLedgerEntry(e, cashId)
    );
    const staff = Array.isArray(parsed.staff) ? parsed.staff : [];
    const withAdmin = staff.some((s) => s.role === "admin")
      ? staff
      : [...staff.filter((m) => m.id !== DEFAULT_ADMIN.id), DEFAULT_ADMIN];

    const inventory = ensureMenuCatalog(rawInventory);

    return {
      ...emptyState,
      ...parsed,
      inventory,
      posOrders: Array.isArray(parsed.posOrders) ? parsed.posOrders : [],
      kitchenOrders: Array.isArray(parsed.kitchenOrders) ? parsed.kitchenOrders : [],
      transactions: (Array.isArray(parsed.transactions) ? parsed.transactions : []).map(
        normalizeTransaction
      ),
      stockMovements: (Array.isArray(parsed.stockMovements) ? parsed.stockMovements : []).map(
        normalizeStockMovement
      ),
      staff: withAdmin,
      settings: {
        ...defaultSettings,
        ...(parsed.settings ?? {}),
        menuCategories: ensureMenuCategories(
          Array.isArray(parsed.settings?.menuCategories) ? parsed.settings.menuCategories : [],
          inventory
        ),
      },
      financialAccounts,
      ledgerEntries,
      parties: ensureDefaultParties(Array.isArray(parsed.parties) ? parsed.parties : []),
      kotCounter: typeof parsed.kotCounter === "number" ? parsed.kotCounter : emptyState.kotCounter,
      txCounter: typeof parsed.txCounter === "number" ? parsed.txCounter : emptyState.txCounter,
      orderCounter:
        typeof parsed.orderCounter === "number" ? parsed.orderCounter : emptyState.orderCounter,
    };
  } catch {
    return { ...emptyState, staff: [DEFAULT_ADMIN] };
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): AppState {
  if (typeof window === "undefined") return { ...emptyState, staff: [DEFAULT_ADMIN] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyState, staff: [DEFAULT_ADMIN] };
    const parsed = JSON.parse(raw) as AppState;
    const state = hydrateState(parsed);
    if (needsMenuCatalogPersist(Array.isArray(parsed.inventory) ? parsed.inventory : [])) {
      saveState(state);
    }
    return state;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return { ...emptyState, staff: [DEFAULT_ADMIN] };
  }
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export { menuFromInventory, isLowStock, ledgerBalance, todaySales } from "./store-utils";

type StoreContextValue = {
  state: AppState;
  menuItems: ReturnType<typeof menuFromInventory>;
  persist: (next: AppState) => void;
  addInventory: (item: Omit<InventoryItem, "id">) => void;
  updateInventory: (id: string, patch: Partial<InventoryItem>) => void;
  deleteInventory: (id: string) => void;
  adjustStock: (id: string, delta: number, note: string, type?: StockMovement["type"]) => void;
  addTransaction: (tx: Omit<Transaction, "id" | "date"> & { date?: string }) => void;
  recordInventorySale: (input: {
    itemId: string;
    stockQty: number;
    billQty: number;
    billUnit: string;
    unitPrice: number;
    date: string;
    party: string;
    accountId: string;
    paymentMethod: PaymentMethod;
    paymentType: "cash" | "credit";
  }) => { ok: true; transactionId: string } | { ok: false; error: string };
  recordInventoryPurchase: (input: {
    itemId: string;
    stockQty: number;
    billQty: number;
    billUnit: string;
    unitPrice: number;
    date: string;
    party: string;
    accountId: string;
    paymentMethod: PaymentMethod;
  }) => { ok: true; transactionId: string } | { ok: false; error: string };
  recordExpense: (input: {
    description: string;
    amount: number;
    date: string;
    party: string;
    accountId: string;
    paymentMethod: PaymentMethod;
    category?: string;
  }) => { ok: true; transactionId: string } | { ok: false; error: string };
  deleteTransaction: (id: string) => void;
  addLedgerEntry: (entry: Omit<LedgerEntry, "id">) => void;
  deleteLedgerEntry: (id: string) => void;
  addFinancialAccount: (account: Omit<FinancialAccount, "id">) => void;
  updateFinancialAccount: (id: string, patch: Partial<FinancialAccount>) => void;
  deleteFinancialAccount: (id: string) => { ok: true } | { ok: false; error: string };
  addParty: (party: Omit<Party, "id">) => void;
  updateParty: (id: string, patch: Partial<Party>) => { ok: true } | { ok: false; error: string };
  deleteParty: (id: string) => { ok: true } | { ok: false; error: string };
  addKitchenOrder: (order: Omit<KitchenOrder, "id" | "createdAt">) => string;
  createPosOrder: (table: string) => PosOrder;
  updatePosOrder: (id: string, patch: Partial<Pick<PosOrder, "items" | "discountType" | "discountValue" | "table">>) => void;
  cancelPosOrder: (id: string) => void;
  sendPosOrderToKitchen: (input: {
    posOrderId: string;
    table: string;
    items: { name: string; qty: number }[];
  }) => string | null;
  finalizePosOrder: (input: {
    posOrderId: string;
    table: string;
    items: { name: string; qty: number }[];
    stockLines: { inventoryId: string; qty: number; name: string }[];
    paymentLabel: string;
    paymentMethod: string;
    amountPaid: number;
    total: number;
    isCredit?: boolean;
    creditCustomer?: string;
  }) => { transactionId: string; kotId: string; orderRef: string } | null;
  updateKitchenStatus: (id: string, status: KitchenOrder["status"]) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  addMenuCategory: (input: { name: string; imageUrl?: string }) => { ok: true } | { ok: false; error: string };
  updateMenuCategory: (
    id: string,
    patch: Partial<Pick<MenuCategoryDef, "name" | "imageUrl" | "sortOrder">>
  ) => { ok: true } | { ok: false; error: string };
  removeMenuCategory: (id: string) => { ok: true } | { ok: false; error: string };
  addTable: (name: string) => void;
  removeTable: (id: string) => void;
  addStaff: (input: {
    name: string;
    username: string;
    password: string;
    role: StaffMember["role"];
    permissions: StaffMember["permissions"];
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateStaff: (
    id: string,
    patch: Partial<Pick<StaffMember, "name" | "username" | "role" | "permissions" | "active">>,
    newPassword?: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteStaff: (id: string) => { ok: true } | { ok: false; error: string };
  ensureDefaultAdmin: () => void;
  hydrated: boolean;
  refreshData: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { ready: authReady, session } = useAuth();
  const [state, setState] = useState<AppState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<AppState | null>(null);

  useLayoutEffect(() => {
    if (!authReady) return;

    let cancelled = false;
    setHydrated(false);

    (async () => {
      try {
        if (isRemoteDataSource()) {
          if (!session) {
            if (!cancelled) {
              setState({ ...emptyState, staff: [] });
            }
            return;
          }

          const remote = await loadAppStateClient();
          if (!cancelled) {
            if (remote) {
              const rawInventory = Array.isArray(remote.inventory) ? remote.inventory : [];
              const state = hydrateState(remote);
              setState(state);
              if (needsMenuCatalogPersist(rawInventory)) {
                void saveAppStateClient(state).catch((err) =>
                  console.error("Failed to sync menu catalog to server", err)
                );
              }
            } else {
              setState({ ...emptyState, staff: [] });
            }
          }
        } else {
          if (!cancelled) setState(loadState());
        }
      } catch {
        if (!cancelled) {
          setState(isRemoteDataSource() ? { ...emptyState, staff: [] } : { ...emptyState, staff: [DEFAULT_ADMIN] });
          if (!isRemoteDataSource()) {
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {
              /* ignore */
            }
          }
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, session?.staffId]);

  useEffect(() => {
    if (!authReady) return;
    const fallback = window.setTimeout(() => setHydrated(true), 2500);
    return () => window.clearTimeout(fallback);
  }, [authReady]);

  useEffect(() => {
    if (isRemoteDataSource() && !session) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      pendingSaveRef.current = null;
    }
  }, [session]);

  const persistToBackend = useCallback((next: AppState) => {
    if (isRemoteDataSource()) {
      if (!sessionRef.current) return;
      pendingSaveRef.current = next;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const toSave = pendingSaveRef.current;
        saveTimerRef.current = null;
        if (!toSave) return;
        void saveAppStateClient(toSave).catch((err) => console.error("Failed to save to server", err));
      }, 600);
    } else {
      saveState(next);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /** Ensure POS menu catalog exists in memory and sync to DB/local once after load */
  useEffect(() => {
    if (!hydrated) return;
    setState((prev) => {
      if (!needsMenuCatalogPersist(prev.inventory)) return prev;
      const next = { ...prev, inventory: ensureMenuCatalog(prev.inventory) };
      persistToBackend(next);
      return next;
    });
  }, [hydrated, persistToBackend]);

  /** Seed menu categories from catalog / inventory when missing */
  useEffect(() => {
    if (!hydrated) return;
    setState((prev) => {
      if (!needsMenuCategoriesPersist(prev.settings.menuCategories, prev.inventory)) return prev;
      const next = {
        ...prev,
        settings: {
          ...prev.settings,
          menuCategories: ensureMenuCategories(prev.settings.menuCategories, prev.inventory),
        },
      };
      persistToBackend(next);
      return next;
    });
  }, [hydrated, persistToBackend]);

  const persist = useCallback(
    (next: AppState) => {
      setState(next);
      persistToBackend(next);
    },
    [persistToBackend]
  );

  const patch = useCallback(
    (fn: (s: AppState) => AppState) => {
      setState((prev) => {
        const next = fn(prev);
        persistToBackend(next);
        return next;
      });
    },
    [persistToBackend]
  );

  const menuItems = useMemo(
    () => menuFromInventory(state.inventory, state.settings.menuCategories),
    [state.inventory, state.settings.menuCategories]
  );

  const addInventory = useCallback(
    (item: Omit<InventoryItem, "id">) => {
      patch((s) => ({
        ...s,
        inventory: [...s.inventory, { ...item, id: uid("inv") }],
      }));
    },
    [patch]
  );

  const updateInventory = useCallback(
    (id: string, data: Partial<InventoryItem>) => {
      patch((s) => ({
        ...s,
        inventory: s.inventory.map((i) => (i.id === id ? { ...i, ...data } : i)),
      }));
    },
    [patch]
  );

  const deleteInventory = useCallback(
    (id: string) => {
      patch((s) => ({
        ...s,
        inventory: s.inventory.filter((i) => i.id !== id),
      }));
    },
    [patch]
  );

  const adjustStock = useCallback(
    (id: string, delta: number, note: string, type: StockMovement["type"] = "adjust") => {
      patch((s) => {
        const item = s.inventory.find((i) => i.id === id);
        if (!item) return s;
        const movement: StockMovement = {
          id: uid("mov"),
          itemId: id,
          itemName: item.name,
          type,
          qty: Math.abs(delta),
          note,
          date: today(),
        };
        return {
          ...s,
          inventory: s.inventory.map((i) =>
            i.id === id ? { ...i, stockOnHand: Math.max(0, i.stockOnHand + delta) } : i
          ),
          stockMovements: [movement, ...s.stockMovements],
        };
      });
    },
    [patch]
  );

  const addTransaction = useCallback(
    (tx: Omit<Transaction, "id" | "date"> & { date?: string }) => {
      patch((s) => {
        const id = `TX-${String(s.txCounter).padStart(4, "0")}`;
        return {
          ...s,
          txCounter: s.txCounter + 1,
          transactions: [
            {
              ...tx,
              id,
              date: tx.date ?? today(),
            },
            ...s.transactions,
          ],
        };
      });
    },
    [patch]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      patch((s) => ({
        ...s,
        transactions: s.transactions.filter((t) => t.id !== id),
      }));
    },
    [patch]
  );

  const recordInventorySale = useCallback(
    (input: {
      itemId: string;
      stockQty: number;
      billQty: number;
      billUnit: string;
      unitPrice: number;
      date: string;
      party: string;
      accountId: string;
      paymentMethod: PaymentMethod;
      paymentType: "cash" | "credit";
    }) => {
      const item = state.inventory.find((i) => i.id === input.itemId);
      if (!item) return { ok: false as const, error: "Item not found" };
      if (input.stockQty > item.stockOnHand) {
        return {
          ok: false as const,
          error: `Only ${item.stockOnHand} ${item.unit} in stock`,
        };
      }

      const amount = input.billQty * input.unitPrice;
      const date = normalizeIsoDate(input.date);
      const party = input.party.trim() || "Cash sales & expenses";
      let transactionId = "";

      patch((s) => {
        const current = s.inventory.find((i) => i.id === input.itemId);
        if (!current || input.stockQty > current.stockOnHand) return s;

        transactionId = `TX-${String(s.txCounter).padStart(4, "0")}`;
        const description = `Sold ${input.billQty} ${input.billUnit} — ${current.name}`;
        const cashId = defaultCashAccountId(s.financialAccounts);
        const ledgerEntry: LedgerEntry | null =
          input.paymentType === "cash"
            ? normalizeLedgerEntry(
                {
                  id: "",
                  date,
                  description,
                  party,
                  credit: amount,
                  debit: 0,
                  accountId: input.accountId,
                  paymentMethod: input.paymentMethod,
                  kind: "receipt",
                },
                cashId
              )
            : null;

        return {
          ...s,
          txCounter: s.txCounter + 1,
          inventory: s.inventory.map((i) =>
            i.id === input.itemId
              ? { ...i, stockOnHand: Math.max(0, i.stockOnHand - input.stockQty) }
              : i
          ),
          stockMovements: [
            {
              id: uid("mov"),
              itemId: input.itemId,
              itemName: current.name,
              type: "sale" as const,
              qty: input.stockQty,
              note: `Sale: ${input.billQty} ${input.billUnit}`,
              date,
            },
            ...s.stockMovements,
          ],
          transactions: [
            {
              id: transactionId,
              type: "sale" as const,
              description,
              amount,
              date,
              category: party,
            },
            ...s.transactions,
          ],
          ledgerEntries: ledgerEntry
            ? [{ ...ledgerEntry, id: uid("led") }, ...s.ledgerEntries]
            : s.ledgerEntries,
        };
      });

      return transactionId
        ? ({ ok: true as const, transactionId })
        : ({ ok: false as const, error: "Could not record sale" });
    },
    [patch, state.inventory]
  );

  const recordInventoryPurchase = useCallback(
    (input: {
      itemId: string;
      stockQty: number;
      billQty: number;
      billUnit: string;
      unitPrice: number;
      date: string;
      party: string;
      accountId: string;
      paymentMethod: PaymentMethod;
    }) => {
      const item = state.inventory.find((i) => i.id === input.itemId);
      if (!item) return { ok: false as const, error: "Item not found" };

      const amount = input.billQty * input.unitPrice;
      const date = normalizeIsoDate(input.date);
      const party = input.party.trim() || "Supplier";
      let transactionId = "";

      patch((s) => {
        const current = s.inventory.find((i) => i.id === input.itemId);
        if (!current) return s;

        transactionId = `TX-${String(s.txCounter).padStart(4, "0")}`;
        const description = `Purchased ${input.billQty} ${input.billUnit} — ${current.name}`;
        const nextStock = current.stockOnHand + input.stockQty;
        const nextAvgCost =
          nextStock > 0
            ? (current.stockOnHand * current.avgCost + amount) / nextStock
            : input.unitPrice;
        const cashId = defaultCashAccountId(s.financialAccounts);
        const ledgerEntry = normalizeLedgerEntry(
          {
            id: "",
            date,
            description,
            party,
            debit: amount,
            credit: 0,
            accountId: input.accountId,
            paymentMethod: input.paymentMethod,
            kind: "payment",
          },
          cashId
        );

        return {
          ...s,
          txCounter: s.txCounter + 1,
          inventory: s.inventory.map((i) =>
            i.id === input.itemId
              ? { ...i, stockOnHand: nextStock, avgCost: nextAvgCost }
              : i
          ),
          stockMovements: [
            {
              id: uid("mov"),
              itemId: input.itemId,
              itemName: current.name,
              type: "in" as const,
              qty: input.stockQty,
              note: `Purchase: ${input.billQty} ${input.billUnit}`,
              date,
            },
            ...s.stockMovements,
          ],
          transactions: [
            {
              id: transactionId,
              type: "purchase" as const,
              description,
              amount,
              date,
              category: party,
            },
            ...s.transactions,
          ],
          ledgerEntries: [{ ...ledgerEntry, id: uid("led") }, ...s.ledgerEntries],
        };
      });

      return transactionId
        ? ({ ok: true as const, transactionId })
        : ({ ok: false as const, error: "Could not record purchase" });
    },
    [patch, state.inventory]
  );

  const recordExpense = useCallback(
    (input: {
      description: string;
      amount: number;
      date: string;
      party: string;
      accountId: string;
      paymentMethod: PaymentMethod;
      category?: string;
    }) => {
      const date = normalizeIsoDate(input.date);
      const party = input.party.trim() || "Cash sales & expenses";
      const description = input.description.trim();
      let transactionId = "";

      patch((s) => {
        transactionId = `TX-${String(s.txCounter).padStart(4, "0")}`;
        const cashId = defaultCashAccountId(s.financialAccounts);
        const ledgerEntry = normalizeLedgerEntry(
          {
            id: "",
            date,
            description,
            party,
            debit: input.amount,
            credit: 0,
            accountId: input.accountId,
            paymentMethod: input.paymentMethod,
            kind: "payment",
          },
          cashId
        );

        return {
          ...s,
          txCounter: s.txCounter + 1,
          transactions: [
            {
              id: transactionId,
              type: "expense" as const,
              description,
              amount: input.amount,
              date,
              category: input.category?.trim() || party,
            },
            ...s.transactions,
          ],
          ledgerEntries: [{ ...ledgerEntry, id: uid("led") }, ...s.ledgerEntries],
        };
      });

      return transactionId
        ? ({ ok: true as const, transactionId })
        : ({ ok: false as const, error: "Could not record expense" });
    },
    [patch]
  );

  const addLedgerEntry = useCallback(
    (entry: Omit<LedgerEntry, "id">) => {
      patch((s) => {
        const cashId = defaultCashAccountId(s.financialAccounts);
        const normalized = normalizeLedgerEntry({ ...entry, id: "" }, cashId);
        return {
          ...s,
          ledgerEntries: [{ ...normalized, id: uid("led") }, ...s.ledgerEntries],
        };
      });
    },
    [patch]
  );

  const addFinancialAccount = useCallback(
    (account: Omit<FinancialAccount, "id">) => {
      patch((s) => ({
        ...s,
        financialAccounts: [...s.financialAccounts, { ...account, id: uid("fac") }],
      }));
    },
    [patch]
  );

  const updateFinancialAccount = useCallback(
    (id: string, data: Partial<FinancialAccount>) => {
      patch((s) => ({
        ...s,
        financialAccounts: s.financialAccounts.map((a) => (a.id === id ? { ...a, ...data } : a)),
      }));
    },
    [patch]
  );

  const deleteFinancialAccount = useCallback(
    (id: string) => {
      const inUse = state.ledgerEntries.some((e) => e.accountId === id);
      if (inUse) {
        return { ok: false as const, error: "Account has ledger entries — cannot delete" };
      }
      if (state.financialAccounts.length <= 1) {
        return { ok: false as const, error: "Keep at least one financial account" };
      }
      patch((s) => ({
        ...s,
        financialAccounts: s.financialAccounts.filter((a) => a.id !== id),
      }));
      return { ok: true as const };
    },
    [patch, state.financialAccounts.length, state.ledgerEntries]
  );

  const deleteLedgerEntry = useCallback(
    (id: string) => {
      patch((s) => ({
        ...s,
        ledgerEntries: s.ledgerEntries.filter((e) => e.id !== id),
      }));
    },
    [patch]
  );

  const addParty = useCallback(
    (party: Omit<Party, "id">) => {
      patch((s) => ({
        ...s,
        parties: [...s.parties, { ...party, id: uid("party") }],
      }));
    },
    [patch]
  );

  const updateParty = useCallback(
    (id: string, data: Partial<Party>) => {
      if (isFixedLedgerParty(id)) {
        return { ok: false as const, error: "Cash sales & expenses cannot be edited" };
      }
      patch((s) => {
        const existing = s.parties.find((p) => p.id === id);
        const newName = data.name?.trim();
        const renameEntries =
          existing && newName && newName !== existing.name
            ? s.ledgerEntries.map((e) =>
                (e.party ?? "").trim() === existing.name ? { ...e, party: newName } : e
              )
            : s.ledgerEntries;
        return {
          ...s,
          ledgerEntries: renameEntries,
          parties: s.parties.map((p) => (p.id === id ? { ...p, ...data, ...(newName ? { name: newName } : {}) } : p)),
        };
      });
      return { ok: true as const };
    },
    [patch]
  );

  const deleteParty = useCallback(
    (id: string) => {
      if (isFixedLedgerParty(id)) {
        return { ok: false as const, error: "Cash sales & expenses cannot be deleted" };
      }
      patch((s) => ({
        ...s,
        parties: s.parties.filter((p) => p.id !== id),
      }));
      return { ok: true as const };
    },
    [patch]
  );

  const addKitchenOrder = useCallback(
    (order: Omit<KitchenOrder, "id" | "createdAt">) => {
      let newId = "";
      patch((s) => {
        newId = `KOT-${s.kotCounter}`;
        return {
          ...s,
          kotCounter: s.kotCounter + 1,
          kitchenOrders: [
            {
              ...order,
              id: newId,
              createdAt: new Date().toISOString(),
            },
            ...s.kitchenOrders,
          ],
        };
      });
      return newId;
    },
    [patch]
  );

  const createPosOrder = useCallback(
    (table: string): PosOrder => {
      const existing = state.posOrders.find((o) => o.status === "open" && o.table === table);
      if (existing) return existing;

      const draft: PosOrder = {
        id: uid("ord"),
        orderRef: formatPosOrderRef(state.orderCounter),
        table,
        items: [],
        status: "open",
        discountType: "flat",
        discountValue: 0,
        createdAt: new Date().toISOString(),
      };

      let resolved: PosOrder = draft;
      patch((s) => {
        const again = s.posOrders.find((o) => o.status === "open" && o.table === table);
        if (again) {
          resolved = again;
          return s;
        }
        resolved = draft;
        return {
          ...s,
          orderCounter: s.orderCounter + 1,
          posOrders: [draft, ...s.posOrders],
        };
      });

      return resolved;
    },
    [patch, state.posOrders, state.orderCounter]
  );

  const updatePosOrder = useCallback(
    (
      id: string,
      data: Partial<Pick<PosOrder, "items" | "discountType" | "discountValue" | "table">>
    ) => {
      patch((s) => ({
        ...s,
        posOrders: s.posOrders.map((o) =>
          o.id === id && o.status === "open" ? { ...o, ...data } : o
        ),
      }));
    },
    [patch]
  );

  const cancelPosOrder = useCallback(
    (id: string) => {
      patch((s) => {
        const order = s.posOrders.find((o) => o.id === id && o.status === "open");
        const kotId = order?.kitchenOrderId;
        return {
          ...s,
          posOrders: s.posOrders.map((o) =>
            o.id === id && o.status === "open" ? { ...o, status: "cancelled" as const } : o
          ),
          kitchenOrders: kotId
            ? s.kitchenOrders.filter((k) => k.id !== kotId)
            : s.kitchenOrders,
        };
      });
    },
    [patch]
  );

  const sendPosOrderToKitchen = useCallback(
    (input: {
      posOrderId: string;
      table: string;
      items: { name: string; qty: number }[];
    }) => {
      if (!input.items.length) return null;

      let kotId: string | null = null;

      patch((s) => {
        const openOrder = s.posOrders.find((o) => o.id === input.posOrderId && o.status === "open");
        if (!openOrder) return s;

        const now = new Date().toISOString();
        const existingKotId = openOrder.kitchenOrderId;

        if (existingKotId) {
          kotId = existingKotId;
          return {
            ...s,
            posOrders: s.posOrders.map((o) =>
              o.id === input.posOrderId ? { ...o, sentToKitchenAt: o.sentToKitchenAt ?? now } : o
            ),
            kitchenOrders: s.kitchenOrders.map((k) =>
              k.id === existingKotId
                ? {
                    ...k,
                    table: input.table,
                    items: input.items,
                    orderRef: openOrder.orderRef,
                    posOrderId: input.posOrderId,
                  }
                : k
            ),
          };
        }

        kotId = `KOT-${s.kotCounter}`;
        return {
          ...s,
          kotCounter: s.kotCounter + 1,
          posOrders: s.posOrders.map((o) =>
            o.id === input.posOrderId
              ? { ...o, kitchenOrderId: kotId!, sentToKitchenAt: now }
              : o
          ),
          kitchenOrders: [
            {
              id: kotId!,
              table: input.table,
              items: input.items,
              status: "new" as const,
              priority: "normal" as const,
              createdAt: now,
              posOrderId: input.posOrderId,
              orderRef: openOrder.orderRef,
            },
            ...s.kitchenOrders,
          ],
        };
      });

      return kotId;
    },
    [patch]
  );

  const finalizePosOrder = useCallback(
    (input: {
      posOrderId: string;
      table: string;
      items: { name: string; qty: number }[];
      stockLines: { inventoryId: string; qty: number; name: string }[];
      paymentLabel: string;
      paymentMethod: string;
      amountPaid: number;
      total: number;
      isCredit?: boolean;
      creditCustomer?: string;
    }) => {
      if (input.items.length === 0 || input.total <= 0) return null;
      if (input.isCredit) {
        if (!input.creditCustomer?.trim()) return null;
      } else if (input.amountPaid < input.total || input.amountPaid <= 0) {
        return null;
      }

      const saleAmount = input.isCredit ? input.total : input.amountPaid;

      let result: { transactionId: string; kotId: string; orderRef: string } | null = null;

      patch((s) => {
        const openOrder = s.posOrders.find((o) => o.id === input.posOrderId && o.status === "open");
        if (!openOrder) return s;

        const transactionId = `TX-${String(s.txCounter).padStart(4, "0")}`;
        const existingKotId = openOrder.kitchenOrderId;
        const kotId = existingKotId ?? `KOT-${s.kotCounter}`;
        const orderRef = openOrder.orderRef;
        const now = new Date().toISOString();
        const date = today();

        let inventory = s.inventory;
        const stockMovements = [...s.stockMovements];

        for (const line of input.stockLines) {
          const item = inventory.find((i) => i.id === line.inventoryId);
          if (!item) continue;
          stockMovements.unshift({
            id: uid("mov"),
            itemId: line.inventoryId,
            itemName: line.name,
            type: "sale",
            qty: line.qty,
            note: `POS sale: ${line.qty}× ${line.name}`,
            date,
          });
          inventory = inventory.map((i) =>
            i.id === line.inventoryId
              ? { ...i, stockOnHand: Math.max(0, i.stockOnHand - line.qty) }
              : i
          );
        }

        result = { transactionId, kotId, orderRef };

        const kitchenOrders = existingKotId
          ? s.kitchenOrders.map((k) =>
              k.id === existingKotId
                ? {
                    ...k,
                    table: input.table,
                    items: input.items,
                    transactionId,
                    orderRef,
                    posOrderId: input.posOrderId,
                  }
                : k
            )
          : [
              {
                id: kotId,
                table: input.table,
                items: input.items,
                status: "new" as const,
                priority: "normal" as const,
                createdAt: now,
                transactionId,
                orderRef,
                posOrderId: input.posOrderId,
              },
              ...s.kitchenOrders,
            ];

        return {
          ...s,
          txCounter: s.txCounter + 1,
          kotCounter: existingKotId ? s.kotCounter : s.kotCounter + 1,
          inventory,
          stockMovements,
          transactions: [
            {
              id: transactionId,
              type: "sale" as const,
              description: `POS ${input.table} — ${input.paymentLabel}`,
              amount: saleAmount,
              date,
            },
            ...s.transactions,
          ],
          posOrders: s.posOrders.map((o) =>
            o.id === input.posOrderId
              ? {
                  ...o,
                  status: "paid" as const,
                  paidAt: now,
                  transactionId,
                  paymentMethod: input.paymentMethod,
                  creditCustomer: input.creditCustomer?.trim() || undefined,
                  amountPaid: input.amountPaid,
                  kitchenOrderId: kotId,
                }
              : o
          ),
          kitchenOrders,
        };
      });

      return result;
    },
    [patch]
  );

  const updateKitchenStatus = useCallback(
    (id: string, status: KitchenOrder["status"]) => {
      patch((s) => ({
        ...s,
        kitchenOrders: s.kitchenOrders.map((o) => (o.id === id ? { ...o, status } : o)),
      }));
    },
    [patch]
  );

  const updateSettings = useCallback(
    (data: Partial<AppSettings>) => {
      patch((s) => ({
        ...s,
        settings: { ...s.settings, ...data },
      }));
    },
    [patch]
  );

  const addTable = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      patch((s) => ({
        ...s,
        settings: {
          ...s.settings,
          tables: [...s.settings.tables, { id: uid("tbl"), name: trimmed }],
        },
      }));
    },
    [patch]
  );

  const removeTable = useCallback(
    (id: string) => {
      patch((s) => ({
        ...s,
        settings: {
          ...s.settings,
          tables: s.settings.tables.filter((t) => t.id !== id),
        },
      }));
    },
    [patch]
  );

  const addMenuCategory = useCallback(
    (input: { name: string; imageUrl?: string }): { ok: true } | { ok: false; error: string } => {
      const name = input.name.trim();
      if (!name) return { ok: false, error: "Category name is required" };
      const imageUrl = input.imageUrl?.trim() || undefined;
      let result: { ok: true } | { ok: false; error: string } = { ok: false, error: "Duplicate category" };
      patch((s) => {
        const key = name.toLowerCase();
        if (s.settings.menuCategories.some((c) => c.name.trim().toLowerCase() === key)) {
          result = { ok: false, error: `Category “${name}” already exists` };
          return s;
        }
        const maxOrder = s.settings.menuCategories.reduce((m, c) => Math.max(m, c.sortOrder), -1);
        result = { ok: true };
        return {
          ...s,
          settings: {
            ...s.settings,
            menuCategories: [
              ...s.settings.menuCategories,
              { id: uid("cat"), name, imageUrl, sortOrder: maxOrder + 1 },
            ],
          },
        };
      });
      return result;
    },
    [patch]
  );

  const updateMenuCategory = useCallback(
    (
      id: string,
      data: Partial<Pick<MenuCategoryDef, "name" | "imageUrl" | "sortOrder">>
    ): { ok: true } | { ok: false; error: string } => {
      let result: { ok: true } | { ok: false; error: string } = { ok: false, error: "Category not found" };
      patch((s) => {
        const current = s.settings.menuCategories.find((c) => c.id === id);
        if (!current) return s;
        const name = (data.name ?? current.name).trim();
        if (!name) {
          result = { ok: false, error: "Category name is required" };
          return s;
        }
        const key = name.toLowerCase();
        if (
          s.settings.menuCategories.some(
            (c) => c.id !== id && c.name.trim().toLowerCase() === key
          )
        ) {
          result = { ok: false, error: `Category “${name}” already exists` };
          return s;
        }
        const imageUrl =
          data.imageUrl !== undefined ? data.imageUrl.trim() || undefined : current.imageUrl;
        result = { ok: true };
        return {
          ...s,
          settings: {
            ...s.settings,
            menuCategories: s.settings.menuCategories.map((c) =>
              c.id === id
                ? {
                    ...c,
                    name,
                    imageUrl,
                    sortOrder: data.sortOrder ?? c.sortOrder,
                  }
                : c
            ),
          },
        };
      });
      return result;
    },
    [patch]
  );

  const removeMenuCategory = useCallback(
    (id: string): { ok: true } | { ok: false; error: string } => {
      let result: { ok: true } | { ok: false; error: string } = { ok: false, error: "Category not found" };
      patch((s) => {
        const cat = s.settings.menuCategories.find((c) => c.id === id);
        if (!cat) return s;
        const inUse = s.inventory.some(
          (i) => i.category.trim().toLowerCase() === cat.name.trim().toLowerCase()
        );
        if (inUse) {
          result = {
            ok: false,
            error: `Move or delete items in “${cat.name}” before removing this category`,
          };
          return s;
        }
        result = { ok: true };
        return {
          ...s,
          settings: {
            ...s.settings,
            menuCategories: s.settings.menuCategories.filter((c) => c.id !== id),
          },
        };
      });
      return result;
    },
    [patch]
  );

  const ensureDefaultAdmin = useCallback(() => {
    patch((s) => {
      if (s.staff.some((m) => m.role === "admin")) return s;
      return { ...s, staff: [...s.staff.filter((m) => m.id !== DEFAULT_ADMIN.id), DEFAULT_ADMIN] };
    });
  }, [patch]);

  const addStaff = useCallback(
    async (input: {
      name: string;
      username: string;
      password: string;
      role: StaffMember["role"];
      permissions: StaffMember["permissions"];
    }) => {
      const username = input.username.trim().toLowerCase();
      if (!input.name.trim()) return { ok: false as const, error: "Name is required" };
      if (!username) return { ok: false as const, error: "Username is required" };
      if (input.password.length < 4) {
        return { ok: false as const, error: "Password must be at least 4 characters" };
      }
      if (state.staff.some((s) => s.username.trim().toLowerCase() === username)) {
        return { ok: false as const, error: "Username already in use" };
      }
      const passwordHash = await hashPassword(input.password);
      const member: StaffMember = {
        id: uid("staff"),
        name: input.name.trim(),
        username,
        passwordHash,
        role: input.role,
        permissions: input.role === "admin" ? ALL_PERMISSIONS : input.permissions,
        active: true,
        createdAt: new Date().toISOString(),
      };
      patch((s) => ({ ...s, staff: [...s.staff, member] }));
      return { ok: true as const };
    },
    [patch, state.staff]
  );

  const updateStaff = useCallback(
    async (
      id: string,
      data: Partial<Pick<StaffMember, "name" | "username" | "role" | "permissions" | "active">>,
      newPassword?: string
    ) => {
      const existing = state.staff.find((s) => s.id === id);
      if (!existing) return { ok: false as const, error: "Staff not found" };

      const username = data.username?.trim().toLowerCase() ?? existing.username;
      if (state.staff.some((s) => s.id !== id && s.username.trim().toLowerCase() === username)) {
        return { ok: false as const, error: "Username already in use" };
      }

      if (existing.role === "admin" && data.active === false) {
        const admins = state.staff.filter((s) => s.role === "admin" && s.active);
        if (admins.length <= 1) {
          return { ok: false as const, error: "Cannot disable the only admin account" };
        }
      }

      let passwordHash = existing.passwordHash;
      if (newPassword) {
        if (newPassword.length < 4) {
          return { ok: false as const, error: "Password must be at least 4 characters" };
        }
        passwordHash = await hashPassword(newPassword);
      }

      const role = data.role ?? existing.role;
      patch((s) => ({
        ...s,
        staff: s.staff.map((m) =>
          m.id === id
            ? {
                ...m,
                ...data,
                username,
                passwordHash,
                role,
                permissions: role === "admin" ? ALL_PERMISSIONS : (data.permissions ?? m.permissions),
              }
            : m
        ),
      }));
      return { ok: true as const };
    },
    [patch, state.staff]
  );

  const deleteStaff = useCallback(
    (id: string) => {
      const member = state.staff.find((s) => s.id === id);
      if (!member) return { ok: false as const, error: "Staff not found" };
      if (member.role === "admin") {
        const admins = state.staff.filter((s) => s.role === "admin");
        if (admins.length <= 1) {
          return { ok: false as const, error: "Cannot delete the only admin account" };
        }
      }
      patch((s) => ({ ...s, staff: s.staff.filter((m) => m.id !== id) }));
      return { ok: true as const };
    },
    [patch, state.staff]
  );

  const refreshData = useCallback(() => {
    void (async () => {
      try {
        if (isRemoteDataSource()) {
          const remote = await loadAppStateClient();
          if (remote) setState(hydrateState(remote));
        } else {
          setState(loadState());
        }
      } catch {
        /* keep current state */
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated || isRemoteDataSource()) return;
    ensureDefaultAdmin();
  }, [hydrated, ensureDefaultAdmin]);

  const value = useMemo<StoreContextValue>(
    () => ({
      state: hydrated ? state : emptyState,
      menuItems,
      persist,
      addInventory,
      updateInventory,
      deleteInventory,
      adjustStock,
      addTransaction,
      recordInventorySale,
      recordInventoryPurchase,
      recordExpense,
      deleteTransaction,
      addLedgerEntry,
      deleteLedgerEntry,
      addFinancialAccount,
      updateFinancialAccount,
      deleteFinancialAccount,
      addParty,
      updateParty,
      deleteParty,
      addKitchenOrder,
      createPosOrder,
      updatePosOrder,
      cancelPosOrder,
      sendPosOrderToKitchen,
      finalizePosOrder,
      updateKitchenStatus,
      updateSettings,
      addMenuCategory,
      updateMenuCategory,
      removeMenuCategory,
      addTable,
      removeTable,
      addStaff,
      updateStaff,
      deleteStaff,
      ensureDefaultAdmin,
      refreshData,
      hydrated,
    }),
    [
      hydrated,
      state,
      menuItems,
      persist,
      addInventory,
      updateInventory,
      deleteInventory,
      adjustStock,
      addTransaction,
      recordInventorySale,
      recordInventoryPurchase,
      recordExpense,
      deleteTransaction,
      addLedgerEntry,
      deleteLedgerEntry,
      addFinancialAccount,
      updateFinancialAccount,
      deleteFinancialAccount,
      addParty,
      updateParty,
      deleteParty,
      addKitchenOrder,
      createPosOrder,
      updatePosOrder,
      cancelPosOrder,
      sendPosOrderToKitchen,
      finalizePosOrder,
      updateKitchenStatus,
      updateSettings,
      addMenuCategory,
      updateMenuCategory,
      removeMenuCategory,
      addTable,
      removeTable,
      addStaff,
      updateStaff,
      deleteStaff,
      ensureDefaultAdmin,
      refreshData,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
