"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "@/lib/motion";
import { Check, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

export type PosPaymentMethod = "cash" | "qr_cash" | "qr" | "credit";

const METHODS: { id: PosPaymentMethod; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "qr_cash", label: "QR + Cash" },
  { id: "qr", label: "QR Payment" },
  { id: "credit", label: "Credit" },
];

type LineItem = { id: string; name: string; qty: number; price: number };

type Props = {
  open: boolean;
  onClose: () => void;
  items: LineItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  onConfirm: (method: PosPaymentMethod, amountPaid: number, creditCustomer?: string) => void;
};

export function PosPaymentModal({
  open,
  onClose,
  items,
  subtotal,
  discountAmount,
  total,
  onConfirm,
}: Props) {
  const [method, setMethod] = useState<PosPaymentMethod>("cash");
  const [amountInput, setAmountInput] = useState("");
  const [creditCustomer, setCreditCustomer] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMethod("cash");
    setAmountInput(total > 0 ? String(total) : "");
    setCreditCustomer("");
    setError("");
  }, [open, total]);

  const amountPaid = useMemo(() => {
    const n = parseFloat(amountInput.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }, [amountInput]);

  const handlePayFull = () => {
    setAmountInput(String(total));
    setError("");
  };

  const handleConfirm = () => {
    if (method === "credit") {
      const name = creditCustomer.trim();
      if (!name) {
        setError("Enter customer name for credit.");
        return;
      }
      onConfirm(method, 0, name);
      return;
    }
    if (amountPaid <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (amountPaid < total) {
      setError("Pay the full total to complete the order.");
      return;
    }
    if (amountPaid > total) {
      setError("Amount cannot exceed the total.");
      return;
    }
    onConfirm(method, amountPaid);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] scrim backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed z-[60] left-1/2 top-1/2 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--surface-overlay)] shadow-[var(--shadow-float)] overflow-hidden"
            role="dialog"
            aria-labelledby="pos-payment-title"
          >
            <div className="px-5 pt-5 pb-4 border-b border-[var(--border)] bg-[var(--surface-raised)]">
              <h2 id="pos-payment-title" className="text-lg font-semibold text-foreground">
                Payment
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Review and confirm payment</p>
            </div>

            <div className="p-5 space-y-5 max-h-[min(70dvh,32rem)] overflow-y-auto">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 shadow-sm">
                <ul className="space-y-2 text-sm">
                  {items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                      <span className="text-foreground truncate">
                        {item.name} × {item.qty}
                      </span>
                      <span className="tabular-nums text-muted-foreground shrink-0">
                        {formatCurrency(item.price * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-[var(--border)] space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount</span>
                      <span className="tabular-nums">−{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base pt-1">
                    <span className="text-foreground">Total</span>
                    <span className="tabular-nums text-price">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Payment Method</p>
                <div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
                  role="tablist"
                >
                  {METHODS.map((m) => {
                    const active = method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                          setMethod(m.id);
                          setError("");
                          if (m.id === "credit") setAmountInput(String(total));
                        }}
                        className={cn(
                          "relative flex items-center justify-center gap-1 min-h-10 px-2 py-2 rounded-lg text-xs font-medium transition-colors",
                          active
                            ? "bg-[var(--chip-active-bg)] text-[var(--chip-active-text)] border border-[var(--chip-active-border)] shadow-sm"
                            : "text-muted-foreground hover:bg-[var(--chip-hover)]"
                        )}
                      >
                        {active && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
                        <span className="text-center leading-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {method === "credit" ? (
                <div className="space-y-2">
                  <label
                    className="block text-xs font-medium text-muted-foreground"
                    htmlFor="pos-credit-customer"
                  >
                    Customer name
                  </label>
                  <input
                    id="pos-credit-customer"
                    name="creditCustomer"
                    type="text"
                    value={creditCustomer}
                    onChange={(e) => {
                      setCreditCustomer(e.target.value);
                      setError("");
                    }}
                    className="field-input w-full"
                    placeholder="Who is this credit for?"
                    autoComplete="name"
                  />
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Send to kitchen first if needed. Credit records the sale; collect payment later.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-muted-foreground" htmlFor="pos-pay-amount">
                      Amount
                    </label>
                    <input
                      id="pos-pay-amount"
                      name="amountPaid"
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={amountInput}
                      onChange={(e) => {
                        setAmountInput(e.target.value);
                        setError("");
                      }}
                      className="field-input w-full tabular-nums text-base font-medium"
                      placeholder={formatCurrency(total)}
                    />
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Use Send to kitchen on POS before paying. Payment records the sale and stock.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[var(--chip-active-border)] text-[var(--chip-active-text)] hover:bg-[var(--primary-subtle)]"
                    onClick={handlePayFull}
                  >
                    <Wallet className="h-4 w-4" />
                    Pay Full Amount
                  </Button>
                </>
              )}

              {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
            </div>

            <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-raised)] flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" className="flex-1" onClick={handleConfirm}>
                Confirm
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
