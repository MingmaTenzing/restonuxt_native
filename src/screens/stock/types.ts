export type StockCategory = 'INGREDIENTS' | 'BEVERAGES' | 'SUPPLIES' | 'OTHER';

export type StockFilter = 'all' | 'low' | StockCategory;

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  reorderQuantity: number;
  supplier: string | null;
  lastRestocked: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockItemInput {
  name: string;
  category: StockCategory;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  reorderQuantity: number;
  supplier?: string;
}

export const STOCK_CATEGORIES: StockCategory[] = [
  'INGREDIENTS',
  'BEVERAGES',
  'SUPPLIES',
  'OTHER',
];

export const STOCK_CATEGORY_LABELS: Record<StockCategory, string> = {
  INGREDIENTS: 'Ingredients',
  BEVERAGES: 'Beverages',
  SUPPLIES: 'Supplies',
  OTHER: 'Other',
};
