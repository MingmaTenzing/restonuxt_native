import {
  prependCompletedOrder,
  removeOrder,
  upsertOrder,
} from '@/screens/kitchen/order-queue';
import type { KitchenWebSocketPayload } from '@/screens/kitchen/types';
import { getOrderId, isOrder } from '@/screens/kitchen/types';
import type { Order } from '@/screens/orders/types';

export interface KitchenQueues {
  pending: Order[];
  completed: Order[];
}

export function applyKitchenEvent(
  queues: KitchenQueues,
  message: KitchenWebSocketPayload,
  markOrderAsNew?: (orderId: string) => void,
): KitchenQueues {
  let pending = queues.pending;
  let completed = queues.completed;

  if (message.type === 'ORDER_CREATED' && isOrder(message.payload)) {
    if (message.payload.status === 'PENDING') {
      markOrderAsNew?.(message.payload.id);
      pending = upsertOrder(pending, message.payload);
    }
  } else if (
    message.type === 'ORDER_MARKED_COMPLETED' ||
    message.type === 'ORDER_CANCELLED'
  ) {
    const orderId = getOrderId(message.payload);
    if (orderId) {
      pending = removeOrder(pending, orderId);
    }
  } else if (message.type === 'ORDER_RECALL' && isOrder(message.payload)) {
    if (message.payload.status === 'PENDING') {
      markOrderAsNew?.(message.payload.id);
      pending = upsertOrder(pending, message.payload);
    }
  }

  if (message.type === 'ORDER_MARKED_COMPLETED' && isOrder(message.payload)) {
    completed = prependCompletedOrder(completed, message.payload);
  } else if (message.type === 'ORDER_RECALL' || message.type === 'ORDER_CANCELLED') {
    const orderId = getOrderId(message.payload);
    if (orderId) {
      completed = removeOrder(completed, orderId);
    }
  }

  return { pending, completed };
}
