"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Search, Command, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";
import { filterNavItems } from "@/lib/nav-filter";
import { useAuth } from "@/components/auth-provider";
import { canAccessPath } from "@/lib/permissions";
import { useRouter } from "next/navigation";

const QUICK_ACTIONS = [
  { label: "New Order", href: "/pos", shortcut: "⌘N" },
  { label: "Add Inventory Item", href: "/inventory", shortcut: "⌘I" },
  { label: "Record Sale", href: "/transactions/sales", shortcut: "⌘S" },
  { label: "Kitchen Display", href: "/kitchen", shortcut: "⌘K" },
  { label: "View Reports", href: "/reports", shortcut: "⌘R" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const allItems = [
    ...QUICK_ACTIONS.filter((item) => canAccessPath(session, item.href)),
    ...filterNavItems(NAV_ITEMS, session).flatMap((item) =>
      item.children
        ? item.children.map((c) => ({ label: c.label, href: c.href, shortcut: "" }))
        : [{ label: item.label, href: item.href, shortcut: "" }]
    ),
  ];

  const filtered = allItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex sm:hidden items-center justify-center h-8 w-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-muted-foreground text-xs hover:border-[var(--border-strong)] hover:text-foreground transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-4 flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--surface-overlay)] px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 scrim backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-[12%] sm:top-[20%] z-50 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-float)] overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
                <Command className="h-4 w-4 text-amber-500/70" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands, pages, actions..."
                  className="flex-1 h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No results found
                  </p>
                ) : (
                  filtered.map((item, i) => (
                    <button
                      key={`${item.href}-${i}`}
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-amber-500/[0.08] transition-colors group"
                      )}
                    >
                      <span>{item.label}</span>
                      <div className="flex items-center gap-2">
                        {item.shortcut && (
                          <kbd className="text-[10px] font-mono text-muted-foreground">
                            {item.shortcut}
                          </kbd>
                        )}
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
