import type { AppPermission } from "./permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
  permission?: AppPermission;
  children?: NavItem[];
};

/** Area of the app a staff member may access (admin has all). */
export type StaffRole = "admin" | "staff";

export type StaffMember = {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: StaffRole;
  permissions: AppPermission[];
  active: boolean;
  createdAt: string;
};

export type AuthSession = {
  staffId: string;
  username: string;
  name: string;
  role: StaffRole;
  permissions: AppPermission[];
  /** Tenant workspace code (server DB mode). */
  workspace?: string;
  /** Display name for the restaurant (server DB mode). */
  restaurantName?: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  stockOnHand: number;
  unit: string;
  avgCost: number;
  sellingPrice: number;
  reorderAt: number;
  type: "sellable" | "consumable";
  /** Local or CDN path for POS menu thumbnail, persisted in inventory_items.image_url */
  imageUrl?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  emoji: string;
  /** Local path under /public, e.g. /menu-images/carlsberg.jpg */
  imageUrl?: string;
  /** Category fallback when item image is not generated yet */
  categoryImageUrl?: string;
};

export type TableDef = {
  id: string;
  name: string;
};

export type KitchenOrder = {
  id: string;
  table: string;
  items: { name: string; qty: number; notes?: string }[];
  status: "new" | "preparing" | "ready" | "served";
  createdAt: string;
  priority: "normal" | "urgent" | "rush";
};

export type Transaction = {
  id: string;
  type: "sale" | "purchase" | "expense";
  description: string;
  amount: number;
  date: string;
  category?: string;
};

export type FinancialAccountType = "cash" | "bank" | "digital" | "other";

export type FinancialAccount = {
  id: string;
  name: string;
  type: FinancialAccountType;
  openingBalance: number;
  active: boolean;
};

export type PartyType = "supplier" | "customer" | "other";

/** Saved payee / payer — manage under Accounts → Ledger & parties */
export type Party = {
  id: string;
  name: string;
  type: PartyType;
  phone?: string;
  note?: string;
  active: boolean;
};

export type PaymentMethod = "cash" | "qr" | "bank" | "card";

export type LedgerEntryKind = "receipt" | "payment" | "transfer" | "general";

export type LedgerEntry = {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  /** Which cash/bank account this movement affects */
  accountId?: string;
  /** Payee or payer name */
  party?: string;
  paymentMethod?: PaymentMethod;
  kind?: LedgerEntryKind;
};

export type StockMovement = {
  id: string;
  itemId: string;
  itemName: string;
  type: "in" | "out" | "adjust" | "sale";
  qty: number;
  note: string;
  date: string;
};

export type AppSettings = {
  restaurantName: string;
  location: string;
  tables: TableDef[];
};

export type AppState = {
  inventory: InventoryItem[];
  kitchenOrders: KitchenOrder[];
  transactions: Transaction[];
  ledgerEntries: LedgerEntry[];
  financialAccounts: FinancialAccount[];
  parties: Party[];
  stockMovements: StockMovement[];
  staff: StaffMember[];
  settings: AppSettings;
  kotCounter: number;
  txCounter: number;
};
