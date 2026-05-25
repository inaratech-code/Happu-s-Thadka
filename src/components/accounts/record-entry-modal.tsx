"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Modal, ModalActions } from "@/components/modal";
import { FormField, PresetChips, QuickChips } from "@/components/forms/form-field";
import { Input, Select } from "@/components/ui/primitives";
import { PartyField } from "@/components/accounts/party-field";
import { LEDGER_DESCRIPTION_PRESETS } from "@/lib/entry-presets";
import { type LedgerEntryMode, todayIso } from "@/lib/validate-entry";
import type { FinancialAccount, Party } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const AMOUNT_QUICK = [100, 500, 1000, 2000, 5000, 10000] as const;

export type LedgerFormState = {
  description: string;
  amount: string;
  date: string;
  mode: LedgerEntryMode;
  accountId: string;
  party: string;
};

export const emptyLedgerForm = (accountId: string): LedgerFormState => ({
  description: "",
  amount: "",
  date: todayIso(),
  mode: "in",
  accountId,
  party: "",
});

type Props = {
  open: boolean;
  onClose: () => void;
  form: LedgerFormState;
  setForm: React.Dispatch<React.SetStateAction<LedgerFormState>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  accounts: FinancialAccount[];
  parties: Party[];
  previewBalance: number | null;
  onSubmit: () => void;
};

export function RecordEntryModal({
  open,
  onClose,
  form,
  setForm,
  errors,
  setErrors,
  accounts,
  parties,
  previewBalance,
  onSubmit,
}: Props) {
  const activeAccounts = accounts.filter((a) => a.active);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record money movement"
      footer={
        <ModalActions
          formId="ledger-entry-form"
          onCancel={onClose}
          onSubmit={onSubmit}
          submitLabel="Save entry"
        />
      }
    >
      <form
        id="ledger-entry-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
          {(
            [
              { mode: "in" as const, label: "Money in", icon: ArrowDownLeft, sub: "Sales, deposits" },
              { mode: "out" as const, label: "Money out", icon: ArrowUpRight, sub: "Bills, purchases" },
            ] as const
          ).map(({ mode, label, icon: Icon, sub }) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setForm((f) => ({ ...f, mode }));
                setErrors((e) => ({ ...e, amount: "" }));
              }}
              className={cn(
                "rounded-md px-3 py-2.5 text-left transition-colors",
                form.mode === mode
                  ? "bg-amber-500/15 border border-amber-500/30 text-foreground"
                  : "border border-transparent text-muted-foreground hover:bg-[var(--nav-hover)]"
              )}
            >
              <Icon className={cn("h-4 w-4 mb-1", form.mode === mode ? "text-amber-500" : "")} />
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-[10px] opacity-80">{sub}</p>
            </button>
          ))}
        </div>

        <FormField label="Financial account" required error={errors.accountId}>
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

        <FormField label="Amount (₹)" required error={errors.amount}>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="0"
            autoFocus
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

        {previewBalance !== null && (
          <p className="text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2">
            Balance after this entry:{" "}
            <span className="font-semibold tabular-nums text-amber-400">
              {formatCurrency(previewBalance)}
            </span>
          </p>
        )}

        <PartyField
          label={form.mode === "in" ? "Received from (party)" : "Paid to (party)"}
          value={form.party}
          onChange={(party) => setForm((f) => ({ ...f, party }))}
          parties={parties}
          hint="Optional — links this entry to a ledger account card (any supplier, customer, or Cash sales & expenses)."
        />

        <FormField label="Description" required error={errors.description}>
          <Input
            placeholder="e.g. Vegetable supplier — weekly"
            value={form.description}
            onChange={(e) => {
              setForm((f) => ({ ...f, description: e.target.value }));
              setErrors((err) => ({ ...err, description: "" }));
            }}
          />
          <PresetChips
            className="mt-2"
            presets={LEDGER_DESCRIPTION_PRESETS}
            onPick={(preset) => {
              setForm((f) => ({ ...f, description: preset }));
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
  );
}
