import type { Order, OrderStatus } from '@/screens/orders/types';
import { apiUrl } from '@/utils/api';

async function apiRequest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errorBody = (await response.json()) as { statusMessage?: string; message?: string };
      const detail = errorBody.statusMessage ?? errorBody.message;
      if (detail) message = detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function normalizeOrders(payload: unknown): Order[] {
  return Array.isArray(payload) ? payload : ((payload as { orders?: Order[]; data?: Order[] }).orders
    ?? (payload as { data?: Order[] }).data
    ?? []);
}

export async function fetchPendingOrders(token: string): Promise<Order[]> {
  const payload = await apiRequest<unknown>(token, '/api/orders/pending');
  return normalizeOrders(payload);
}

export async function fetchCompletedOrders(token: string): Promise<Order[]> {
  const payload = await apiRequest<unknown>(token, '/api/orders/completed');
  return normalizeOrders(payload);
}

export async function updateOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const payload = await apiRequest<Order | { order?: Order }>(token, `/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

  if (payload && typeof payload === 'object' && 'order' in payload && payload.order) {
    return payload.order;
  }

  return payload as Order;
}
