import type { PosMode, PosTable } from './types';

export type DiningStep = 'pick-table' | 'order';

export type TablePressAction =
  | { kind: 'enter-order'; tableId: string }
  | { kind: 'confirm-open-session'; tableId: string; tableNumber: string }
  | { kind: 'ignore' };

export type NavigationGuard =
  | { kind: 'proceed' }
  | { kind: 'confirm-clear-ticket'; reason: 'switch-mode' | 'change-table' };

/** Initial dining step for a service mode. Dining starts on table pick; takeaway goes straight to order. */
export function initialDiningStepForMode(mode: PosMode): DiningStep {
  return mode === 'DINING' ? 'pick-table' : 'order';
}

/** Whether POS should show the menu/cart (vs the table-select screen). */
export function isPosOrdering({
  mode,
  diningStep,
}: {
  mode: PosMode;
  diningStep: DiningStep;
}) {
  return mode === 'TAKEAWAY' || diningStep === 'order';
}

/**
 * Decide what happens when a waiter taps a table on the pick-table screen.
 * Live tables enter the order screen immediately; free tables need session confirmation.
 */
export function resolveTablePress({
  table,
  isOpeningSession,
}: {
  table: PosTable;
  isOpeningSession: boolean;
}): TablePressAction {
  if (isOpeningSession) return { kind: 'ignore' };
  if (table.activeSessionId) {
    return { kind: 'enter-order', tableId: table.id };
  }
  return {
    kind: 'confirm-open-session',
    tableId: table.id,
    tableNumber: table.number,
  };
}

/** Guard before switching Dining ↔ Takeaway. */
export function resolveModeChange({
  currentMode,
  nextMode,
  cartLineCount,
}: {
  currentMode: PosMode;
  nextMode: PosMode;
  cartLineCount: number;
}): NavigationGuard | { kind: 'noop' } {
  if (nextMode === currentMode) return { kind: 'noop' };
  if (cartLineCount > 0) {
    return { kind: 'confirm-clear-ticket', reason: 'switch-mode' };
  }
  return { kind: 'proceed' };
}

/** Guard before leaving the order screen to pick a different table. */
export function resolveChangeTable({ cartLineCount }: { cartLineCount: number }): NavigationGuard {
  if (cartLineCount > 0) {
    return { kind: 'confirm-clear-ticket', reason: 'change-table' };
  }
  return { kind: 'proceed' };
}

/** State after confirming a mode switch (ticket cleared, dining returns to table pick). */
export function applyModeChange(nextMode: PosMode): {
  mode: PosMode;
  diningStep: DiningStep;
  selectedTableId: null;
} {
  return {
    mode: nextMode,
    diningStep: initialDiningStepForMode(nextMode),
    selectedTableId: null,
  };
}

/** State after entering the dining order screen for a table with a live session. */
export function applyEnterDiningOrder(tableId: string): {
  selectedTableId: string;
  diningStep: DiningStep;
} {
  return {
    selectedTableId: tableId,
    diningStep: 'order',
  };
}

/** State after returning to the table-select screen (ticket cleared). */
export function applyReturnToTableSelect(): {
  selectedTableId: null;
  diningStep: DiningStep;
} {
  return {
    selectedTableId: null,
    diningStep: 'pick-table',
  };
}

/** Optimistically mark a table as having a live session after create succeeds. */
export function applyOpenedSession(
  tables: PosTable[],
  tableId: string,
  sessionId: string
): PosTable[] {
  return tables.map((table) =>
    table.id === tableId ? { ...table, activeSessionId: sessionId } : table
  );
}

export function tableHasLiveSession(table: PosTable) {
  return !!table.activeSessionId;
}

export function partitionTablesBySession(tables: PosTable[]) {
  const live: PosTable[] = [];
  const free: PosTable[] = [];
  for (const table of tables) {
    if (tableHasLiveSession(table)) live.push(table);
    else free.push(table);
  }
  return { live, free };
}

export function openSessionConfirmCopy(tableNumber: string) {
  return {
    title: 'Open table session?',
    message: `Table ${tableNumber} has no active session. Open it now to start taking orders?`,
    confirmLabel: 'Open & order',
  };
}
