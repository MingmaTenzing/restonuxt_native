import { describe, expect, test } from 'bun:test';

import { buildCreateMenuItemBody, centsToPriceText, parsePriceCents } from './menu-form-utils';

describe('centsToPriceText', () => {
  test('formats whole dollars', () => {
    expect(centsToPriceText(1200)).toBe('12.00');
  });

  test('formats cents with two decimals', () => {
    expect(centsToPriceText(105)).toBe('1.05');
  });

  test('formats zero', () => {
    expect(centsToPriceText(0)).toBe('0.00');
  });
});

describe('parsePriceCents', () => {
  test('parses dollar text into cents', () => {
    expect(parsePriceCents('12.50')).toBe(1250);
  });

  test('strips currency symbols and letters', () => {
    expect(parsePriceCents('$8.99')).toBe(899);
  });

  test('rounds to nearest cent', () => {
    expect(parsePriceCents('1.006')).toBe(101);
  });

  test('accepts zero', () => {
    expect(parsePriceCents('0')).toBe(0);
  });

  test('treats empty input as zero cents', () => {
    expect(parsePriceCents('')).toBe(0);
  });

  test('treats letters-only input as zero cents', () => {
    expect(parsePriceCents('abc')).toBe(0);
  });

  test('strips minus signs before parsing', () => {
    expect(parsePriceCents('-5')).toBe(500);
  });
});

describe('buildCreateMenuItemBody', () => {
  test('builds Prisma nested-create shape', () => {
    expect(
      buildCreateMenuItemBody({
        name: 'Burger',
        category: 'MAINS',
        priceCents: 1500,
        description: 'Classic',
        imageUrl: 'https://example.com/burger.jpg',
        isAvailable: true,
        options: [{ name: 'Cheese', priceCents: 100 }],
      })
    ).toEqual({
      name: 'Burger',
      category: 'MAINS',
      priceCents: 1500,
      description: 'Classic',
      imageUrl: 'https://example.com/burger.jpg',
      isAvailable: true,
      options: {
        create: [{ name: 'Cheese', priceCents: 100 }],
      },
    });
  });

  test('defaults optional fields', () => {
    expect(
      buildCreateMenuItemBody({
        name: 'Fries',
        category: 'SIDES',
        priceCents: 500,
      })
    ).toEqual({
      name: 'Fries',
      category: 'SIDES',
      priceCents: 500,
      description: '',
      imageUrl: '',
      isAvailable: true,
      options: {
        create: [],
      },
    });
  });
});
