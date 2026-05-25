"use client";

import { motion } from "@/lib/motion";
import { Cloud, CloudOff, UserCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  online: boolean;
  cashierName: string;
  todayRevenue: number;
  className?: string;
};

export function SidebarStatusWidget({ online, cashierName, todayRevenue, className }: Props) {
  return (
    <div
      className={cn(
        "sidebar-status relative overflow-hidden rounded-xl border border-[var(--sidebar-status-border)]",
        "bg-[var(--sidebar-status-bg)] p-3 shadow-[var(--sidebar-status-shadow)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 100% 0%, rgba(245, 158, 11, 0.12), transparent 55%)",
        }}
      />

      <div className="relative space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              {online ? (
                <>
                  <motion.span
                    className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/50"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.55)]" />
                </>
              ) : (
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
              )}
            </span>
            <span className="text-[11px] font-semibold tracking-wide text-foreground/90 truncate">
              {online ? "Shift live" : "Offline"}
            </span>
          </div>
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider",
              online
                ? "bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/15"
                : "bg-amber-500/10 text-amber-400/90 border border-amber-500/15"
            )}
          >
            {online ? <Cloud className="h-2.5 w-2.5" /> : <CloudOff className="h-2.5 w-2.5" />}
            {online ? "Synced" : "Local"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <UserCircle2 className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={2.25} />
          <span className="truncate">
            <span className="text-muted-foreground/80">Cashier · </span>
            <span className="font-medium text-foreground/85">{cashierName}</span>
          </span>
        </div>

        <div className="pt-2 border-t border-[var(--border)]">
          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">
            Today&apos;s sales
          </p>
          <p className="mt-0.5 text-[15px] font-semibold tabular-nums tracking-tight text-[var(--primary)]">
            {formatCurrency(todayRevenue)}
          </p>
        </div>
      </div>
    </div>
  );
}
