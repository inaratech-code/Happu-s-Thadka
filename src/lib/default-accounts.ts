import type { FinancialAccount } from "./types";

export const DEFAULT_CASH_ACCOUNT_ID = "fac-cash";
export const DEFAULT_BANK_ACCOUNT_ID = "fac-bank";
export const DEFAULT_DIGITAL_ACCOUNT_ID = "fac-qr";

export const DEFAULT_FINANCIAL_ACCOUNTS: FinancialAccount[] = [
  {
    id: DEFAULT_CASH_ACCOUNT_ID,
    name: "Cash in Hand",
    type: "cash",
    openingBalance: 0,
    active: true,
  },
  {
    id: DEFAULT_BANK_ACCOUNT_ID,
    name: "Bank Account",
    type: "bank",
    openingBalance: 0,
    active: true,
  },
  {
    id: DEFAULT_DIGITAL_ACCOUNT_ID,
    name: "QR / Digital Wallet",
    type: "digital",
    openingBalance: 0,
    active: true,
  },
];

export function defaultCashAccountId(accounts: FinancialAccount[]): string {
  const cash = accounts.find((a) => a.active && a.type === "cash");
  return cash?.id ?? accounts.find((a) => a.active)?.id ?? DEFAULT_CASH_ACCOUNT_ID;
}
