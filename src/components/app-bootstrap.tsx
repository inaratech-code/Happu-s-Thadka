"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/lib/store";

/** Brief gate while local data + session are read from the device */
export function AppBootstrap({ children }: { children: ReactNode }) {
  const { hydrated } = useStore();
  const { ready, session } = useAuth();

  // After sign-in, session is cached immediately; show the shell while data loads.
  if (!ready || (!hydrated && !session)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground px-6">
        <div
          className="h-9 w-9 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin"
          aria-hidden
        />
        <p className="text-sm font-medium">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
