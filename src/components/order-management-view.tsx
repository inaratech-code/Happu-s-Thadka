"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trash2 } from "lucide-react";
import { PageHeader, Input, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { FormField, PresetChips } from "@/components/forms/form-field";
import { ItemSearchSelect } from "@/components/item-search-select";
import { NepaliDateFields } from "@/components/nepali-date-fields";
import { PartyField } from "@/components/accounts/party-field";
import { useStore } from "@/lib/store";
import { defaultCashAccountId } from "@/lib/default-accounts";
import { CASH_SALES_PARTY_NAME } from "@/lib/default-parties";
import {
  EXPENSE_DESCRIPTION_PRESETS,
  INVENTORY_UNITS,
  PAYMENT_METHOD_OPTIONS,
} from "@/lib/entry-presets";
import {
  todayIso,
  validateOrderExpense,
  validateOrderPurchase,
  validateOrderSale,
} from "@/lib/validate-entry";
import { qtyInInventoryUnit } from "@/lib/unit-convert";
import type { PaymentMethod, Transaction } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { useAdminPasswordConfirm } from "@/hooks/use-admin-password-confirm";

type OrderMode = "sale" | "purchase" | "expense";

const TABS: { label: string; href: string; type: OrderMode }[] = [
  { label: "Sales (POS)", href: "/transactions/sales", type: "sale" },
  { label: "Purchases", href: "/transactions/purchases", type: "purchase" },
  { label: "Expenses", href: "/transactions/expenses", type: "expense" },
];

const emptySaleForm = (accountId: string) => ({
  itemId: "",
  qty: "1",
  unit: "pcs",
  unitPrice: "",
  party: CASH_SALES_PARTY_NAME,
  date: todayIso(),
  paymentType: "cash" as "cash" | "credit",
  paymentMethod: "cash" as PaymentMethod,
  accountId,
});

const emptyPurchaseForm = (accountId: string) => ({
  itemId: "",
  qty: "1",
  unit: "pcs",
  unitPrice: "",
  party: "",
  date: todayIso(),
  paymentMethod: "cash" as PaymentMethod,
  accountId,
});

const emptyExpenseForm = (accountId: string) => ({
  description: "",
  amount: "",
  party: "",
  date: todayIso(),
  paymentMethod: "cash" as PaymentMethod,
  accountId,
});

function UnitSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (unit: string) => void;
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="w-full">
      {INVENTORY_UNITS.map((u) => (
        <option key={u} value={u}>
          {u}
        </option>
      ))}
    </Select>
  );
}

export function OrderManagementView({ mode }: { mode: OrderMode }) {
  const pathname = usePathname();
  const {
    state,
    recordInventorySale,
    recordInventoryPurchase,
    recordExpense,
    deleteTransaction,
  } = useStore();
  const { requestConfirm, modal: adminModal } = useAdminPasswordConfirm();

  const cashId = defaultCashAccountId(state.financialAccounts);
  const activeAccounts = state.financialAccounts.filter((a) => a.active);
  const activeParties = state.parties.filter((p) => p.active);

  const [saleForm, setSaleForm] = useState(() => emptySaleForm(cashId));
  const [purchaseForm, setPurchaseForm] = useState(() => emptyPurchaseForm(cashId));
  const [expenseForm, setExpenseForm] = useState(() => emptyExpenseForm(cashId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const inventoryOptions = useMemo(() => {
    const items =
      mode === "sale"
        ? state.inventory.filter((i) => i.type === "sellable")
        : state.inventory;
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      meta:
        mode === "sale"
          ? `${item.stockOnHand} ${item.unit} · ${formatCurrency(item.sellingPrice)}`
          : `${item.stockOnHand} ${item.unit} · cost ${formatCurrency(item.avgCost)}`,
    }));
  }, [mode, state.inventory]);

  const selectedSaleItem = state.inventory.find((i) => i.id === saleForm.itemId);
  const selectedPurchaseItem = state.inventory.find((i) => i.id === purchaseForm.itemId);

  const list = state.transactions.filter((t) => t.type === mode);

  const resetForm = () => {
    const accountId = defaultCashAccountId(state.financialAccounts);
    if (mode === "sale") setSaleForm(emptySaleForm(accountId));
    else if (mode === "purchase") setPurchaseForm(emptyPurchaseForm(accountId));
    else setExpenseForm(emptyExpenseForm(accountId));
    setErrors({});
  };

  const onSaleItemChange = (itemId: string) => {
    const item = state.inventory.find((i) => i.id === itemId);
    setSaleForm((f) => ({
      ...f,
      itemId,
      unit: item?.unit ?? "pcs",
      unitPrice: item ? String(item.sellingPrice || "") : "",
    }));
    setErrors((e) => ({ ...e, itemId: "", unitPrice: "" }));
  };

  const onPurchaseItemChange = (itemId: string) => {
    const item = state.inventory.find((i) => i.id === itemId);
    setPurchaseForm((f) => ({
      ...f,
      itemId,
      unit: item?.unit ?? "pcs",
      unitPrice: item ? String(item.avgCost || "") : "",
    }));
    setErrors((e) => ({ ...e, itemId: "", unitPrice: "" }));
  };

  const submitSale = () => {
    const item = selectedSaleItem;
    if (!item) {
      setErrors({ itemId: "Select an item" });
      return;
    }

    const billQty = parseFloat(saleForm.qty);
    if (!billQty || billQty <= 0) {
      setErrors({ qty: "Enter quantity (decimals allowed for g, kg, L, etc.)" });
      return;
    }

    const converted = qtyInInventoryUnit(billQty, saleForm.unit, item.unit);
    if (!converted.ok) {
      setErrors({ qty: converted.error });
      return;
    }

    const result = validateOrderSale({
      itemId: saleForm.itemId,
      qty: String(converted.qty),
      unitPrice: saleForm.unitPrice,
      maxQty: item.stockOnHand,
      accountId: saleForm.accountId,
      date: saleForm.date,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSubmitting(true);
    const res = recordInventorySale({
      itemId: saleForm.itemId,
      stockQty: converted.qty,
      billQty,
      billUnit: saleForm.unit,
      unitPrice: result.unitPrice,
      date: saleForm.date,
      party: saleForm.party,
      accountId: saleForm.accountId,
      paymentMethod: saleForm.paymentMethod,
      paymentType: saleForm.paymentType,
    });
    setSubmitting(false);

    if (!res.ok) {
      setErrors({ form: res.error });
      return;
    }
    resetForm();
  };

  const submitPurchase = () => {
    const item = selectedPurchaseItem;
    if (!item) {
      setErrors({ itemId: "Select an item" });
      return;
    }

    const billQty = parseFloat(purchaseForm.qty);
    if (!billQty || billQty <= 0) {
      setErrors({ qty: "Enter quantity (decimals allowed for g, kg, L, etc.)" });
      return;
    }

    const converted = qtyInInventoryUnit(billQty, purchaseForm.unit, item.unit);
    if (!converted.ok) {
      setErrors({ qty: converted.error });
      return;
    }

    const result = validateOrderPurchase({
      itemId: purchaseForm.itemId,
      qty: String(converted.qty),
      unitPrice: purchaseForm.unitPrice,
      accountId: purchaseForm.accountId,
      date: purchaseForm.date,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSubmitting(true);
    const res = recordInventoryPurchase({
      itemId: purchaseForm.itemId,
      stockQty: converted.qty,
      billQty,
      billUnit: purchaseForm.unit,
      unitPrice: result.unitPrice,
      date: purchaseForm.date,
      party: purchaseForm.party,
      accountId: purchaseForm.accountId,
      paymentMethod: purchaseForm.paymentMethod,
    });
    setSubmitting(false);

    if (!res.ok) {
      setErrors({ form: res.error });
      return;
    }
    resetForm();
  };

  const submitExpense = () => {
    const result = validateOrderExpense({
      description: expenseForm.description,
      amount: expenseForm.amount,
      accountId: expenseForm.accountId,
      date: expenseForm.date,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSubmitting(true);
    const res = recordExpense({
      description: expenseForm.description.trim(),
      amount: result.amount,
      date: expenseForm.date,
      party: expenseForm.party,
      accountId: expenseForm.accountId,
      paymentMethod: expenseForm.paymentMethod,
      category: expenseForm.description.trim(),
    });
    setSubmitting(false);

    if (!res.ok) {
      setErrors({ form: res.error });
      return;
    }
    resetForm();
  };

  const saleTotal = (parseFloat(saleForm.qty) || 0) * (parseFloat(saleForm.unitPrice) || 0);
  const purchaseTotal =
    (parseFloat(purchaseForm.qty) || 0) * (parseFloat(purchaseForm.unitPrice) || 0);
  const expenseTotal = parseFloat(expenseForm.amount) || 0;

  const subtitle =
    mode === "sale"
      ? "Record sales from inventory with stock deduction"
      : mode === "purchase"
        ? "Record purchases and add stock"
        : "Record business expenses with ledger tracking";

  const submitLabel =
    mode === "sale"
      ? "Complete Sale"
      : mode === "purchase"
        ? "Complete Purchase"
        : "Complete Expense";

  const total =
    mode === "sale" ? saleTotal : mode === "purchase" ? purchaseTotal : expenseTotal;

  return (
    <div className="max-w-[1200px] space-y-5">
      <PageHeader title="Order Management" subtitle={subtitle} />

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

      <div className="surface-card p-4 sm:p-5 space-y-4">
        {mode === "sale" && (
          <>
            <FormField label="Select item" required error={errors.itemId}>
              <ItemSearchSelect
                items={inventoryOptions}
                value={saleForm.itemId}
                onChange={onSaleItemChange}
                placeholder="Search inventory items…"
              />
            </FormField>

            <div className="grid sm:grid-cols-2 gap-3">
              <FormField
                label="Quantity"
                required
                error={errors.qty}
                hint="Stock is deducted in inventory units; decimals work for g, kg, L, etc."
              >
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={saleForm.qty}
                  onChange={(e) => {
                    setSaleForm((f) => ({ ...f, qty: e.target.value }));
                    setErrors((err) => ({ ...err, qty: "" }));
                  }}
                />
              </FormField>

              <FormField
                label="Unit"
                hint={
                  selectedSaleItem && saleForm.unit !== selectedSaleItem.unit
                    ? `Stock tracked in ${selectedSaleItem.unit}`
                    : undefined
                }
              >
                <UnitSelect
                  value={saleForm.unit}
                  onChange={(unit) => setSaleForm((f) => ({ ...f, unit }))}
                />
              </FormField>
            </div>

            <FormField label="Selling price (per unit)" required error={errors.unitPrice}>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="Enter price per unit"
                value={saleForm.unitPrice}
                onChange={(e) => {
                  setSaleForm((f) => ({ ...f, unitPrice: e.target.value }));
                  setErrors((err) => ({ ...err, unitPrice: "" }));
                }}
              />
            </FormField>

            <PartyField
              label="Customer"
              value={saleForm.party}
              onChange={(party) => setSaleForm((f) => ({ ...f, party }))}
              parties={activeParties}
            />

            <FormField label="Date" required error={errors.date}>
              <NepaliDateFields
                value={saleForm.date}
                onChange={(date) => setSaleForm((f) => ({ ...f, date }))}
              />
            </FormField>

            <div className="grid sm:grid-cols-3 gap-3">
              <FormField label="Payment type">
                <Select
                  value={saleForm.paymentType}
                  onChange={(e) =>
                    setSaleForm((f) => ({
                      ...f,
                      paymentType: e.target.value as "cash" | "credit",
                    }))
                  }
                  className="w-full"
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                </Select>
              </FormField>

              <FormField label="Payment mode">
                <Select
                  value={saleForm.paymentMethod}
                  onChange={(e) =>
                    setSaleForm((f) => ({
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

              <FormField label="Account" required error={errors.accountId}>
                <Select
                  value={saleForm.accountId}
                  onChange={(e) =>
                    setSaleForm((f) => ({ ...f, accountId: e.target.value }))
                  }
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
            </div>
          </>
        )}

        {mode === "purchase" && (
          <>
            <FormField label="Select item" required error={errors.itemId}>
              <ItemSearchSelect
                items={inventoryOptions}
                value={purchaseForm.itemId}
                onChange={onPurchaseItemChange}
                placeholder="Search inventory items…"
              />
            </FormField>

            <div className="grid sm:grid-cols-2 gap-3">
              <FormField
                label="Quantity"
                required
                error={errors.qty}
                hint="Stock is added in inventory units; decimals work for g, kg, L, etc."
              >
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={purchaseForm.qty}
                  onChange={(e) => {
                    setPurchaseForm((f) => ({ ...f, qty: e.target.value }));
                    setErrors((err) => ({ ...err, qty: "" }));
                  }}
                />
              </FormField>

              <FormField
                label="Unit"
                hint={
                  selectedPurchaseItem && purchaseForm.unit !== selectedPurchaseItem.unit
                    ? `Stock tracked in ${selectedPurchaseItem.unit}`
                    : undefined
                }
              >
                <UnitSelect
                  value={purchaseForm.unit}
                  onChange={(unit) => setPurchaseForm((f) => ({ ...f, unit }))}
                />
              </FormField>
            </div>

            <FormField label="Purchase price (per unit)" required error={errors.unitPrice}>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="Cost per unit"
                value={purchaseForm.unitPrice}
                onChange={(e) => {
                  setPurchaseForm((f) => ({ ...f, unitPrice: e.target.value }));
                  setErrors((err) => ({ ...err, unitPrice: "" }));
                }}
              />
            </FormField>

            <PartyField
              label="Supplier"
              value={purchaseForm.party}
              onChange={(party) => setPurchaseForm((f) => ({ ...f, party }))}
              parties={activeParties}
            />

            <FormField label="Date" required error={errors.date}>
              <NepaliDateFields
                value={purchaseForm.date}
                onChange={(date) => setPurchaseForm((f) => ({ ...f, date }))}
              />
            </FormField>

            <div className="grid sm:grid-cols-2 gap-3">
              <FormField label="Payment mode">
                <Select
                  value={purchaseForm.paymentMethod}
                  onChange={(e) =>
                    setPurchaseForm((f) => ({
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

              <FormField label="Account" required error={errors.accountId}>
                <Select
                  value={purchaseForm.accountId}
                  onChange={(e) =>
                    setPurchaseForm((f) => ({ ...f, accountId: e.target.value }))
                  }
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
            </div>
          </>
        )}

        {mode === "expense" && (
          <>
            <FormField label="Expense description" required error={errors.description}>
              <Input
                placeholder="What was this expense for?"
                value={expenseForm.description}
                onChange={(e) => {
                  setExpenseForm((f) => ({ ...f, description: e.target.value }));
                  setErrors((err) => ({ ...err, description: "" }));
                }}
              />
              <PresetChips
                className="mt-2"
                presets={EXPENSE_DESCRIPTION_PRESETS}
                onPick={(preset) => {
                  setExpenseForm((f) => ({ ...f, description: preset }));
                  setErrors((err) => ({ ...err, description: "" }));
                }}
              />
            </FormField>

            <FormField label="Amount (₹)" required error={errors.amount}>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="Enter amount"
                value={expenseForm.amount}
                onChange={(e) => {
                  setExpenseForm((f) => ({ ...f, amount: e.target.value }));
                  setErrors((err) => ({ ...err, amount: "" }));
                }}
              />
            </FormField>

            <PartyField
              label="Paid to"
              value={expenseForm.party}
              onChange={(party) => setExpenseForm((f) => ({ ...f, party }))}
              parties={activeParties}
            />

            <FormField label="Date" required error={errors.date}>
              <NepaliDateFields
                value={expenseForm.date}
                onChange={(date) => setExpenseForm((f) => ({ ...f, date }))}
              />
            </FormField>

            <div className="grid sm:grid-cols-2 gap-3">
              <FormField label="Payment mode">
                <Select
                  value={expenseForm.paymentMethod}
                  onChange={(e) =>
                    setExpenseForm((f) => ({
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

              <FormField label="Account" required error={errors.accountId}>
                <Select
                  value={expenseForm.accountId}
                  onChange={(e) =>
                    setExpenseForm((f) => ({ ...f, accountId: e.target.value }))
                  }
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
            </div>
          </>
        )}

        {errors.form ? <p className="text-sm text-red-400">{errors.form}</p> : null}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-[var(--border)]">
          <p className="text-lg font-semibold tabular-nums">Total: {formatCurrency(total)}</p>
          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={submitting}
            onClick={
              mode === "sale"
                ? submitSale
                : mode === "purchase"
                  ? submitPurchase
                  : submitExpense
            }
          >
            {submitLabel}
          </Button>
        </div>
      </div>

      <TransactionHistory
        list={list}
        onDelete={(tx) =>
          requestConfirm({
            title: "Delete transaction",
            message: `Enter admin password to delete “${tx.description}”.`,
            onConfirm: () => deleteTransaction(tx.id),
          })
        }
      />

      {adminModal}
    </div>
  );
}

function TransactionHistory({
  list,
  onDelete,
}: {
  list: Transaction[];
  onDelete: (tx: Transaction) => void;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold">Recent records</h2>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground p-8 text-center">No records yet</p>
      ) : (
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
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
                <td className="text-muted-foreground">{tx.date}</td>
                <td className="text-right tabular-nums font-medium">
                  {formatCurrency(tx.amount)}
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(tx)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 rounded-md hover:bg-[var(--nav-hover)]"
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
  );
}
