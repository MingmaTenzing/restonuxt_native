import { afterEach, describe, expect, test } from 'bun:test';

import { jsonResponse, withMockFetch } from '@/test/mock-fetch';
import { makeStockInput, makeStockItem } from '@/test/stock-fixtures';
import { testApiClient } from '@/test/test-api-client';
import { apiUrl } from '@/utils/api';

import {
  createStockItem,
  deleteStockItem,
  fetchStockItem,
  fetchStockItems,
  updateStockLevel,
} from './api';

describe('stock api', () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  test('fetchStockItems GETs /api/stock', async () => {
    const items = [makeStockItem({ id: 'a' }), makeStockItem({ id: 'b' })];

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/stock'));
      expect(init?.method ?? 'GET').toBe('GET');
      return jsonResponse(items);
    });

    const result = await fetchStockItems(testApiClient('stock-token'));
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('a');
  });

  test('fetchStockItem GETs /api/stock/{id}', async () => {
    const item = makeStockItem({ id: 'stock-9', name: 'Basil' });

    restore = withMockFetch((input) => {
      expect(String(input)).toBe(apiUrl('/api/stock/stock-9'));
      return jsonResponse(item);
    });

    const result = await fetchStockItem(testApiClient('token'), 'stock-9');
    expect(result.id).toBe('stock-9');
    expect(result.name).toBe('Basil');
  });

  test('createStockItem POSTs create body', async () => {
    const input = makeStockInput({
      name: 'Olive oil',
      category: 'INGREDIENTS',
      currentStock: 3,
      unit: 'liters',
      reorderLevel: 2,
      reorderQuantity: 6,
      supplier: 'Oil Co',
    });
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((inputUrl, init) => {
      expect(String(inputUrl)).toBe(apiUrl('/api/stock'));
      capturedInit = init;
      return jsonResponse(makeStockItem({ id: 'created-1', ...input, supplier: input.supplier ?? null }));
    });

    const created = await createStockItem(testApiClient('token'), input);

    expect(created.id).toBe('created-1');
    expect(capturedInit?.method).toBe('POST');
    expect(JSON.parse(String(capturedInit?.body))).toEqual(input);
  });

  test('createStockItem omits optional supplier when undefined', async () => {
    const input = makeStockInput();
    let capturedBody: unknown;

    restore = withMockFetch((_input, init) => {
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse(makeStockItem({ id: 'created-2' }));
    });

    await createStockItem(testApiClient('token'), input);
    expect(capturedBody).toEqual(input);
    expect((capturedBody as Record<string, unknown>).supplier).toBeUndefined();
  });

  test('updateStockLevel PUTs only currentStock', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/stock/stock-3'));
      capturedInit = init;
      return jsonResponse(makeStockItem({ id: 'stock-3', currentStock: 42 }));
    });

    const updated = await updateStockLevel(testApiClient('token'), 'stock-3', 42);

    expect(updated.currentStock).toBe(42);
    expect(capturedInit?.method).toBe('PUT');
    expect(JSON.parse(String(capturedInit?.body))).toEqual({ currentStock: 42 });
  });

  test('deleteStockItem DELETEs /api/stock/{id}', async () => {
    let capturedInit: RequestInit | undefined;
    const deleted = makeStockItem({ id: 'stock-gone' });

    restore = withMockFetch((input, init) => {
      expect(String(input)).toBe(apiUrl('/api/stock/stock-gone'));
      capturedInit = init;
      return jsonResponse(deleted);
    });

    const result = await deleteStockItem(testApiClient('token'), 'stock-gone');

    expect(result.id).toBe('stock-gone');
    expect(capturedInit?.method).toBe('DELETE');
  });

  test('propagates API error messages', async () => {
    restore = withMockFetch(() =>
      jsonResponse({ statusMessage: 'Stock item not found' }, 404)
    );

    await expect(fetchStockItem(testApiClient('token'), 'missing')).rejects.toThrow(
      'Stock item not found'
    );
  });

  test('propagates create failures', async () => {
    restore = withMockFetch(() => jsonResponse({ message: 'Name is required' }, 400));

    await expect(createStockItem(testApiClient('token'), makeStockInput())).rejects.toThrow(
      'Name is required'
    );
  });
});
