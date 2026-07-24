import { describe, expect, test } from 'bun:test';

import {
  canShowUndoPaid,
  checkoutBalanceBarActionLabel,
  checkoutPaymentSheetTitle,
  formatUndoTablePaidBlockMessage,
  formatUndoTakeawayPaidBlockMessage,
  resolveUndoTablePaid,
  resolveUndoTakeawayPaid,
  undoPaidConfirmMessage,
} from './checkout-undo';

describe('checkout paid CTAs', () => {
  test('balance bar opens receipt actions when paid, collect when unpaid', () => {
    expect(checkoutBalanceBarActionLabel(true)).toBe('Receipt & actions');
    expect(checkoutBalanceBarActionLabel(false)).toBe('Collect payment');
  });

  test('payment sheet title matches paid vs unpaid mode', () => {
    expect(checkoutPaymentSheetTitle(true)).toBe('Receipt');
    expect(checkoutPaymentSheetTitle(false)).toBe('Collect payment');
  });

  test('undo control only shows for paid sales', () => {
    expect(canShowUndoPaid(true)).toBe(true);
    expect(canShowUndoPaid(false)).toBe(false);
  });
});

describe('resolveUndoTablePaid — unpaid only, never reopen', () => {
  test('allows undo for paid sessions by session id', () => {
    expect(
      resolveUndoTablePaid({
        tableSessionId: 'session-closed-1',
        isPaid: true,
      })
    ).toEqual({ kind: 'allow', tableSessionId: 'session-closed-1' });
  });

  test('blocks undo when the sale is not paid', () => {
    const decision = resolveUndoTablePaid({
      tableSessionId: 'session-1',
      isPaid: false,
    });
    expect(decision.kind).toBe('blocked-not-paid');
    expect(formatUndoTablePaidBlockMessage(decision)).toMatch(/not paid/i);
    expect(formatUndoTablePaidBlockMessage({ kind: 'allow', tableSessionId: 's1' })).toBeNull();
  });

  test('stress: paid sessions always allow undo regardless of session id shape', () => {
    for (let i = 0; i < 5_000; i += 1) {
      const tableSessionId = `session-${i}-${i % 7 === 0 ? 'closed' : 'paid'}`;
      const isPaid = i % 11 !== 0;
      const decision = resolveUndoTablePaid({ tableSessionId, isPaid });
      if (isPaid) {
        expect(decision).toEqual({ kind: 'allow', tableSessionId });
      } else {
        expect(decision).toEqual({ kind: 'blocked-not-paid', tableSessionId });
      }
    }
  });
});

describe('resolveUndoTakeawayPaid', () => {
  test('allows undo only for paid takeaway orders', () => {
    expect(resolveUndoTakeawayPaid({ orderId: 'o1', isPaid: true })).toEqual({
      kind: 'allow',
      orderId: 'o1',
    });
    const blocked = resolveUndoTakeawayPaid({ orderId: 'o2', isPaid: false });
    expect(blocked.kind).toBe('blocked-not-paid');
    expect(formatUndoTakeawayPaidBlockMessage(blocked)).toMatch(/not paid/i);
    expect(formatUndoTakeawayPaidBlockMessage({ kind: 'allow', orderId: 'o1' })).toBeNull();
  });
});

describe('undoPaidConfirmMessage', () => {
  test('table undo keeps session closed; takeaway returns to queue', () => {
    expect(undoPaidConfirmMessage('table')).toMatch(/stays closed/i);
    expect(undoPaidConfirmMessage('table')).not.toMatch(/reopens/i);
    expect(undoPaidConfirmMessage('takeaway')).toMatch(/cashier queue/i);
  });
});
