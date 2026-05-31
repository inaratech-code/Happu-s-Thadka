import type { InventoryItem } from "./types";

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function parsePositiveAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function parseNonZeroAmount(value: string): number | null {
  const n = parsePositiveAmount(value);
  if (n === null || n === 0) return null;
  return n;
}

/** Optional image URL for menu items / categories (https or site path). */
export function validateImageUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return undefined;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") return trimmed;
  } catch {
    /* invalid */
  }
  return undefined;
}

export function imageUrlFieldError(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (validateImageUrl(trimmed)) return null;
  return "Use a full https:// link or a path starting with /";
}

export function validateInventoryItem(
  item: Omit<InventoryItem, "id">,
  existing: InventoryItem[],
  editingId?: string | null
): { ok: true } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!item.name.trim()) {
    errors.name = "Item name is required";
  }

  if (!item.category.trim()) {
    errors.category = "Category helps you find items later";
  }

  if (!item.unit.trim()) {
    errors.unit = "Pick a unit (pcs, kg, etc.)";
  }

  if (item.stockOnHand < 0) {
    errors.stockOnHand = "Stock cannot be negative";
  }

  if (item.avgCost < 0 || item.sellingPrice < 0 || item.reorderAt < 0) {
    errors.pricing = "Amounts cannot be negative";
  }

  if (item.type === "sellable" && item.sellingPrice <= 0) {
    errors.sellingPrice = "Sellable items need a selling price";
  }

  if (item.reorderAt > item.stockOnHand && item.stockOnHand > 0) {
    errors.reorderAt = "Reorder level is above current stock — you'll get low-stock alerts immediately";
  }

  const duplicate = existing.find(
    (i) =>
      i.id !== editingId &&
      i.name.trim().toLowerCase() === item.name.trim().toLowerCase() &&
      i.category.trim().toLowerCase() === item.category.trim().toLowerCase()
  );
  if (duplicate) {
    errors.name = `“${duplicate.name}” already exists in ${duplicate.category}`;
  }

  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
}

export type LedgerEntryMode = "in" | "out";

export function validatePaymentEntry(input: {
  description: string;
  amount: string;
  date: string;
  party: string;
  accountId: string;
}): { ok: true; amount: number } | { ok: false; errors: Record<string, string> } {
  return validateAccountsPayment({ ...input, requireNote: true });
}

export type AccountsPaymentDirection = "receive" | "pay";

export type AccountsPartyTypeFilter = "customer" | "supplier" | "worker";

export function validateAccountsPayment(input: {
  description: string;
  amount: string;
  date: string;
  party: string;
  accountId: string;
  requireNote?: boolean;
}): { ok: true; amount: number } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.party.trim()) {
    errors.party = "Select a party — add accounts under Ledger";
  }

  if (!input.accountId) {
    errors.accountId = "Select an account";
  }

  if (input.requireNote && !input.description.trim()) {
    errors.description = "Add a short note (invoice, bill no., etc.)";
  }

  const amount = parseNonZeroAmount(input.amount);
  if (amount === null) {
    errors.amount = "Enter an amount greater than zero";
  }

  if (!input.date) {
    errors.date = "Pick a date";
  }

  return Object.keys(errors).length === 0
    ? { ok: true, amount: amount! }
    : { ok: false, errors };
}

export function validateFinancialAccount(input: {
  name: string;
  type: string;
  openingBalance: string;
}): { ok: true; openingBalance: number } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input.name.trim()) errors.name = "Account name is required";
  const opening = parsePositiveAmount(input.openingBalance);
  if (opening === null) errors.openingBalance = "Enter opening balance (use 0 if none)";
  return Object.keys(errors).length === 0
    ? { ok: true, openingBalance: opening! }
    : { ok: false, errors };
}

export function validateLedgerEntry(input: {
  description: string;
  amount: string;
  date: string;
  mode: LedgerEntryMode;
  accountId?: string;
}): { ok: true; amount: number } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.description.trim()) {
    errors.description = "Add a short note (who / what this was for)";
  }

  const amount = parseNonZeroAmount(input.amount);
  if (amount === null) {
    errors.amount = "Enter an amount greater than zero";
  }

  if (!input.date) {
    errors.date = "Pick a date";
  }

  if (input.accountId !== undefined && !input.accountId) {
    errors.accountId = "Select an account";
  }

  return Object.keys(errors).length === 0
    ? { ok: true, amount: amount! }
    : { ok: false, errors };
}

export function validateStockAdjust(input: {
  qty: string;
  currentStock: number;
  note: string;
}): { ok: true; delta: number } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const trimmed = input.qty.trim();
  if (!trimmed) {
    errors.qty = "Enter how much to add or remove";
    return { ok: false, errors };
  }

  const delta = Number(trimmed);
  if (!Number.isFinite(delta) || delta === 0) {
    errors.qty = "Use a non-zero number (e.g. 5 or -2)";
    return { ok: false, errors };
  }

  const next = input.currentStock + delta;
  if (next < 0) {
    errors.qty = `Only ${input.currentStock} in stock — max reduction is −${input.currentStock}`;
    return { ok: false, errors };
  }

  if (!input.note.trim()) {
    errors.note = "Add a short reason (purchase, waste, count fix…)";
  }

  return { ok: true, delta };
}

export function validateOrderSale(input: {
  itemId: string;
  qty: string;
  unitPrice: string;
  maxQty: number;
  accountId: string;
  date: string;
}): { ok: true; qty: number; unitPrice: number } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.itemId) {
    errors.itemId = "Select an item";
  }

  const qty = parseNonZeroAmount(input.qty);
  if (qty === null) {
    errors.qty = "Enter quantity (decimals allowed for g, kg, etc.)";
  } else if (qty > input.maxQty) {
    errors.qty = `Only ${input.maxQty} available in stock`;
  }

  const unitPrice = parseNonZeroAmount(input.unitPrice);
  if (unitPrice === null) {
    errors.unitPrice = "Enter selling price per unit";
  }

  if (!input.accountId) {
    errors.accountId = "Select an account";
  }

  if (!input.date) {
    errors.date = "Pick a date";
  }

  return Object.keys(errors).length === 0
    ? { ok: true, qty: qty!, unitPrice: unitPrice! }
    : { ok: false, errors };
}

export function validateOrderPurchase(input: {
  itemId: string;
  qty: string;
  unitPrice: string;
  accountId: string;
  date: string;
}): { ok: true; qty: number; unitPrice: number } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.itemId) {
    errors.itemId = "Select an item";
  }

  const qty = parseNonZeroAmount(input.qty);
  if (qty === null) {
    errors.qty = "Enter quantity (decimals allowed for g, kg, etc.)";
  }

  const unitPrice = parsePositiveAmount(input.unitPrice);
  if (unitPrice === null) {
    errors.unitPrice = "Enter purchase price per unit";
  }

  if (!input.accountId) {
    errors.accountId = "Select an account";
  }

  if (!input.date) {
    errors.date = "Pick a date";
  }

  return Object.keys(errors).length === 0
    ? { ok: true, qty: qty!, unitPrice: unitPrice! }
    : { ok: false, errors };
}

export function validateOrderExpense(input: {
  description: string;
  amount: string;
  accountId: string;
  date: string;
}): { ok: true; amount: number } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.description.trim()) {
    errors.description = "Describe this expense";
  }

  const amount = parseNonZeroAmount(input.amount);
  if (amount === null) {
    errors.amount = "Enter an amount greater than zero";
  }

  if (!input.accountId) {
    errors.accountId = "Select an account";
  }

  if (!input.date) {
    errors.date = "Pick a date";
  }

  return Object.keys(errors).length === 0
    ? { ok: true, amount: amount! }
    : { ok: false, errors };
}

export function validateStockSell(input: {
  qty: string;
  maxQty: number;
}): { ok: true; qty: number } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const qty = parseNonZeroAmount(input.qty);
  if (qty === null) {
    errors.qty = "Enter quantity to sell";
    return { ok: false, errors };
  }
  if (qty > input.maxQty) {
    errors.qty = `Only ${input.maxQty} available`;
    return { ok: false, errors };
  }
  return { ok: true, qty };
}
