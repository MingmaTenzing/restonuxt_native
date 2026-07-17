import type { Table } from '@/screens/tables/types';

import type { PosTable } from './types';

export type TableWithStatus = Table & {
  sessions?: { id: string; status?: string }[];
};

/** Pick the live session id for a table row from GET /api/tables. */
export function pickActiveSessionId(
  sessions: { id: string; status?: string }[] | undefined
): string | null {
  const list = sessions ?? [];
  const explicitActive = list.find((session) => session.status === 'ACTIVE');
  if (explicitActive) return explicitActive.id;

  // Production GET /api/tables returns ACTIVE-only rows, often without a status field.
  const untyped = list.find((session) => session.status == null);
  if (untyped) return untyped.id;

  // Explicit non-ACTIVE statuses (CLOSED / CHECKOUT_PENDING) must not look live.
  return null;
}

export function mapPosTables(tables: TableWithStatus[]): PosTable[] {
  return tables
    .map((table) => ({
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      activeSessionId: pickActiveSessionId(table.sessions),
    }))
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
}
