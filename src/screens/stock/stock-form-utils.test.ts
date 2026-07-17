import { describe, expect, test } from 'bun:test';

import {
  parseStockNumber,
  resolveNextStockLevel,
  validateStockForm,
  type StockFormDraft,
} from './stock-form-utils';

function draft(overrides: Partial<StockFormDraft> = {}): StockFormDraft {
  return {
    name: 'Fresh basil',
    category: 'INGREDIENTS',
    currentStock: '0',
    unit: 'kg',
    reorderLevel: '5',
    reorderQuantity: '10',
    supplier: '',
    ...overrides,
  };
}

describe('parseStockNumber', () => {
  test('parses integers and decimals', () => {
    expect(parseStockNumber('12')).toBe(12);
    expect(parseStockNumber('3.5')).toBe(3.5);
    expect(parseStockNumber(' 8 ')).toBe(8);
  });

  test('rejects empty and non-numeric values', () => {
    expect(parseStockNumber('')).toBeNull();
    expect(parseStockNumber('   ')).toBeNull();
    expect(parseStockNumber('abc')).toBeNull();
    expect(parseStockNumber('12kg')).toBeNull();
  });

  test('accepts zero', () => {
    expect(parseStockNumber('0')).toBe(0);
  });
});

describe('validateStockForm', () => {
  test('accepts a valid create payload', () => {
    const result = validateStockForm(
      draft({
        name: '  Olive oil  ',
        supplier: '  Oil Co  ',
        currentStock: '3',
        reorderLevel: '2',
        reorderQuantity: '6',
        unit: ' liters ',
        category: 'INGREDIENTS',
      })
    );

    expect(result).toEqual({
      ok: true,
      input: {
        name: 'Olive oil',
        category: 'INGREDIENTS',
        currentStock: 3,
        unit: 'liters',
        reorderLevel: 2,
        reorderQuantity: 6,
        supplier: 'Oil Co',
      },
    });
  });

  test('omits blank supplier', () => {
    const result = validateStockForm(draft({ supplier: '   ' }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.supplier).toBeUndefined();
    }
  });

  test('requires name', () => {
    expect(validateStockForm(draft({ name: '  ' }))).toEqual({
      ok: false,
      error: 'Name is required.',
    });
  });

  test('requires unit', () => {
    expect(validateStockForm(draft({ unit: '' }))).toEqual({
      ok: false,
      error: 'Unit is required (e.g. kg, liters, pieces).',
    });
  });

  test('rejects negative starting stock', () => {
    expect(validateStockForm(draft({ currentStock: '-1' }))).toEqual({
      ok: false,
      error: 'Enter a valid starting stock.',
    });
  });

  test('rejects invalid starting stock', () => {
    expect(validateStockForm(draft({ currentStock: 'nope' }))).toEqual({
      ok: false,
      error: 'Enter a valid starting stock.',
    });
  });

  test('rejects negative reorder level', () => {
    expect(validateStockForm(draft({ reorderLevel: '-2' }))).toEqual({
      ok: false,
      error: 'Enter a valid reorder level.',
    });
  });

  test('rejects zero reorder quantity', () => {
    expect(validateStockForm(draft({ reorderQuantity: '0' }))).toEqual({
      ok: false,
      error: 'Reorder quantity must be greater than 0.',
    });
  });

  test('rejects invalid reorder quantity', () => {
    expect(validateStockForm(draft({ reorderQuantity: '' }))).toEqual({
      ok: false,
      error: 'Reorder quantity must be greater than 0.',
    });
  });

  test('allows zero starting stock and zero reorder level', () => {
    const result = validateStockForm(draft({ currentStock: '0', reorderLevel: '0' }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.currentStock).toBe(0);
      expect(result.input.reorderLevel).toBe(0);
    }
  });
});

describe('resolveNextStockLevel', () => {
  test('adds quantity to current stock', () => {
    expect(resolveNextStockLevel(10, '5', 'add')).toEqual({ ok: true, nextStock: 15 });
  });

  test('sets absolute stock level', () => {
    expect(resolveNextStockLevel(10, '3', 'set')).toEqual({ ok: true, nextStock: 3 });
  });

  test('allows setting stock to zero', () => {
    expect(resolveNextStockLevel(10, '0', 'set')).toEqual({ ok: true, nextStock: 0 });
  });

  test('allows adding zero', () => {
    expect(resolveNextStockLevel(10, '0', 'add')).toEqual({ ok: true, nextStock: 10 });
  });

  test('rejects empty quantity', () => {
    expect(resolveNextStockLevel(10, '', 'add')).toEqual({
      ok: false,
      error: 'Enter a valid quantity.',
    });
  });

  test('rejects negative quantity text', () => {
    expect(resolveNextStockLevel(10, '-4', 'add')).toEqual({
      ok: false,
      error: 'Enter a valid quantity.',
    });
  });

  test('rejects non-numeric quantity', () => {
    expect(resolveNextStockLevel(10, 'abc', 'set')).toEqual({
      ok: false,
      error: 'Enter a valid quantity.',
    });
  });

  test('handles decimal restock amounts', () => {
    expect(resolveNextStockLevel(2.5, '1.25', 'add')).toEqual({ ok: true, nextStock: 3.75 });
  });
});
