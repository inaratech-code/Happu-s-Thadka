export const INVENTORY_UNITS = ["pcs", "kg", "g", "L", "ml", "box", "pack", "dozen", "plate"] as const;

export const INVENTORY_CATEGORY_SUGGESTIONS = [
  "Grocery",
  "Vegetables",
  "Meat",
  "Dairy",
  "Beverages",
  "Spices",
  "Packaging",
  "Frozen",
  "Other",
] as const;

export const LEDGER_DESCRIPTION_PRESETS = [
  "Daily sales deposit",
  "Supplier payment",
  "Rent",
  "Utilities",
  "Staff salary",
  "Equipment purchase",
  "Petty cash",
  "Bank transfer",
] as const;

export const PAYMENT_PARTY_PRESETS = [
  "Vegetable supplier",
  "Meat supplier",
  "Dairy supplier",
  "Gas agency",
  "Electricity board",
  "Landlord",
  "Staff advance",
  "Equipment vendor",
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash" as const, label: "Cash" },
  { value: "qr" as const, label: "QR" },
  { value: "bank" as const, label: "Bank transfer" },
  { value: "card" as const, label: "Card" },
];

export const STOCK_ADJUST_PRESETS = [-10, -5, -1, 1, 5, 10, 25] as const;
