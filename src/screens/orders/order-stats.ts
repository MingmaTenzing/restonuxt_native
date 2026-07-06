import type { Order } from './types';

export interface OrderStats {
  todayCount: number;
  todayRevenueCents: number;
  pendingCount: number;
  unpaidCount: number;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function computeOrderStats(orders: Order[]): OrderStats {
  const now = new Date();
  let todayCount = 0;
  let todayRevenueCents = 0;
  let pendingCount = 0;
  let unpaidCount = 0;

  for (const order of orders) {
    const created = new Date(order.createdAt);
    const isToday = !Number.isNaN(created.getTime()) && isSameDay(created, now);

    if (isToday) {
      todayCount += 1;
      if (order.paymentStatus === 'PAID' && order.status !== 'CANCELLED') {
        todayRevenueCents += order.totalAmountCents ?? 0;
      }
    }
    if (order.status === 'PENDING') pendingCount += 1;
    if (order.paymentStatus === 'UNPAID' && order.status !== 'CANCELLED') unpaidCount += 1;
  }

  return { todayCount, todayRevenueCents, pendingCount, unpaidCount };
}

export function searchOrders(orders: Order[], query: string): Order[] {
  const q = query.trim().toLowerCase();
  if (!q) return orders;
  return orders.filter((order) => {
    const name = order.customerName?.toLowerCase() ?? '';
    const no = String(order.orderNo ?? '');
    return name.includes(q) || no.includes(q);
  });
}

export function countItems(order: Order): number {
  return (order.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 1), 0);
}
