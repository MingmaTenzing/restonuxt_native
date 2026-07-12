import type { MenuItem } from '@/screens/menu/types';
import type { Order } from '@/screens/orders/types';
import type { ApiClient } from '@/utils/api';

import { mapPosTables } from './pos-tables';
import type { PosDiningOrderInput, PosTakeawayOrderInput } from './types';

export async function fetchPosMenu(api: ApiClient) {
  const items = await api<MenuItem[]>('/api/menu');
  return items.filter((item) => item.isAvailable);
}

export async function fetchPosTables(api: ApiClient) {
  const tables = await api<Parameters<typeof mapPosTables>[0]>('/api/tables');
  return mapPosTables(tables);
}

export async function createTableSession(api: ApiClient, tableId: string) {
  return api<{ id: string; tableId: string; status: string }>('/api/table-sessions/create', {
    method: 'POST',
    body: JSON.stringify({ tableId }),
  });
}

export async function submitDiningOrder(api: ApiClient, input: PosDiningOrderInput) {
  return api<Order>('/api/orders/pos/dining', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        tableId: input.tableId,
        customerName: input.customerName,
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
        items: { create: input.items },
      },
    }),
  });
}
