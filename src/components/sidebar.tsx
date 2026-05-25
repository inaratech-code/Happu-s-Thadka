"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Package,
  ArrowUpDown,
  Receipt,
  LayoutGrid,
  ShoppingCart,
  Truck,
  Wallet,
  BookOpen,
  CalendarDays,
  CreditCard,
  Landmark,
  Zap,
  LayoutDashboard,
  Monitor,
  ChefHat,
  Settings,
  Users,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";
import { filterNavItems } from "@/lib/nav-filter";
import { NAV_ICON_STROKE, NAV_MOTION, SIDEBAR_WIDTH } from "@/lib/sidebar-config";
import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/lib/store";
import { todaySales } from "@/lib/store-utils";
import { SidebarTodaySalesStrip } from "@/components/sidebar/today-sales-strip";
import type { NavItem } from "@/lib/types";

const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  Package,
  ArrowUpDown,
  Receipt,
  LayoutGrid,
  ShoppingCart,
  Truck,
  Wallet,
  BookOpen,
  CalendarDays,
  CreditCard,
  Landmark,
  Zap,
  LayoutDashboard,
  Monitor,
  ChefHat,
  Settings,
  Users,
};

function NavIcon({
  name,
  active,
  compact,
}: {
  name: string;
  active?: boolean;
  compact?: boolean;
}) {
  const Icon = ICON_MAP[name] || Package;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[8px] transition-all duration-150",
        compact ? "h-7 w-7" : "h-8 w-8",
        active
          ? "bg-amber-500/14 text-amber-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "text-muted-foreground/75 group-hover/nav:text-foreground/88 group-hover/nav:bg-white/[0.045]"
      )}
    >
      <Icon className={compact ? "h-[15px] w-[15px]" : "h-[17px] w-[17px]"} strokeWidth={NAV_ICON_STROKE} />
    </span>
  );
}

function pathMatches(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useNavActive() {
  const pathname = usePathname();
  return useCallback((href: string) => pathMatches(pathname, href), [pathname]);
}

function NavLeaf({
  item,
  active,
  onNavigate,
  compact,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn("group/nav relative flex items-center gap-2.5 rounded-[10px] outline-none", compact ? "px-2 py-1.5" : "px-2.5 py-2")}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="nav-active-pill absolute inset-0 rounded-[10px]"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      {active && <span className="nav-active-rail absolute left-0 top-1/2 -translate-y-1/2" />}
      <NavIcon name={item.icon} active={active} compact={compact} />
      <span
        className={cn(
          "relative z-[1] truncate text-[13px] leading-none transition-colors",
          active ? "font-semibold text-foreground" : "font-medium text-muted-foreground group-hover/nav:text-foreground/92"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

function NavGroup({
  item,
  expanded,
  onToggle,
  isActive,
  onNavigate,
  showDivider,
}: {
  item: NavItem;
  expanded: boolean;
  onToggle: () => void;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  showDivider?: boolean;
}) {
  const children = item.children ?? [];
  const childActive = children.some((c) => isActive(c.href));

  return (
    <div className={cn(showDivider && "pt-1.5 mt-1.5 border-t border-[var(--sidebar-divider)]")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          "group/nav flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left transition-colors",
          childActive ? "text-foreground/90" : "text-muted-foreground/75 hover:text-foreground/88"
        )}
      >
        <NavIcon name={item.icon} active={childActive} compact />
        <span className="flex-1 min-w-0">
          <span
            className={cn(
              "block text-[13px] font-semibold leading-tight tracking-tight",
              childActive && "text-foreground"
            )}
          >
            {item.label}
          </span>
        </span>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200 pointer-events-none",
            expanded && "rotate-90"
          )}
          strokeWidth={NAV_ICON_STROKE}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key={`${item.label}-children`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={NAV_MOTION.accordion}
            className="overflow-hidden"
          >
            <div className="relative mt-0.5 ml-[18px] pl-2.5 border-l border-[var(--sidebar-tree-line)] space-y-0.5 pb-0.5">
              {children.map((child) => (
                <NavLeaf
                  key={child.href}
                  item={child}
                  active={isActive(child.href)}
                  onNavigate={onNavigate}
                  compact
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = useNavActive();
  const { session } = useAuth();
  const { state } = useStore();
  const navItems = useMemo(() => filterNavItems(NAV_ITEMS, session), [session]);
  const revenue = todaySales(state.transactions);
  const location = state.settings.location?.split(",")[0] ?? "Restaurant";

  const defaultExpanded = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const item of navItems) {
      if (item.children?.some((c) => pathMatches(pathname, c.href))) {
        map[item.label] = true;
      }
    }
    return map;
  }, [navItems, pathname]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
    Operations: true,
    Inventory: false,
    Transactions: false,
    Accounts: false,
    Settings: false,
    ...defaultExpanded,
  }));

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of navItems) {
        if (item.children?.some((c) => pathMatches(pathname, c.href)) && !next[item.label]) {
          next[item.label] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pathname, navItems]);

  const toggle = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const groupedIndices = useMemo(() => {
    const withChildren = navItems.map((item, i) => ({
      item,
      i,
      hasChildren: Boolean(item.children?.length),
    }));
    return withChildren;
  }, [navItems]);

  return (
    <aside
      style={{ width: mobile ? undefined : SIDEBAR_WIDTH }}
      className={cn(
        "sidebar-shell relative flex h-full shrink-0 flex-col",
        mobile ? "w-full" : ""
      )}
    >
      <div className="sidebar-edge-glow pointer-events-none absolute inset-y-0 right-0 z-10 w-px" />
      <div className="sidebar-sheen pointer-events-none absolute inset-0 z-0" />

      <div className="relative z-[1] flex items-center gap-3 border-b border-[var(--sidebar-divider)] px-3.5 py-3.5">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[11px] ring-1 ring-amber-500/20 shadow-[0_2px_12px_rgba(245,158,11,0.12)]">
          <Image src="/logo.png" alt="Happus Tadka" fill className="object-cover" sizes="40px" priority />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold tracking-tight text-foreground leading-tight truncate">
            Happus Tadka
          </p>
          <p className="text-[10px] font-medium text-muted-foreground/80 truncate mt-0.5 tracking-wide">
            {location}
          </p>
        </div>
      </div>

      <nav className="relative z-[1] flex-1 overflow-y-auto overflow-x-hidden px-2 py-2.5 scrollbar-thin">
        <div className="space-y-0.5">
          {groupedIndices.map(({ item, hasChildren }, idx) => {
            const sectionBreaks = new Set(["Inventory", "Transactions", "Accounts", "Settings"]);

            if (hasChildren) {
              return (
                <NavGroup
                  key={item.label}
                  item={item}
                  expanded={expanded[item.label] ?? false}
                  onToggle={() => toggle(item.label)}
                  isActive={isActive}
                  onNavigate={onNavigate}
                  showDivider={sectionBreaks.has(item.label)}
                />
              );
            }

            const active = isActive(item.href);
            const showTopDivider = idx > 0 && item.label === "Reports";

            return (
              <div
                key={item.href}
                className={cn(showTopDivider && "pt-1.5 mt-1.5 border-t border-[var(--sidebar-divider)]")}
              >
                <NavLeaf item={item} active={active} onNavigate={onNavigate} />
              </div>
            );
          })}
        </div>
      </nav>

      <div className="relative z-[1] shrink-0 border-t border-[var(--sidebar-divider)] px-2.5 py-2.5">
        <SidebarTodaySalesStrip todayRevenue={revenue} />
      </div>
    </aside>
  );
}
