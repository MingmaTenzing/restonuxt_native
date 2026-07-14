import { describe, expect, test } from 'bun:test';

import { canSubmitPosOrder, getPosSubmitBlocker } from './pos-order';

describe('getPosSubmitBlocker', () => {
  test('returns empty-cart when there are no lines', () => {
    expect(
      getPosSubmitBlocker({
        lineCount: 0,
        customerName: 'Alex',
        mode: 'TAKEAWAY',
        selectedTableId: null,
        hasActiveSession: false,
      })
    ).toEqual({ kind: 'empty-cart' });
  });

  test('returns missing-customer-name for blank or whitespace names', () => {
    expect(
      getPosSubmitBlocker({
        lineCount: 1,
        customerName: '',
        mode: 'TAKEAWAY',
        selectedTableId: null,
        hasActiveSession: false,
      })
    ).toEqual({ kind: 'missing-customer-name' });

    expect(
      getPosSubmitBlocker({
        lineCount: 1,
        customerName: '   ',
        mode: 'DINING',
        selectedTableId: 'table-1',
        hasActiveSession: true,
      })
    ).toEqual({ kind: 'missing-customer-name' });
  });

  test('returns null when takeaway order is ready', () => {
    expect(
      getPosSubmitBlocker({
        lineCount: 1,
        customerName: 'Sam',
        mode: 'TAKEAWAY',
        selectedTableId: null,
        hasActiveSession: false,
      })
    ).toBeNull();
  });

  test('takeaway ignores table and session requirements', () => {
    expect(
      getPosSubmitBlocker({
        lineCount: 2,
        customerName: 'Walk-in',
        mode: 'TAKEAWAY',
        selectedTableId: null,
        hasActiveSession: false,
      })
    ).toBeNull();
  });

  test('returns missing-table for dining without a selected table', () => {
    expect(
      getPosSubmitBlocker({
        lineCount: 1,
        customerName: 'Alex',
        mode: 'DINING',
        selectedTableId: null,
        hasActiveSession: false,
      })
    ).toEqual({ kind: 'missing-table' });
  });

  test('returns missing-session for dining without an active session', () => {
    expect(
      getPosSubmitBlocker({
        lineCount: 1,
        customerName: 'Alex',
        mode: 'DINING',
        selectedTableId: 'table-1',
        hasActiveSession: false,
        tableNumber: '4',
      })
    ).toEqual({ kind: 'missing-session', tableNumber: '4' });
  });

  test('falls back to a generic table label when number is missing', () => {
    expect(
      getPosSubmitBlocker({
        lineCount: 1,
        customerName: 'Alex',
        mode: 'DINING',
        selectedTableId: 'table-1',
        hasActiveSession: false,
      })
    ).toEqual({ kind: 'missing-session', tableNumber: 'this table' });
  });

  test('returns null for dining with table + live session', () => {
    expect(
      getPosSubmitBlocker({
        lineCount: 1,
        customerName: 'Alex',
        mode: 'DINING',
        selectedTableId: 'table-1',
        hasActiveSession: true,
        tableNumber: '4',
      })
    ).toBeNull();
  });

  test('checks blockers in priority order: cart → name → table → session', () => {
    // Empty cart wins even if name/table/session are also wrong.
    expect(
      getPosSubmitBlocker({
        lineCount: 0,
        customerName: '',
        mode: 'DINING',
        selectedTableId: null,
        hasActiveSession: false,
      })
    ).toEqual({ kind: 'empty-cart' });

    // Name wins over missing table.
    expect(
      getPosSubmitBlocker({
        lineCount: 1,
        customerName: '',
        mode: 'DINING',
        selectedTableId: null,
        hasActiveSession: false,
      })
    ).toEqual({ kind: 'missing-customer-name' });

    // Table wins over missing session.
    expect(
      getPosSubmitBlocker({
        lineCount: 1,
        customerName: 'Alex',
        mode: 'DINING',
        selectedTableId: null,
        hasActiveSession: false,
      })
    ).toEqual({ kind: 'missing-table' });
  });
});

describe('canSubmitPosOrder', () => {
  test('requires at least one cart line and customer name', () => {
    expect(
      canSubmitPosOrder({
        lineCount: 0,
        customerName: 'Alex',
        mode: 'TAKEAWAY',
        selectedTableId: null,
        hasActiveSession: false,
      })
    ).toBe(false);

    expect(
      canSubmitPosOrder({
        lineCount: 2,
        customerName: '   ',
        mode: 'TAKEAWAY',
        selectedTableId: null,
        hasActiveSession: false,
      })
    ).toBe(false);
  });

  test('allows takeaway submit with items and customer name', () => {
    expect(
      canSubmitPosOrder({
        lineCount: 1,
        customerName: 'Sam',
        mode: 'TAKEAWAY',
        selectedTableId: null,
        hasActiveSession: false,
      })
    ).toBe(true);
  });

  test('requires table selection and active session for dining', () => {
    expect(
      canSubmitPosOrder({
        lineCount: 1,
        customerName: 'Alex',
        mode: 'DINING',
        selectedTableId: null,
        hasActiveSession: false,
      })
    ).toBe(false);

    expect(
      canSubmitPosOrder({
        lineCount: 1,
        customerName: 'Alex',
        mode: 'DINING',
        selectedTableId: 'table-1',
        hasActiveSession: false,
      })
    ).toBe(false);

    expect(
      canSubmitPosOrder({
        lineCount: 1,
        customerName: 'Alex',
        mode: 'DINING',
        selectedTableId: 'table-1',
        hasActiveSession: true,
      })
    ).toBe(true);
  });

  test('mirrors getPosSubmitBlocker === null', () => {
    const args = {
      lineCount: 1,
      customerName: 'Guest',
      mode: 'DINING' as const,
      selectedTableId: 't1',
      hasActiveSession: true,
    };
    expect(canSubmitPosOrder(args)).toBe(getPosSubmitBlocker(args) === null);
  });
});
