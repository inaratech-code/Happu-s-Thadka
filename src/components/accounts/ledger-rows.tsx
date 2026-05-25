"use client";

import { Trash2 } from "lucide-react";
import type { FinancialAccount, LedgerEntry } from "@/lib/types";
import { accountNameById } from "@/lib/account-stats";
import { formatCurrency } from "@/lib/utils";

export type LedgerRow = { entry: LedgerEntry; balance: number };

type Props = {
  rows: LedgerRow[];
  accounts: FinancialAccount[];
  onDelete: (id: string, description: string) => void;
  showAccount?: boolean;
};

export function LedgerRowsMobile({ rows, accounts, onDelete, showAccount }: Props) {
  return (
    <div className="lg:hidden space-y-2">
      {rows.map(({ entry, balance }) => (
        <div key={entry.id} className="surface-card p-3 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium break-words">{entry.description}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {entry.date}
                {entry.party ? ` · ${entry.party}` : ""}
                {showAccount ? ` · ${accountNameById(accounts, entry.accountId)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDelete(entry.id, entry.description)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 shrink-0"
              aria-label="Delete entry"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="flex justify-between text-xs tabular-nums">
            {entry.debit > 0 ? (
              <span className="text-rose-400">Out {formatCurrency(entry.debit)}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
            {entry.credit > 0 ? (
              <span className="text-emerald-400">In {formatCurrency(entry.credit)}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LedgerRowsTable({ rows, accounts, onDelete, showAccount }: Props) {
  return (
    <div className="surface-card overflow-hidden hidden lg:block">
      <table className="data-table w-full">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            {showAccount && <th>Account</th>}
            <th className="text-right">Out</th>
            <th className="text-right">In</th>
            <th className="text-right">Balance</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ entry, balance }) => (
            <tr key={entry.id}>
              <td className="text-muted-foreground whitespace-nowrap">{entry.date}</td>
              <td className="font-medium">
                {entry.description}
                {entry.party ? (
                  <span className="block text-[11px] font-normal text-muted-foreground">
                    {entry.party}
                  </span>
                ) : null}
              </td>
              {showAccount && (
                <td className="text-muted-foreground text-sm">
                  {accountNameById(accounts, entry.accountId)}
                </td>
              )}
              <td className="text-right tabular-nums text-rose-400">
                {entry.debit ? formatCurrency(entry.debit) : "—"}
              </td>
              <td className="text-right tabular-nums text-emerald-400">
                {entry.credit ? formatCurrency(entry.credit) : "—"}
              </td>
              <td className="text-right tabular-nums font-semibold">{formatCurrency(balance)}</td>
              <td>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id, entry.description)}
                  className="p-1 rounded text-muted-foreground hover:text-red-400"
                  aria-label="Delete entry"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
