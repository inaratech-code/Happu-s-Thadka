import type { LedgerEntry, Transaction } from "./types";
import { ledgerBalance } from "./account-stats";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthKey(d: Date) {
  return d.toISOString().slice(0, 7);
}

export function sumByType(transactions: Transaction[], type: Transaction["type"], onDate?: string) {
  return transactions
    .filter((t) => t.type === type && (!onDate || t.date === onDate))
    .reduce((s, t) => s + t.amount, 0);
}

export function sumByTypeInMonth(transactions: Transaction[], type: Transaction["type"], month: string) {
  return transactions
    .filter((t) => t.type === type && t.date.startsWith(month))
    .reduce((s, t) => s + t.amount, 0);
}

export function amountTrend(
  transactions: Transaction[],
  days: number,
  match: (t: Transaction) => boolean
): { date: string; amount: number }[] {
  const result: { date: string; amount: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const amount = transactions
      .filter((t) => match(t) && t.date === key)
      .reduce((s, t) => s + t.amount, 0);
    result.push({ date: key, amount });
  }
  return result;
}

export function salesTrend(transactions: Transaction[], days: number): { date: string; amount: number }[] {
  return amountTrend(transactions, days, (t) => t.type === "sale");
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning", icon: "☀️" };
  if (h < 17) return { text: "Good Afternoon", icon: "🌤️" };
  return { text: "Good Evening", icon: "🌙" };
}

export function formatTodayLong() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export { formatNepaliBS as formatNepaliDate, getTodayDates } from "./nepali-date";

export function dashboardMetrics(transactions: Transaction[], ledgerEntries: LedgerEntry[]) {
  const today = dateKey(new Date());
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  const month = monthKey(new Date());

  const todaySales = sumByType(transactions, "sale", today);
  const yesterdaySales = sumByType(transactions, "sale", yesterday);
  const todayExpenses =
    sumByType(transactions, "expense", today) + sumByType(transactions, "purchase", today);

  const monthSales = sumByTypeInMonth(transactions, "sale", month);
  const monthCosts =
    sumByTypeInMonth(transactions, "expense", month) + sumByTypeInMonth(transactions, "purchase", month);
  const monthProfit = monthSales - monthCosts;

  const balance = ledgerBalance(ledgerEntries);
  const receivable = balance > 0 ? balance : 0;
  const payable = balance < 0 ? Math.abs(balance) : 0;

  return {
    today,
    todaySales,
    yesterdaySales,
    salesChange: percentChange(todaySales, yesterdaySales),
    todayExpenses,
    monthProfit,
    receivable,
    payable,
    salesSparkline: salesTrend(transactions, 7).map((d) => d.amount),
    expenseSparkline: amountTrend(
      transactions,
      7,
      (t) => t.type === "expense" || t.type === "purchase"
    ).map((d) => d.amount),
  };
}
