import type { Order } from '@/screens/orders/types';

/** Paid takeaway sales for the cashier history tab. */
export function selectPaidTakeawayOrders(orders: Order[]): Order[] {
  return orders
    .filter((order) => order.orderType === 'TAKEAWAY' && order.paymentStatus === 'PAID')
    .sort((a, b) => {
      const aAt = a.paidAt ?? a.updatedAt ?? a.createdAt;
      const bAt = b.paidAt ?? b.updatedAt ?? b.createdAt;
      return new Date(bAt).getTime() - new Date(aAt).getTime();
    });
}

export function sessionCollectedCents(session: {
  orders?: { paymentStatus: string; totalAmountCents: number }[] | null;
}) {
  return (session.orders ?? [])
    .filter((order) => order.paymentStatus === 'PAID')
    .reduce((sum, order) => sum + order.totalAmountCents, 0);
}
