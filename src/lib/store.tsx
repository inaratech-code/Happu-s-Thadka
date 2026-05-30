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
  Party,
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
import { menuFromInventory } from "./store-utils";

const STORAGE_KEY = "happus-tadka-state";

const defaultSettings: AppSettings = {
  restaurantName: "Happus Tadka",
  location: "Mahendinagar-4-Bhashi, Ghuiyaghat",
  tables: [],
};

const emptyState: AppState = {
  inventory: [],
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
    accountId,
    kind,
    paymentMethod: migratePaymentMethod(entry.paymentMethod),
  };
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
      kitchenOrders: Array.isArray(parsed.kitchenOrders) ? parsed.kitchenOrders : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      stockMovements: Array.isArray(parsed.stockMovements) ? parsed.stockMovements : [],
      staff: withAdmin,
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
      financialAccounts,
      ledgerEntries,
      parties: ensureDefaultParties(Array.isArray(parsed.parties) ? parsed.parties : []),
      kotCounter: typeof parsed.kotCounter === "number" ? parsed.kotCounter : emptyState.kotCounter,
      txCounter: typeof parsed.txCounter === "number" ? parsed.txCounter : emptyState.txCounter,
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
  updateKitchenStatus: (id: string, status: KitchenOrder["status"]) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
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
  const [state, setState] = useState<AppState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (isRemoteDataSource()) {
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
  }, []);

  useEffect(() => {
    const fallback = window.setTimeout(() => setHydrated(true), 2500);
    return () => window.clearTimeout(fallback);
  }, []);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<AppState | null>(null);

  const persistToBackend = useCallback((next: AppState) => {
    if (isRemoteDataSource()) {
      pendingSaveRef.current = next;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const toSave = pendingSaveRef.current;
        saveTimerRef.current = null;
        if (!toSave) return;
        void saveAppStateClient(toSave).catch((err) => console.error("Failed to save to server", err));
      }, 250);
    } else {
      saveState(next);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

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

  const menuItems = useMemo(() => menuFromInventory(state.inventory), [state.inventory]);

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

  const value: StoreContextValue = {
    state: hydrated ? state : emptyState,
    menuItems: hydrated ? menuItems : [],
    persist,
    addInventory,
    updateInventory,
    deleteInventory,
    adjustStock,
    addTransaction,
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
    updateKitchenStatus,
    updateSettings,
    addTable,
    removeTable,
    addStaff,
    updateStaff,
    deleteStaff,
    ensureDefaultAdmin,
    refreshData,
    hydrated,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
