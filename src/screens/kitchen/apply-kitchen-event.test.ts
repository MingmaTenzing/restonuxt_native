import { describe, expect, test } from 'bun:test';

import { applyKitchenEvent } from './apply-kitchen-event';
import { kitchenEvent, makeOrder } from '@/test/kitchen-fixtures';

describe('applyKitchenEvent', () => {
  test('creates pending orders and moves completed orders to the completed queue', () => {
    const recent = new Date().toISOString();
    const created = makeOrder({ id: 'order-1', orderNo: 1, createdAt: recent });
    const completed = makeOrder({
      id: 'order-1',
      orderNo: 1,
      status: 'COMPLETED',
      createdAt: recent,
      updatedAt: recent,
    });

    const afterCreate = applyKitchenEvent(
      { pending: [], completed: [] },
      kitchenEvent('ORDER_CREATED', created),
    );
    const afterComplete = applyKitchenEvent(afterCreate, kitchenEvent('ORDER_MARKED_COMPLETED', completed));

    expect(afterComplete.pending).toHaveLength(0);
    expect(afterComplete.completed).toHaveLength(1);
    expect(afterComplete.completed[0]?.id).toBe('order-1');
  });

  test('recalls completed orders back to pending', () => {
    const order = makeOrder({ id: 'order-9', orderNo: 9, status: 'COMPLETED' });
    const recalled = makeOrder({ id: 'order-9', orderNo: 9, status: 'PENDING' });

    const state = applyKitchenEvent(
      { pending: [], completed: [order] },
      kitchenEvent('ORDER_RECALL', recalled),
    );

    expect(state.pending).toHaveLength(1);
    expect(state.completed).toHaveLength(0);
  });

  test('survives 5_000 random lifecycle events with consistent final state', () => {
    let state = { pending: [] as ReturnType<typeof makeOrder>[], completed: [] as ReturnType<typeof makeOrder>[] };
    const active = new Set<string>();

    for (let i = 0; i < 5_000; i += 1) {
      const orderId = `order-${i % 250}`;
      const orderNo = i % 250;
      const roll = i % 10;

      if (roll < 4 || !active.has(orderId)) {
        const created = makeOrder({ id: orderId, orderNo, status: 'PENDING' });
        state = applyKitchenEvent(state, kitchenEvent('ORDER_CREATED', created));
        active.add(orderId);
        continue;
      }

      if (roll < 7) {
        const completed = makeOrder({
          id: orderId,
          orderNo,
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date(Date.now() + i * 1_000).toISOString(),
        });
        state = applyKitchenEvent(state, kitchenEvent('ORDER_MARKED_COMPLETED', completed));
        active.delete(orderId);
        continue;
      }

      if (roll < 9 && state.completed.some((order) => order.id === orderId)) {
        const recalled = makeOrder({ id: orderId, orderNo, status: 'PENDING' });
        state = applyKitchenEvent(state, kitchenEvent('ORDER_RECALL', recalled));
        active.add(orderId);
        continue;
      }

      state = applyKitchenEvent(
        state,
        kitchenEvent('ORDER_CANCELLED', { id: orderId } as ReturnType<typeof makeOrder>),
      );
      active.delete(orderId);
    }

    const pendingIds = new Set(state.pending.map((order) => order.id));
    const completedIds = new Set(state.completed.map((order) => order.id));

    for (const id of pendingIds) {
      expect(completedIds.has(id)).toBe(false);
    }
  });
});
