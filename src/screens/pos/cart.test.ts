import { describe, expect, test } from 'bun:test';

import {
  addCartLine,
  areCartLinesMergeable,
  buildOrderItemCreates,
  cartItemCount,
  cartLineMergeKey,
  cartTotalCents,
  decreaseCartLineQuantity,
  findCartLine,
  increaseCartLineQuantity,
  lineTotalCents,
  quantityForMenuItem,
  removeCartLine,
  removeCartLineByVariant,
  updateCartLineQuantity,
  clearCart,
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

  test('omits specialInstructions and orderItemOptions when empty', () => {
    const plain: CartLine = {
      id: 'line-plain',
      menuItemId: 'menu-2',
      itemName: 'Fries',
      unitPriceCents: 500,
      quantity: 1,
      specialInstructions: null,
      options: [],
    };

    expect(buildOrderItemCreates([plain])).toEqual([
      {
        menuItemId: 'menu-2',
        itemName: 'Fries',
        unitPriceCents: 500,
        quantity: 1,
      },
    ]);
  });

  test('always includes itemName and unitPriceCents required by Prisma', () => {
    const [item] = buildOrderItemCreates([
      {
        id: 'line-x',
        menuItemId: 'm9',
        itemName: 'Soup',
        unitPriceCents: 900,
        quantity: 3,
        specialInstructions: null,
        options: [],
      },
    ]);

    expect(item).toMatchObject({
      menuItemId: 'm9',
      itemName: 'Soup',
      unitPriceCents: 900,
      quantity: 3,
    });
    expect(item).not.toHaveProperty('specialInstructions');
    expect(item).not.toHaveProperty('orderItemOptions');
  });

  test('maps multiple lines including mixed options', () => {
    const withOptions = sampleLine;
    const without: CartLine = {
      id: 'line-2',
      menuItemId: 'menu-2',
      itemName: 'Water',
      unitPriceCents: 0,
      quantity: 2,
      specialInstructions: null,
      options: [],
    };

    const payload = buildOrderItemCreates([withOptions, without]);
    expect(payload).toHaveLength(2);
    expect(payload[0]?.orderItemOptions?.create).toHaveLength(1);
    expect(payload[1]).toEqual({
      menuItemId: 'menu-2',
      itemName: 'Water',
      unitPriceCents: 0,
      quantity: 2,
    });
  });
});

describe('cart mutations', () => {
  test('updateCartLineQuantity removes at zero', () => {
    expect(updateCartLineQuantity([sampleLine], 'line-1', 0)).toEqual([]);
  });

  test('removeCartLine drops matching id', () => {
    expect(removeCartLine([sampleLine], 'line-1')).toEqual([]);
  });

  test('clearCart returns an empty ticket', () => {
    expect(clearCart()).toEqual([]);
  });
});

describe('addCartLine', () => {
  const plainBurger: CartLine = {
    id: 'line-a',
    menuItemId: 'menu-burger',
    itemName: 'Burger',
    unitPriceCents: 1200,
    quantity: 1,
    specialInstructions: null,
    options: [],
  };

  test('merges identical items without options into one line', () => {
    const incoming = { ...plainBurger, id: 'line-b', quantity: 2 };
    const result = addCartLine([plainBurger], incoming);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('line-a');
    expect(result[0]?.quantity).toBe(3);
  });

  test('keeps separate lines when menu options differ', () => {
    const withCheese: CartLine = {
      ...plainBurger,
      id: 'line-cheese',
      options: [{ menuOptionId: 'opt-cheese', name: 'Cheese', priceCents: 100, quantity: 1 }],
    };
    const withoutCheese = { ...plainBurger, id: 'line-plain', quantity: 1 };

    const result = addCartLine([withCheese], withoutCheese);

    expect(result).toHaveLength(2);
    expect(result.map((line) => line.id)).toEqual(['line-cheese', 'line-plain']);
  });

  test('merges when option selections match even if option order differs', () => {
    const lineOne: CartLine = {
      ...plainBurger,
      id: 'line-1',
      quantity: 1,
      options: [
        { menuOptionId: 'opt-bacon', name: 'Bacon', priceCents: 200, quantity: 1 },
        { menuOptionId: 'opt-cheese', name: 'Cheese', priceCents: 100, quantity: 2 },
      ],
    };
    const lineTwo: CartLine = {
      ...plainBurger,
      id: 'line-2',
      quantity: 2,
      options: [
        { menuOptionId: 'opt-cheese', name: 'Cheese', priceCents: 100, quantity: 2 },
        { menuOptionId: 'opt-bacon', name: 'Bacon', priceCents: 200, quantity: 1 },
      ],
    };

    const result = addCartLine([lineOne], lineTwo);

    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(3);
  });

  test('keeps separate lines when option quantities differ', () => {
    const oneCheese: CartLine = {
      ...plainBurger,
      id: 'line-1',
      options: [{ menuOptionId: 'opt-cheese', name: 'Cheese', priceCents: 100, quantity: 1 }],
    };
    const twoCheese: CartLine = {
      ...plainBurger,
      id: 'line-2',
      options: [{ menuOptionId: 'opt-cheese', name: 'Cheese', priceCents: 100, quantity: 2 }],
    };

    const result = addCartLine([oneCheese], twoCheese);

    expect(result).toHaveLength(2);
  });

  test('keeps separate lines when special instructions differ', () => {
    const noOnions: CartLine = {
      ...plainBurger,
      id: 'line-1',
      specialInstructions: 'No onions',
    };
    const plain = { ...plainBurger, id: 'line-2' };

    const result = addCartLine([noOnions], plain);

    expect(result).toHaveLength(2);
  });

  test('merges lines with matching special instructions', () => {
    const first: CartLine = {
      ...plainBurger,
      id: 'line-1',
      quantity: 1,
      specialInstructions: 'Extra crispy',
    };
    const second: CartLine = {
      ...plainBurger,
      id: 'line-2',
      quantity: 2,
      specialInstructions: 'Extra crispy',
    };

    const result = addCartLine([first], second);

    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(3);
  });
});

describe('cartLineMergeKey', () => {
  test('treats null and empty instructions the same for matching', () => {
    const withNull = cartLineMergeKey({
      menuItemId: 'm1',
      specialInstructions: null,
      options: [],
    });
    const withEmpty = cartLineMergeKey({
      menuItemId: 'm1',
      specialInstructions: '',
      options: [],
    });

    expect(withNull).toBe(withEmpty);
  });

  test('areCartLinesMergeable reflects merge key equality', () => {
    const a: CartLine = { ...sampleLine, id: 'a' };
    const b: CartLine = { ...sampleLine, id: 'b', quantity: 5 };

    expect(areCartLinesMergeable(a, b)).toBe(true);
  });
});

describe('findCartLine / quantityForMenuItem', () => {
  const plainBurger: CartLine = {
    id: 'line-a',
    menuItemId: 'menu-burger',
    itemName: 'Burger',
    unitPriceCents: 1200,
    quantity: 2,
    specialInstructions: null,
    options: [],
  };

  const burgerWithCheese: CartLine = {
    ...plainBurger,
    id: 'line-b',
    quantity: 1,
    options: [{ menuOptionId: 'opt-cheese', name: 'Cheese', priceCents: 100, quantity: 1 }],
  };

  test('findCartLine matches by variant, not id', () => {
    const probe = { ...plainBurger, id: 'other', quantity: 99 };
    expect(findCartLine([plainBurger, burgerWithCheese], probe)).toEqual(plainBurger);
  });

  test('quantityForMenuItem sums all variants of the same menu item', () => {
    expect(quantityForMenuItem([plainBurger, burgerWithCheese], 'menu-burger')).toBe(3);
    expect(quantityForMenuItem([plainBurger], 'menu-missing')).toBe(0);
  });
});

describe('variant-based quantity changes', () => {
  const line: CartLine = {
    id: 'line-1',
    menuItemId: 'menu-1',
    itemName: 'Pasta',
    unitPriceCents: 1000,
    quantity: 2,
    specialInstructions: null,
    options: [],
  };

  test('increaseCartLineQuantity bumps the matching variant', () => {
    const probe = { ...line, id: 'probe' };
    const next = increaseCartLineQuantity([line], probe);
    expect(next[0]?.quantity).toBe(3);
  });

  test('decreaseCartLineQuantity drops the row at quantity 1', () => {
    const single = { ...line, quantity: 1 };
    const probe = { ...single, id: 'probe' };
    expect(decreaseCartLineQuantity([single], probe)).toEqual([]);
  });

  test('decreaseCartLineQuantity decrements above 1', () => {
    const probe = { ...line, id: 'probe' };
    const next = decreaseCartLineQuantity([line], probe);
    expect(next[0]?.quantity).toBe(1);
  });

  test('removeCartLineByVariant removes only the matching variant', () => {
    const other: CartLine = {
      ...line,
      id: 'line-2',
      specialInstructions: 'No salt',
    };
    const probe = { ...line, id: 'probe' };
    expect(removeCartLineByVariant([line, other], probe)).toEqual([other]);
  });

  test('increaseCartLineQuantity is a no-op when variant is missing', () => {
    const probe = { ...line, menuItemId: 'missing' };
    expect(increaseCartLineQuantity([line], probe)).toEqual([line]);
  });
});
