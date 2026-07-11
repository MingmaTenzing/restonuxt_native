import type { Order } from '@/screens/orders/types';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function isWithinLast24Hours(createdAt: string) {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created <= TWENTY_FOUR_HOURS_MS;
}

export function sortKitchenOrders(orders: Order[]) {
  return [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function sortCompletedOrders(orders: Order[]) {
  return [...orders].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function upsertOrder(orders: Order[], incoming: Order) {
  const index = orders.findIndex((order) => order.id === incoming.id);
  if (index === -1) return sortKitchenOrders([...orders, incoming]);
  const next = [...orders];
  next[index] = { ...next[index], ...incoming };
  return sortKitchenOrders(next);
}

export function prependCompletedOrder(orders: Order[], incoming: Order) {
  if (orders.some((order) => order.id === incoming.id)) return orders;
  if (!isWithinLast24Hours(incoming.createdAt)) return orders;
  return sortCompletedOrders([incoming, ...orders]);
}

export function removeOrder(orders: Order[], orderId: string) {
  return orders.filter((order) => order.id !== orderId);
}
