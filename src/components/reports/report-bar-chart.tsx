"use client";

import { formatCurrency } from "@/lib/utils";

export function ReportBarChart({
  points,
  title,
}: {
  points: { label: string; sales: number; max: number }[];
  title: string;
}) {
  const hasData = points.some((p) => p.sales > 0);

  return (
    <div className="surface-card p-4 sm:p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {!hasData ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No sales data for this period</p>
      ) : (
        <div className="flex items-end gap-1 sm:gap-2 h-40 sm:h-48">
          {points.map((p, i) => {
            const height = p.max > 0 ? Math.max((p.sales / p.max) * 100, p.sales > 0 ? 4 : 0) : 0;
            return (
              <div
                key={`${p.label}-${i}`}
                className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1 h-full"
                title={`${p.label}: ${formatCurrency(p.sales)}`}
              >
                <div
                  className="w-full max-w-[2.5rem] rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 transition-all"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate w-full text-center">
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
