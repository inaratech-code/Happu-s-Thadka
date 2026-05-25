import type { Transaction } from "./types";

export type ReportTotals = {
  sales: number;
  purchases: number;
  expenses: number;
  costs: number;
  net: number;
  count: number;
};

export type PeriodReportRow = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
} & ReportTotals;

export function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function monthKey(d: Date) {
  return d.toISOString().slice(0, 7);
}

/** Monday-based week start (local date) */
export function weekStartKey(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return dateKey(copy);
}

export function totalsForRange(transactions: Transaction[], start: string, end: string): ReportTotals {
  const inRange = transactions.filter((t) => t.date >= start && t.date <= end);
  const sales = inRange.filter((t) => t.type === "sale").reduce((s, t) => s + t.amount, 0);
  const purchases = inRange.filter((t) => t.type === "purchase").reduce((s, t) => s + t.amount, 0);
  const expenses = inRange.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const costs = purchases + expenses;
  return {
    sales,
    purchases,
    expenses,
    costs,
    net: sales - costs,
    count: inRange.length,
  };
}

export function todayReport(transactions: Transaction[]): PeriodReportRow {
  const today = new Date();
  const key = dateKey(today);
  const label = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return { key, label, startDate: key, endDate: key, ...totalsForRange(transactions, key, key) };
}

export function currentWeekReport(transactions: Transaction[]): PeriodReportRow {
  const today = new Date();
  const start = weekStartKey(today);
  const end = dateKey(today);
  const startDate = new Date(start + "T12:00:00");
  const label = `This week · ${startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${today.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  return { key: `week-${start}`, label, startDate: start, endDate: end, ...totalsForRange(transactions, start, end) };
}

export function currentMonthReport(transactions: Transaction[]): PeriodReportRow {
  const today = new Date();
  const key = monthKey(today);
  const start = `${key}-01`;
  const end = dateKey(today);
  const label = today.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return { key, label, startDate: start, endDate: end, ...totalsForRange(transactions, start, end) };
}

export function dailyReports(transactions: Transaction[], days = 30): PeriodReportRow[] {
  const rows: PeriodReportRow[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const label = d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
    rows.push({
      key,
      label: i === 0 ? `Today · ${label}` : label,
      startDate: key,
      endDate: key,
      ...totalsForRange(transactions, key, key),
    });
  }

  return rows;
}

export function weeklyReports(transactions: Transaction[], weeks = 12): PeriodReportRow[] {
  const rows: PeriodReportRow[] = [];
  const today = new Date();
  const seen = new Set<string>();

  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const start = weekStartKey(d);
    if (seen.has(start)) continue;
    seen.add(start);

    const endD = new Date(start + "T12:00:00");
    endD.setDate(endD.getDate() + 6);
    const end = dateKey(endD) > dateKey(today) ? dateKey(today) : dateKey(endD);

    const startLabel = new Date(start + "T12:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    const endLabel = new Date(end + "T12:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

    const isCurrent = start === weekStartKey(today);
    rows.push({
      key: `week-${start}`,
      label: isCurrent ? `This week · ${startLabel} – ${endLabel}` : `${startLabel} – ${endLabel}`,
      startDate: start,
      endDate: end,
      ...totalsForRange(transactions, start, end),
    });

    if (rows.length >= weeks) break;
  }

  return rows;
}

export function monthlyReports(transactions: Transaction[], months = 12): PeriodReportRow[] {
  const rows: PeriodReportRow[] = [];
  const today = new Date();

  for (let i = 0; i < months; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = monthKey(d);
    const start = `${key}-01`;
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const end = i === 0 ? dateKey(today) : dateKey(lastDay);
    const label =
      i === 0
        ? `This month · ${d.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
        : d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

    rows.push({
      key,
      label,
      startDate: start,
      endDate: end,
      ...totalsForRange(transactions, start, end),
    });
  }

  return rows;
}

export function chartPointsFromRows(rows: PeriodReportRow[], maxPoints: number) {
  const slice = [...rows].reverse().slice(-maxPoints);
  return slice.map((r) => ({
    label: r.key.length === 10 ? r.startDate.slice(5) : r.label.split("·")[0]?.trim().slice(0, 8) ?? r.key,
    sales: r.sales,
    max: Math.max(...slice.map((x) => x.sales), 1),
  }));
}
