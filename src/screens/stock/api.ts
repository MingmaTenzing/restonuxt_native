import type { ApiClient } from '@/utils/api';

import type { StockItem, StockItemInput } from './types';

export async function fetchStockItems(api: ApiClient) {
  return api<StockItem[]>('/api/stock');
}

export async function fetchStockItem(api: ApiClient, id: string) {
  return api<StockItem>(`/api/stock/${id}`);
}

export async function createStockItem(api: ApiClient, input: StockItemInput) {
  return api<StockItem>('/api/stock', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateStockLevel(api: ApiClient, id: string, currentStock: number) {
  return api<StockItem>(`/api/stock/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ currentStock }),
  });
}

export async function deleteStockItem(api: ApiClient, id: string) {
  return api<StockItem>(`/api/stock/${id}`, {
    method: 'DELETE',
  });
}
