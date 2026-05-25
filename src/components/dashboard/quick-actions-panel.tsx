"use client";

import Link from "next/link";
import { motion } from "@/lib/motion";
import {
  Package,
  ShoppingCart,
  Wallet,
  Truck,
  BookOpen,
  Receipt,
  ChefHat,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ACTIONS: {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
}[] = [
  {
    label: "Open POS",
    description: "Cashier & tables",
    href: "/pos",
    icon: Receipt,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    label: "Record Sale",
    description: "Log a manual sale",
    href: "/transactions/sales",
    icon: ShoppingCart,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    label: "Kitchen",
    description: "Active KOT tickets",
    href: "/kitchen",
    icon: ChefHat,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    label: "Add Inventory",
    description: "Stock in or update",
    href: "/inventory",
    icon: Package,
    gradient: "from-sky-500 to-blue-600",
  },
  {
    label: "New Expense",
    description: "Record spending",
    href: "/transactions/expenses",
    icon: Wallet,
    gradient: "from-rose-500 to-pink-600",
  },
  {
    label: "Add Purchase",
    description: "Supplier buy-in",
    href: "/transactions/purchases",
    icon: Truck,
    gradient: "from-orange-500 to-amber-600",
  },
  {
    label: "Ledger",
    description: "Accounts book",
    href: "/accounts",
    icon: BookOpen,
    gradient: "from-amber-600 to-orange-700",
  },
];

export function QuickActionsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.45 }}
      className="dash-card rounded-2xl p-5 h-full flex flex-col"
    >
      <div className="flex items-center gap-2.5 mb-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--dash-text)]">Quick Actions</h3>
          <p className="text-xs dash-text-secondary">Do more in fewer taps</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 flex-1 content-start">
        {ACTIONS.map((action, i) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + i * 0.04 }}
          >
            <Link
              href={action.href}
              className="group dash-action flex items-center gap-3 rounded-xl px-3 py-3 transition-all hover:scale-[1.02] active:scale-[0.99]"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} shadow-md group-hover:shadow-lg transition-shadow`}
              >
                <action.icon className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--dash-text)]">{action.label}</p>
                <p className="text-xs dash-text-secondary truncate">{action.description}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[var(--dash-text-secondary)] opacity-40 group-hover:text-primary group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
