import { describe, expect, test } from 'bun:test';

import { toCashierSession } from './cashier-sessions';
import type { TableSession } from '@/screens/sessions/types';

function makeSession(overrides: Partial<TableSession> = {}): TableSession {
  const now = '2026-07-12T10:00:00.000Z';
  return {
    id: 'session-1',
    tableId: 'table-1',
    status: 'ACTIVE',
    openedAt: now,
    closedAt: null,
    createdAt: now,
    updatedAt: now,
    orders: [],
    ...overrides,
  };
}

describe('toCashierSession', () => {
  test('sums unpaid orders into outstandingCents', () => {
    const session = makeSession({
      orders: [
        {
          id: 'o1',
          orderNo: 1,
          status: 'COMPLETED',
          paymentStatus: 'UNPAID',
          totalAmountCents: 1500,
          createdAt: '2026-07-12T10:00:00.000Z',
          updatedAt: '2026-07-12T10:05:00.000Z',
        },
        {
          id: 'o2',
          orderNo: 2,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          totalAmountCents: 800,
          createdAt: '2026-07-12T10:10:00.000Z',
          updatedAt: '2026-07-12T10:15:00.000Z',
        },
        {
          id: 'o3',
          orderNo: 3,
          status: 'COMPLETED',
          paymentStatus: 'UNPAID',
          totalAmountCents: 2200,
          createdAt: '2026-07-12T10:20:00.000Z',
          updatedAt: '2026-07-12T10:25:00.000Z',
        },
      ],
    });

    const result = toCashierSession(session);

    expect(result.outstandingCents).toBe(3700);
    expect(result.unpaidOrderCount).toBe(2);
    expect(result.id).toBe('session-1');
  });

  test('handles missing orders array', () => {
    const session = makeSession({ orders: undefined });

    const result = toCashierSession(session);

    expect(result.outstandingCents).toBe(0);
    expect(result.unpaidOrderCount).toBe(0);
  });

  test('returns zero totals when all orders are paid', () => {
    const session = makeSession({
      orders: [
        {
          id: 'o1',
          orderNo: 1,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          totalAmountCents: 500,
          createdAt: '2026-07-12T10:00:00.000Z',
          updatedAt: '2026-07-12T10:05:00.000Z',
        },
      ],
    });

    const result = toCashierSession(session);

    expect(result.outstandingCents).toBe(0);
    expect(result.unpaidOrderCount).toBe(0);
  });

  test('ignores paid orders even when they are larger than unpaid ones', () => {
    const session = makeSession({
      orders: [
        {
          id: 'paid-big',
          orderNo: 1,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          totalAmountCents: 50_000,
          createdAt: '2026-07-12T10:00:00.000Z',
          updatedAt: '2026-07-12T10:05:00.000Z',
        },
        {
          id: 'unpaid-small',
          orderNo: 2,
          status: 'COMPLETED',
          paymentStatus: 'UNPAID',
          totalAmountCents: 125,
          createdAt: '2026-07-12T10:10:00.000Z',
          updatedAt: '2026-07-12T10:15:00.000Z',
        },
      ],
    });

    const result = toCashierSession(session);

    expect(result.outstandingCents).toBe(125);
    expect(result.unpaidOrderCount).toBe(1);
  });

  test('preserves session identity fields while enriching totals', () => {
    const session = makeSession({
      id: 'session-99',
      tableId: 'table-42',
      orders: [
        {
          id: 'o1',
          orderNo: 9,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          totalAmountCents: 999,
          createdAt: '2026-07-12T10:00:00.000Z',
          updatedAt: '2026-07-12T10:05:00.000Z',
        },
      ],
    });

    const result = toCashierSession(session);

    expect(result).toMatchObject({
      id: 'session-99',
      tableId: 'table-42',
      status: 'ACTIVE',
      outstandingCents: 999,
      unpaidOrderCount: 1,
    });
  });

  test('sums 1_000 unpaid orders without dropping cents', () => {
    const orders = Array.from({ length: 1_000 }, (_, index) => ({
      id: `o-${index}`,
      orderNo: index + 1,
      status: 'COMPLETED' as const,
      paymentStatus: (index % 3 === 0 ? 'PAID' : 'UNPAID') as 'PAID' | 'UNPAID',
      totalAmountCents: 100 + (index % 7),
      createdAt: '2026-07-12T10:00:00.000Z',
      updatedAt: '2026-07-12T10:05:00.000Z',
    }));

    const expectedOutstanding = orders
      .filter((order) => order.paymentStatus === 'UNPAID')
      .reduce((sum, order) => sum + order.totalAmountCents, 0);
    const expectedCount = orders.filter((order) => order.paymentStatus === 'UNPAID').length;

    const result = toCashierSession(makeSession({ orders }));

    expect(result.outstandingCents).toBe(expectedOutstanding);
    expect(result.unpaidOrderCount).toBe(expectedCount);
    expect(result.unpaidOrderCount).toBeGreaterThan(600);
  });
});
