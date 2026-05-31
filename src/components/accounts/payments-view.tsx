"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, BookOpen, Trash2 } from "lucide-react";
import { PageHeader, Input, Select, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { NepaliDateFields } from "@/components/nepali-date-fields";
import { useStore } from "@/lib/store";
import { defaultCashAccountId } from "@/lib/default-accounts";
import { GENERAL_LEDGER_PARTY_ID } from "@/lib/default-parties";
import {
  accountNameById,
  paymentHistoryEntries,
  sortLedgerEntries,
} from "@/lib/account-stats";
import { partyTypeFilterToPartyType } from "@/lib/ledger-accounts";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/entry-presets";
import {
  todayIso,
  validateAccountsPayment,
  type AccountsPartyTypeFilter,
  type AccountsPaymentDirection,
} from "@/lib/validate-entry";
import type { FinancialAccount, LedgerEntry, PaymentMethod } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { useAdminPasswordConfirm } from "@/hooks/use-admin-password-confirm";

const PARTY_TYPE_OPTIONS: { value: AccountsPartyTypeFilter; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "supplier", label: "Supplier" },
  { value: "worker", label: "Worker" },
];

const emptyForm = (accountId: string) => ({
  partyType: "customer" as AccountsPartyTypeFilter,
  party: "",
  amount: "",
  description: "",
  date: todayIso(),
  accountId,
  paymentMethod: "cash" as PaymentMethod,
});

function paymentMethodLabel(method: PaymentMethod) {
  return PAYMENT_METHOD_OPTIONS.find((o) => o.value === method)?.label ?? method;
}

function submitLabel(direction: AccountsPaymentDirection, method: PaymentMethod) {
  const verb = direction === "receive" ? "Receive" : "Pay";
  const mode = paymentMethodLabel(method);
  if (method === "cash") return `${verb} Cash`;
  return `${verb} via ${mode}`;
}

type Props = {
  initialDirection?: AccountsPaymentDirection;
  initialParty?: string;
  initialPartyType?: AccountsPartyTypeFilter;
};

export function PaymentsView({
  initialDirection = "receive",
  initialParty = "",
  initialPartyType = "customer",
}: Props) {
  const searchParams = useSearchParams();
  const { state, addLedgerEntry, deleteLedgerEntry } = useStore();
  const { requestConfirm, modal: adminModal } = useAdminPasswordConfirm();

  const cashId = defaultCashAccountId(state.financialAccounts);
  const activeAccounts = state.financialAccounts.filter((a) => a.active);

  const [direction, setDirection] = useState<AccountsPaymentDirection>(initialDirection);
  const [form, setForm] = useState(() => ({
    ...emptyForm(cashId),
    partyType: initialPartyType,
    party: initialParty,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dir = searchParams.get("direction");
    const party = searchParams.get("party");
    const partyType = searchParams.get("partyType");
    if (dir === "receive" || dir === "pay") setDirection(dir);
    if (partyType === "customer" || partyType === "supplier" || partyType === "worker") {
      setForm((f) => ({ ...f, partyType, ...(party ? {} : { party: "" }) }));
    }
    if (party) setForm((f) => ({ ...f, party }));
  }, [searchParams]);

  const partiesForType = useMemo(() => {
    const type = partyTypeFilterToPartyType(form.partyType);
    const filtered = state.parties
      .filter((p) => p.active && (p.type === type || p.id === GENERAL_LEDGER_PARTY_ID))
      .sort((a, b) => {
        if (a.id === GENERAL_LEDGER_PARTY_ID) return -1;
        if (b.id === GENERAL_LEDGER_PARTY_ID) return 1;
        return a.name.localeCompare(b.name);
      });
    return filtered;
  }, [form.partyType, state.parties]);

  const history = useMemo(
    () => sortLedgerEntries(paymentHistoryEntries(state.ledgerEntries)).reverse(),
    [state.ledgerEntries]
  );

  const totalReceived = history.reduce((s, e) => s + e.credit, 0);
  const totalPaid = history.reduce((s, e) => s + e.debit, 0);

  const resetForm = (keepDirection = direction) => {
    setForm({
      ...emptyForm(defaultCashAccountId(state.financialAccounts)),
      partyType: form.partyType,
    });
    setErrors({});
    setDirection(keepDirection);
  };

  const submit = () => {
    const result = validateAccountsPayment({
      description: form.description,
      amount: form.amount,
      date: form.date,
      party: form.party,
      accountId: form.accountId,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    const note =
      form.description.trim() ||
      (direction === "receive"
        ? `Received from ${form.party.trim()}`
        : `Paid to ${form.party.trim()}`);

    setSubmitting(true);
    addLedgerEntry({
      date: form.date,
      description: note,
      party: form.party.trim(),
      debit: direction === "pay" ? result.amount : 0,
      credit: direction === "receive" ? result.amount : 0,
      accountId: form.accountId,
      paymentMethod: form.paymentMethod,
      kind: direction === "receive" ? "receipt" : "payment",
    });
    setSubmitting(false);
    resetForm();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        subtitle="Receive from customers or pay suppliers. Cash updates Day Book automatically."
      />

      <div className="surface-card p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
          {(
            [
              {
                mode: "receive" as const,
                label: "Receive",
                icon: ArrowDownLeft,
                sub: "From customers",
              },
              {
                mode: "pay" as const,
                label: "Pay",
                icon: ArrowUpRight,
                sub: "To suppliers & workers",
              },
            ] as const
          ).map(({ mode, label, icon: Icon, sub }) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setDirection(mode);
                setErrors({});
              }}
              className={cn(
                "rounded-md px-3 py-2.5 text-left transition-colors",
                direction === mode
                  ? "bg-amber-500/15 border border-amber-500/30 text-foreground"
                  : "border border-transparent text-muted-foreground hover:bg-[var(--nav-hover)]"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 mb-1",
                  direction === mode ? "text-amber-500" : ""
                )}
              />
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-[10px] opacity-80">{sub}</p>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <FormField label="Party type">
            <Select
              value={form.partyType}
              onChange={(e) => {
                const partyType = e.target.value as AccountsPartyTypeFilter;
                setForm((f) => ({ ...f, partyType, party: "" }));
                setErrors((err) => ({ ...err, party: "" }));
              }}
              className="w-full"
            >
              {PARTY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Party" required error={errors.party}>
            <Select
              value={form.party}
              onChange={(e) => {
                setForm((f) => ({ ...f, party: e.target.value }));
                setErrors((err) => ({ ...err, party: "" }));
              }}
              className="w-full"
            >
              <option value="">Select…</option>
              {partiesForType.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </Select>
            {partiesForType.length === 0 ? (
              <p className="text-[11px] text-amber-500/90 mt-1.5">
                No {form.partyType}s yet.{" "}
                <Link href="/accounts/ledger" className="underline hover:text-amber-400">
                  Add under Ledger
                </Link>
              </p>
            ) : null}
          </FormField>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <FormField label="Payment mode">
            <Select
              value={form.paymentMethod}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  paymentMethod: e.target.value as PaymentMethod,
                }))
              }
              className="w-full"
            >
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Amount" required error={errors.amount}>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="0"
              value={form.amount}
              onChange={(e) => {
                setForm((f) => ({ ...f, amount: e.target.value }));
                setErrors((err) => ({ ...err, amount: "" }));
              }}
            />
          </FormField>
        </div>

        <FormField label="Account" required error={errors.accountId}>
          <Select
            value={form.accountId}
            onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
            className="w-full"
          >
            <option value="">Select account…</option>
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Date" required error={errors.date}>
          <NepaliDateFields
            value={form.date}
            onChange={(date) => setForm((f) => ({ ...f, date }))}
          />
        </FormField>

        <FormField label="Note (optional)" error={errors.description}>
          <Input
            placeholder="e.g. part payment, advance, settlement"
            value={form.description}
            onChange={(e) => {
              setForm((f) => ({ ...f, description: e.target.value }));
              setErrors((err) => ({ ...err, description: "" }));
            }}
          />
        </FormField>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-[var(--border)]">
          <Link
            href="/accounts/ledger"
            className="inline-flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 font-medium"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Ledger
          </Link>
          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={submitting}
            onClick={submit}
          >
            {submitLabel(direction, form.paymentMethod)}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="surface-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Received</p>
          <p className="text-lg font-bold tabular-nums text-emerald-400 mt-1">
            {formatCurrency(totalReceived)}
          </p>
        </div>
        <div className="surface-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid out</p>
          <p className="text-lg font-bold tabular-nums text-rose-400 mt-1">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="surface-card p-3 col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net</p>
          <p className="text-lg font-bold tabular-nums text-amber-400 mt-1">
            {formatCurrency(totalReceived - totalPaid)}
          </p>
        </div>
      </div>

      <PaymentHistory
        entries={history}
        accounts={state.financialAccounts}
        onDelete={(entry) =>
          requestConfirm({
            title: "Remove payment",
            message: `Enter admin password to remove “${entry.description}”.`,
            onConfirm: () => deleteLedgerEntry(entry.id),
          })
        }
      />

      {adminModal}
    </div>
  );
}

function PaymentHistory({
  entries,
  accounts,
  onDelete,
}: {
  entries: LedgerEntry[];
  accounts: FinancialAccount[];
  onDelete: (entry: LedgerEntry) => void;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold">Payment history</h2>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground p-8 text-center">
          No payments recorded yet.
        </p>
      ) : (
        <>
          <div className="lg:hidden divide-y divide-[var(--border)]">
            {entries.map((entry) => (
              <PaymentHistoryCard
                key={entry.id}
                entry={entry}
                accounts={accounts}
                onDelete={() => onDelete(entry)}
              />
            ))}
          </div>
          <div className="hidden lg:block overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Note</th>
                  <th>Type</th>
                  <th>Account</th>
                  <th>Mode</th>
                  <th className="text-right">Amount</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isReceive = entry.credit > 0;
                  const amount = isReceive ? entry.credit : entry.debit;
                  return (
                    <tr key={entry.id}>
                      <td className="text-muted-foreground whitespace-nowrap">{entry.date}</td>
                      <td className="font-medium">{entry.party ?? "—"}</td>
                      <td className="text-sm">{entry.description}</td>
                      <td>
                        <Badge variant={isReceive ? "success" : "danger"}>
                          {isReceive ? "Receive" : "Pay"}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {accountNameById(accounts, entry.accountId)}
                      </td>
                      <td className="text-muted-foreground text-sm capitalize">
                        {entry.paymentMethod ?? "—"}
                      </td>
                      <td
                        className={cn(
                          "text-right tabular-nums font-semibold",
                          isReceive ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {isReceive ? "+" : "−"}
                        {formatCurrency(amount)}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => onDelete(entry)}
                          className="p-1 rounded text-muted-foreground hover:text-red-400"
                          aria-label="Delete payment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PaymentHistoryCard({
  entry,
  accounts,
  onDelete,
}: {
  entry: LedgerEntry;
  accounts: FinancialAccount[];
  onDelete: () => void;
}) {
  const isReceive = entry.credit > 0;
  const amount = isReceive ? entry.credit : entry.debit;

  return (
    <div className="p-3 flex justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium">{entry.party ?? entry.description}</p>
          <Badge variant={isReceive ? "success" : "danger"}>
            {isReceive ? "Receive" : "Pay"}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {entry.date} · {accountNameById(accounts, entry.accountId)}
          {entry.paymentMethod ? ` · ${entry.paymentMethod}` : ""}
        </p>
        {entry.party ? (
          <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
        ) : null}
      </div>
      <div className="text-right shrink-0">
        <p
          className={cn(
            "font-semibold tabular-nums",
            isReceive ? "text-emerald-400" : "text-rose-400"
          )}
        >
          {isReceive ? "+" : "−"}
          {formatCurrency(amount)}
        </p>
        <button
          type="button"
          onClick={onDelete}
          className="mt-1 p-1 text-muted-foreground hover:text-red-400"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
