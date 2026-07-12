import type { PosMode } from './types';

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
  if (lineCount < 1) return false;
  if (!customerName.trim()) return false;
  if (mode === 'TAKEAWAY') return true;
  return !!selectedTableId && hasActiveSession;
}
