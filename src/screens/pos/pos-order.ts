import type { PosMode } from './types';

export type PosSubmitBlocker =
  | { kind: 'empty-cart' }
  | { kind: 'missing-customer-name' }
  | { kind: 'missing-table' }
  | { kind: 'missing-session'; tableNumber: string };

export function getPosSubmitBlocker({
  lineCount,
  customerName,
  mode,
  selectedTableId,
  hasActiveSession,
  tableNumber,
}: {
  lineCount: number;
  customerName: string;
  mode: PosMode;
  selectedTableId: string | null;
  hasActiveSession: boolean;
  tableNumber?: string | null;
}): PosSubmitBlocker | null {
  if (lineCount < 1) return { kind: 'empty-cart' };
  if (!customerName.trim()) return { kind: 'missing-customer-name' };
  if (mode === 'TAKEAWAY') return null;
  if (!selectedTableId) return { kind: 'missing-table' };
  if (!hasActiveSession) {
    return { kind: 'missing-session', tableNumber: tableNumber ?? 'this table' };
  }
  return null;
}

export function canSubmitPosOrder({
  lineCount,
  customerName,
  mode,
  selectedTableId,
  hasActiveSession,
}: {
  lineCount: number;
  customerName: string;
  mode: PosMode;
  selectedTableId: string | null;
  hasActiveSession: boolean;
}) {
  return (
    getPosSubmitBlocker({
      lineCount,
      customerName,
      mode,
      selectedTableId,
      hasActiveSession,
    }) === null
  );
}
