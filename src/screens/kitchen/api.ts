import type { Order, OrderStatus } from '@/screens/orders/types';
import type { ApiClient } from '@/utils/api';
import { unwrapList } from '@/utils/api';

export async function fetchPendingOrders(api: ApiClient): Promise<Order[]> {
  const payload = await api<unknown>('/api/orders/pending');
  return unwrapList<Order>(payload, ['orders', 'data']);
}

export async function fetchCompletedOrders(api: ApiClient): Promise<Order[]> {
  const payload = await api<unknown>('/api/orders/completed');
  return unwrapList<Order>(payload, ['orders', 'data']);
}

export async function updateOrderStatus(
  api: ApiClient,
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  return api<Order>(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
