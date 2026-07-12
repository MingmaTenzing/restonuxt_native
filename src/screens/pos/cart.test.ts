import { describe, expect, test } from 'bun:test';

import {
  buildOrderItemCreates,
  cartItemCount,
  cartTotalCents,
  lineTotalCents,
  removeCartLine,
  updateCartLineQuantity,
} from './cart';
import type { CartLine } from './types';

const sampleLine: CartLine = {
  id: 'line-1',
  menuItemId: 'menu-1',
  itemName: 'Margherita',
  unitPriceCents: 1500,
  quantity: 2,
  specialInstructions: 'Extra basil',
  options: [{ menuOptionId: 'opt-1', name: 'Extra cheese', priceCents: 200, quantity: 1 }],
};

describe('cart totals', () => {
  test('lineTotalCents includes options', () => {
    expect(lineTotalCents(sampleLine)).toBe(3400);
  });

  test('cartTotalCents sums all lines', () => {
    const lines = [
      sampleLine,
      {
        ...sampleLine,
        id: 'line-2',
        quantity: 1,
        unitPriceCents: 800,
        options: [],
      },
    ];
    expect(cartTotalCents(lines)).toBe(4200);
    expect(cartItemCount(lines)).toBe(3);
  });
});

describe('buildOrderItemCreates', () => {
  test('maps cart lines to API payload', () => {
    expect(buildOrderItemCreates([sampleLine])).toEqual([
      {
        menuItemId: 'menu-1',
        itemName: 'Margherita',
        unitPriceCents: 1500,
        quantity: 2,
        specialInstructions: 'Extra basil',
        orderItemOptions: {
          create: [
            {
              menuOptionId: 'opt-1',
              quantity: 1,
              name: 'Extra cheese',
              priceCents: 200,
            },
          ],
        },
      },
    ]);
  });
});

describe('cart mutations', () => {
  test('updateCartLineQuantity removes at zero', () => {
    expect(updateCartLineQuantity([sampleLine], 'line-1', 0)).toEqual([]);
  });

  test('removeCartLine drops matching id', () => {
    expect(removeCartLine([sampleLine], 'line-1')).toEqual([]);
  });
});
