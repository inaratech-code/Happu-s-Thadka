"use client";

import { X, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuItemThumb } from "@/components/menu-item-thumb";
import { cn, formatCurrency } from "@/lib/utils";

export type PosOrderPanelItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  emoji: string;
  imageUrl?: string;
  categoryImageUrl?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  tableLabel: string;
  orderRef: string | null;
  items: PosOrderPanelItem[];
  subtotal: number;
  discountType: "flat" | "percent";
  discountValue: string;
  onDiscountTypeChange: (t: "flat" | "percent") => void;
  onDiscountValueChange: (v: string) => void;
  discountAmount: number;
  total: number;
  onUpdateQty: (id: string, delta: number) => void;
  /** Pending = not saved yet (ChiyaGadi-style) */
  isPending: boolean;
  sentToKitchen: boolean;
  onCreateOrder: () => void;
  onSendKitchen: () => void;
  onPay: () => void;
  creating?: boolean;
};

const fieldSm =
  "h-8 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground text-sm focus-ring";

export function PosOrderPanel({
  open,
  onClose,
  tableLabel,
  orderRef,
  items,
  subtotal,
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
  discountAmount,
  total,
  onUpdateQty,
  isPending,
  sentToKitchen,
  onCreateOrder,
  onSendKitchen,
  onPay,
  creating,
}: Props) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[55] scrim backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed z-[60] top-0 right-0 bottom-0 w-full max-w-md flex flex-col",
          "border-l border-[var(--border)] bg-[var(--surface-overlay)] shadow-2xl",
          "lg:static lg:z-auto lg:max-w-none lg:w-[min(100%,360px)] xl:w-[400px] lg:shrink-0 lg:shadow-none lg:border lg:rounded-xl lg:overflow-hidden"
        )}
        role="dialog"
        aria-labelledby="pos-order-panel-title"
      >
        <div className="panel-header px-4 py-3 flex items-center justify-between shrink-0 safe-top lg:pt-3">
          <div>
            <h2 id="pos-order-panel-title" className="text-base font-semibold text-foreground">
              {isPending ? "Create Order" : "View Order"}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {tableLabel}
              {orderRef ? ` · ${orderRef}` : isPending ? " · Pending" : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="lg:hidden p-1" aria-label="Close">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[100px] bg-[var(--surface)]">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Add items from the menu</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg panel-row p-2.5">
                <MenuItemThumb
                  name={item.name}
                  emoji={item.emoji}
                  imageUrl={item.imageUrl}
                  categoryImageUrl={item.categoryImageUrl}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.id, -1)}
                    className="control-btn h-7 w-7 rounded-md text-sm"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm tabular-nums font-medium">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.id, 1)}
                    className="control-btn h-7 w-7 rounded-md text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="panel-footer p-4 space-y-3 shrink-0 safe-bottom lg:pb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Discount</span>
              <div className="flex gap-2">
                <select
                  id="pos-discount-type"
                  name="discountType"
                  value={discountType}
                  onChange={(e) => onDiscountTypeChange(e.target.value as "flat" | "percent")}
                  className={cn(fieldSm, "px-2 text-xs w-auto")}
                  aria-label="Discount type"
                >
                  <option value="flat">₹ Amount</option>
                  <option value="percent">% Percent</option>
                </select>
                <input
                  id="pos-discount-value"
                  name="discountValue"
                  type="number"
                  min={0}
                  value={discountValue}
                  onChange={(e) => onDiscountValueChange(e.target.value)}
                  placeholder="0"
                  className={cn(fieldSm, "flex-1 px-2 tabular-nums")}
                  aria-label="Discount value"
                />
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs">
                  <span>Discount</span>
                  <span className="tabular-nums">−{formatCurrency(discountAmount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-semibold text-base pt-1 border-t border-[var(--border)]">
              <span>Total</span>
              <span className="tabular-nums text-price">{formatCurrency(total)}</span>
            </div>
          </div>

          {isPending ? (
            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={!items.length || creating}
              onClick={onCreateOrder}
            >
              {creating ? "Creating…" : "Create Order"}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full border-amber-500/40 text-amber-800 dark:text-amber-200 hover:bg-amber-500/10"
                disabled={!items.length}
                onClick={onSendKitchen}
              >
                <ChefHat className="h-4 w-4" />
                {sentToKitchen ? "Update kitchen" : "Send to kitchen"}
              </Button>
              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={!items.length || total <= 0}
                onClick={onPay}
              >
                Pay {items.length > 0 ? formatCurrency(total) : ""}
              </Button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
