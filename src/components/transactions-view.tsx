"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, Badge, Input, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/modal";
import { useStore } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { useAdminPasswordConfirm } from "@/hooks/use-admin-password-confirm";

const TABS = [
  { label: "Overview", href: "/transactions", type: null as Transaction["type"] | null },
  { label: "Sales", href: "/transactions/sales", type: "sale" as const },
  { label: "Purchases", href: "/transactions/purchases", type: "purchase" as const },
  { label: "Expenses", href: "/transactions/expenses", type: "expense" as const },
];

export function TransactionsView({ defaultType }: { defaultType?: Transaction["type"] }) {
  const pathname = usePathname();
  const { state, addTransaction, deleteTransaction } = useStore();
  const { requestConfirm, modal: adminModal } = useAdminPasswordConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    type: (defaultType ?? "sale") as Transaction["type"],
    description: "",
    amount: "",
    category: "",
  });

  const filterType =
    TABS.find((t) => t.href === pathname)?.type ?? defaultType ?? null;

  const list = filterType
    ? state.transactions.filter((t) => t.type === filterType)
    : state.transactions;

  const sales = state.transactions.filter((t) => t.type === "sale");
  const purchases = state.transactions.filter((t) => t.type === "purchase");
  const expenses = state.transactions.filter((t) => t.type === "expense");

  const openRecord = () => {
    setForm({
      type: defaultType ?? filterType ?? "sale",
      description: "",
      amount: "",
      category: "",
    });
    setModalOpen(true);
  };

  const submit = () => {
    const amount = parseFloat(form.amount);
    if (!form.description.trim() || !amount || amount <= 0) return;
    addTransaction({
      type: form.type,
      description: form.description.trim(),
      amount,
      category: form.category.trim() || undefined,
    });
    setModalOpen(false);
  };

  return (
    <div className="max-w-[1200px] space-y-5">
      <PageHeader
        title="Transactions"
        subtitle="Manual sales, purchases & expenses"
        actions={
          <Button size="sm" onClick={openRecord}>
            <Plus className="h-4 w-4" />
            Record
          </Button>
        }
      />

      <div className="flex gap-1 border-b border-[var(--border)] pb-px overflow-x-auto">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              pathname === tab.href
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {!filterType && (
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="surface-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sales</p>
            <p className="text-2xl font-semibold tabular-nums text-emerald-400 mt-1">
              {formatCurrency(sales.reduce((s, t) => s + t.amount, 0))}
            </p>
          </div>
          <div className="surface-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Purchases</p>
            <p className="text-2xl font-semibold tabular-nums text-sky-400 mt-1">
              {formatCurrency(purchases.reduce((s, t) => s + t.amount, 0))}
            </p>
          </div>
          <div className="surface-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Expenses</p>
            <p className="text-2xl font-semibold tabular-nums text-rose-400 mt-1">
              {formatCurrency(expenses.reduce((s, t) => s + t.amount, 0))}
            </p>
          </div>
        </div>
      )}

      <div className="surface-card overflow-hidden">
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground p-8 text-center">No transactions yet</p>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Type</th>
                <th>Date</th>
                <th className="text-right">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-xs text-muted-foreground">{tx.id}</td>
                  <td className="font-medium">{tx.description}</td>
                  <td>
                    <Badge
                      variant={
                        tx.type === "sale" ? "success" : tx.type === "purchase" ? "info" : "danger"
                      }
                    >
                      {tx.type}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground">{tx.date}</td>
                  <td className="text-right tabular-nums font-medium">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() =>
                        requestConfirm({
                          title: "Delete transaction",
                          message: `Enter admin password to delete “${tx.description}”.`,
                          onConfirm: () => deleteTransaction(tx.id),
                        })
                      }
                      className="p-1.5 text-muted-foreground hover:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-[var(--nav-hover)]"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record transaction"
        footer={
          <ModalActions
            onCancel={() => setModalOpen(false)}
            onSubmit={submit}
            submitLabel="Save"
            disabled={!form.description.trim() || !form.amount}
          />
        }
      >
        <div className="space-y-3">
          {!defaultType && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as Transaction["type"] }))
                }
                className="w-full"
              >
                <option value="sale">Sale</option>
                <option value="purchase">Purchase</option>
                <option value="expense">Expense</option>
              </Select>
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What was this for?"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amount (₹)</label>
            <Input
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Category (optional)</label>
            <Input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
      {adminModal}
    </div>
  );
}
