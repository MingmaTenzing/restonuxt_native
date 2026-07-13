import type { StockFilter, StockItem } from './types';

export interface StockStats {
  total: number;
  lowStock: number;
  healthy: number;
  categories: number;
}

export function isLowStock(item: StockItem) {
  return item.currentStock <= item.reorderLevel;
}

export function computeStockStats(items: StockItem[]): StockStats {
  const categories = new Set(items.map((item) => item.category));
  let lowStock = 0;

  for (const item of items) {
    if (isLowStock(item)) lowStock += 1;
  }

  return {
    total: items.length,
    lowStock,
    healthy: items.length - lowStock,
    categories: categories.size,
  };
}

export function filterStockItems(items: StockItem[], filter: StockFilter, query: string) {
  const q = query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.supplier ?? '').toLowerCase().includes(q) ||
      item.unit.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'low') return isLowStock(item);
    return item.category === filter;
  });
}

/** Visual fill ratio for stock level indicators (0–100). */
export function stockLevelPercent(item: StockItem) {
  const target = Math.max(item.reorderLevel * 2, item.reorderQuantity, 1);
  return Math.min(100, Math.round((item.currentStock / target) * 100));
}
