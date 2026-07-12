import { describe, expect, test } from 'bun:test';

import { canSubmitPosOrder } from './pos-order';

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
});
