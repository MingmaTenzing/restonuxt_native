import type { Order } from '@/screens/orders/types';
import type { SessionCheckout, TableSession } from '@/screens/sessions/types';
import { apiRequest } from '@/utils/api';

import { toCashierSession } from './cashier-sessions';
import type { CloseTakeawayInput, MarkTablePaidInput } from './types';

export async function fetchActiveSessions(token: string) {
  const sessions = await apiRequest<TableSession[]>(token, '/api/table-sessions?status=ACTIVE');
  return sessions.map(toCashierSession);
}

export async function fetchSessionCheckout(token: string, sessionId: string) {
  return apiRequest<SessionCheckout>(token, `/api/orders/checkout/table/${sessionId}`);
}

export async function fetchUnpaidTakeawayOrders(token: string) {
  return apiRequest<Order[]>(token, '/api/orders/takeaway-unpaid');
}

export async function markTablePaid(token: string, input: MarkTablePaidInput) {
  return apiRequest(token, '/api/orders/checkout/table/mark-paid', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function closeTakeawaySale(token: string, input: CloseTakeawayInput) {
  return apiRequest<Order>(token, '/api/orders/checkout/takeaway/closesales', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
