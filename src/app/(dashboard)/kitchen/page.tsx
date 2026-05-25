"use client";

import { motion } from "@/lib/motion";
import { Clock, Flame, CheckCircle2, ChevronRight } from "lucide-react";
import { PageHeader, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { KitchenOrder } from "@/lib/types";
import { useMounted } from "@/hooks/use-mounted";
import { cn, timeAgo } from "@/lib/utils";

const COLUMNS: { id: KitchenOrder["status"]; label: string; next?: KitchenOrder["status"]; color: string }[] = [
  { id: "new", label: "New Orders", next: "preparing", color: "border-sky-500/30" },
  { id: "preparing", label: "Preparing", next: "ready", color: "border-amber-500/30" },
  { id: "ready", label: "Ready", next: "served", color: "border-emerald-500/30" },
];

function OrderCard({
  order,
  onAdvance,
}: {
  order: KitchenOrder;
  onAdvance: () => void;
}) {
  const mounted = useMounted();
  const elapsed = mounted
    ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
    : 0;
  const urgencyColor =
    order.priority === "rush"
      ? "border-red-500/40 bg-red-500/[0.06]"
      : order.priority === "urgent"
      ? "border-amber-500/40 bg-amber-500/[0.06] pulse-active"
      : "border-[var(--border)] bg-[var(--surface-raised)]";

  return (
    <motion.div layout whileHover={{ y: -2 }} className={cn("rounded-xl border p-4", urgencyColor)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-muted-foreground">{order.id}</p>
          <p className="text-base font-bold mt-0.5">{order.table}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {order.priority !== "normal" && (
            <Badge variant={order.priority === "rush" ? "danger" : "warning"}>
              {order.priority === "rush" ? (
                <>
                  <Flame className="h-3 w-3 mr-0.5" />
                  RUSH
                </>
              ) : (
                "URGENT"
              )}
            </Badge>
          )}
          <span
            className="flex items-center gap-1 text-[11px] text-muted-foreground"
            suppressHydrationWarning
          >
            <Clock className="h-3 w-3" />
            {mounted ? `${elapsed}m · ${timeAgo(order.createdAt)}` : "—"}
          </span>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="font-bold tabular-nums text-price w-5">{item.qty}×</span>
            <div>
              <span className="font-medium">{item.name}</span>
              {item.notes && (
                <p className="text-[11px] text-orange-400 mt-0.5">↳ {item.notes}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Button variant="secondary" size="sm" className="w-full mt-3" onClick={onAdvance}>
        {order.status === "ready" ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Mark Served
          </>
        ) : (
          <>
            Advance
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </motion.div>
  );
}

export default function KitchenPage() {
  const { state, updateKitchenStatus } = useStore();
  const active = state.kitchenOrders.filter((o) => o.status !== "served");

  const advance = (order: KitchenOrder) => {
    const col = COLUMNS.find((c) => c.id === order.status);
    if (col?.next) updateKitchenStatus(order.id, col.next);
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <PageHeader
        title="Kitchen Display"
        subtitle={`${active.length} active tickets · tap Advance to move orders forward`}
      />

      <div className="flex-1 grid md:grid-cols-3 gap-4 min-h-0 overflow-hidden">
        {COLUMNS.map((col) => {
          const colOrders = state.kitchenOrders.filter((o) => o.status === col.id);
          return (
            <div
              key={col.id}
              className={cn(
                "flex flex-col rounded-xl border bg-[var(--surface)] min-h-0",
                col.color
              )}
            >
              <div className="panel-header px-4 py-3 flex items-center justify-between shrink-0">
                <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                <span className="text-xs tabular-nums text-muted-foreground bg-[var(--nav-hover)] px-2 py-0.5 rounded-full">
                  {colOrders.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onAdvance={() => advance(order)} />
                ))}
                {colOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No orders</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
