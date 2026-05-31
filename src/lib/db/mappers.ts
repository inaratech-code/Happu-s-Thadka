import { normalizeIsoDate } from "@/lib/iso-date";
import type {
  AppSettings,
  AppState,
  FinancialAccount,
  InventoryItem,
  KitchenOrder,
  LedgerEntry,
  MenuCategoryDef,
  Party,
  StaffMember,
  StockMovement,
  Transaction,
  PosOrder,
} from "@/lib/types";
import { ensureMenuCatalog } from "@/lib/default-menu";
import { ensureMenuCategories } from "@/lib/menu-categories";
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
    order_counter: number;
  } | null;
  tables: { id: string; name: string }[];
  menu_categories: {
    id: string;
    name: string;
    image_url: string | null;
    sort_order: number;
  }[];
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
  pos_orders: Record<string, unknown>[];
};

export function rowsToAppState(rows: DbRows): AppState {
  const r = rows.restaurant;
  const inventory = ensureMenuCatalog(rows.inventory.map(mapInventory));
  const menuCategories: MenuCategoryDef[] =
    rows.menu_categories.length > 0
      ? rows.menu_categories
          .map((c) => ({
            id: c.id,
            name: c.name,
            imageUrl: c.image_url ?? undefined,
            sortOrder: Number(c.sort_order) || 0,
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      : ensureMenuCategories([], inventory);

  const settings: AppSettings = {
    restaurantName: r?.name ?? "Happus Tadka",
    location: r?.location ?? "",
    tables: rows.tables.map((t) => ({ id: t.id, name: t.name })),
    menuCategories,
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
    inventory,
    posOrders: rows.pos_orders.map(mapPosOrder),
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
    orderCounter: r?.order_counter ?? 1,
  };
}

function mapPosOrder(row: Record<string, unknown>): PosOrder {
  const items = row.items;
  return {
    id: row.id as string,
    orderRef: row.order_ref as string,
    table: row.table_name as string,
    items: Array.isArray(items) ? (items as PosOrder["items"]) : [],
    status: row.status as PosOrder["status"],
    discountType: (row.discount_type as PosOrder["discountType"]) ?? "flat",
    discountValue: Number(row.discount_value ?? 0),
    createdAt: row.created_at as string,
    paidAt: (row.paid_at as string) ?? undefined,
    transactionId: (row.transaction_id as string) ?? undefined,
    paymentMethod: (row.payment_method as string) ?? undefined,
    creditCustomer: (row.credit_customer as string) ?? undefined,
    amountPaid: row.amount_paid != null ? Number(row.amount_paid) : undefined,
    kitchenOrderId: (row.kitchen_order_id as string) ?? undefined,
    sentToKitchenAt: (row.sent_to_kitchen_at as string) ?? undefined,
  };
}

export function mapInventory(row: Record<string, unknown>): InventoryItem {
  const imageUrl = row.image_url as string | null | undefined;
  const sellingPrice = Number(row.selling_price) || 0;
  const rawType = row.item_type as string | null | undefined;
  const type: InventoryItem["type"] =
    rawType === "sellable" || rawType === "consumable"
      ? rawType
      : sellingPrice > 0
        ? "sellable"
        : "consumable";
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    stockOnHand: Number(row.stock_on_hand),
    unit: (row.unit as string) || "pcs",
    avgCost: Number(row.avg_cost) || 0,
    sellingPrice,
    reorderAt: Number(row.reorder_at) || 0,
    type,
    imageUrl: imageUrl ?? undefined,
  };
}

function mapTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    type: row.tx_type as Transaction["type"],
    description: row.description as string,
    amount: Number(row.amount),
    date: normalizeIsoDate(row.tx_date),
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
    date: normalizeIsoDate(row.entry_date),
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
    date: normalizeIsoDate(row.movement_date),
  };
}

function mapKitchenOrder(row: Record<string, unknown>): KitchenOrder {
  const items = row.items;
  const transactionId = row.transaction_id as string | null | undefined;
  const orderRef = row.order_ref as string | null | undefined;
  const posOrderId = row.pos_order_id as string | null | undefined;
  return {
    id: row.id as string,
    table: row.table_name as string,
    items: Array.isArray(items) ? (items as KitchenOrder["items"]) : [],
    status: row.status as KitchenOrder["status"],
    createdAt: row.created_at as string,
    priority: row.priority as KitchenOrder["priority"],
    posOrderId: posOrderId ?? undefined,
    orderRef: orderRef ?? undefined,
    transactionId: transactionId ?? undefined,
  };
}

function ensureStaffForPersist(staff: StaffMember[]): StaffMember[] {
  const activeAdmin = staff.some((m) => m.active && m.role === "admin");
  if (activeAdmin) return staff;
  return [...staff.filter((m) => m.id !== DEFAULT_ADMIN.id), DEFAULT_ADMIN];
}

export function appStateToDbPayload(state: AppState, restaurantId: string) {
  const staff = ensureStaffForPersist(state.staff);
  return {
    restaurant: {
      id: restaurantId,
      name: state.settings.restaurantName,
      location: state.settings.location,
      kot_counter: state.kotCounter,
      tx_counter: state.txCounter,
      order_counter: state.orderCounter,
    },
    tables: state.settings.tables.map((t) => ({
      id: t.id,
      restaurant_id: restaurantId,
      name: t.name,
    })),
    menu_categories: state.settings.menuCategories.map((c) => ({
      id: c.id,
      restaurant_id: restaurantId,
      name: c.name,
      image_url: c.imageUrl ?? null,
      sort_order: c.sortOrder,
    })),
    staff: staff.map((s) => ({
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
      image_url: i.imageUrl ?? null,
    })),
    transactions: state.transactions.map((t) => ({
      id: t.id,
      restaurant_id: restaurantId,
      tx_type: t.type,
      description: t.description,
      amount: t.amount,
      tx_date: normalizeIsoDate(t.date),
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
      entry_date: normalizeIsoDate(e.date),
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
      movement_date: normalizeIsoDate(m.date),
    })),
    kitchen_orders: state.kitchenOrders.map((o) => ({
      id: o.id,
      restaurant_id: restaurantId,
      table_name: o.table,
      items: o.items,
      status: o.status,
      priority: o.priority,
      created_at: o.createdAt,
      transaction_id: o.transactionId ?? null,
      order_ref: o.orderRef ?? null,
      pos_order_id: o.posOrderId ?? null,
    })),
    pos_orders: state.posOrders.map((o) => ({
      id: o.id,
      restaurant_id: restaurantId,
      order_ref: o.orderRef,
      table_name: o.table,
      items: o.items,
      status: o.status,
      discount_type: o.discountType,
      discount_value: o.discountValue,
      created_at: o.createdAt,
      paid_at: o.paidAt ?? null,
      transaction_id: o.transactionId ?? null,
      payment_method: o.paymentMethod ?? null,
      credit_customer: o.creditCustomer ?? null,
      amount_paid: o.amountPaid ?? null,
      kitchen_order_id: o.kitchenOrderId ?? null,
      sent_to_kitchen_at: o.sentToKitchenAt ?? null,
    })),
  };
}
