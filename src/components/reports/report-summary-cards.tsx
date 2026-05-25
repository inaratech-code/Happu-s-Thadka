"use client";

import type { ReportTotals } from "@/lib/report-stats";
import { formatCurrency, cn } from "@/lib/utils";

export function ReportSummaryCards({
  totals,
  className,
}: {
  totals: ReportTotals;
  className?: string;
}) {
  const cards = [
    { label: "Sales", value: totals.sales, className: "text-amber-400" },
    { label: "Purchases", value: totals.purchases, className: "text-sky-400" },
    { label: "Expenses", value: totals.expenses, className: "text-rose-400" },
    {
      label: "Net profit",
      value: totals.net,
      className: totals.net >= 0 ? "text-emerald-400" : "text-rose-400",
    },
  ] as const;

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3", className)}>
      {cards.map((card) => (
        <div key={card.label} className="surface-card p-3 sm:p-4 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.label}</p>
          <p className={cn("text-base sm:text-xl font-semibold tabular-nums mt-1 break-words", card.className)}>
            {formatCurrency(card.value)}
          </p>
        </div>
      ))}
      <div className="surface-card p-3 sm:p-4 col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{totals.count} transactions in this period</span>
        <span>
          Total costs (purchases + expenses):{" "}
          <span className="text-foreground font-medium tabular-nums">{formatCurrency(totals.costs)}</span>
        </span>
      </div>
    </div>
  );
}
