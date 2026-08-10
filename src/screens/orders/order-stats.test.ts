import { describe, expect, test } from 'bun:test';

import { computeOrderStats, countItems, searchOrders } from './order-stats';
import type { Order, OrderItem } from './types';

function order(
  partial: Partial<Order> & Pick<Order, 'id' | 'orderNo' | 'customerName'>
): Order {
  return {
    checkoutSessionId: 'cs_1',
    status: 'COMPLETED',
    totalAmountCents: 1000,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    paidAt: '2026-08-04T12:00:00.000Z',
    orderType: 'TAKEAWAY',
    tableId: null,
    tableSessionId: null,
    table: null,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

function item(partial: Partial<OrderItem> & Pick<OrderItem, 'id' | 'itemName' | 'quantity'>): OrderItem {
  return {
    unitPriceCents: 500,
    specialInstructions: null,
    orderId: 'o1',
    menuItemId: null,
    createdAt: '2026-08-04T12:00:00.000Z',
    updatedAt: '2026-08-04T12:00:00.000Z',
    ...partial,
  };
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

describe('computeOrderStats', () => {
  test('returns zeros for empty list', () => {
    expect(computeOrderStats([])).toEqual({
      todayCount: 0,
      todayRevenueCents: 0,
      pendingCount: 0,
      unpaidCount: 0,
    });
  });

  test('counts today orders and paid revenue', () => {
    const stats = computeOrderStats([
      order({
        id: '1',
        orderNo: 1,
        customerName: 'A',
        totalAmountCents: 2500,
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
      }),
      order({
        id: '2',
        orderNo: 2,
        customerName: 'B',
        totalAmountCents: 1000,
        paymentStatus: 'UNPAID',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }),
    ]);

    expect(stats.todayCount).toBe(2);
    expect(stats.todayRevenueCents).toBe(2500);
    expect(stats.pendingCount).toBe(1);
    expect(stats.unpaidCount).toBe(1);
  });

  test('excludes cancelled paid orders from today revenue', () => {
    const stats = computeOrderStats([
      order({
        id: '1',
        orderNo: 1,
        customerName: 'A',
        totalAmountCents: 5000,
        paymentStatus: 'PAID',
        status: 'CANCELLED',
        createdAt: new Date().toISOString(),
      }),
    ]);

    expect(stats.todayCount).toBe(1);
    expect(stats.todayRevenueCents).toBe(0);
    expect(stats.unpaidCount).toBe(0);
  });

  test('excludes cancelled unpaid from unpaid count', () => {
    const stats = computeOrderStats([
      order({
        id: '1',
        orderNo: 1,
        customerName: 'A',
        paymentStatus: 'UNPAID',
        status: 'CANCELLED',
        createdAt: new Date().toISOString(),
      }),
    ]);

    expect(stats.unpaidCount).toBe(0);
  });

  test('ignores older days for todayCount and todayRevenue', () => {
    const stats = computeOrderStats([
      order({
        id: 'old',
        orderNo: 10,
        customerName: 'Old',
        totalAmountCents: 9999,
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        createdAt: daysAgoIso(2),
      }),
      order({
        id: 'today',
        orderNo: 11,
        customerName: 'Today',
        totalAmountCents: 300,
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
      }),
    ]);

    expect(stats.todayCount).toBe(1);
    expect(stats.todayRevenueCents).toBe(300);
  });

  test('still counts pending/unpaid from prior days', () => {
    const stats = computeOrderStats([
      order({
        id: 'old-pending',
        orderNo: 20,
        customerName: 'Wait',
        paymentStatus: 'UNPAID',
        status: 'PENDING',
        createdAt: daysAgoIso(3),
      }),
    ]);

    expect(stats.todayCount).toBe(0);
    expect(stats.pendingCount).toBe(1);
    expect(stats.unpaidCount).toBe(1);
  });

  test('treats invalid createdAt as not today', () => {
    const stats = computeOrderStats([
      order({
        id: 'bad',
        orderNo: 99,
        customerName: 'Bad',
        totalAmountCents: 100,
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        createdAt: 'not-a-date',
      }),
    ]);

    expect(stats.todayCount).toBe(0);
    expect(stats.todayRevenueCents).toBe(0);
  });
});

describe('searchOrders', () => {
  const sample: Order[] = [
    order({ id: '1', orderNo: 101, customerName: 'Jane Doe' }),
    order({ id: '2', orderNo: 202, customerName: 'Alex Kim' }),
  ];

  test('returns all orders when query is empty', () => {
    expect(searchOrders(sample, '   ')).toHaveLength(2);
  });

  test('matches customer name case-insensitively', () => {
    expect(searchOrders(sample, 'jane').map((o) => o.id)).toEqual(['1']);
  });

  test('matches order number', () => {
    expect(searchOrders(sample, '202').map((o) => o.id)).toEqual(['2']);
  });

  test('returns empty when nothing matches', () => {
    expect(searchOrders(sample, 'zzzz')).toHaveLength(0);
  });
});

describe('countItems', () => {
  test('sums item quantities', () => {
    expect(
      countItems(
        order({
          id: '1',
          orderNo: 1,
          customerName: 'A',
          items: [
            item({ id: 'i1', itemName: 'Burger', quantity: 2 }),
            item({ id: 'i2', itemName: 'Fries', quantity: 3 }),
          ],
        })
      )
    ).toBe(5);
  });

  test('defaults missing quantity to 1', () => {
    expect(
      countItems(
        order({
          id: '1',
          orderNo: 1,
          customerName: 'A',
          items: [item({ id: 'i1', itemName: 'Burger', quantity: undefined as unknown as number })],
        })
      )
    ).toBe(1);
  });

  test('returns 0 when items are missing', () => {
    expect(
      countItems(
        order({
          id: '1',
          orderNo: 1,
          customerName: 'A',
          items: undefined,
        })
      )
    ).toBe(0);
  });
});
