"use client";

import { useState } from "react";
import { Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, Input, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/modal";
import { FormField } from "@/components/forms/form-field";
import { useStore } from "@/lib/store";
import { accountBalance } from "@/lib/account-stats";
import { validateFinancialAccount } from "@/lib/validate-entry";
import type { FinancialAccount, FinancialAccountType } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { useAdminPasswordConfirm } from "@/hooks/use-admin-password-confirm";

const TYPE_LABELS: Record<FinancialAccountType, string> = {
  cash: "Cash",
  bank: "Bank",
  digital: "QR / Digital",
  other: "Other",
};

const emptyAccountForm = () => ({
  name: "",
  type: "cash" as FinancialAccountType,
  openingBalance: "0",
});

export default function FinancialAccountsPage() {
  const { state, addFinancialAccount, updateFinancialAccount, deleteFinancialAccount } =
    useStore();
  const { requestConfirm, modal: adminModal } = useAdminPasswordConfirm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialAccount | null>(null);
  const [form, setForm] = useState(emptyAccountForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const accounts = state.financialAccounts;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyAccountForm());
    setErrors({});
    setOpen(true);
  };

  const openEdit = (account: FinancialAccount) => {
    setEditing(account);
    setForm({
      name: account.name,
      type: account.type,
      openingBalance: String(account.openingBalance),
    });
    setErrors({});
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyAccountForm());
    setErrors({});
  };

  const submit = () => {
    const result = validateFinancialAccount(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (editing) {
      updateFinancialAccount(editing.id, {
        name: form.name.trim(),
        type: form.type,
        openingBalance: result.openingBalance,
      });
    } else {
      addFinancialAccount({
        name: form.name.trim(),
        type: form.type,
        openingBalance: result.openingBalance,
        active: true,
      });
    }
    closeModal();
  };

  const handleDelete = (account: FinancialAccount) => {
    const res = deleteFinancialAccount(account.id);
    if (!res.ok) alert(res.error);
  };

  return (
    <>
      <PageHeader
        title="Financial accounts"
        subtitle="Cash, bank & wallets — balances from opening + ledger"
        actions={
          <Button size="sm" className="w-full sm:w-auto" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add account
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          const balance = accountBalance(account, state.ledgerEntries);
          return (
            <div
              key={account.id}
              className={cn(
                "surface-card p-4 flex flex-col gap-3",
                !account.active && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Landmark className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{account.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {TYPE_LABELS[account.type]}
                      {!account.active ? " · Inactive" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(account)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground"
                    aria-label="Edit account"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestConfirm({
                        title: "Delete financial account",
                        message: `Enter admin password to delete “${account.name}”.`,
                        onConfirm: () => handleDelete(account),
                      })
                    }
                    className="p-1.5 rounded text-muted-foreground hover:text-red-400"
                    aria-label="Delete account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Current balance
                </p>
                <p className="text-xl font-bold tabular-nums text-amber-400 mt-0.5">
                  {formatCurrency(balance)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Opening {formatCurrency(account.openingBalance)}
                </p>
              </div>
              {account.active ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => updateFinancialAccount(account.id, { active: false })}
                >
                  Mark inactive
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => updateFinancialAccount(account.id, { active: true })}
                >
                  Reactivate
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? "Edit account" : "New financial account"}
        footer={
          <ModalActions
            formId="financial-account-form"
            onCancel={closeModal}
            onSubmit={submit}
            submitLabel={editing ? "Save changes" : "Add account"}
          />
        }
      >
        <form
          id="financial-account-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-4"
        >
          <FormField label="Account name" required error={errors.name}>
            <Input
              autoFocus
              placeholder="e.g. Petty cash"
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                setErrors((err) => ({ ...err, name: "" }));
              }}
            />
          </FormField>

          <FormField label="Type">
            <Select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as FinancialAccountType }))
              }
            >
              {(Object.keys(TYPE_LABELS) as FinancialAccountType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Opening balance (₹)" required error={errors.openingBalance}>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={form.openingBalance}
              onChange={(e) => {
                setForm((f) => ({ ...f, openingBalance: e.target.value }));
                setErrors((err) => ({ ...err, openingBalance: "" }));
              }}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Balance before entries in this app (use 0 for new accounts).
            </p>
          </FormField>
        </form>
      </Modal>
      {adminModal}
    </>
  );
}
