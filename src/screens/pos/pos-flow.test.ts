import { describe, expect, test } from 'bun:test';

import {
  applyEnterDiningOrder,
  applyModeChange,
  applyOpenedSession,
  applyReturnToTableSelect,
  initialDiningStepForMode,
  isPosOrdering,
  openSessionConfirmCopy,
  partitionTablesBySession,
  resolveChangeTable,
  resolveModeChange,
  resolveTablePress,
  tableHasLiveSession,
} from './pos-flow';
import type { PosTable } from './types';

const liveTable: PosTable = {
  id: 'table-live',
  number: '4',
  capacity: 4,
  activeSessionId: 'session-1',
};

const freeTable: PosTable = {
  id: 'table-free',
  number: '7',
  capacity: 2,
  activeSessionId: null,
};

describe('initialDiningStepForMode', () => {
  test('dining starts on pick-table; takeaway starts on order', () => {
    expect(initialDiningStepForMode('DINING')).toBe('pick-table');
    expect(initialDiningStepForMode('TAKEAWAY')).toBe('order');
  });
});

describe('isPosOrdering', () => {
  test('takeaway is always ordering', () => {
    expect(isPosOrdering({ mode: 'TAKEAWAY', diningStep: 'pick-table' })).toBe(true);
    expect(isPosOrdering({ mode: 'TAKEAWAY', diningStep: 'order' })).toBe(true);
  });

  test('dining only orders after a table is chosen', () => {
    expect(isPosOrdering({ mode: 'DINING', diningStep: 'pick-table' })).toBe(false);
    expect(isPosOrdering({ mode: 'DINING', diningStep: 'order' })).toBe(true);
  });
});

describe('resolveTablePress', () => {
  test('live table enters the order screen immediately', () => {
    expect(
      resolveTablePress({ table: liveTable, isOpeningSession: false })
    ).toEqual({ kind: 'enter-order', tableId: 'table-live' });
  });

  test('free table asks to open a session first', () => {
    expect(
      resolveTablePress({ table: freeTable, isOpeningSession: false })
    ).toEqual({
      kind: 'confirm-open-session',
      tableId: 'table-free',
      tableNumber: '7',
    });
  });

  test('ignores presses while a session is opening', () => {
    expect(
      resolveTablePress({ table: liveTable, isOpeningSession: true })
    ).toEqual({ kind: 'ignore' });
    expect(
      resolveTablePress({ table: freeTable, isOpeningSession: true })
    ).toEqual({ kind: 'ignore' });
  });
});

describe('openSessionConfirmCopy', () => {
  test('names the table in the confirmation', () => {
    expect(openSessionConfirmCopy('12')).toEqual({
      title: 'Open table session?',
      message:
        'Table 12 has no active session. Open it now to start taking orders?',
      confirmLabel: 'Open & order',
    });
  });
});

describe('resolveModeChange', () => {
  test('noops when the mode is unchanged', () => {
    expect(
      resolveModeChange({
        currentMode: 'DINING',
        nextMode: 'DINING',
        cartLineCount: 3,
      })
    ).toEqual({ kind: 'noop' });
  });

  test('proceeds immediately with an empty cart', () => {
    expect(
      resolveModeChange({
        currentMode: 'DINING',
        nextMode: 'TAKEAWAY',
        cartLineCount: 0,
      })
    ).toEqual({ kind: 'proceed' });
  });

  test('requires confirmation when the ticket has items', () => {
    expect(
      resolveModeChange({
        currentMode: 'TAKEAWAY',
        nextMode: 'DINING',
        cartLineCount: 2,
      })
    ).toEqual({ kind: 'confirm-clear-ticket', reason: 'switch-mode' });
  });
});

describe('resolveChangeTable', () => {
  test('returns to table pick immediately when the cart is empty', () => {
    expect(resolveChangeTable({ cartLineCount: 0 })).toEqual({ kind: 'proceed' });
  });

  test('confirms before clearing a non-empty ticket', () => {
    expect(resolveChangeTable({ cartLineCount: 1 })).toEqual({
      kind: 'confirm-clear-ticket',
      reason: 'change-table',
    });
  });
});

describe('applyModeChange', () => {
  test('switching to dining clears table and returns to pick-table', () => {
    expect(applyModeChange('DINING')).toEqual({
      mode: 'DINING',
      diningStep: 'pick-table',
      selectedTableId: null,
    });
  });

  test('switching to takeaway goes straight to order without a table', () => {
    expect(applyModeChange('TAKEAWAY')).toEqual({
      mode: 'TAKEAWAY',
      diningStep: 'order',
      selectedTableId: null,
    });
  });
});

describe('applyEnterDiningOrder / applyReturnToTableSelect', () => {
  test('entering dining order locks the selected table and opens the menu', () => {
    expect(applyEnterDiningOrder('table-live')).toEqual({
      selectedTableId: 'table-live',
      diningStep: 'order',
    });
  });

  test('returning to table select clears the destination', () => {
    expect(applyReturnToTableSelect()).toEqual({
      selectedTableId: null,
      diningStep: 'pick-table',
    });
  });
});

describe('applyOpenedSession', () => {
  test('marks only the opened table as live', () => {
    const tables = [liveTable, freeTable];
    const next = applyOpenedSession(tables, 'table-free', 'session-new');

    expect(next).toEqual([
      liveTable,
      { ...freeTable, activeSessionId: 'session-new' },
    ]);
    // Original array is not mutated.
    expect(freeTable.activeSessionId).toBeNull();
  });

  test('leaves other tables unchanged when id does not match', () => {
    expect(applyOpenedSession([freeTable], 'missing', 'session-x')).toEqual([
      freeTable,
    ]);
  });
});

describe('tableHasLiveSession / partitionTablesBySession', () => {
  test('detects live vs free tables', () => {
    expect(tableHasLiveSession(liveTable)).toBe(true);
    expect(tableHasLiveSession(freeTable)).toBe(false);
  });

  test('partitions tables for the overview UI', () => {
    expect(partitionTablesBySession([freeTable, liveTable])).toEqual({
      live: [liveTable],
      free: [freeTable],
    });
  });

  test('handles all-live and all-free floors', () => {
    expect(partitionTablesBySession([liveTable])).toEqual({
      live: [liveTable],
      free: [],
    });
    expect(partitionTablesBySession([freeTable])).toEqual({
      live: [],
      free: [freeTable],
    });
    expect(partitionTablesBySession([])).toEqual({ live: [], free: [] });
  });
});

describe('table-first dining journey', () => {
  test('live table → order → change table with empty cart', () => {
    const press = resolveTablePress({ table: liveTable, isOpeningSession: false });
    expect(press.kind).toBe('enter-order');

    const entered = applyEnterDiningOrder(liveTable.id);
    expect(isPosOrdering({ mode: 'DINING', diningStep: entered.diningStep })).toBe(
      true
    );

    const change = resolveChangeTable({ cartLineCount: 0 });
    expect(change).toEqual({ kind: 'proceed' });
    expect(applyReturnToTableSelect().diningStep).toBe('pick-table');
  });

  test('free table → open session → order → switch to takeaway clears destination', () => {
    const press = resolveTablePress({ table: freeTable, isOpeningSession: false });
    expect(press).toEqual({
      kind: 'confirm-open-session',
      tableId: 'table-free',
      tableNumber: '7',
    });

    const afterOpen = applyOpenedSession([freeTable], freeTable.id, 'session-new');
    expect(tableHasLiveSession(afterOpen[0]!)).toBe(true);

    const entered = applyEnterDiningOrder(freeTable.id);
    expect(entered).toEqual({
      selectedTableId: 'table-free',
      diningStep: 'order',
    });

    const modeGuard = resolveModeChange({
      currentMode: 'DINING',
      nextMode: 'TAKEAWAY',
      cartLineCount: 1,
    });
    expect(modeGuard).toEqual({
      kind: 'confirm-clear-ticket',
      reason: 'switch-mode',
    });

    expect(applyModeChange('TAKEAWAY')).toEqual({
      mode: 'TAKEAWAY',
      diningStep: 'order',
      selectedTableId: null,
    });
  });
});
