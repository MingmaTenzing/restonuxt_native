import { afterEach, describe, expect, mock, test } from 'bun:test';

import { apiUrl } from '@/utils/api';
import { jsonResponse, withMockFetch } from '@/test/mock-fetch';
import { testApiClient } from '@/test/test-api-client';

import { printReceipt, printSessionReceipt, printTakeawayReceipt } from './api';

const soupOrder = {
  id: 'o1',
  orderNo: 1,
  checkoutSessionId: 'co1',
  status: 'PENDING',
  totalAmountCents: 1200,
  paymentStatus: 'UNPAID',
  paymentMethod: null,
  paidAt: null,
  orderType: 'DINING',
  customerName: 'Guest',
  tableId: 't1',
  tableSessionId: 'session-1',
  items: [
    {
      id: 'i1',
      itemName: 'Soup',
      quantity: 1,
      unitPriceCents: 1200,
      specialInstructions: null,
      orderId: 'o1',
      menuItemId: 'm1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('receipt api', () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  test('printSessionReceipt loads checkout then sends ESC/POS to the LAN printer', async () => {
    const send = mock(async () => {});

    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/orders/checkout/table/session-1'));
      return jsonResponse({
        id: 'session-1',
        status: 'ACTIVE',
        openedAt: '2026-01-01T00:00:00.000Z',
        closedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        tableId: 't1',
        table: { id: 't1', number: '3', capacity: 2 },
        orders: [soupOrder],
        summary: {
          orderCount: 1,
          payableOrderCount: 1,
          paidOrderCount: 0,
          payableOrderIds: ['o1'],
          sessionTotalCents: 1200,
          payableTotalCents: 1200,
          paidTotalCents: 0,
          hasOutstandingBalance: true,
        },
      });
    });

    const result = await printSessionReceipt(
      testApiClient('token'),
      'session-1',
      ' 192.168.1.50 ',
      send
    );

    expect(result).toEqual({
      ok: true,
      id: 'session-1',
      kind: 'table',
      printerTarget: '192.168.1.50:9100',
      itemCount: 1,
      totalCents: 1200,
    });
    expect(send).toHaveBeenCalledTimes(1);
    const [host, port, bytes] = send.mock.calls[0] as [string, number, Uint8Array];
    expect(host).toBe('192.168.1.50');
    expect(port).toBe(9100);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(20);
  });

  test('printTakeawayReceipt loads order then sends ESC/POS to the LAN printer', async () => {
    const send = mock(async () => {});

    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/orders/order-9'));
      return jsonResponse({
        ...soupOrder,
        id: 'order-9',
        orderNo: 9,
        orderType: 'TAKEAWAY',
        customerName: 'Sam',
        tableId: null,
        tableSessionId: null,
      });
    });

    const result = await printTakeawayReceipt(
      testApiClient('token'),
      'order-9',
      '192.168.1.50:9100',
      send
    );

    expect(result).toEqual({
      ok: true,
      id: 'order-9',
      kind: 'takeaway',
      printerTarget: '192.168.1.50:9100',
      itemCount: 1,
      totalCents: 1200,
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  test('printReceipt dispatches table and takeaway targets', async () => {
    const send = mock(async () => {});
    let calls = 0;

    restore = withMockFetch((input) => {
      calls += 1;
      const url = String(input);
      if (url.includes('/checkout/table/')) {
        return jsonResponse({
          id: 'session-1',
          status: 'ACTIVE',
          openedAt: '2026-01-01T00:00:00.000Z',
          closedAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          tableId: 't1',
          table: { id: 't1', number: '3', capacity: 2 },
          orders: [soupOrder],
          summary: {
            orderCount: 1,
            payableOrderCount: 1,
            paidOrderCount: 0,
            payableOrderIds: ['o1'],
            sessionTotalCents: 1200,
            payableTotalCents: 1200,
            paidTotalCents: 0,
            hasOutstandingBalance: true,
          },
        });
      }
      return jsonResponse({ ...soupOrder, id: 'order-9', orderType: 'TAKEAWAY' });
    });

    const table = await printReceipt(
      testApiClient('token'),
      { kind: 'table', sessionId: 'session-1' },
      '192.168.1.50',
      send
    );
    const takeaway = await printReceipt(
      testApiClient('token'),
      { kind: 'takeaway', orderId: 'order-9' },
      '192.168.1.50',
      send
    );

    expect(table.kind).toBe('table');
    expect(takeaway.kind).toBe('takeaway');
    expect(calls).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
