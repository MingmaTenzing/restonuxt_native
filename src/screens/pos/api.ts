import type { MenuItem } from '@/screens/menu/types';
import type { Order } from '@/screens/orders/types';
import { apiRequest } from '@/utils/api';

import { mapPosTables } from './pos-tables';
import type { PosDiningOrderInput, PosTakeawayOrderInput } from './types';

export async function fetchPosMenu(token: string) {
  const items = await apiRequest<MenuItem[]>(token, '/api/menu');
  return items.filter((item) => item.isAvailable);
}

export async function fetchPosTables(token: string) {
  const tables = await apiRequest<Parameters<typeof mapPosTables>[0]>(token, '/api/tables');
  return mapPosTables(tables);
}

export async function createTableSession(token: string, tableId: string) {
  return apiRequest<{ id: string; tableId: string; status: string }>(
    token,
    '/api/table-sessions/create',
    {
      method: 'POST',
      body: JSON.stringify({ tableId }),
    }
  );
}

export async function submitDiningOrder(token: string, input: PosDiningOrderInput) {
  return apiRequest<Order>(token, '/api/orders/pos/dining', {
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

export async function submitTakeawayOrder(token: string, input: PosTakeawayOrderInput) {
  return apiRequest<Order>(token, '/api/orders/pos/takeaway', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        customerName: input.customerName,
        items: { create: input.items },
      },
    }),
  });
}
