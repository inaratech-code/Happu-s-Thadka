"use client";

import type { PeriodReportRow } from "@/lib/report-stats";
import { formatCurrency, cn } from "@/lib/utils";

export function ReportPeriodTable({
  rows,
  highlightKey,
}: {
  rows: PeriodReportRow[];
  highlightKey?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-sm text-muted-foreground">
        No transactions recorded yet.
      </div>
    );
  }

  return (
    <>
      <div className="lg:hidden space-y-2">
        {rows.map((row) => {
          const highlight = row.key === highlightKey || row.label.startsWith("Today") || row.label.startsWith("This ");
          return (
            <div
              key={row.key}
              className={cn(
                "surface-card p-3 space-y-2",
                highlight && "border-amber-500/30 bg-amber-500/[0.04]"
              )}
            >
              <p className="text-sm font-semibold">{row.label}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Sales</span>
                  <p className="font-medium tabular-nums text-amber-400">{formatCurrency(row.sales)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Net</span>
                  <p
                    className={cn(
                      "font-medium tabular-nums",
                      row.net >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {formatCurrency(row.net)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Purchases</span>
                  <p className="tabular-nums">{formatCurrency(row.purchases)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expenses</span>
                  <p className="tabular-nums">{formatCurrency(row.expenses)}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">{row.count} transactions</p>
            </div>
          );
        })}
      </div>

      <div className="surface-card overflow-hidden hidden lg:block">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Period</th>
              <th className="text-right">Sales</th>
              <th className="text-right">Purchases</th>
              <th className="text-right">Expenses</th>
              <th className="text-right">Net</th>
              <th className="text-right">Txns</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const highlight =
                row.key === highlightKey ||
                row.label.startsWith("Today") ||
                row.label.startsWith("This week") ||
                row.label.startsWith("This month");
              return (
                <tr key={row.key} className={highlight ? "bg-amber-500/[0.04]" : undefined}>
                  <td className="font-medium whitespace-nowrap">{row.label}</td>
                  <td className="text-right tabular-nums text-amber-400">{formatCurrency(row.sales)}</td>
                  <td className="text-right tabular-nums text-sky-400/90">
                    {formatCurrency(row.purchases)}
                  </td>
                  <td className="text-right tabular-nums text-rose-400/90">
                    {formatCurrency(row.expenses)}
                  </td>
                  <td
                    className={cn(
                      "text-right tabular-nums font-semibold",
                      row.net >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {formatCurrency(row.net)}
                  </td>
                  <td className="text-right tabular-nums text-muted-foreground">{row.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
