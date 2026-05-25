"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, Input, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/modal";
import { PartyField } from "@/components/accounts/party-field";
import { FormField, QuickChips } from "@/components/forms/form-field";
import { useStore } from "@/lib/store";
import { defaultCashAccountId } from "@/lib/default-accounts";
import {
  accountNameById,
  paymentEntries,
  sortLedgerEntries,
} from "@/lib/account-stats";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/entry-presets";
import { todayIso, validatePaymentEntry } from "@/lib/validate-entry";
import type { FinancialAccount, LedgerEntry, PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const AMOUNT_QUICK = [500, 1000, 2000, 5000, 10000, 25000] as const;

const emptyPaymentForm = (accountId: string) => ({
  party: "",
  description: "",
  amount: "",
  date: todayIso(),
  accountId,
  paymentMethod: "cash" as PaymentMethod,
});

export default function PaymentsPage() {
  const { state, addLedgerEntry, deleteLedgerEntry } = useStore();
  const cashId = defaultCashAccountId(state.financialAccounts);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => emptyPaymentForm(cashId));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const payments = useMemo(
    () => sortLedgerEntries(paymentEntries(state.ledgerEntries)).reverse(),
    [state.ledgerEntries]
  );

  const totalPaid = payments.reduce((s, p) => s + p.debit, 0);
  const activeAccounts = state.financialAccounts.filter((a) => a.active);

  const resetForm = () => {
    setForm(emptyPaymentForm(defaultCashAccountId(state.financialAccounts)));
    setErrors({});
  };

  const submit = () => {
    const result = validatePaymentEntry(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    addLedgerEntry({
      date: form.date,
      description: form.description.trim(),
      party: form.party.trim(),
      debit: result.amount,
      credit: 0,
      accountId: form.accountId,
      paymentMethod: form.paymentMethod,
      kind: "payment",
    });
    resetForm();
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Money paid out — suppliers, rent & bills"
        actions={
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Record payment
          </Button>
        }
      />

      <div className="surface-card p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total payments recorded</p>
        <p className="text-2xl font-bold tabular-nums text-rose-400 mt-1">{formatCurrency(totalPaid)}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{payments.length} payment(s) in the book</p>
      </div>

      {payments.length === 0 ? (
        <div className="surface-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          <Button className="mt-4" size="sm" onClick={() => setOpen(true)}>
            Record first payment
          </Button>
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-2">
            {payments.map((entry) => (
              <PaymentCard
                key={entry.id}
                entry={entry}
                accounts={state.financialAccounts}
                onDelete={() => {
                  if (confirm(`Remove payment to “${entry.party ?? entry.description}”?`)) {
                    deleteLedgerEntry(entry.id);
                  }
                }}
              />
            ))}
          </div>
          <div className="surface-card overflow-hidden hidden lg:block">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Description</th>
                  <th>Account</th>
                  <th>Method</th>
                  <th className="text-right">Amount</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {payments.map((entry) => (
                  <tr key={entry.id}>
                    <td className="text-muted-foreground whitespace-nowrap">{entry.date}</td>
                    <td className="font-medium">{entry.party ?? "—"}</td>
                    <td>{entry.description}</td>
                    <td className="text-muted-foreground text-sm">
                      {accountNameById(state.financialAccounts, entry.accountId)}
                    </td>
                    <td className="text-muted-foreground text-sm capitalize">
                      {entry.paymentMethod ?? "—"}
                    </td>
                    <td className="text-right tabular-nums text-rose-400 font-semibold">
                      {formatCurrency(entry.debit)}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove payment to “${entry.party ?? entry.description}”?`)) {
                            deleteLedgerEntry(entry.id);
                          }
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-red-400"
                        aria-label="Delete payment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="Record payment"
        footer={
          <ModalActions
            formId="payment-form"
            onCancel={() => {
              setOpen(false);
              resetForm();
            }}
            onSubmit={submit}
            submitLabel="Save payment"
          />
        }
      >
        <form
          id="payment-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-4"
        >
          <PartyField
            label="Paid to (party)"
            required
            error={errors.party}
            value={form.party}
            onChange={(party) => {
              setForm((f) => ({ ...f, party }));
              setErrors((err) => ({ ...err, party: "" }));
            }}
            parties={state.parties}
            types={["supplier", "other"]}
          />

          <FormField label="Amount (₹)" required error={errors.amount}>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={form.amount}
              onChange={(e) => {
                setForm((f) => ({ ...f, amount: e.target.value }));
                setErrors((err) => ({ ...err, amount: "" }));
              }}
            />
            <QuickChips
              className="mt-2"
              values={AMOUNT_QUICK}
              format={(n) => `₹${n.toLocaleString("en-IN")}`}
              onPick={(n) => {
                setForm((f) => ({ ...f, amount: String(n) }));
                setErrors((err) => ({ ...err, amount: "" }));
              }}
            />
          </FormField>

          <FormField label="Paid from account" required error={errors.accountId}>
            <Select
              value={form.accountId}
              onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
            >
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Payment method">
            <Select
              value={form.paymentMethod}
              onChange={(e) =>
                setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))
              }
            >
              {PAYMENT_METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Note / reference" required error={errors.description}>
            <Input
              placeholder="Invoice no., bill period, etc."
              value={form.description}
              onChange={(e) => {
                setForm((f) => ({ ...f, description: e.target.value }));
                setErrors((err) => ({ ...err, description: "" }));
              }}
            />
          </FormField>

          <FormField label="Date" required error={errors.date}>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </FormField>
        </form>
      </Modal>
    </>
  );
}

function PaymentCard({
  entry,
  accounts,
  onDelete,
}: {
  entry: LedgerEntry;
  accounts: FinancialAccount[];
  onDelete: () => void;
}) {
  return (
    <div className="surface-card p-3 flex flex-col gap-2">
      <div className="flex justify-between gap-2">
        <div>
          <p className="font-medium">{entry.party ?? entry.description}</p>
          <p className="text-[11px] text-muted-foreground">
            {entry.date} · {accountNameById(accounts, entry.accountId)}
            {entry.paymentMethod ? ` · ${entry.paymentMethod}` : ""}
          </p>
          {entry.party ? (
            <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
          ) : null}
        </div>
        <div className="text-right shrink-0">
          <p className="text-rose-400 font-semibold tabular-nums">{formatCurrency(entry.debit)}</p>
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
    </div>
  );
}
