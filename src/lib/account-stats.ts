import type { FinancialAccount, LedgerEntry } from "./types";

function entryDelta(entry: LedgerEntry) {
  return entry.credit - entry.debit;
}

export function sortLedgerEntries(entries: LedgerEntry[]) {
  return [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
  );
}

export function ledgerBalance(entries: LedgerEntry[]) {
  return entries.reduce((b, e) => b + entryDelta(e), 0);
}

export function entriesForDate(entries: LedgerEntry[], date: string) {
  return sortLedgerEntries(entries).filter((e) => e.date === date);
}

export type DayBookRow = {
  entry: LedgerEntry;
  balance: number;
};

export type DayBookSummary = {
  date: string;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  rows: DayBookRow[];
};

export function dayBookForDate(entries: LedgerEntry[], date: string): DayBookSummary {
  const sorted = sortLedgerEntries(entries);
  let openingBalance = 0;
  const dayOnly: LedgerEntry[] = [];

  for (const entry of sorted) {
    if (entry.date < date) {
      openingBalance += entryDelta(entry);
    } else if (entry.date === date) {
      dayOnly.push(entry);
    }
  }

  let totalIn = 0;
  let totalOut = 0;
  let running = openingBalance;
  const rows: DayBookRow[] = [];

  for (const entry of dayOnly) {
    totalIn += entry.credit;
    totalOut += entry.debit;
    running += entryDelta(entry);
    rows.push({ entry, balance: running });
  }

  return {
    date,
    openingBalance,
    totalIn,
    totalOut,
    closingBalance: running,
    rows,
  };
}

export function paymentEntries(entries: LedgerEntry[]) {
  return entries.filter((e) => e.kind === "payment" || (e.debit > 0 && !e.credit));
}

export function accountBalance(account: FinancialAccount, entries: LedgerEntry[]) {
  const movement = entries
    .filter((e) => e.accountId === account.id)
    .reduce((sum, e) => sum + entryDelta(e), 0);
  return account.openingBalance + movement;
}

export function accountNameById(accounts: FinancialAccount[], id?: string) {
  if (!id) return "—";
  return accounts.find((a) => a.id === id)?.name ?? "—";
}

export function runningLedgerBalances(entries: LedgerEntry[]): DayBookRow[] {
  const sorted = sortLedgerEntries(entries);
  let running = 0;
  return sorted.map((entry) => {
    running += entryDelta(entry);
    return { entry, balance: running };
  });
}
