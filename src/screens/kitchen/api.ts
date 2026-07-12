import type { Order, OrderStatus } from '@/screens/orders/types';
import { apiRequest, unwrapList } from '@/utils/api';

export async function fetchPendingOrders(token: string): Promise<Order[]> {
  const payload = await apiRequest<unknown>(token, '/api/orders/pending');
  return unwrapList<Order>(payload, ['orders', 'data']);
}

export async function fetchCompletedOrders(token: string): Promise<Order[]> {
  const payload = await apiRequest<unknown>(token, '/api/orders/completed');
  return unwrapList<Order>(payload, ['orders', 'data']);
}

export async function updateOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  return apiRequest<Order>(token, `/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
