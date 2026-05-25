"use client";

import { Pencil, Trash2 } from "lucide-react";
import { isFixedLedgerParty } from "@/lib/default-parties";
import {
  formatLedgerRs,
  formatNetLabel,
  partyTypeLabel,
  type LedgerAccountSummary,
} from "@/lib/ledger-accounts";
import { cn } from "@/lib/utils";

type Props = {
  account: LedgerAccountSummary;
  selected?: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function LedgerAccountCard({ account, selected, onSelect, onEdit, onDelete }: Props) {
  const net = formatNetLabel(account.net);
  const fixed = isFixedLedgerParty(account.id);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "ledger-account-card group relative flex flex-col rounded-xl border bg-[var(--surface-raised)] p-4 text-left transition-all",
        "hover:border-amber-500/25 hover:shadow-[var(--shadow-elevated)]",
        selected
          ? "border-amber-500/35 ring-1 ring-amber-500/20 shadow-[var(--nav-active-glow)]"
          : "border-[var(--border)]",
        !account.active && "opacity-55"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground pr-2 line-clamp-2">
          {account.name}
        </h3>
        {fixed ? (
          <span className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
            Fixed
          </span>
        ) : (
          <div className="flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-[var(--nav-hover)]"
              aria-label={`Edit ${account.name}`}
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
              aria-label={`Delete ${account.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </div>
        )}
      </div>

      <span className="inline-flex w-fit items-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-4">
        {partyTypeLabel(account.type)}
      </span>

      <div className="mt-auto space-y-2 text-[13px] tabular-nums">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium">Dr</span>
          <span className="font-semibold text-emerald-400">{formatLedgerRs(account.debit)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium">Cr</span>
          <span className="font-semibold text-rose-400">{formatLedgerRs(account.credit)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
          <span className="text-muted-foreground font-medium">Net</span>
          {net.settled ? (
            <span className="text-[12px] font-medium text-muted-foreground/90">settled</span>
          ) : (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                net.side === "dr"
                  ? "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/12 text-rose-400 border border-rose-500/20"
              )}
            >
              {net.text}
            </span>
          )}
        </div>
      </div>

      {account.entryCount > 0 && (
        <p className="mt-3 text-[10px] text-muted-foreground/70">
          {account.entryCount} transaction{account.entryCount === 1 ? "" : "s"}
        </p>
      )}
    </article>
  );
}
