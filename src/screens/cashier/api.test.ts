import { afterEach, describe, expect, test } from 'bun:test';

import { apiUrl } from '@/utils/api';
import { jsonResponse, withMockFetch } from '@/test/mock-fetch';
import { testApiClient } from '@/test/test-api-client';

import {
  closeTakeawaySale,
  fetchActiveSessions,
  fetchCheckoutOrder,
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
          openedAt: '2026-07-12T10:00:00.000Z',
          closedAt: null,
          createdAt: '2026-07-12T10:00:00.000Z',
          updatedAt: '2026-07-12T10:00:00.000Z',
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

    const sessions = await fetchActiveSessions(testApiClient('cashier-token'));

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.outstandingCents).toBe(1200);
    expect(sessions[0]?.unpaidOrderCount).toBe(1);
  });

  test('fetchSessionCheckout requests checkout endpoint', async () => {
    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/orders/checkout/table/session-9'));
      return jsonResponse({
        id: 'session-9',
        tableId: 'table-1',
        status: 'ACTIVE',
        openedAt: '2026-07-12T10:00:00.000Z',
        closedAt: null,
        createdAt: '2026-07-12T10:00:00.000Z',
        updatedAt: '2026-07-12T10:00:00.000Z',
        orders: [],
        summary: {
          orderCount: 0,
          payableOrderCount: 0,
          paidOrderCount: 0,
          payableOrderIds: [],
          sessionTotalCents: 0,
          payableTotalCents: 0,
          paidTotalCents: 0,
          hasOutstandingBalance: false,
        },
      });
    });

    const checkout = await fetchSessionCheckout(testApiClient('token'), 'session-9');

    expect(checkout.id).toBe('session-9');
  });

  test('fetchUnpaidTakeawayOrders returns order list', async () => {
    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/orders/takeaway-unpaid'));
      return jsonResponse([{ id: 'order-1', orderNo: 42 }]);
    });

    const orders = await fetchUnpaidTakeawayOrders(testApiClient('token'));

    expect(orders).toHaveLength(1);
    expect(orders[0]?.id).toBe('order-1');
  });

  test('fetchCheckoutOrder unwraps nested order payload', async () => {
    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/orders/order-42'));
      return jsonResponse({
        order: { id: 'order-42', orderNo: 42, paymentStatus: 'UNPAID', totalAmountCents: 1500 },
      });
    });

    const order = await fetchCheckoutOrder(testApiClient('token'), 'order-42');

    expect(order.id).toBe('order-42');
    expect(order.totalAmountCents).toBe(1500);
  });

  test('fetchCheckoutOrder unwraps data-wrapped payloads and flat payloads', async () => {
    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/orders/order-data'));
      return jsonResponse({
        data: { id: 'order-data', orderNo: 7, paymentStatus: 'UNPAID', totalAmountCents: 900 },
      });
    });

    const nested = await fetchCheckoutOrder(testApiClient('token'), 'order-data');
    expect(nested.id).toBe('order-data');

    restore?.();
    restore = withMockFetch(() =>
      jsonResponse({ id: 'order-flat', orderNo: 8, paymentStatus: 'PAID', totalAmountCents: 400 })
    );

    const flat = await fetchCheckoutOrder(testApiClient('token'), 'order-flat');
    expect(flat.id).toBe('order-flat');
    expect(flat.paymentStatus).toBe('PAID');
  });

  test('fetchCheckoutOrder throws friendly message on 404', async () => {
    restore = withMockFetch(() => {
      return new Response('Not found', { status: 404 });
    });

    await expect(fetchCheckoutOrder(testApiClient('token'), 'missing')).rejects.toThrow(
      'This order no longer exists.'
    );
  });

  test('fetchCheckoutOrder rethrows non-404 failures', async () => {
    restore = withMockFetch(() => new Response('Server error', { status: 500 }));

    await expect(fetchCheckoutOrder(testApiClient('token'), 'order-1')).rejects.toThrow();
  });

  test('markTablePaid posts checkout payload', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/orders/checkout/table/mark-paid'));
      capturedInit = init;
      return jsonResponse({ ok: true });
    });

    await markTablePaid(testApiClient('token'), {
      tableSessionId: 'session-1',
      orderIds: ['o1', 'o2'],
      paymentMethod: 'CASH',
    });

    expect(capturedInit?.method).toBe('POST');
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      tableSessionId: 'session-1',
      orderIds: ['o1', 'o2'],
      paymentMethod: 'CASH',
    });
  });

  test('markTablePaid posts card terminal method for table checkout', async () => {
    let capturedBody: unknown;

    restore = withMockFetch((_input, init) => {
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({ ok: true });
    });

    await markTablePaid(testApiClient('token'), {
      tableSessionId: 'session-2',
      orderIds: ['payable-1'],
      paymentMethod: 'CARD_TERMINAL',
    });

    expect(capturedBody).toEqual({
      tableSessionId: 'session-2',
      orderIds: ['payable-1'],
      paymentMethod: 'CARD_TERMINAL',
    });
  });

  test('closeTakeawaySale posts order id', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/orders/checkout/takeaway/closesales'));
      capturedInit = init;
      return jsonResponse({ id: 'order-7', paymentStatus: 'PAID' });
    });

    const order = await closeTakeawaySale(testApiClient('token'), {
      orderId: 'order-7',
      paymentMethod: 'CARD_TERMINAL',
    });

    expect(order.id).toBe('order-7');
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      orderId: 'order-7',
      paymentMethod: 'CARD_TERMINAL',
    });
  });

  test('closeTakeawaySale accepts cash payment method', async () => {
    let capturedBody: unknown;

    restore = withMockFetch((_input, init) => {
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({ id: 'order-8', paymentStatus: 'PAID' });
    });

    await closeTakeawaySale(testApiClient('token'), {
      orderId: 'order-8',
      paymentMethod: 'CASH',
    });

    expect(capturedBody).toEqual({
      orderId: 'order-8',
      paymentMethod: 'CASH',
    });
  });
});
