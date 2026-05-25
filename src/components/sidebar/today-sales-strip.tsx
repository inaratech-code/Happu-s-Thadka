"use client";

import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function SidebarTodaySalesStrip({
  todayRevenue,
  className,
}: {
  todayRevenue: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--sidebar-status-border)] bg-[var(--sidebar-status-bg)] px-3 py-2.5",
        className
      )}
    >
      <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">
        Today&apos;s sales
      </p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums tracking-tight text-[var(--primary)]">
        {formatCurrency(todayRevenue)}
      </p>
    </div>
  );
}
