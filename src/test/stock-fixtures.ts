import type { StockItem, StockItemInput } from '@/screens/stock/types';

let stockSeq = 0;

export function makeStockItem(overrides: Partial<StockItem> = {}): StockItem {
  stockSeq += 1;
  const id = overrides.id ?? `stock-${stockSeq}`;

  return {
    id,
    name: overrides.name ?? `Item ${stockSeq}`,
    category: overrides.category ?? 'INGREDIENTS',
    currentStock: overrides.currentStock ?? 10,
    unit: overrides.unit ?? 'kg',
    reorderLevel: overrides.reorderLevel ?? 5,
    reorderQuantity: overrides.reorderQuantity ?? 10,
    supplier: overrides.supplier === undefined ? 'Fresh Farms' : overrides.supplier,
    lastRestocked: overrides.lastRestocked ?? '2026-07-01T00:00:00.000Z',
    createdAt: overrides.createdAt ?? '2026-06-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-07-01T00:00:00.000Z',
  };
}

export function makeStockInput(overrides: Partial<StockItemInput> = {}): StockItemInput {
  return {
    name: overrides.name ?? 'Fresh basil',
    category: overrides.category ?? 'INGREDIENTS',
    currentStock: overrides.currentStock ?? 0,
    unit: overrides.unit ?? 'kg',
    reorderLevel: overrides.reorderLevel ?? 5,
    reorderQuantity: overrides.reorderQuantity ?? 10,
    ...(overrides.supplier !== undefined ? { supplier: overrides.supplier } : {}),
  };
}

/** Mixed inventory used across stock filter/stats tests. */
export function makeStockInventory(): StockItem[] {
  return [
    makeStockItem({
      id: 'tomatoes',
      name: 'Tomatoes',
      category: 'INGREDIENTS',
      currentStock: 4,
      reorderLevel: 5,
      unit: 'kg',
      supplier: 'Fresh Farms',
    }),
    makeStockItem({
      id: 'cola',
      name: 'Cola syrup',
      category: 'BEVERAGES',
      currentStock: 30,
      reorderLevel: 8,
      unit: 'liters',
      supplier: 'Beverage Co',
    }),
    makeStockItem({
      id: 'napkins',
      name: 'Napkins',
      category: 'SUPPLIES',
      currentStock: 2,
      reorderLevel: 20,
      unit: 'packs',
      supplier: null,
    }),
    makeStockItem({
      id: 'misc',
      name: 'Misc spice kit',
      category: 'OTHER',
      currentStock: 12,
      reorderLevel: 3,
      unit: 'boxes',
      supplier: 'Kitchen Depot',
    }),
  ];
}
