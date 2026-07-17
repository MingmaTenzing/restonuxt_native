import type { MenuItem } from '@/screens/menu/types';
import type { Order } from '@/screens/orders/types';
import type { ApiClient } from '@/utils/api';

import { resolveActiveSessionLookup } from './pos-session';
import { mapPosTables } from './pos-tables';
import type { PosDiningOrderInput, PosTakeawayOrderInput } from './types';

export type CreatedTableSession = {
  id: string;
  tableId: string;
  status: 'ACTIVE' | string;
};

export type ActiveTableSession = {
  id: string;
  tableId: string;
  status: string;
};

export async function fetchPosMenu(api: ApiClient) {
  const items = await api<MenuItem[]>('/api/menu');
  return items.filter((item) => item.isAvailable);
}

export async function fetchPosTables(api: ApiClient) {
  const tables = await api<Parameters<typeof mapPosTables>[0]>('/api/tables');
  return mapPosTables(tables);
}

/** Get-or-create ACTIVE session — POST /api/table-sessions/create { tableId }. */
export async function createTableSession(api: ApiClient, tableId: string) {
  return api<CreatedTableSession>('/api/table-sessions/create', {
    method: 'POST',
    body: JSON.stringify({ tableId }),
  });
}

/**
 * Current ACTIVE session for a table (web route middleware equivalent).
 * Throws on network/auth errors; 404 "No active session…" also throws via api().
 */
export async function fetchActiveTableSession(api: ApiClient, tableId: string) {
  return api<ActiveTableSession>(`/api/table-sessions/active/${tableId}`);
}

/** Soft lookup used before entering dining order — 404 → missing, other errors preserved. */
export async function lookupActiveTableSession(api: ApiClient, tableId: string) {
  try {
    const session = await fetchActiveTableSession(api, tableId);
    return resolveActiveSessionLookup({ ok: true, session });
  } catch (error) {
    return resolveActiveSessionLookup({ ok: false, error });
  }
}

export async function submitDiningOrder(api: ApiClient, input: PosDiningOrderInput) {
  return api<Order>('/api/orders/pos/dining', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        tableId: input.tableId,
        customerName: input.customerName,
        totalAmountCents: input.totalAmountCents,
        items: { create: input.items },
      },
    }),
  });
}

export async function submitTakeawayOrder(api: ApiClient, input: PosTakeawayOrderInput) {
  return api<Order>('/api/orders/pos/takeaway', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        customerName: input.customerName,
        totalAmountCents: input.totalAmountCents,
        items: { create: input.items },
      },
    }),
  });
}
