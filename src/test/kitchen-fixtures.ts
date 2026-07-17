import type { Order } from '@/screens/orders/types';

const BASE_TIME = Date.parse('2026-07-10T12:00:00.000Z');

export function makeOrder(overrides: Partial<Order> & Pick<Order, 'id' | 'orderNo'>): Order {
  const now = new Date(BASE_TIME + overrides.orderNo * 1_000).toISOString();
  return {
    checkoutSessionId: `pos_${overrides.id}`,
    status: 'PENDING',
    totalAmountCents: 1000,
    orderType: 'DINING',
    customerName: 'Test Guest',
    paymentStatus: 'UNPAID',
    paymentMethod: null,
    paidAt: null,
    tableId: null,
    tableSessionId: null,
    table: null,
    items: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function kitchenEvent(
  type: 'ORDER_CREATED' | 'ORDER_MARKED_COMPLETED' | 'ORDER_RECALL' | 'ORDER_CANCELLED',
  order: Order,
) {
  return { type, payload: order };
}
