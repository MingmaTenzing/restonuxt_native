import { describe, expect, test } from 'bun:test';

import { makeStockInventory, makeStockItem } from '@/test/stock-fixtures';

import {
  computeStockStats,
  filterStockItems,
  isLowStock,
  stockLevelPercent,
} from './stock-stats';

describe('isLowStock', () => {
  test('flags when currentStock is below reorder level', () => {
    expect(isLowStock(makeStockItem({ currentStock: 4, reorderLevel: 5 }))).toBe(true);
  });

  test('flags when currentStock equals reorder level', () => {
    expect(isLowStock(makeStockItem({ currentStock: 5, reorderLevel: 5 }))).toBe(true);
  });

  test('is healthy when currentStock is above reorder level', () => {
    expect(isLowStock(makeStockItem({ currentStock: 6, reorderLevel: 5 }))).toBe(false);
  });

  test('treats zero reorder level as low only at zero', () => {
    expect(isLowStock(makeStockItem({ currentStock: 0, reorderLevel: 0 }))).toBe(true);
    expect(isLowStock(makeStockItem({ currentStock: 1, reorderLevel: 0 }))).toBe(false);
  });
});

describe('computeStockStats', () => {
  test('returns zeros for empty inventory', () => {
    expect(computeStockStats([])).toEqual({
      total: 0,
      lowStock: 0,
      healthy: 0,
      categories: 0,
    });
  });

  test('counts totals, low stock, healthy, and unique categories', () => {
    const stats = computeStockStats(makeStockInventory());
    expect(stats.total).toBe(4);
    expect(stats.lowStock).toBe(2); // tomatoes + napkins
    expect(stats.healthy).toBe(2);
    expect(stats.categories).toBe(4);
  });

  test('does not double-count duplicate categories', () => {
    const stats = computeStockStats([
      makeStockItem({ id: 'a', category: 'INGREDIENTS', currentStock: 1, reorderLevel: 5 }),
      makeStockItem({ id: 'b', category: 'INGREDIENTS', currentStock: 20, reorderLevel: 5 }),
    ]);
    expect(stats.categories).toBe(1);
    expect(stats.lowStock).toBe(1);
    expect(stats.healthy).toBe(1);
  });

  test('all-low inventory reports zero healthy', () => {
    const stats = computeStockStats([
      makeStockItem({ id: 'a', currentStock: 0, reorderLevel: 1 }),
      makeStockItem({ id: 'b', currentStock: 1, reorderLevel: 2 }),
    ]);
    expect(stats.lowStock).toBe(2);
    expect(stats.healthy).toBe(0);
  });
});

describe('filterStockItems', () => {
  const items = makeStockInventory();

  test('returns all items for empty query and all filter', () => {
    expect(filterStockItems(items, 'all', '')).toHaveLength(4);
  });

  test('filters low stock', () => {
    expect(filterStockItems(items, 'low', '').map((item) => item.id)).toEqual([
      'tomatoes',
      'napkins',
    ]);
  });

  test('filters by category', () => {
    expect(filterStockItems(items, 'BEVERAGES', '').map((item) => item.id)).toEqual(['cola']);
    expect(filterStockItems(items, 'SUPPLIES', '').map((item) => item.id)).toEqual(['napkins']);
    expect(filterStockItems(items, 'OTHER', '').map((item) => item.id)).toEqual(['misc']);
    expect(filterStockItems(items, 'INGREDIENTS', '').map((item) => item.id)).toEqual([
      'tomatoes',
    ]);
  });

  test('searches by name case-insensitively', () => {
    expect(filterStockItems(items, 'all', 'COLA').map((item) => item.id)).toEqual(['cola']);
  });

  test('searches by supplier', () => {
    expect(filterStockItems(items, 'all', 'kitchen depot').map((item) => item.id)).toEqual([
      'misc',
    ]);
  });

  test('searches by unit', () => {
    expect(filterStockItems(items, 'all', 'packs').map((item) => item.id)).toEqual(['napkins']);
  });

  test('trims search query', () => {
    expect(filterStockItems(items, 'all', '  tomatoes  ').map((item) => item.id)).toEqual([
      'tomatoes',
    ]);
  });

  test('combines category filter with search', () => {
    expect(filterStockItems(items, 'INGREDIENTS', 'tom').map((item) => item.id)).toEqual([
      'tomatoes',
    ]);
    expect(filterStockItems(items, 'BEVERAGES', 'tom')).toHaveLength(0);
  });

  test('combines low filter with search', () => {
    expect(filterStockItems(items, 'low', 'nap').map((item) => item.id)).toEqual(['napkins']);
    expect(filterStockItems(items, 'low', 'cola')).toHaveLength(0);
  });

  test('handles null supplier without throwing', () => {
    expect(() => filterStockItems(items, 'all', 'fresh')).not.toThrow();
    expect(filterStockItems(items, 'all', 'fresh').map((item) => item.id)).toEqual(['tomatoes']);
  });

  test('returns empty for no matches', () => {
    expect(filterStockItems(items, 'all', 'zzzz')).toHaveLength(0);
  });
});

describe('stockLevelPercent', () => {
  test('uses max of reorderLevel*2 and reorderQuantity as target', () => {
    // target = max(5*2, 10, 1) = 10 → 5/10 = 50%
    expect(
      stockLevelPercent(
        makeStockItem({ currentStock: 5, reorderLevel: 5, reorderQuantity: 10 })
      )
    ).toBe(50);
  });

  test('prefers reorderLevel*2 when larger than reorderQuantity', () => {
    // target = max(10*2, 5, 1) = 20 → 10/20 = 50%
    expect(
      stockLevelPercent(
        makeStockItem({ currentStock: 10, reorderLevel: 10, reorderQuantity: 5 })
      )
    ).toBe(50);
  });

  test('caps at 100 when over target', () => {
    expect(
      stockLevelPercent(
        makeStockItem({ currentStock: 100, reorderLevel: 5, reorderQuantity: 10 })
      )
    ).toBe(100);
  });

  test('returns 0 when empty', () => {
    expect(
      stockLevelPercent(makeStockItem({ currentStock: 0, reorderLevel: 5, reorderQuantity: 10 }))
    ).toBe(0);
  });

  test('never divides by zero when levels are zero', () => {
    expect(
      stockLevelPercent(makeStockItem({ currentStock: 0, reorderLevel: 0, reorderQuantity: 0 }))
    ).toBe(0);
    expect(
      stockLevelPercent(makeStockItem({ currentStock: 1, reorderLevel: 0, reorderQuantity: 0 }))
    ).toBe(100);
  });

  test('rounds to nearest percent', () => {
    // target = 10 → 1/10 = 10%
    expect(
      stockLevelPercent(makeStockItem({ currentStock: 1, reorderLevel: 5, reorderQuantity: 10 }))
    ).toBe(10);
  });
});
