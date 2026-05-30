import type { KitchenOrder } from "./types";

/** Kitchen / dashboard show tickets sent from POS or completed with payment */
export function isPlacedKitchenOrder(order: KitchenOrder): boolean {
  if (order.posOrderId) return true;
  if (order.transactionId) return true;
  return order.items.length > 0;
}

export function placedKitchenOrders(orders: KitchenOrder[]): KitchenOrder[] {
  return orders.filter(isPlacedKitchenOrder);
}

export function isUnpaidKitchenOrder(order: KitchenOrder): boolean {
  return Boolean(order.posOrderId) && !order.transactionId;
}
