import type { Table } from '@/screens/tables/types';

import type { PosTable } from './types';

export type TableWithStatus = Table & {
  sessions?: { id: string; status?: string }[];
};

export function mapPosTables(tables: TableWithStatus[]): PosTable[] {
  return tables
    .map((table) => {
      const sessions = table.sessions ?? [];
      // GET /api/tables only includes ACTIVE sessions; keep the status check for tests/mocks.
      const active =
        sessions.find((session) => session.status === 'ACTIVE') ?? sessions[0] ?? null;

      return {
        id: table.id,
        number: table.number,
        capacity: table.capacity,
        activeSessionId: active?.id ?? null,
      };
    })
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
}
