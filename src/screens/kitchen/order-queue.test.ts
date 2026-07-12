import { describe, expect, test } from 'bun:test';

import {
  prependCompletedOrder,
  removeOrder,
  sortKitchenOrders,
  upsertOrder,
} from './order-queue';
import { makeOrder } from '@/test/kitchen-fixtures';

describe('order-queue', () => {
  test('upserts and sorts pending orders by createdAt', () => {
    const first = makeOrder({ id: 'a', orderNo: 2 });
    const second = makeOrder({ id: 'b', orderNo: 1 });
    const result = upsertOrder([first], second);

    expect(result.map((order) => order.id)).toEqual(['b', 'a']);
  });

  test('handles 2_000 upserts without losing the latest state', () => {
    let orders = sortKitchenOrders([]);

    for (let i = 0; i < 2_000; i += 1) {
      const order = makeOrder({
        id: `order-${i % 200}`,
        orderNo: i % 200,
        totalAmountCents: i,
      });
      orders = upsertOrder(orders, order);
    }

    expect(orders).toHaveLength(200);
    expect(orders.find((order) => order.id === 'order-42')?.totalAmountCents).toBe(1842);
  });

  test('completed queue keeps unique recent orders', () => {
    const recent = new Date().toISOString();
    const completed = makeOrder({
      id: 'done-1',
      orderNo: 9,
      status: 'COMPLETED',
      createdAt: recent,
      updatedAt: recent,
    });

    const result = prependCompletedOrder(
      prependCompletedOrder([], completed),
      makeOrder({
        id: 'done-1',
        orderNo: 9,
        status: 'COMPLETED',
        createdAt: recent,
        updatedAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    );

    expect(result).toHaveLength(1);
  });

  test('removeOrder is stable under repeated deletes', () => {
    let orders = sortKitchenOrders(
      Array.from({ length: 100 }, (_, index) =>
        makeOrder({ id: `order-${index}`, orderNo: index }),
      ),
    );

    for (let pass = 0; pass < 5; pass += 1) {
      for (let index = 0; index < 100; index += 1) {
        orders = removeOrder(orders, `order-${index}`);
      }
    }

    expect(orders).toHaveLength(0);
  });
});
