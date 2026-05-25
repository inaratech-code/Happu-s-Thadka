"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  Search,
  Minus,
  Plus,
  CreditCard,
  Banknote,
  Split,
  X,
  Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";

type CartItem = { id: string; name: string; price: number; qty: number; emoji: string };

function calcDiscount(subtotal: number, type: "flat" | "percent", value: number) {
  if (!value || value <= 0) return 0;
  if (type === "percent") return Math.min(subtotal, Math.round(subtotal * (value / 100)));
  return Math.min(subtotal, value);
}

const fieldSm =
  "h-8 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground text-sm focus-ring";

export default function POSPage() {
  const { menuItems, state, addTransaction, addKitchenOrder, adjustStock } = useStore();
  const tables = state.settings.tables;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [customTable, setCustomTable] = useState("Walk-in");
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "split">("card");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState("");

  const categories = useMemo(
    () => [...new Set(menuItems.map((m) => m.category))].filter(Boolean),
    [menuItems]
  );

  const filtered = menuItems.filter((m) => {
    const matchCat = category === "All" || m.category === category;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const tableLabel = tables.length > 0 ? selectedTable || tables[0]?.name : customTable;

  const addToCart = (item: (typeof menuItems)[0]) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [
        ...prev,
        { id: item.id, name: item.name, price: item.price, qty: 1, emoji: item.emoji },
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

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmount = calcDiscount(
    subtotal,
    discountType,
    parseFloat(discountValue) || 0
  );
  const total = Math.max(0, subtotal - discountAmount);

  const completePayment = (method: "cash" | "card" | "split") => {
    if (!cart.length || total <= 0) return;
    setPaymentMethod(method);

    const discountNote =
      discountAmount > 0
        ? ` (discount ${discountType === "percent" ? `${discountValue}%` : formatCurrency(parseFloat(discountValue) || 0)})`
        : "";

    addTransaction({
      type: "sale",
      description: `POS ${tableLabel} — ${method}${discountNote}`,
      amount: total,
    });

    addKitchenOrder({
      table: tableLabel,
      items: cart.map((c) => ({ name: c.name, qty: c.qty })),
      status: "new",
      priority: "normal",
    });

    cart.forEach((c) => {
      const inv = state.inventory.find((i) => i.id === c.id);
      if (inv) {
        adjustStock(c.id, -c.qty, `POS sale: ${c.qty}× ${c.name}`, "sale");
      }
    });

    setShowReceipt(true);
  };

  const resetOrder = () => {
    setShowReceipt(false);
    setCart([]);
    setDiscountValue("");
  };

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 lg:flex-row lg:min-h-[calc(100dvh-8.5rem)]">
      <div className="flex-1 flex flex-col min-w-0 min-h-[min(50vh,28rem)] lg:min-h-0">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu..."
              className="field-input pl-9 pr-3"
            />
          </div>
          {tables.length > 0 ? (
            <select
              value={selectedTable || tables[0]?.name}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="field-select"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={customTable}
              onChange={(e) => setCustomTable(e.target.value)}
              placeholder="Table / customer"
              className="field-input w-36"
            />
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "chip-btn h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap",
                category === cat
                  ? "chip-btn-active"
                  : "text-muted-foreground"
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
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 content-start">
            {filtered.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => addToCart(item)}
                className="surface-card-interactive text-left p-3"
              >
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-sm font-medium mt-2 leading-tight text-foreground">{item.name}</p>
                <p className="text-xs text-price tabular-nums mt-1 font-semibold">
                  {formatCurrency(item.price)}
                </p>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full min-w-0 lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col surface-card overflow-hidden max-h-[min(70dvh,32rem)] lg:max-h-none">
        <div className="panel-header px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{tableLabel}</p>
            <p className="text-[11px] text-muted-foreground">{cart.length} items in cart</p>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setCart([])}
              className="text-xs text-muted-foreground hover:text-red-500 dark:hover:text-red-400"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[100px] bg-[var(--surface)]">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Tap items to add</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-lg panel-row p-2.5"
              >
                <span className="text-lg">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, -1)}
                    className="control-btn h-7 w-7 rounded-md"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm tabular-nums font-medium text-foreground">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, 1)}
                    className="control-btn h-7 w-7 rounded-md"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="panel-footer p-4 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums text-foreground">{formatCurrency(subtotal)}</span>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Discount</span>
              <div className="flex gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "flat" | "percent")}
                  className={cn(fieldSm, "px-2 text-xs w-auto")}
                >
                  <option value="flat">₹ Amount</option>
                  <option value="percent">% Percent</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="0"
                  className={cn(fieldSm, "flex-1 px-2 tabular-nums")}
                />
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs">
                  <span>Discount applied</span>
                  <span className="tabular-nums">−{formatCurrency(discountAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between font-semibold text-base pt-1 border-t border-[var(--border)] text-foreground">
              <span>Total</span>
              <span className="tabular-nums text-price">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!cart.length}
              onClick={() => completePayment("split")}
            >
              <Split className="h-3.5 w-3.5" />
              Split
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!cart.length}
              onClick={() => completePayment("cash")}
            >
              <Banknote className="h-3.5 w-3.5" />
              Cash
            </Button>
            <Button size="sm" disabled={!cart.length} onClick={() => completePayment("card")}>
              <CreditCard className="h-3.5 w-3.5" />
              Pay
            </Button>
          </div>
        </div>
      </div>

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
              className="modal-panel fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm border-l shadow-2xl flex flex-col"
            >
              <div className="panel-header flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-price" />
                  <span className="font-semibold text-foreground">Receipt</span>
                  <Badge variant="success">{paymentMethod}</Badge>
                </div>
                <button type="button" onClick={resetOrder}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 p-6 font-mono text-sm space-y-4 overflow-y-auto text-foreground">
                <div className="text-center">
                  <p className="font-bold text-base">{state.settings.restaurantName.toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{state.settings.location}</p>
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
