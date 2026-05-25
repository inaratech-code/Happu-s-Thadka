"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const ACCOUNTS_TABS = [
  { label: "Overview", href: "/accounts" },
  { label: "Day book", href: "/accounts/day-book" },
  { label: "Payments", href: "/accounts/payments" },
  { label: "Financial accounts", href: "/accounts/financial" },
  { label: "Ledger & parties", href: "/accounts/ledger" },
] as const;

export function AccountsSubnav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-[var(--border)] pb-px overflow-x-auto scrollbar-none">
      {ACCOUNTS_TABS.map((tab) => {
        const active =
          tab.href === "/accounts"
            ? pathname === "/accounts"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              active
                ? "border-amber-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
