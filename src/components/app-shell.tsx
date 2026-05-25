"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Menu, Bell, RefreshCw, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { SIDEBAR_WIDTH } from "@/lib/sidebar-config";
import { CommandPalette } from "./command-palette";
import { ThemeToggle } from "./theme-toggle";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useAppSync } from "@/hooks/use-app-sync";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useAuth } from "@/components/auth-provider";
import { HeaderSessionStatus } from "@/components/header-session-status";
import { LiveStatusDot } from "@/components/live-status-dot";
import { sessionInitials } from "@/lib/auth-session";
import { isRemoteDataSource } from "@/lib/data-source";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { sync, syncing } = useAppSync();
  const { session, logout, isAdmin } = useAuth();
  const online = useOnlineStatus();
  const usesRemoteData = isRemoteDataSource();

  return (
    <div className="noise-bg relative min-h-screen flex">
      <div className="ambient-glow ambient-glow-amber" />
      <div className="ambient-glow ambient-glow-orange" />

      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 backdrop-blur-sm lg:hidden bg-[var(--overlay-scrim)]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: `calc(-1 * ${SIDEBAR_WIDTH})` }}
              animate={{ x: 0 }}
              exit={{ x: `calc(-1 * ${SIDEBAR_WIDTH})` }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
              style={{ width: `min(100vw, ${SIDEBAR_WIDTH})` }}
            >
              <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3.5 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--nav-hover)]"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 lg:pl-[15.75rem]">
        {/* Top bar */}
        <header className="app-titlebar sticky top-0 z-20 flex items-center gap-2 sm:gap-3 h-14 px-3 sm:px-4 lg:px-6 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md safe-top">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--nav-hover)]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <CommandPalette />

          {session ? (
            <div className="flex md:hidden items-center gap-2 min-w-0 max-w-[45vw]">
              <LiveStatusDot online={online} size="md" />
              <div className="min-w-0 leading-tight">
                <p className="text-xs font-semibold truncate">{session.name}</p>
                {isAdmin ? (
                  <p className="text-[10px] text-muted-foreground truncate">
                    Active · @{session.username}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <HeaderSessionStatus
            session={session}
            online={online}
            isAdmin={isAdmin}
            usesRemoteData={usesRemoteData}
          />

          <div className="flex-1" />

          <ThemeToggle />

          <button
            type="button"
            onClick={() => void sync()}
            disabled={syncing}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-[var(--nav-hover)] transition-colors disabled:opacity-60"
            title="Reload data and refresh the page"
            aria-label="Sync and refresh"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
            <span className="hidden sm:inline">{syncing ? "Syncing…" : "Sync"}</span>
          </button>

          <button
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[var(--nav-hover)] transition-colors"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 pulse-active" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 h-8 pl-1 pr-2.5 rounded-lg hover:bg-[var(--nav-hover)] transition-colors"
              aria-label="Account menu"
            >
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[10px] font-bold text-charcoal-950">
                {session ? sessionInitials(session.name) : "?"}
              </div>
              <span className="sr-only">{session?.name ?? "Account"}</span>
            </button>
            {userMenuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40"
                  aria-label="Close menu"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-[var(--border)] bg-[var(--surface-overlay)] shadow-lg py-1">
                  <p className="px-3 py-2 text-xs text-muted-foreground border-b border-[var(--border)]">
                    @{session?.username}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-[var(--nav-hover)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main
          className={cn(
            "flex-1 min-w-0 overflow-x-hidden p-3 sm:p-4 lg:p-6",
            "pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          )}
        >
          {children}
        </main>

        <MobileBottomNav onOpenMenu={() => setMobileOpen(true)} />
      </div>
    </div>
  );
}
