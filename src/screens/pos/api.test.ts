import { afterEach, describe, expect, test } from 'bun:test';

import { apiUrl } from '@/utils/api';
import { jsonResponse, withMockFetch } from '@/test/mock-fetch';
import { testApiClient } from '@/test/test-api-client';

import {
  createTableSession,
  fetchPosMenu,
  fetchPosTables,
  submitDiningOrder,
  submitTakeawayOrder,
} from './api';

describe('pos api', () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  test('fetchPosMenu filters unavailable items', async () => {
    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/menu'));
      return jsonResponse([
        { id: 'm1', name: 'Burger', isAvailable: true, priceCents: 1200 },
        { id: 'm2', name: 'Soup', isAvailable: false, priceCents: 800 },
      ]);
    });

    const menu = await fetchPosMenu(testApiClient('pos-token'));

    expect(menu).toHaveLength(1);
    expect(menu[0]?.id).toBe('m1');
  });

  test('fetchPosTables maps and sorts tables', async () => {
    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/tables'));
      return jsonResponse([
        {
          id: 't2',
          number: '10',
          capacity: 4,
          sessions: [{ id: 's2', status: 'ACTIVE' }],
        },
        {
          id: 't1',
          number: '2',
          capacity: 2,
          sessions: [{ id: 's1', status: 'ACTIVE' }],
        },
      ]);
    });

    const tables = await fetchPosTables(testApiClient('pos-token'));

    expect(tables.map((table) => table.number)).toEqual(['2', '10']);
    expect(tables[0]?.activeSessionId).toBe('s1');
  });

  test('createTableSession posts tableId', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/table-sessions/create'));
      capturedInit = init;
      return jsonResponse({ id: 'session-new', tableId: 'table-3', status: 'ACTIVE' });
    });

    const session = await createTableSession(testApiClient('token'), 'table-3');

    expect(session.id).toBe('session-new');
    expect(JSON.parse(String(capturedInit?.body))).toEqual({ tableId: 'table-3' });
  });

  test('submitDiningOrder wraps items in Prisma-style create payload', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/orders/pos/dining'));
      capturedInit = init;
      return jsonResponse({ id: 'order-1', orderNo: 5 });
    });

    await submitDiningOrder(testApiClient('token'), {
      tableId: 'table-1',
      customerName: 'Alex',
      totalAmountCents: 2400,
      items: [
        {
          menuItemId: 'm1',
          itemName: 'Burger',
          quantity: 2,
          unitPriceCents: 1200,
        },
      ],
    });

    expect(capturedInit?.method).toBe('POST');
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      data: {
        tableId: 'table-1',
        customerName: 'Alex',
        totalAmountCents: 2400,
        items: {
          create: [
            {
              menuItemId: 'm1',
              itemName: 'Burger',
              quantity: 2,
              unitPriceCents: 1200,
            },
          ],
        },
      },
    });
  });

  test('submitTakeawayOrder posts takeaway payload', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/orders/pos/takeaway'));
      capturedInit = init;
      return jsonResponse({ id: 'order-2', orderNo: 6 });
    });

    await submitTakeawayOrder(testApiClient('token'), {
      customerName: 'Sam',
      totalAmountCents: 900,
      items: [
        {
          menuItemId: 'm2',
          itemName: 'Soup',
          quantity: 1,
          unitPriceCents: 900,
        },
      ],
    });

    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      data: {
        customerName: 'Sam',
        totalAmountCents: 900,
        items: {
          create: [
            {
              menuItemId: 'm2',
              itemName: 'Soup',
              quantity: 1,
              unitPriceCents: 900,
            },
          ],
        },
      },
    });
  });
});
