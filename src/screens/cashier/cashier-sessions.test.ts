import { describe, expect, test } from 'bun:test';

import { toCashierSession } from './cashier-sessions';
import type { TableSession } from '@/screens/sessions/types';

function makeSession(overrides: Partial<TableSession> = {}): TableSession {
  return {
    id: 'session-1',
    tableId: 'table-1',
    status: 'ACTIVE',
    startedAt: '2026-07-12T10:00:00.000Z',
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
});
