"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  CircleDollarSign,
  HandCoins,
  Tag,
  TrendingDown,
  TrendingUp,
  Flame,
  ChevronRight,
} from "lucide-react";
import { WelcomeHero } from "@/components/dashboard/welcome-hero";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { useStore } from "@/lib/store";
import { dashboardMetrics } from "@/lib/dashboard-stats";
import { formatCurrency } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/use-online-status";

function exportData(state: ReturnType<typeof useStore>["state"]) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `happus-tadka-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const { state } = useStore();
  const online = useOnlineStatus();
  const metrics = dashboardMetrics(state.transactions, state.ledgerEntries);
  const activeKitchen = state.kitchenOrders.filter((o) => o.status !== "served");
  const name = state.settings.restaurantName || "Happus Tadka";
  const location = state.settings.location || "Mahendinagar · Ghuiyaghat";

  const salesChangeLabel =
    metrics.salesChange > 0
      ? `+${metrics.salesChange}% from yesterday`
      : metrics.salesChange < 0
      ? `${metrics.salesChange}% from yesterday`
      : "Same as yesterday";

  return (
    <div className="dash-page w-full min-w-0 space-y-4 pb-4">
      <div className="max-w-[1400px] mx-auto w-full min-w-0 space-y-4">
        <WelcomeHero
          name={name}
          location={location}
          activeKitchen={activeKitchen.length}
          online={online}
        />

        <AnimatePresence>
          {activeKitchen.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Link
                href="/kitchen"
                className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent px-4 py-3 sm:px-5 sm:py-4 hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 pulse-active">
                    <Flame className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--dash-text)]">
                      {activeKitchen.length} kitchen order{activeKitchen.length > 1 ? "s" : ""} in progress
                    </p>
                    <p className="text-xs dash-text-secondary">Tap to open kitchen display</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <p className="dash-section-title mb-3 px-1">Key metrics</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <div className="col-span-1 sm:col-span-2 min-w-0">
            <KpiCard
              index={0}
              featured
              className="h-full"
              label="Today Sales"
              value={formatCurrency(metrics.todaySales)}
              change={salesChangeLabel}
              changeType={metrics.salesChange >= 0 ? "up" : "down"}
              icon={CircleDollarSign}
              iconBg="bg-amber-100 dark:bg-amber-500/20"
              iconColor="text-amber-600 dark:text-amber-400"
              sparkData={metrics.salesSparkline}
              sparkStroke="var(--chart-primary)"
              sparkFill="var(--chart-primary-fill)"
            />
            </div>
            <KpiCard
              index={1}
              className="min-w-0"
              label="Expenses (today)"
              value={formatCurrency(metrics.todayExpenses)}
              change={
                metrics.todayExpenses > 0 ? "Purchases + expenses" : "No spend logged today"
              }
              changeType="neutral"
              icon={TrendingDown}
              iconBg="bg-orange-100 dark:bg-orange-500/15"
              iconColor="text-orange-600 dark:text-orange-400"
              sparkData={metrics.expenseSparkline}
              sparkStroke="var(--chart-primary)"
              sparkFill="var(--chart-primary-fill)"
            />
            <KpiCard
              index={2}
              className="min-w-0"
              label="Outstanding Receivable"
              value={formatCurrency(metrics.receivable)}
              change={metrics.receivable > 0 ? "Ledger credit balance" : "Nothing due in"}
              changeType="neutral"
              icon={HandCoins}
              iconBg="bg-emerald-100 dark:bg-emerald-500/15"
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <KpiCard
              index={3}
              className="min-w-0"
              label="Outstanding Payable"
              value={formatCurrency(metrics.payable)}
              change={metrics.payable > 0 ? "Ledger debit balance" : "All settled"}
              changeType="neutral"
              icon={Tag}
              iconBg="bg-rose-100 dark:bg-rose-500/15"
              iconColor="text-rose-600 dark:text-rose-400"
            />
            <div className="col-span-1 sm:col-span-2 xl:col-span-4 min-w-0">
            <KpiCard
              index={4}
              className="h-full"
              label="Net Profit (month)"
              value={formatCurrency(metrics.monthProfit)}
              change={metrics.monthProfit >= 0 ? "Sales minus costs" : "Costs exceed sales"}
              changeType={metrics.monthProfit >= 0 ? "up" : "down"}
              icon={TrendingUp}
              iconBg="bg-emerald-100 dark:bg-emerald-500/15"
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          <div className="lg:col-span-2 min-h-[280px] sm:min-h-[380px]">
            <SalesTrendChart
              transactions={state.transactions}
              onExport={() => exportData(state)}
            />
          </div>
          <div className="min-h-[320px] sm:min-h-[380px]">
            <QuickActionsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
