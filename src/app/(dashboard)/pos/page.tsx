"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  Search,
  CreditCard,
  X,
  Receipt,
  ClipboardList,
  ListOrdered,
} from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { MenuItemThumb } from "@/components/menu-item-thumb";
import { PosOrderPanel } from "@/components/pos/pos-order-panel";
import { PosPaymentModal, type PosPaymentMethod } from "@/components/pos/payment-modal";
import { useStore } from "@/lib/store";
import { openOrderForTable } from "@/lib/pos-orders";
import type { PosOrderLine } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  emoji: string;
  imageUrl?: string;
  categoryImageUrl?: string;
};

function calcDiscount(subtotal: number, type: "flat" | "percent", value: number) {
  if (!value || value <= 0) return 0;
  if (type === "percent") return Math.min(subtotal, Math.round(subtotal * (value / 100)));
  return Math.min(subtotal, value);
}

function cartToLines(cart: CartItem[]): PosOrderLine[] {
  return cart.map((c) => ({
    inventoryId: c.id,
    name: c.name,
    price: c.price,
    qty: c.qty,
  }));
}

export default function POSPage() {
  const searchParams = useSearchParams();
  const tableFromUrl = searchParams.get("table");

  const {
    menuItems,
    state,
    createPosOrder,
    updatePosOrder,
    cancelPosOrder,
    sendPosOrderToKitchen,
    finalizePosOrder,
  } = useStore();
  const tables = state.settings.tables;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [customTable, setCustomTable] = useState("Walk-in");
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>("cash");
  const [amountPaid, setAmountPaid] = useState(0);
  const [creditCustomer, setCreditCustomer] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState("");
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [creating, setCreating] = useState(false);
  const [kitchenNotice, setKitchenNotice] = useState("");

  const skipPersistRef = useRef(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categories = useMemo(
    () => [...new Set(menuItems.map((m) => m.category))].filter(Boolean),
    [menuItems]
  );

  const defaultTable =
    tableFromUrl ||
    (tables.length > 0 ? selectedTable || tables[0]?.name : customTable) ||
    "Walk-in";

  const tableLabel = tables.length > 0 ? selectedTable || tables[0]?.name || defaultTable : customTable;

  const activeOrder = useMemo(
    () =>
      activeOrderId
        ? state.posOrders.find((o) => o.id === activeOrderId && o.status === "open")
        : openOrderForTable(state.posOrders, tableLabel),
    [activeOrderId, state.posOrders, tableLabel]
  );

  const hasOpenOrder = Boolean(activeOrder);
  const isPending = !hasOpenOrder;
  const sentToKitchen = Boolean(activeOrder?.sentToKitchenAt);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const hasPanelContent = cart.length > 0 || hasOpenOrder;

  useEffect(() => {
    if (hasOpenOrder) setShowOrderPanel(true);
  }, [hasOpenOrder]);

  useEffect(() => {
    if (tableFromUrl && tables.some((t) => t.name === tableFromUrl)) {
      setSelectedTable(tableFromUrl);
    } else if (tableFromUrl && tables.length === 0) {
      setCustomTable(tableFromUrl);
    }
  }, [tableFromUrl, tables]);

  const linesToCart = useCallback(
    (lines: PosOrderLine[]): CartItem[] =>
      lines.map((l) => {
        const m = menuItems.find((x) => x.id === l.inventoryId);
        return {
          id: l.inventoryId,
          name: l.name,
          price: l.price,
          qty: l.qty,
          emoji: m?.emoji ?? "🍽",
          imageUrl: m?.imageUrl,
          categoryImageUrl: m?.categoryImageUrl,
        };
      }),
    [menuItems]
  );

  useEffect(() => {
    const existing = openOrderForTable(state.posOrders, tableLabel);
    if (existing && existing.id === activeOrderId) return;

    skipPersistRef.current = true;
    if (existing) {
      setActiveOrderId(existing.id);
      setCart(linesToCart(existing.items));
      setDiscountType(existing.discountType);
      setDiscountValue(existing.discountValue > 0 ? String(existing.discountValue) : "");
    } else {
      setActiveOrderId(null);
      setCart([]);
      setDiscountType("flat");
      setDiscountValue("");
    }
    queueMicrotask(() => {
      skipPersistRef.current = false;
    });
  }, [tableLabel, state.posOrders, activeOrderId, linesToCart]);

  useEffect(() => {
    if (!activeOrder?.id || skipPersistRef.current) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      updatePosOrder(activeOrder.id, {
        items: cartToLines(cart),
        discountType,
        discountValue: parseFloat(discountValue) || 0,
        table: tableLabel,
      });
    }, 250);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [cart, discountType, discountValue, activeOrder?.id, tableLabel, updatePosOrder]);

  const openByTable = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of state.posOrders) {
      if (o.status !== "open") continue;
      const n = o.items.reduce((s, l) => s + l.qty, 0);
      map.set(o.table, (map.get(o.table) ?? 0) + n);
    }
    return map;
  }, [state.posOrders]);

  const filtered = menuItems.filter((m) => {
    const matchCat = category === "All" || m.category === category;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (item: (typeof menuItems)[0]) => {
    setShowOrderPanel(true);
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          emoji: item.emoji,
          imageUrl: item.imageUrl,
          categoryImageUrl: item.categoryImageUrl,
        },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const clearCart = () => {
    if (activeOrderId) cancelPosOrder(activeOrderId);
    setActiveOrderId(null);
    setCart([]);
    setDiscountValue("");
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmount = calcDiscount(
    subtotal,
    discountType,
    parseFloat(discountValue) || 0
  );
  const total = Math.max(0, subtotal - discountAmount);

  const paymentMethodLabel: Record<PosPaymentMethod, string> = {
    cash: "Cash",
    qr_cash: "QR + Cash",
    qr: "QR Payment",
    credit: "Credit",
  };

  const sendToKitchen = () => {
    if (!activeOrder?.id || !cart.length) return;
    const kotId = sendPosOrderToKitchen({
      posOrderId: activeOrder.id,
      table: tableLabel,
      items: cart.map((c) => ({ name: c.name, qty: c.qty })),
    });
    if (kotId) {
      setKitchenNotice(sentToKitchen ? "Kitchen ticket updated" : "Sent to kitchen");
      window.setTimeout(() => setKitchenNotice(""), 3000);
    }
  };

  /** ChiyaGadi-style: pending cart → Create Order → kitchen + unpaid order */
  const handleCreateOrder = () => {
    if (!cart.length) return;
    if (openOrderForTable(state.posOrders, tableLabel)) {
      setKitchenNotice("This table already has an open order — open it from Orders.");
      window.setTimeout(() => setKitchenNotice(""), 4000);
      return;
    }
    setCreating(true);
    skipPersistRef.current = true;
    const order = createPosOrder(tableLabel);
    const lines = cartToLines(cart);
    const kitchenItems = cart.map((c) => ({ name: c.name, qty: c.qty }));
    updatePosOrder(order.id, {
      items: lines,
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      table: tableLabel,
    });
    sendPosOrderToKitchen({
      posOrderId: order.id,
      table: tableLabel,
      items: kitchenItems,
    });
    setActiveOrderId(order.id);
    setCreating(false);
    queueMicrotask(() => {
      skipPersistRef.current = false;
    });
    setKitchenNotice("Order created · sent to kitchen");
    window.setTimeout(() => setKitchenNotice(""), 3000);
  };

  const completePayment = (
    method: PosPaymentMethod,
    paid: number,
    customerName?: string
  ) => {
    if (!cart.length || total <= 0 || !activeOrder?.id) return;
    const isCredit = method === "credit";
    if (!isCredit && paid < total) return;

    const discountNote =
      discountAmount > 0
        ? ` (discount ${discountType === "percent" ? `${discountValue}%` : formatCurrency(parseFloat(discountValue) || 0)})`
        : "";
    const creditNote = isCredit && customerName ? ` — ${customerName}` : "";

    const result = finalizePosOrder({
      posOrderId: activeOrder.id,
      table: tableLabel,
      items: cart.map((c) => ({ name: c.name, qty: c.qty })),
      stockLines: cart
        .filter((c) => state.inventory.some((i) => i.id === c.id))
        .map((c) => ({ inventoryId: c.id, qty: c.qty, name: c.name })),
      paymentLabel: `${paymentMethodLabel[method]}${creditNote}${discountNote}`,
      paymentMethod: method,
      amountPaid: paid,
      total,
      isCredit,
      creditCustomer: customerName,
    });

    if (!result) return;

    setPaymentMethod(method);
    setAmountPaid(isCredit ? 0 : paid);
    setCreditCustomer(customerName ?? "");
    setOrderRef(result.orderRef);
    setShowPayment(false);
    setShowReceipt(true);
  };

  const resetOrder = () => {
    setShowReceipt(false);
    setShowPayment(false);
    setCart([]);
    setDiscountValue("");
    setAmountPaid(0);
    setCreditCustomer("");
    setOrderRef("");
    setActiveOrderId(null);
  };

  const openOrderCount = state.posOrders.filter((o) => o.status === "open").length;

  useEffect(() => {
    const open = showOrderPanel || showPayment || showReceipt;
    document.documentElement.classList.toggle("pos-sheet-open", open);
    return () => document.documentElement.classList.remove("pos-sheet-open");
  }, [showOrderPanel, showPayment, showReceipt]);

  return (
    <div className="flex flex-col gap-3 w-full max-w-full min-w-0 lg:flex-1 lg:min-h-0 lg:flex-row lg:gap-4 lg:min-h-[calc(100dvh-8.5rem)] lg:overflow-hidden">
      <div className="flex flex-col min-w-0 max-w-full lg:flex-1 lg:min-h-0 lg:flex lg:flex-col lg:overflow-hidden">
        <div className="flex items-stretch gap-2 mb-2 min-w-0 max-w-full">
          <div className="relative flex-1 min-w-0 lg:max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <input
              id="pos-menu-search"
              name="menuSearch"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu..."
              className="field-input h-11 sm:h-12 pl-9 sm:pl-10 pr-3 text-base min-w-0"
              autoComplete="off"
            />
          </div>
          <Link
            href="/pos/orders"
            aria-label={openOrderCount > 0 ? `Orders, ${openOrderCount} open` : "Orders"}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-1.5 sm:gap-2.5 h-11 sm:h-12 min-w-11 sm:min-w-[7.5rem] px-3 sm:px-5 rounded-xl text-sm sm:text-base font-semibold border-2 transition-colors",
              openOrderCount > 0
                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--chip-hover)]"
            )}
          >
            <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
            <span className="hidden sm:inline">Orders</span>
            {openOrderCount > 0 && (
              <span className="inline-flex h-6 sm:h-7 min-w-6 sm:min-w-7 items-center justify-center rounded-full bg-[var(--primary-foreground)]/20 text-xs sm:text-sm font-bold tabular-nums px-1 sm:px-1.5">
                {openOrderCount}
              </span>
            )}
          </Link>
        </div>
        {tables.length > 0 ? (
          <div className="flex gap-1.5 w-full min-w-0 max-w-full mb-2 overflow-x-auto scrollbar-none pb-0.5 touch-pan-x overscroll-x-contain">
            {tables.map((t) => {
              const active = tableLabel === t.name;
              const qty = openByTable.get(t.name) ?? 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTable(t.name)}
                    className={cn(
                      "chip-btn h-8 px-3 rounded-lg text-xs font-medium relative shrink-0 whitespace-nowrap",
                      active ? "chip-btn-active" : "text-muted-foreground"
                    )}
                >
                  {t.name}
                  {qty > 0 && (
                    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-[var(--primary-foreground)] px-1">
                      {qty}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mb-2 w-full min-w-0 max-w-full">
            <input
              id="pos-table-name"
              name="tableName"
              value={customTable}
              onChange={(e) => setCustomTable(e.target.value)}
              placeholder="Table / customer"
              className="field-input w-full min-w-0 h-9 text-sm"
              autoComplete="off"
            />
          </div>
        )}
        {kitchenNotice && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 -mt-2 mb-1">{kitchenNotice}</p>
        )}

        <div className="flex gap-1.5 w-full min-w-0 max-w-full overflow-x-auto pb-2 mb-2 scrollbar-none touch-pan-x overscroll-x-contain">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "chip-btn h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap shrink-0",
                category === cat ? "chip-btn-active" : "text-muted-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {menuItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center surface-card p-8 text-center">
            <p className="text-sm text-muted-foreground max-w-xs">
              No menu items yet. Add sellable inventory with a selling price to show items here.
            </p>
          </div>
        ) : (
          <div className="pos-menu-grid min-w-0 max-w-full pb-4 lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-y-contain lg:pb-0">
            {filtered.map((item, index) => (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(item)}
                className="surface-card-interactive text-left p-2 sm:p-3 min-w-0 w-full overflow-hidden flex flex-col"
              >
                <MenuItemThumb
                  name={item.name}
                  emoji={item.emoji}
                  imageUrl={item.imageUrl}
                  categoryImageUrl={item.categoryImageUrl}
                  className="mb-1.5 sm:mb-2 w-full"
                  priority={index < 4}
                />
                <p className="text-xs sm:text-sm font-medium leading-tight text-foreground line-clamp-2">
                  {item.name}
                </p>
                <p className="text-[11px] sm:text-xs text-price tabular-nums mt-0.5 sm:mt-1 font-semibold">
                  {formatCurrency(item.price)}
                </p>
              </motion.button>
            ))}
          </div>
        )}

        {cartCount > 0 && !showOrderPanel && hasPanelContent && (
          <Button
            type="button"
            className="fixed right-4 z-30 shadow-lg mobile-fab-bottom lg:bottom-6"
            onClick={() => setShowOrderPanel(true)}
          >
            <ListOrdered className="h-4 w-4" />
            View Order ({cartCount})
          </Button>
        )}
      </div>

      <div
        className={cn(
          !hasPanelContent && "hidden",
          hasPanelContent && !showOrderPanel && "hidden lg:flex lg:flex-col",
          hasPanelContent && showOrderPanel && "flex flex-col"
        )}
      >
        <PosOrderPanel
          open={hasPanelContent}
          onClose={() => setShowOrderPanel(false)}
          tableLabel={tableLabel}
          orderRef={activeOrder?.orderRef ?? null}
          items={cart}
          subtotal={subtotal}
          discountType={discountType}
          discountValue={discountValue}
          onDiscountTypeChange={setDiscountType}
          onDiscountValueChange={setDiscountValue}
          discountAmount={discountAmount}
          total={total}
          onUpdateQty={updateQty}
          isPending={isPending}
          sentToKitchen={sentToKitchen}
          onCreateOrder={handleCreateOrder}
          onSendKitchen={sendToKitchen}
          onPay={() => setShowPayment(true)}
          creating={creating}
        />
      </div>

      <PosPaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        items={cart.map((c) => ({ id: c.id, name: c.name, qty: c.qty, price: c.price }))}
        subtotal={subtotal}
        discountAmount={discountAmount}
        total={total}
        onConfirm={(method, paid, customer) => completePayment(method, paid, customer)}
      />

      <AnimatePresence>
        {showReceipt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 scrim backdrop-blur-sm"
              onClick={resetOrder}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="modal-panel fixed right-0 top-0 bottom-0 z-[60] w-full max-w-sm border-l shadow-2xl flex flex-col safe-top safe-bottom"
            >
              <div className="panel-header flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-price" />
                  <span className="font-semibold text-foreground">Receipt</span>
                  <Badge variant="success">{paymentMethodLabel[paymentMethod]}</Badge>
                </div>
                <button type="button" onClick={resetOrder}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 p-6 font-mono text-sm space-y-4 overflow-y-auto text-foreground">
                <div className="text-center">
                  <p className="font-bold text-base">{state.settings.restaurantName.toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{state.settings.location}</p>
                  {orderRef && (
                    <p className="text-[11px] text-muted-foreground mt-2 tabular-nums">{orderRef}</p>
                  )}
                  {paymentMethod === "credit" && creditCustomer && (
                    <p className="text-xs mt-1">Credit: {creditCustomer}</p>
                  )}
                </div>
                <div className="border-t border-dashed border-dashed-theme pt-3 space-y-1.5">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.qty}× {item.name}
                      </span>
                      <span className="tabular-nums">
                        {formatCurrency(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-dashed-theme pt-3 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount</span>
                      <span>−{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-price">
                    <span>TOTAL</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  {paymentMethod !== "credit" && amountPaid > 0 && amountPaid < total && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Paid</span>
                      <span className="tabular-nums">{formatCurrency(amountPaid)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="panel-footer p-4">
                <Button className="w-full" onClick={resetOrder}>
                  New Order
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
