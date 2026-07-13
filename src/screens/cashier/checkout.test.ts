import { describe, expect, test } from 'bun:test';

import type { Order } from '@/screens/orders/types';
import type { SessionCheckoutSummary } from '@/screens/sessions/types';

import {
  applyQuickCashAmount,
  canAcceptCheckoutPayment,
  formatCheckoutPayableLabel,
  formatTenderedInput,
  getChangeDueCents,
  getCheckoutPaymentPresentation,
  getCheckoutScrollBottomPadding,
  getTableCheckoutAmountDue,
  getTakeawayCheckoutAmountDue,
  isTableCheckoutPaid,
  isTakeawayCheckoutPaid,
  orderItemLineTotalCents,
  parseTenderedCents,
  resolveCheckoutTenderState,
  shouldShowCheckoutPayment,
  type CashOrCard,
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
    expect(parseTenderedCents('1,250.99')).toBe(125099);
  });

  test('accepts whole dollars, leading zeros, and trailing decimals', () => {
    expect(parseTenderedCents('20')).toBe(2000);
    expect(parseTenderedCents('0.5')).toBe(50);
    expect(parseTenderedCents('0.05')).toBe(5);
    expect(parseTenderedCents('00.10')).toBe(10);
  });

  test('returns zero for empty or invalid input', () => {
    expect(parseTenderedCents('')).toBe(0);
    expect(parseTenderedCents('   ')).toBe(0);
    expect(parseTenderedCents('abc')).toBe(0);
    expect(parseTenderedCents('..')).toBe(0);
    expect(parseTenderedCents('-5')).toBe(0);
  });

  test('rounds floating cents safely', () => {
    // 19.99 * 100 can be 1998.999… in IEEE floats without rounding.
    expect(parseTenderedCents('19.99')).toBe(1999);
    expect(parseTenderedCents('0.01')).toBe(1);
  });
});

describe('formatTenderedInput', () => {
  test('formats cents as fixed two-decimal dollars', () => {
    expect(formatTenderedInput(1250)).toBe('12.50');
    expect(formatTenderedInput(0)).toBe('0.00');
    expect(formatTenderedInput(5)).toBe('0.05');
  });

  test('round-trips with parseTenderedCents', () => {
    for (const cents of [0, 1, 99, 100, 1250, 1999, 10000]) {
      expect(parseTenderedCents(formatTenderedInput(cents))).toBe(cents);
    }
  });
});

describe('getChangeDueCents', () => {
  test('returns change only for cash payments', () => {
    expect(getChangeDueCents('CASH', 2000, 1250)).toBe(750);
    expect(getChangeDueCents('CARD_TERMINAL', 2000, 1250)).toBe(0);
  });

  test('never returns negative change', () => {
    expect(getChangeDueCents('CASH', 1000, 1250)).toBe(0);
    expect(getChangeDueCents('CASH', 0, 500)).toBe(0);
  });

  test('returns zero change when tendered exactly matches due', () => {
    expect(getChangeDueCents('CASH', 2500, 2500)).toBe(0);
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
    expect(isTableCheckoutPaid(makeSummary({ orderCount: 0, payableOrderCount: 0 }))).toBe(false);
  });

  test('getTableCheckoutAmountDue reads payable total', () => {
    expect(getTableCheckoutAmountDue(makeSummary({ payableTotalCents: 4300 }))).toBe(4300);
  });

  test('partially paid sessions still expose remaining payable balance', () => {
    const summary = makeSummary({
      orderCount: 3,
      payableOrderCount: 1,
      paidOrderCount: 2,
      payableOrderIds: ['o3'],
      sessionTotalCents: 9000,
      payableTotalCents: 2500,
      paidTotalCents: 6500,
      hasOutstandingBalance: true,
    });

    expect(isTableCheckoutPaid(summary)).toBe(false);
    expect(getTableCheckoutAmountDue(summary)).toBe(2500);
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

  test('allows overpay on cash and still accepts the sale', () => {
    expect(
      canAcceptCheckoutPayment({
        isPaid: false,
        amountDueCents: 1250,
        paymentMethod: 'CASH',
        tenderedCents: 2000,
      })
    ).toBe(true);
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

  test('treats missing option quantity as 1 and empty options as zero add-on', () => {
    expect(
      orderItemLineTotalCents({
        id: 'item-3',
        menuItemId: 'menu-3',
        itemName: 'Fries',
        unitPriceCents: 400,
        quantity: 2,
        orderItemOptions: [
          { id: 'opt-2', menuOptionId: 'mo-2', name: 'Sauce', priceCents: 50 },
        ],
      })
    ).toBe(900);

    expect(
      orderItemLineTotalCents({
        id: 'item-4',
        menuItemId: 'menu-4',
        itemName: 'Water',
        unitPriceCents: 0,
        quantity: 1,
        orderItemOptions: [],
      })
    ).toBe(0);
  });
});

describe('checkout payment presentation (mobile popup vs tablet sidebar)', () => {
  test('shouldShowCheckoutPayment requires loaded orders and no error', () => {
    expect(shouldShowCheckoutPayment({ isLoading: true, isError: false, orderCount: 2 })).toBe(
      false
    );
    expect(shouldShowCheckoutPayment({ isLoading: false, isError: true, orderCount: 2 })).toBe(
      false
    );
    expect(shouldShowCheckoutPayment({ isLoading: false, isError: false, orderCount: 0 })).toBe(
      false
    );
    expect(shouldShowCheckoutPayment({ isLoading: false, isError: false, orderCount: 1 })).toBe(
      true
    );
  });

  test('phones use a balance-due sheet popup; tablets use a sidebar', () => {
    expect(getCheckoutPaymentPresentation({ isTablet: false, showPayment: true })).toBe('sheet');
    expect(getCheckoutPaymentPresentation({ isTablet: true, showPayment: true })).toBe('sidebar');
  });

  test('hides payment chrome while loading, on error, or with empty receipts', () => {
    expect(getCheckoutPaymentPresentation({ isTablet: false, showPayment: false })).toBe('hidden');
    expect(getCheckoutPaymentPresentation({ isTablet: true, showPayment: false })).toBe('hidden');
  });

  test('mobile scroll padding clears the floating balance bar; tablet does not', () => {
    expect(getCheckoutScrollBottomPadding({ isTablet: true, safeBottom: 34 })).toBe(24);
    expect(getCheckoutScrollBottomPadding({ isTablet: false, safeBottom: 34 })).toBe(146);
    expect(getCheckoutScrollBottomPadding({ isTablet: false, safeBottom: 0 })).toBe(112);
  });

  test('payable labels pluralize correctly for table and takeaway', () => {
    expect(
      formatCheckoutPayableLabel({ kind: 'table', payableOrderCount: 1, totalItems: 4 })
    ).toBe('1 payable order');
    expect(
      formatCheckoutPayableLabel({ kind: 'table', payableOrderCount: 3, totalItems: 4 })
    ).toBe('3 payable orders');
    expect(
      formatCheckoutPayableLabel({ kind: 'takeaway', payableOrderCount: 0, totalItems: 1 })
    ).toBe('1 item');
    expect(
      formatCheckoutPayableLabel({ kind: 'takeaway', payableOrderCount: 0, totalItems: 5 })
    ).toBe('5 items');
  });
});

describe('cash tender UX helpers', () => {
  test('quick amount chips accumulate from the current tender', () => {
    expect(applyQuickCashAmount(0, 10)).toBe('10.00');
    expect(applyQuickCashAmount(1000, 20)).toBe('30.00');
    expect(applyQuickCashAmount(parseTenderedCents('12.50'), 50)).toBe('62.50');
  });

  test('exact amount fills the due total and unlocks cash pay', () => {
    const amountDueCents = 1875;
    const exact = formatTenderedInput(amountDueCents);
    const state = resolveCheckoutTenderState({
      isPaid: false,
      amountDueCents,
      paymentMethod: 'CASH',
      tenderedInput: exact,
    });

    expect(state.tenderedCents).toBe(1875);
    expect(state.changeDueCents).toBe(0);
    expect(state.canPay).toBe(true);
  });

  test('overpay shows change and still allows closing the sale', () => {
    const state = resolveCheckoutTenderState({
      isPaid: false,
      amountDueCents: 1250,
      paymentMethod: 'CASH',
      tenderedInput: '20',
    });

    expect(state.tenderedCents).toBe(2000);
    expect(state.changeDueCents).toBe(750);
    expect(state.canPay).toBe(true);
  });

  test('card ignores tendered input for change and can-pay', () => {
    const state = resolveCheckoutTenderState({
      isPaid: false,
      amountDueCents: 4000,
      paymentMethod: 'CARD_TERMINAL',
      tenderedInput: '',
    });

    expect(state.changeDueCents).toBe(0);
    expect(state.canPay).toBe(true);
  });

  test('simulates a full cash desk flow: empty → underpay → quick chips → exact → overpay', () => {
    const amountDueCents = 2750;
    let tendered = '';

    let state = resolveCheckoutTenderState({
      isPaid: false,
      amountDueCents,
      paymentMethod: 'CASH',
      tenderedInput: tendered,
    });
    expect(state.canPay).toBe(false);

    tendered = '10.00';
    state = resolveCheckoutTenderState({
      isPaid: false,
      amountDueCents,
      paymentMethod: 'CASH',
      tenderedInput: tendered,
    });
    expect(state.canPay).toBe(false);
    expect(state.changeDueCents).toBe(0);

    tendered = applyQuickCashAmount(state.tenderedCents, 20);
    state = resolveCheckoutTenderState({
      isPaid: false,
      amountDueCents,
      paymentMethod: 'CASH',
      tenderedInput: tendered,
    });
    expect(state.tenderedCents).toBe(3000);
    expect(state.canPay).toBe(true);
    expect(state.changeDueCents).toBe(250);

    tendered = formatTenderedInput(amountDueCents);
    state = resolveCheckoutTenderState({
      isPaid: false,
      amountDueCents,
      paymentMethod: 'CASH',
      tenderedInput: tendered,
    });
    expect(state.changeDueCents).toBe(0);
    expect(state.canPay).toBe(true);
  });
});

describe('checkout payment invariants under stress', () => {
  test('10_000 random tender/method combinations keep payment rules consistent', () => {
    const methods: CashOrCard[] = ['CASH', 'CARD_TERMINAL'];

    for (let i = 0; i < 10_000; i += 1) {
      const amountDueCents = i % 5000;
      const isPaid = i % 17 === 0;
      const paymentMethod = methods[i % 2]!;
      const tenderedCents = (i * 37) % 6000;
      const tenderedInput = formatTenderedInput(tenderedCents);

      const state = resolveCheckoutTenderState({
        isPaid,
        amountDueCents,
        paymentMethod,
        tenderedInput,
      });

      expect(state.tenderedCents).toBe(tenderedCents);
      expect(state.changeDueCents).toBeGreaterThanOrEqual(0);

      if (paymentMethod === 'CARD_TERMINAL') {
        expect(state.changeDueCents).toBe(0);
      } else {
        expect(state.changeDueCents).toBe(Math.max(tenderedCents - amountDueCents, 0));
      }

      const expectedCanPay =
        !isPaid &&
        amountDueCents > 0 &&
        (paymentMethod === 'CARD_TERMINAL' || tenderedCents >= amountDueCents);

      expect(state.canPay).toBe(expectedCanPay);

      if (state.canPay && paymentMethod === 'CASH') {
        expect(state.tenderedCents).toBeGreaterThanOrEqual(amountDueCents);
      }
    }
  });
});
