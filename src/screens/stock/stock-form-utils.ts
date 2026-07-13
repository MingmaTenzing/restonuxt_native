import type { StockCategory, StockItemInput } from './types';

export type StockUpdateMode = 'add' | 'set';

export interface StockFormDraft {
  name: string;
  category: StockCategory;
  currentStock: string;
  unit: string;
  reorderLevel: string;
  reorderQuantity: string;
  supplier: string;
}

export type StockFormResult =
  | { ok: true; input: StockItemInput }
  | { ok: false; error: string };

export type StockLevelResult =
  | { ok: true; nextStock: number }
  | { ok: false; error: string };

export function parseStockNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateStockForm(draft: StockFormDraft): StockFormResult {
  const name = draft.name.trim();
  const unit = draft.unit.trim();
  const supplier = draft.supplier.trim();
  const currentStock = parseStockNumber(draft.currentStock);
  const reorderLevel = parseStockNumber(draft.reorderLevel);
  const reorderQuantity = parseStockNumber(draft.reorderQuantity);

  if (!name) return { ok: false, error: 'Name is required.' };
  if (!unit) return { ok: false, error: 'Unit is required (e.g. kg, liters, pieces).' };
  if (currentStock === null || currentStock < 0) {
    return { ok: false, error: 'Enter a valid starting stock.' };
  }
  if (reorderLevel === null || reorderLevel < 0) {
    return { ok: false, error: 'Enter a valid reorder level.' };
  }
  if (reorderQuantity === null || reorderQuantity <= 0) {
    return { ok: false, error: 'Reorder quantity must be greater than 0.' };
  }

  return {
    ok: true,
    input: {
      name,
      category: draft.category,
      currentStock,
      unit,
      reorderLevel,
      reorderQuantity,
      ...(supplier ? { supplier } : {}),
    },
  };
}

/** Compute the next on-hand level from add/set quantity input. */
export function resolveNextStockLevel(
  currentStock: number,
  quantityText: string,
  mode: StockUpdateMode
): StockLevelResult {
  const value = parseStockNumber(quantityText);
  if (value === null || value < 0) {
    return { ok: false, error: 'Enter a valid quantity.' };
  }

  const nextStock = mode === 'add' ? currentStock + value : value;
  if (nextStock < 0) {
    return { ok: false, error: 'Stock cannot go below zero.' };
  }

  return { ok: true, nextStock };
}
