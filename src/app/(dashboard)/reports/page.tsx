"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CalendarRange, Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import { ReportSummaryCards } from "@/components/reports/report-summary-cards";
import { ReportBarChart } from "@/components/reports/report-bar-chart";
import { ReportPeriodTable } from "@/components/reports/report-period-table";
import { useStore } from "@/lib/store";
import {
  chartPointsFromRows,
  currentMonthReport,
  currentWeekReport,
  dailyReports,
  monthlyReports,
  todayReport,
  weeklyReports,
} from "@/lib/report-stats";
import { cn } from "@/lib/utils";

type ReportTab = "daily" | "weekly" | "monthly";

const TABS: { id: ReportTab; label: string; icon: typeof Calendar }[] = [
  { id: "daily", label: "Daily", icon: CalendarDays },
  { id: "weekly", label: "Weekly", icon: CalendarRange },
  { id: "monthly", label: "Monthly", icon: Calendar },
];

export default function ReportsPage() {
  const { state } = useStore();
  const [tab, setTab] = useState<ReportTab>("daily");

  const { current, rows, chartTitle, chartPoints, highlightKey } = useMemo(() => {
    const tx = state.transactions;

    if (tab === "daily") {
      const today = todayReport(tx);
      const rows = dailyReports(tx, 30);
      return {
        current: today,
        rows,
        chartTitle: "Daily sales (last 14 days)",
        chartPoints: chartPointsFromRows(rows, 14),
        highlightKey: today.key,
      };
    }

    if (tab === "weekly") {
      const week = currentWeekReport(tx);
      const rows = weeklyReports(tx, 12);
      return {
        current: week,
        rows,
        chartTitle: "Weekly sales (last 8 weeks)",
        chartPoints: chartPointsFromRows(rows, 8),
        highlightKey: week.key,
      };
    }

    const month = currentMonthReport(tx);
    const rows = monthlyReports(tx, 12);
    return {
      current: month,
      rows,
      chartTitle: "Monthly sales (last 6 months)",
      chartPoints: chartPointsFromRows(rows, 6),
      highlightKey: month.key,
    };
  }, [state.transactions, tab]);

  return (
    <div className="max-w-[1200px] w-full min-w-0 space-y-5">
      <PageHeader
        title="Reports"
        subtitle="Daily, weekly, and monthly sales & costs from your transactions"
      />

      <div className="inline-flex w-full sm:w-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-amber-500/15 text-amber-500 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-[var(--nav-hover)]"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <div className="surface-card p-4 border-amber-500/20 bg-amber-500/[0.04]">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current period</p>
        <p className="text-sm font-semibold mt-0.5">{current.label}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {current.startDate === current.endDate
            ? current.startDate
            : `${current.startDate} → ${current.endDate}`}
        </p>
      </div>

      <ReportSummaryCards totals={current} />

      <ReportBarChart points={chartPoints} title={chartTitle} />

      <div>
        <h3 className="text-sm font-semibold mb-3">
          {tab === "daily" && "Daily breakdown (last 30 days)"}
          {tab === "weekly" && "Weekly breakdown (last 12 weeks)"}
          {tab === "monthly" && "Monthly breakdown (last 12 months)"}
        </h3>
        <ReportPeriodTable rows={rows} highlightKey={highlightKey} />
      </div>
    </div>
  );
}
