import type { PosOrder, PosOrderLine } from "./types";

export function calcPosOrderTotals(
  items: PosOrderLine[],
  discountType: "flat" | "percent",
  discountValue: number
) {
  const subtotal = items.reduce((s, l) => s + l.price * l.qty, 0);
  let discountAmount = 0;
  if (discountValue > 0) {
    if (discountType === "percent") {
      discountAmount = Math.min(subtotal, Math.round(subtotal * (discountValue / 100)));
    } else {
      discountAmount = Math.min(subtotal, discountValue);
    }
  }
  const total = Math.max(0, subtotal - discountAmount);
  return { subtotal, discountAmount, total };
}

export function openPosOrders(orders: PosOrder[]) {
  return orders.filter((o) => o.status === "open");
}

export function paidPosOrders(orders: PosOrder[]) {
  return orders.filter((o) => o.status === "paid");
}

export function cancelledPosOrders(orders: PosOrder[]) {
  return orders.filter((o) => o.status === "cancelled");
}

export function openOrderForTable(orders: PosOrder[], table: string) {
  return orders.find((o) => o.status === "open" && o.table === table);
}
