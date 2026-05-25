"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, LayoutDashboard, Menu, Monitor, Package, type LucideIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { canAccessPath } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const TABS: {
  href?: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  action?: "menu";
}[] = [
  {
    href: "/",
    label: "Home",
    icon: LayoutDashboard,
    match: (pathname) => pathname === "/",
  },
  {
    href: "/pos",
    label: "POS",
    icon: Monitor,
    match: (pathname) => pathname.startsWith("/pos"),
  },
  {
    href: "/kitchen",
    label: "Kitchen",
    icon: ChefHat,
    match: (pathname) => pathname.startsWith("/kitchen"),
  },
  {
    href: "/inventory",
    label: "Stock",
    icon: Package,
    match: (pathname) => pathname.startsWith("/inventory"),
  },
  {
    label: "Menu",
    icon: Menu,
    match: () => false,
    action: "menu",
  },
];

export function MobileBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { session } = useAuth();
  const visibleTabs = TABS.filter(
    (tab) => tab.action === "menu" || (tab.href && canAccessPath(session, tab.href))
  );

  const devToolsInset = process.env.NODE_ENV === "development";

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border)] bg-[var(--header-bg)]/95 backdrop-blur-md safe-bottom shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
      aria-label="Main navigation"
    >
      <div
        className={cn(
          "mx-auto flex h-[3.75rem] max-w-lg items-stretch justify-around px-2",
          devToolsInset && "pl-12 pr-2"
        )}
      >
        {visibleTabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          const sharedClass =
            "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 transition-colors active:scale-95";

          if (tab.action === "menu") {
            return (
              <button
                key={tab.label}
                type="button"
                onClick={onOpenMenu}
                className={cn(sharedClass, "text-muted-foreground")}
                aria-label="Open menu"
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href!}
              className={cn(sharedClass, active ? "text-amber-500" : "text-muted-foreground")}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
                {tab.label}
              </span>
              {active ? (
                <span className="absolute bottom-1 h-0.5 w-8 rounded-full bg-amber-500" aria-hidden />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
