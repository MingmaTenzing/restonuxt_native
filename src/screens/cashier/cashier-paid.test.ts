import { describe, expect, test } from 'bun:test';

import type { Order } from '@/screens/orders/types';

import { selectPaidTakeawayOrders, sessionCollectedCents, closedSessionHasUnpaid } from './cashier-paid';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    orderNo: 1,
    checkoutSessionId: 'co1',
    status: 'COMPLETED',
    totalAmountCents: 1500,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    paidAt: '2026-07-24T10:00:00.000Z',
    orderType: 'TAKEAWAY',
    customerName: 'Guest',
    tableId: null,
    tableSessionId: null,
    items: [],
    createdAt: '2026-07-24T09:00:00.000Z',
    updatedAt: '2026-07-24T10:00:00.000Z',
    ...overrides,
  };
}

describe('cashier paid history', () => {
  test('selectPaidTakeawayOrders keeps only paid takeaway and sorts newest first', () => {
    const orders = [
      makeOrder({ id: 'dining', orderType: 'DINING', paidAt: '2026-07-24T12:00:00.000Z' }),
      makeOrder({
        id: 'unpaid-takeaway',
        orderType: 'TAKEAWAY',
        paymentStatus: 'UNPAID',
        paidAt: null,
      }),
      makeOrder({
        id: 'older',
        orderNo: 2,
        paidAt: '2026-07-24T08:00:00.000Z',
      }),
      makeOrder({
        id: 'newer',
        orderNo: 3,
        paidAt: '2026-07-24T11:00:00.000Z',
      }),
    ];

    const paid = selectPaidTakeawayOrders(orders);

    expect(paid.map((order) => order.id)).toEqual(['newer', 'older']);
  });

  test('sessionCollectedCents sums paid orders only', () => {
    expect(
      sessionCollectedCents({
        orders: [
          { paymentStatus: 'PAID', totalAmountCents: 1000 },
          { paymentStatus: 'UNPAID', totalAmountCents: 500 },
          { paymentStatus: 'PAID', totalAmountCents: 250 },
        ],
      })
    ).toBe(1250);

    expect(sessionCollectedCents({ orders: null })).toBe(0);
  });

  test('closedSessionHasUnpaid flags closed sales that still need collection', () => {
    expect(closedSessionHasUnpaid({ unpaidOrderCount: 0 })).toBe(false);
    expect(closedSessionHasUnpaid({ unpaidOrderCount: 1 })).toBe(true);
    expect(closedSessionHasUnpaid({ unpaidOrderCount: 3 })).toBe(true);
  });
});
