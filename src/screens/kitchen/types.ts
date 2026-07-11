import type { Order } from '@/screens/orders/types';

export type KitchenWebSocketEventType =
  | 'ORDER_CREATED'
  | 'ORDER_MARKED_COMPLETED'
  | 'ORDER_RECALL'
  | 'ORDER_CANCELLED';

export interface KitchenWebSocketPayload {
  type: KitchenWebSocketEventType;
  payload: unknown;
}

export type KitchenConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export type KitchenQueueTab = 'active' | 'completed';

const KITCHEN_EVENT_TYPES = new Set<KitchenWebSocketEventType>([
  'ORDER_CREATED',
  'ORDER_MARKED_COMPLETED',
  'ORDER_RECALL',
  'ORDER_CANCELLED',
]);

export function isOrder(value: unknown): value is Order {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Order>;
  return typeof candidate.id === 'string' && typeof candidate.orderNo === 'number';
}

export function getOrderId(payload: unknown): string | null {
  if (isOrder(payload)) return payload.id;
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'id' in payload &&
    typeof (payload as { id: unknown }).id === 'string'
  ) {
    return (payload as { id: string }).id;
  }
  return null;
}

export function parseKitchenWebSocketMessage(raw: string): KitchenWebSocketPayload | null {
  if (raw === 'pong') return null;

  try {
    const parsed = JSON.parse(raw) as KitchenWebSocketPayload;
    if (parsed?.type && KITCHEN_EVENT_TYPES.has(parsed.type)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}
