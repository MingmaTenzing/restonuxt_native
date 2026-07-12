import type { Order } from '@/screens/orders/types';
import type { SessionCheckout, TableSession } from '@/screens/sessions/types';
import type { ApiClient } from '@/utils/api';

import { toCashierSession } from './cashier-sessions';
import type { CloseTakeawayInput, MarkTablePaidInput } from './types';

export async function fetchActiveSessions(api: ApiClient) {
  const sessions = await api<TableSession[]>('/api/table-sessions?status=ACTIVE');
  return sessions.map(toCashierSession);
}

export async function fetchSessionCheckout(api: ApiClient, sessionId: string) {
  return api<SessionCheckout>(`/api/orders/checkout/table/${sessionId}`);
}

export async function fetchUnpaidTakeawayOrders(api: ApiClient) {
  return api<Order[]>('/api/orders/takeaway-unpaid');
}

export async function markTablePaid(api: ApiClient, input: MarkTablePaidInput) {
  return api('/api/orders/checkout/table/mark-paid', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function closeTakeawaySale(api: ApiClient, input: CloseTakeawayInput) {
  return api<Order>('/api/orders/checkout/takeaway/closesales', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
