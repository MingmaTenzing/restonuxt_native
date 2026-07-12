import { afterEach, describe, expect, test } from 'bun:test';

import { apiUrl } from '@/utils/api';
import { jsonResponse, withMockFetch } from '@/test/mock-fetch';

import {
  closeTakeawaySale,
  fetchActiveSessions,
  fetchSessionCheckout,
  fetchUnpaidTakeawayOrders,
  markTablePaid,
} from './api';

describe('cashier api', () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  test('fetchActiveSessions enriches sessions with outstanding totals', async () => {
    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/table-sessions?status=ACTIVE'));
      return jsonResponse([
        {
          id: 'session-1',
          tableId: 'table-1',
          status: 'ACTIVE',
          startedAt: '2026-07-12T10:00:00.000Z',
          orders: [
            {
              id: 'o1',
              orderNo: 1,
              status: 'COMPLETED',
              paymentStatus: 'UNPAID',
              totalAmountCents: 1200,
              createdAt: '2026-07-12T10:00:00.000Z',
              updatedAt: '2026-07-12T10:05:00.000Z',
            },
          ],
        },
      ]);
    });

    const sessions = await fetchActiveSessions('cashier-token');

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.outstandingCents).toBe(1200);
    expect(sessions[0]?.unpaidOrderCount).toBe(1);
  });

  test('fetchSessionCheckout requests checkout endpoint', async () => {
    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/orders/checkout/table/session-9'));
      return jsonResponse({ sessionId: 'session-9', orders: [], totalCents: 0 });
    });

    const checkout = await fetchSessionCheckout('token', 'session-9');

    expect(checkout.sessionId).toBe('session-9');
  });

  test('fetchUnpaidTakeawayOrders returns order list', async () => {
    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/orders/takeaway-unpaid'));
      return jsonResponse([{ id: 'order-1', orderNo: 42 }]);
    });

    const orders = await fetchUnpaidTakeawayOrders('token');

    expect(orders).toHaveLength(1);
    expect(orders[0]?.id).toBe('order-1');
  });

  test('markTablePaid posts checkout payload', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/orders/checkout/table/mark-paid'));
      capturedInit = init;
      return jsonResponse({ ok: true });
    });

    await markTablePaid('token', {
      sessionId: 'session-1',
      paymentMethod: 'CASH',
      amountReceivedCents: 5000,
    });

    expect(capturedInit?.method).toBe('POST');
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      sessionId: 'session-1',
      paymentMethod: 'CASH',
      amountReceivedCents: 5000,
    });
  });

  test('closeTakeawaySale posts order id', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/orders/checkout/takeaway/closesales'));
      capturedInit = init;
      return jsonResponse({ id: 'order-7', paymentStatus: 'PAID' });
    });

    const order = await closeTakeawaySale('token', {
      orderId: 'order-7',
      paymentMethod: 'CARD',
      amountReceivedCents: 1800,
    });

    expect(order.id).toBe('order-7');
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      orderId: 'order-7',
      paymentMethod: 'CARD',
      amountReceivedCents: 1800,
    });
  });
});
