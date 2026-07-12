import { describe, expect, test } from 'bun:test';

import type { Order } from '@/screens/orders/types';
import type { SessionCheckoutSummary } from '@/screens/sessions/types';

import {
  canAcceptCheckoutPayment,
  formatTenderedInput,
  getChangeDueCents,
  getTableCheckoutAmountDue,
  getTakeawayCheckoutAmountDue,
  isTableCheckoutPaid,
  isTakeawayCheckoutPaid,
  orderItemLineTotalCents,
  parseTenderedCents,
} from './checkout';

function makeSummary(overrides: Partial<SessionCheckoutSummary> = {}): SessionCheckoutSummary {
  return {
    orderCount: 0,
    payableOrderCount: 0,
    paidOrderCount: 0,
    payableOrderIds: [],
    sessionTotalCents: 0,
    payableTotalCents: 0,
    paidTotalCents: 0,
    hasOutstandingBalance: false,
    ...overrides,
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  const now = '2026-07-12T10:00:00.000Z';
  return {
    id: 'order-1',
    orderNo: 1,
    status: 'COMPLETED',
    paymentStatus: 'UNPAID',
    totalAmountCents: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('parseTenderedCents', () => {
  test('parses dollar strings into cents', () => {
    expect(parseTenderedCents('12.50')).toBe(1250);
    expect(parseTenderedCents('$ 20')).toBe(2000);
  });

  test('returns zero for empty or invalid input', () => {
    expect(parseTenderedCents('')).toBe(0);
    expect(parseTenderedCents('abc')).toBe(0);
    expect(parseTenderedCents('..')).toBe(0);
  });
});

describe('formatTenderedInput', () => {
  test('formats cents as fixed two-decimal dollars', () => {
    expect(formatTenderedInput(1250)).toBe('12.50');
    expect(formatTenderedInput(0)).toBe('0.00');
  });
});

describe('getChangeDueCents', () => {
  test('returns change only for cash payments', () => {
    expect(getChangeDueCents('CASH', 2000, 1250)).toBe(750);
    expect(getChangeDueCents('CARD_TERMINAL', 2000, 1250)).toBe(0);
  });

  test('never returns negative change', () => {
    expect(getChangeDueCents('CASH', 1000, 1250)).toBe(0);
  });
});

describe('table checkout state', () => {
  test('isTableCheckoutPaid when all orders are settled', () => {
    expect(
      isTableCheckoutPaid(
        makeSummary({
          orderCount: 2,
          payableOrderCount: 0,
          paidOrderCount: 2,
        })
      )
    ).toBe(true);
  });

  test('is not paid when payable orders remain', () => {
    expect(
      isTableCheckoutPaid(
        makeSummary({
          orderCount: 2,
          payableOrderCount: 1,
        })
      )
    ).toBe(false);
  });

  test('is not paid when session has no orders yet', () => {
    expect(isTableCheckoutPaid(makeSummary({ orderCount: 0, payableOrderCount: 0 }))).toBe(
      false
    );
  });

  test('getTableCheckoutAmountDue reads payable total', () => {
    expect(getTableCheckoutAmountDue(makeSummary({ payableTotalCents: 4300 }))).toBe(4300);
  });
});

describe('takeaway checkout state', () => {
  test('isTakeawayCheckoutPaid follows payment status', () => {
    expect(isTakeawayCheckoutPaid(makeOrder({ paymentStatus: 'PAID' }))).toBe(true);
    expect(isTakeawayCheckoutPaid(makeOrder({ paymentStatus: 'UNPAID' }))).toBe(false);
  });

  test('getTakeawayCheckoutAmountDue reads order total', () => {
    expect(getTakeawayCheckoutAmountDue(makeOrder({ totalAmountCents: 1800 }))).toBe(1800);
  });
});

describe('canAcceptCheckoutPayment', () => {
  test('allows card payment without tendered cash', () => {
    expect(
      canAcceptCheckoutPayment({
        isPaid: false,
        amountDueCents: 2500,
        paymentMethod: 'CARD_TERMINAL',
        tenderedCents: 0,
      })
    ).toBe(true);
  });

  test('requires sufficient cash tendered', () => {
    expect(
      canAcceptCheckoutPayment({
        isPaid: false,
        amountDueCents: 2500,
        paymentMethod: 'CASH',
        tenderedCents: 2500,
      })
    ).toBe(true);

    expect(
      canAcceptCheckoutPayment({
        isPaid: false,
        amountDueCents: 2500,
        paymentMethod: 'CASH',
        tenderedCents: 2400,
      })
    ).toBe(false);
  });

  test('blocks payment when already paid or nothing is due', () => {
    expect(
      canAcceptCheckoutPayment({
        isPaid: true,
        amountDueCents: 2500,
        paymentMethod: 'CARD_TERMINAL',
        tenderedCents: 0,
      })
    ).toBe(false);

    expect(
      canAcceptCheckoutPayment({
        isPaid: false,
        amountDueCents: 0,
        paymentMethod: 'CASH',
        tenderedCents: 0,
      })
    ).toBe(false);
  });
});

describe('orderItemLineTotalCents', () => {
  test('includes per-unit options and quantity', () => {
    expect(
      orderItemLineTotalCents({
        id: 'item-1',
        menuItemId: 'menu-1',
        itemName: 'Burger',
        unitPriceCents: 1200,
        quantity: 2,
        orderItemOptions: [
          { id: 'opt-1', menuOptionId: 'mo-1', name: 'Cheese', priceCents: 100, quantity: 2 },
        ],
      })
    ).toBe(2800);
  });

  test('handles items without options', () => {
    expect(
      orderItemLineTotalCents({
        id: 'item-2',
        menuItemId: 'menu-2',
        itemName: 'Soup',
        unitPriceCents: 800,
        quantity: 3,
      })
    ).toBe(2400);
  });
});
