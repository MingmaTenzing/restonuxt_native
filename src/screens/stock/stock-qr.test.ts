import { describe, expect, test } from 'bun:test';

import { API_BASE_URL } from '@/utils/api';

import { buildStockQrValue, parseStockIdFromScan } from './stock-qr';

const stockId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
const altId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

describe('buildStockQrValue', () => {
  test('builds dashboard update URL', () => {
    expect(buildStockQrValue(stockId, 'https://example.com')).toBe(
      `https://example.com/dashboard/stock/update/${stockId}`
    );
  });

  test('strips trailing slash from base URL', () => {
    expect(buildStockQrValue(stockId, 'https://example.com/')).toBe(
      `https://example.com/dashboard/stock/update/${stockId}`
    );
  });

  test('defaults to API_BASE_URL', () => {
    expect(buildStockQrValue(stockId)).toBe(
      `${API_BASE_URL.replace(/\/$/, '')}/dashboard/stock/update/${stockId}`
    );
  });
});

describe('parseStockIdFromScan', () => {
  test('parses dashboard absolute URL', () => {
    expect(
      parseStockIdFromScan(`https://example.com/dashboard/stock/update/${stockId}`)
    ).toBe(stockId);
  });

  test('parses native stock absolute URL', () => {
    expect(parseStockIdFromScan(`https://app.example/stock/update/${altId}`)).toBe(altId);
  });

  test('parses relative dashboard path', () => {
    expect(parseStockIdFromScan(`/dashboard/stock/update/${stockId}`)).toBe(stockId);
  });

  test('parses relative native stock path', () => {
    expect(parseStockIdFromScan(`/stock/update/${stockId}`)).toBe(stockId);
  });

  test('ignores query string and hash', () => {
    expect(
      parseStockIdFromScan(
        `https://example.com/dashboard/stock/update/${stockId}?ref=label#top`
      )
    ).toBe(stockId);
  });

  test('is case-insensitive on path segments', () => {
    expect(
      parseStockIdFromScan(`https://example.com/Dashboard/Stock/Update/${stockId}`)
    ).toBe(stockId);
  });

  test('parses raw uuid', () => {
    expect(parseStockIdFromScan(stockId)).toBe(stockId);
  });

  test('trims whitespace around raw uuid', () => {
    expect(parseStockIdFromScan(`  ${stockId}  `)).toBe(stockId);
  });

  test('returns null for empty / whitespace', () => {
    expect(parseStockIdFromScan('')).toBeNull();
    expect(parseStockIdFromScan('   ')).toBeNull();
  });

  test('returns null for unrelated text', () => {
    expect(parseStockIdFromScan('hello-world')).toBeNull();
    expect(parseStockIdFromScan('https://example.com/menu')).toBeNull();
  });

  test('returns null for invalid uuid-shaped strings', () => {
    expect(parseStockIdFromScan('a1b2c3d4-e5f6-4789-c012-3456789abcde')).toBeNull(); // bad variant nibble
    expect(parseStockIdFromScan('not-a-uuid')).toBeNull();
  });

  test('does not treat table QR paths as stock ids', () => {
    expect(
      parseStockIdFromScan(`https://example.com/order/table/${stockId}`)
    ).toBeNull();
  });

  test('round-trips build → parse', () => {
    const qr = buildStockQrValue(stockId, 'https://resto.example');
    expect(parseStockIdFromScan(qr)).toBe(stockId);
  });
});
