"use client";

import { Cloud, CloudOff } from "lucide-react";
import { LiveStatusDot } from "@/components/live-status-dot";
import type { AuthSession } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  session: AuthSession | null;
  online: boolean;
  isAdmin: boolean;
  usesRemoteData: boolean;
};

export function HeaderSessionStatus({ session, online, isAdmin, usesRemoteData }: Props) {
  if (!session) return null;

  const syncLabel = online ? (usesRemoteData ? "Synced" : "Online") : "Offline";

  return (
    <div
      className="hidden md:flex items-center gap-3 min-w-0 pl-3 ml-1 border-l border-[var(--border)]"
      aria-label={`${session.name}, ${online ? "online" : "offline"}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <LiveStatusDot online={online} size="md" />
        <div className="min-w-0 leading-tight">
          <p className="text-xs font-semibold text-foreground truncate max-w-[200px] lg:max-w-[280px]">
            {session.name}
          </p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[200px] lg:max-w-[280px]">
            {isAdmin ? (
              <>
                Active · <span className="text-foreground/80">@{session.username}</span>
                <span className="text-amber-400/90 font-medium"> · Admin</span>
              </>
            ) : (
              <>
                Active · @{session.username}
              </>
            )}
          </p>
        </div>
      </div>

      <span
        className={cn(
          "shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider",
          online
            ? "bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/15"
            : "bg-amber-500/10 text-amber-400/90 border border-amber-500/15"
        )}
      >
        {online ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
        {syncLabel}
      </span>
    </div>
  );
}
