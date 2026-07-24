import type { Order } from '@/screens/orders/types';
import type { SessionCheckout, TableSession } from '@/screens/sessions/types';
import { unwrapList, type ApiClient } from '@/utils/api';

import { selectPaidTakeawayOrders } from './cashier-paid';
import { toCashierSession } from './cashier-sessions';
import type {
  CloseTakeawayInput,
  MarkTablePaidInput,
  UndoTablePaidInput,
  UndoTablePaidResult,
  UndoTakeawayPaidInput,
} from './types';

export async function fetchActiveSessions(api: ApiClient) {
  const sessions = await api<TableSession[]>('/api/table-sessions?status=ACTIVE');
  return sessions.map(toCashierSession);
}

export async function fetchClosedSessions(api: ApiClient) {
  const sessions = await api<TableSession[]>('/api/table-sessions?status=CLOSED');
  return sessions.map(toCashierSession);
}

export async function fetchSessionCheckout(api: ApiClient, sessionId: string) {
  return api<SessionCheckout>(`/api/orders/checkout/table/${sessionId}`);
}

export async function fetchUnpaidTakeawayOrders(api: ApiClient) {
  return api<Order[]>('/api/orders/takeaway-unpaid');
}

/** Today's paid takeaway orders for reprinting receipts. */
export async function fetchPaidTakeawayOrders(api: ApiClient) {
  const payload = await api<unknown>('/api/orders?range=day');
  return selectPaidTakeawayOrders(unwrapList<Order>(payload, ['orders', 'data']));
}

export async function fetchCheckoutOrder(api: ApiClient, orderId: string) {
  try {
    const payload = await api<Record<string, unknown>>(`/api/orders/${orderId}`);
    return (payload.order ?? payload.data ?? payload) as Order;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      throw new Error('This order no longer exists.');
    }
    throw error;
  }
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

/** Reopen a closed table session by id and mark its paid orders unpaid. */
export async function undoTablePaid(api: ApiClient, input: UndoTablePaidInput) {
  return api<UndoTablePaidResult>('/api/orders/checkout/table/undo-paid', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Mark a paid takeaway order unpaid again so it returns to the cashier queue. */
export async function undoTakeawayPaid(api: ApiClient, input: UndoTakeawayPaidInput) {
  return api<Order>('/api/orders/checkout/takeaway/undo-paid', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
