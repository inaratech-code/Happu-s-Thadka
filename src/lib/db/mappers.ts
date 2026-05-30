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
} from "@/lib/types";
import { ensureMenuCatalog } from "@/lib/default-menu";
import { DEFAULT_PARTIES, ensureDefaultParties } from "@/lib/default-parties";
import { DEFAULT_FINANCIAL_ACCOUNTS } from "@/lib/default-accounts";
import { DEFAULT_ADMIN } from "@/lib/default-admin";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import type { AppPermission } from "@/lib/permissions";

export type DbRows = {
  restaurant: {
    id: string;
    name: string;
    location: string;
    kot_counter: number;
    tx_counter: number;
  } | null;
  tables: { id: string; name: string }[];
  staff: {
    id: string;
    name: string;
    username: string;
    password_hash: string;
    role: string;
    permissions: string[];
    active: boolean;
    created_at: string;
  }[];
  inventory: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  financial_accounts: Record<string, unknown>[];
  parties: Record<string, unknown>[];
  ledger_entries: Record<string, unknown>[];
  stock_movements: Record<string, unknown>[];
  kitchen_orders: Record<string, unknown>[];
};

export function rowsToAppState(rows: DbRows): AppState {
  const r = rows.restaurant;
  const settings: AppSettings = {
    restaurantName: r?.name ?? "Happus Tadka",
    location: r?.location ?? "",
    tables: rows.tables.map((t) => ({ id: t.id, name: t.name })),
  };

  const staff: StaffMember[] = rows.staff.map((s) => ({
    id: s.id,
    name: s.name,
    username: s.username,
    passwordHash: s.password_hash,
    role: s.role as StaffMember["role"],
    permissions: (s.role === "admin" ? ALL_PERMISSIONS : s.permissions) as AppPermission[],
    active: s.active,
    createdAt: s.created_at,
  }));

  return {
    inventory: ensureMenuCatalog(rows.inventory.map(mapInventory)),
    kitchenOrders: rows.kitchen_orders.map(mapKitchenOrder),
    transactions: rows.transactions.map(mapTransaction),
    ledgerEntries: rows.ledger_entries.map(mapLedgerEntry),
    financialAccounts:
      rows.financial_accounts.length > 0
        ? rows.financial_accounts.map(mapFinancialAccount)
        : DEFAULT_FINANCIAL_ACCOUNTS,
    parties: ensureDefaultParties(
      rows.parties.length > 0 ? rows.parties.map(mapParty) : DEFAULT_PARTIES
    ),
    stockMovements: rows.stock_movements.map(mapStockMovement),
    staff: staff.length > 0 ? staff : [DEFAULT_ADMIN],
    settings,
    kotCounter: r?.kot_counter ?? 1000,
    txCounter: r?.tx_counter ?? 1,
  };
}

function mapInventory(row: Record<string, unknown>): InventoryItem {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    stockOnHand: Number(row.stock_on_hand),
    unit: row.unit as string,
    avgCost: Number(row.avg_cost),
    sellingPrice: Number(row.selling_price),
    reorderAt: Number(row.reorder_at),
    type: row.item_type as InventoryItem["type"],
  };
}

function mapTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    type: row.tx_type as Transaction["type"],
    description: row.description as string,
    amount: Number(row.amount),
    date: String(row.tx_date).slice(0, 10),
    category: (row.category as string) ?? undefined,
  };
}

function mapFinancialAccount(row: Record<string, unknown>): FinancialAccount {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.account_type as FinancialAccount["type"],
    openingBalance: Number(row.opening_balance),
    active: Boolean(row.active),
  };
}

function mapParty(row: Record<string, unknown>): Party {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.party_type as Party["type"],
    phone: (row.phone as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    active: Boolean(row.active),
  };
}

function mapLedgerEntry(row: Record<string, unknown>): LedgerEntry {
  return {
    id: row.id as string,
    date: String(row.entry_date).slice(0, 10),
    description: row.description as string,
    debit: Number(row.debit),
    credit: Number(row.credit),
    accountId: (row.account_id as string) ?? undefined,
    party: (row.party as string) ?? undefined,
    paymentMethod: (row.payment_method as LedgerEntry["paymentMethod"]) ?? undefined,
    kind: (row.kind as LedgerEntry["kind"]) ?? undefined,
  };
}

function mapStockMovement(row: Record<string, unknown>): StockMovement {
  return {
    id: row.id as string,
    itemId: row.item_id as string,
    itemName: row.item_name as string,
    type: row.movement_type as StockMovement["type"],
    qty: Number(row.qty),
    note: row.note as string,
    date: String(row.movement_date).slice(0, 10),
  };
}

function mapKitchenOrder(row: Record<string, unknown>): KitchenOrder {
  const items = row.items;
  return {
    id: row.id as string,
    table: row.table_name as string,
    items: Array.isArray(items) ? (items as KitchenOrder["items"]) : [],
    status: row.status as KitchenOrder["status"],
    createdAt: row.created_at as string,
    priority: row.priority as KitchenOrder["priority"],
  };
}

export function appStateToDbPayload(state: AppState, restaurantId: string) {
  return {
    restaurant: {
      id: restaurantId,
      name: state.settings.restaurantName,
      location: state.settings.location,
      kot_counter: state.kotCounter,
      tx_counter: state.txCounter,
    },
    tables: state.settings.tables.map((t) => ({
      id: t.id,
      restaurant_id: restaurantId,
      name: t.name,
    })),
    staff: state.staff.map((s) => ({
      id: s.id,
      restaurant_id: restaurantId,
      name: s.name,
      username: s.username.trim().toLowerCase(),
      password_hash: s.passwordHash,
      role: s.role,
      permissions: s.role === "admin" ? [] : s.permissions,
      active: s.active,
      created_at: s.createdAt,
    })),
    inventory: state.inventory.map((i) => ({
      id: i.id,
      restaurant_id: restaurantId,
      name: i.name,
      category: i.category,
      stock_on_hand: i.stockOnHand,
      unit: i.unit,
      avg_cost: i.avgCost,
      selling_price: i.sellingPrice,
      reorder_at: i.reorderAt,
      item_type: i.type,
    })),
    transactions: state.transactions.map((t) => ({
      id: t.id,
      restaurant_id: restaurantId,
      tx_type: t.type,
      description: t.description,
      amount: t.amount,
      tx_date: t.date,
      category: t.category ?? null,
    })),
    financial_accounts: state.financialAccounts.map((a) => ({
      id: a.id,
      restaurant_id: restaurantId,
      name: a.name,
      account_type: a.type,
      opening_balance: a.openingBalance,
      active: a.active,
    })),
    parties: state.parties.map((p) => ({
      id: p.id,
      restaurant_id: restaurantId,
      name: p.name,
      party_type: p.type,
      phone: p.phone ?? null,
      note: p.note ?? null,
      active: p.active,
    })),
    ledger_entries: state.ledgerEntries.map((e) => ({
      id: e.id,
      restaurant_id: restaurantId,
      entry_date: e.date,
      description: e.description,
      debit: e.debit,
      credit: e.credit,
      account_id: e.accountId ?? null,
      party: e.party ?? null,
      payment_method: e.paymentMethod ?? null,
      kind: e.kind ?? null,
    })),
    stock_movements: state.stockMovements.map((m) => ({
      id: m.id,
      restaurant_id: restaurantId,
      item_id: m.itemId,
      item_name: m.itemName,
      movement_type: m.type,
      qty: m.qty,
      note: m.note,
      movement_date: m.date,
    })),
    kitchen_orders: state.kitchenOrders.map((o) => ({
      id: o.id,
      restaurant_id: restaurantId,
      table_name: o.table,
      items: o.items,
      status: o.status,
      priority: o.priority,
      created_at: o.createdAt,
    })),
  };
}
