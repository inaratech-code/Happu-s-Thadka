"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, CreditCard, Landmark, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import {
  accountBalance,
  dayBookForDate,
  ledgerBalance,
  paymentEntries,
} from "@/lib/account-stats";
import { todayIso } from "@/lib/validate-entry";
import { formatCurrency } from "@/lib/utils";

const LINKS = [
  {
    href: "/accounts/day-book",
    label: "Day book",
    desc: "Daily register with opening & closing",
    icon: CalendarDays,
  },
  {
    href: "/accounts/payments",
    label: "Payments",
    desc: "Receive from customers or pay suppliers",
    icon: CreditCard,
  },
  {
    href: "/accounts/financial",
    label: "Financial accounts",
    desc: "Cash, bank & wallet balances",
    icon: Landmark,
  },
  {
    href: "/accounts/ledger",
    label: "Ledger & parties",
    desc: "Accounts, Dr/Cr balances & party names",
    icon: BookOpen,
  },
] as const;

export default function AccountsOverviewPage() {
  const { state } = useStore();
  const today = todayIso();
  const balance = ledgerBalance(state.ledgerEntries);
  const day = dayBookForDate(state.ledgerEntries, today);
  const payments = paymentEntries(state.ledgerEntries);
  const paymentsToday = payments.filter((p) => p.date === today);
  const activeAccounts = state.financialAccounts.filter((a) => a.active);

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle="Day book, payments & financial accounts"
        actions={
          <Link
            href="/accounts/payments"
            className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 text-xs rounded-md w-full sm:w-auto bg-gradient-to-b from-amber-500 to-amber-600 text-charcoal-950 font-semibold"
          >
            <Plus className="h-4 w-4" />
            Record payment
          </Link>
        }
      />

      <div className="surface-card p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net balance (all accounts)</p>
        <p className="text-2xl sm:text-3xl font-bold tabular-nums text-amber-400 mt-1">
          {formatCurrency(balance)}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Today: in {formatCurrency(day.totalIn)} · out {formatCurrency(day.totalOut)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="surface-card p-4 flex gap-3 hover:border-amber-500/30 transition-colors"
          >
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="surface-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payments today</p>
          <p className="text-lg font-bold tabular-nums mt-1">
            {formatCurrency(paymentsToday.reduce((s, p) => s + p.debit, 0))}
          </p>
          <p className="text-[11px] text-muted-foreground">{paymentsToday.length} payment(s)</p>
        </div>
        <div className="surface-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Day book closing</p>
          <p className="text-lg font-bold tabular-nums text-amber-400 mt-1">
            {formatCurrency(day.closingBalance)}
          </p>
          <p className="text-[11px] text-muted-foreground">As of {today}</p>
        </div>
        <div className="surface-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ledger accounts</p>
          <p className="text-lg font-bold mt-1">
            {state.parties.filter((p) => p.active).length}
          </p>
          <Link href="/accounts/ledger" className="text-[11px] text-amber-500 hover:text-amber-400">
            Ledger & parties →
          </Link>
        </div>
      </div>

      <div className="surface-card p-4">
        <p className="text-sm font-semibold mb-3">Account balances</p>
        <ul className="space-y-2">
          {activeAccounts.map((account) => (
            <li key={account.id} className="flex justify-between text-sm tabular-nums">
              <span className="text-muted-foreground">{account.name}</span>
              <span className="font-medium">
                {formatCurrency(accountBalance(account, state.ledgerEntries))}
              </span>
            </li>
          ))}
        </ul>
        <Link
          href="/accounts/financial"
          className="inline-block mt-3 text-xs text-amber-500 hover:text-amber-400 font-medium"
        >
          Manage accounts →
        </Link>
      </div>
    </>
  );
}
