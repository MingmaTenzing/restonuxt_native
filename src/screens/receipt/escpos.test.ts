import { describe, expect, test } from 'bun:test';

import type { Order } from '@/screens/orders/types';
import type { SessionCheckout } from '@/screens/sessions/types';

import {
  buildSessionReceiptEscPos,
  buildTakeawayReceiptEscPos,
  collectPrintableItems,
  sessionTotalCents,
} from './escpos';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    orderNo: 12,
    checkoutSessionId: 'co1',
    status: 'PENDING',
    totalAmountCents: 1500,
    paymentStatus: 'UNPAID',
    paymentMethod: null,
    paidAt: null,
    orderType: 'DINING',
    customerName: 'Guest',
    tableId: 't1',
    tableSessionId: 's1',
    items: [
      {
        id: 'i1',
        itemName: 'Burger',
        quantity: 2,
        unitPriceCents: 600,
        specialInstructions: null,
        orderId: 'o1',
        menuItemId: 'm1',
        orderItemOptions: [
          {
            id: 'opt1',
            quantity: 1,
            name: 'Cheese',
            priceCents: 100,
            orderItemId: 'i1',
            menuOptionId: 'mo1',
          },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCheckout(overrides: Partial<SessionCheckout> = {}): SessionCheckout {
  const orders = overrides.orders ?? [makeOrder()];
  return {
    id: 'session-1',
    status: 'ACTIVE',
    openedAt: '2026-01-01T00:00:00.000Z',
    closedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tableId: 't1',
    table: { id: 't1', number: '7', capacity: 4 },
    summary: {
      orderCount: orders.length,
      payableOrderCount: orders.length,
      paidOrderCount: 0,
      payableOrderIds: orders.map((order) => order.id),
      sessionTotalCents: sessionTotalCents(orders),
      payableTotalCents: sessionTotalCents(orders),
      paidTotalCents: 0,
      hasOutstandingBalance: true,
    },
    ...overrides,
    orders,
  };
}

describe('escpos receipt builder', () => {
  test('collectPrintableItems flattens order lines and options', () => {
    const items = collectPrintableItems([makeOrder()]);
    expect(items).toEqual([
      {
        name: 'Burger',
        qty: 2,
        amountCents: 1200,
        options: [{ name: 'Cheese', qty: 1, priceCents: 100 }],
      },
    ]);
  });

  test('sessionTotalCents sums order totals', () => {
    expect(
      sessionTotalCents([
        makeOrder({ totalAmountCents: 1000 }),
        makeOrder({ id: 'o2', totalAmountCents: 500 }),
      ])
    ).toBe(1500);
  });

  test('buildSessionReceiptEscPos includes header, table, total, and cut', () => {
    const { bytes, itemCount, totalCents } = buildSessionReceiptEscPos(makeCheckout());
    const text = String.fromCharCode(...bytes);

    expect(itemCount).toBe(1);
    expect(totalCents).toBe(1500);
    expect(text).toContain('RESTO QUICK');
    expect(text).toContain('Table: 7');
    expect(text).toContain('Burger');
    expect(text).toContain('Cheese');
    expect(text).toContain('TOTAL:');
    expect(text).toContain('$15.00');
    // ESC @ init + GS V partial cut
    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x40);
    expect(bytes[bytes.length - 4]).toBe(0x1d);
    expect(bytes[bytes.length - 3]).toBe(0x56);
  });

  test('buildTakeawayReceiptEscPos includes order meta and total', () => {
    const { bytes, itemCount, totalCents } = buildTakeawayReceiptEscPos(
      makeOrder({ orderNo: 42, customerName: 'Alex', orderType: 'TAKEAWAY', tableId: null, tableSessionId: null })
    );
    const text = String.fromCharCode(...bytes);

    expect(itemCount).toBe(1);
    expect(totalCents).toBe(1500);
    expect(text).toContain('Takeaway Receipt');
    expect(text).toContain('Order: #42');
    expect(text).toContain('Customer: Alex');
    expect(text).toContain('Burger');
    expect(text).toContain('$15.00');
  });

  test('strips non-ascii characters from item names', () => {
    const { bytes } = buildSessionReceiptEscPos(
      makeCheckout({
        orders: [
          makeOrder({
            items: [
              {
                id: 'i1',
                itemName: 'Café 🍔',
                quantity: 1,
                unitPriceCents: 500,
                specialInstructions: null,
                orderId: 'o1',
                menuItemId: 'm1',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ],
          }),
        ],
      })
    );
    const text = String.fromCharCode(...bytes);
    expect(text).toContain('Caf?');
    expect(text).not.toContain('🍔');
  });
});
