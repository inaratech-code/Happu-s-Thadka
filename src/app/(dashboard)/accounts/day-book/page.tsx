"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { LedgerRowsMobile, LedgerRowsTable } from "@/components/accounts/ledger-rows";
import { useStore } from "@/lib/store";
import { dayBookForDate } from "@/lib/account-stats";
import { todayIso } from "@/lib/validate-entry";
import { formatCurrency } from "@/lib/utils";

export default function DayBookPage() {
  const { state, deleteLedgerEntry } = useStore();
  const [date, setDate] = useState(todayIso());

  const book = useMemo(
    () => dayBookForDate(state.ledgerEntries, date),
    [state.ledgerEntries, date]
  );

  const onDelete = (id: string, description: string) => {
    if (confirm(`Remove “${description}”?`)) deleteLedgerEntry(id);
  };

  return (
    <>
      <PageHeader
        title="Day book"
        subtitle="Daily cash book — opening, movements & closing"
        actions={
          <Link
            href="/accounts/ledger"
            className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 text-xs rounded-md w-full sm:w-auto bg-gradient-to-b from-amber-500 to-amber-600 text-charcoal-950 font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add entry
          </Link>
        }
      />

      <FormFieldDate date={date} onChange={setDate} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard label="Opening" value={formatCurrency(book.openingBalance)} />
        <SummaryCard label="Money in" value={formatCurrency(book.totalIn)} className="text-emerald-400" />
        <SummaryCard label="Money out" value={formatCurrency(book.totalOut)} className="text-rose-400" />
        <SummaryCard label="Closing" value={formatCurrency(book.closingBalance)} className="text-amber-400" />
      </div>

      {book.rows.length === 0 ? (
        <div className="surface-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No entries on this date.</p>
          <Link
            href="/accounts/ledger"
            className="inline-flex mt-4 items-center justify-center h-7 px-2.5 text-xs rounded-md bg-gradient-to-b from-amber-500 to-amber-600 text-charcoal-950 font-semibold"
          >
            Record entry
          </Link>
        </div>
      ) : (
        <>
          <LedgerRowsMobile
            rows={book.rows}
            accounts={state.financialAccounts}
            onDelete={onDelete}
            showAccount
          />
          <LedgerRowsTable
            rows={book.rows}
            accounts={state.financialAccounts}
            onDelete={onDelete}
            showAccount
          />
        </>
      )}
    </>
  );
}

function FormFieldDate({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  return (
    <div className="surface-card p-3 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Book date</span>
        <Input type="date" value={date} onChange={(e) => onChange(e.target.value)} className="w-auto" />
      </label>
      <Button type="button" size="sm" variant="ghost" onClick={() => onChange(todayIso())}>
        Today
      </Button>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="surface-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold tabular-nums mt-1 ${className ?? ""}`}>{value}</p>
    </div>
  );
}
