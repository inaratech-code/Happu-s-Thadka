"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ClipboardList, FilePlus, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { CreateOrderDialog } from "@/components/pos/create-order-dialog";
import { useStore } from "@/lib/store";
import {
  calcPosOrderTotals,
  cancelledPosOrders,
  openPosOrders,
  paidPosOrders,
} from "@/lib/pos-orders";
import { cn, formatCurrency } from "@/lib/utils";

type Filter = "all" | "pending" | "paid" | "cancelled";

export default function PosOrdersPage() {
  const router = useRouter();
  const { state } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<Filter>("pending");

  const filtered = useMemo(() => {
    switch (filter) {
      case "pending":
        return openPosOrders(state.posOrders);
      case "paid":
        return paidPosOrders(state.posOrders);
      case "cancelled":
        return cancelledPosOrders(state.posOrders);
      default:
        return state.posOrders;
    }
  }, [filter, state.posOrders]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [filtered]
  );

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "paid", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-price" />
            Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Like ChiyaGadi: add items on Menu, Create Order, pay later from Pending.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setShowCreate(true)}>
            <FilePlus className="h-4 w-4" />
            New Order
          </Button>
          <Link
            href="/pos"
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--chip-hover)]"
          >
            <Monitor className="h-4 w-4" />
            Menu
          </Link>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "chip-btn h-8 px-3 rounded-lg text-xs font-medium",
              filter === f.id ? "chip-btn-active" : "text-muted-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No orders in this list.</p>
          <Button type="button" className="mt-4" onClick={() => setShowCreate(true)}>
            <FilePlus className="h-4 w-4" />
            New Order
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((order) => {
            const { subtotal, discountAmount, total } = calcPosOrderTotals(
              order.items,
              order.discountType,
              order.discountValue
            );
            const itemCount = order.items.reduce((s, l) => s + l.qty, 0);
            const isOpen = order.status === "open";
            return (
              <li key={order.id}>
                <Link
                  href={isOpen ? `/pos?table=${encodeURIComponent(order.table)}` : "/pos/orders"}
                  className={cn(
                    "surface-card-interactive flex flex-wrap items-center gap-3 p-4",
                    isOpen && "hover:border-[var(--chip-active-border)]"
                  )}
                >
                  <div className="flex-1 min-w-[140px]">
                    <p className="font-semibold text-foreground">{order.table}</p>
                    <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{order.orderRef}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                    {discountAmount > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                        −{formatCurrency(discountAmount)}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold tabular-nums text-price">{formatCurrency(total)}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      sub {formatCurrency(subtotal)}
                    </p>
                  </div>
                  {order.status === "open" && (
                    <Badge variant="warning">{order.sentToKitchenAt ? "Unpaid" : "Pending"}</Badge>
                  )}
                  {order.status === "paid" && <Badge variant="success">Paid</Badge>}
                  {order.status === "cancelled" && <Badge variant="danger">Cancelled</Badge>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <CreateOrderDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(table) => {
          router.push(`/pos?table=${encodeURIComponent(table)}`);
        }}
      />
    </div>
  );
}
