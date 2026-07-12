import { afterEach, describe, expect, test } from 'bun:test';

import { API_BASE_URL, apiRequest, apiUrl, createApiClient, unwrapList } from '@/utils/api';
import { jsonResponse, withMockFetch } from '@/test/mock-fetch';

describe('apiUrl', () => {
  test('joins base URL and path', () => {
    expect(apiUrl('/api/menu')).toBe(`${API_BASE_URL}/api/menu`);
    expect(apiUrl('api/menu')).toBe(`${API_BASE_URL}/api/menu`);
  });
});

describe('unwrapList', () => {
  test('returns arrays as-is', () => {
    expect(unwrapList([1, 2])).toEqual([1, 2]);
  });

  test('unwraps known keys from objects', () => {
    expect(unwrapList({ data: ['a'] })).toEqual(['a']);
    expect(unwrapList({ items: [1] })).toEqual([1]);
    expect(unwrapList({ orders: [2] }, ['orders'])).toEqual([2]);
  });

  test('returns empty array for missing keys', () => {
    expect(unwrapList({})).toEqual([]);
    expect(unwrapList(null)).toEqual([]);
    expect(unwrapList(undefined)).toEqual([]);
  });
});

describe('apiRequest', () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  test('sends Authorization header and returns parsed JSON', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((_input, init) => {
      capturedInit = init;
      return jsonResponse({ ok: true });
    });

    const result = await apiRequest<{ ok: boolean }>('token-123', '/api/test');

    expect(result).toEqual({ ok: true });
    expect(capturedInit?.headers).toMatchObject({
      Authorization: 'Bearer token-123',
    });
    expect(capturedInit?.headers).not.toHaveProperty('Content-Type');
  });

  test('throws Nitro statusMessage when present', async () => {
    restore = withMockFetch(() =>
      jsonResponse({ statusMessage: 'Table not found' }, 404)
    );

    await expect(apiRequest('token', '/api/tables/1')).rejects.toThrow('Table not found');
  });

  test('falls back to HTTP status when body has no message', async () => {
    restore = withMockFetch(() => new Response('bad gateway', { status: 502 }));

    await expect(apiRequest('token', '/api/menu')).rejects.toThrow('Request failed (502)');
  });

  test('passes method and body through', async () => {
    let capturedInit: RequestInit | undefined;

    restore = withMockFetch((_input, init) => {
      capturedInit = init;
      return jsonResponse({ id: 'order-1' });
    });

    await apiRequest('token', '/api/orders', {
      method: 'POST',
      body: JSON.stringify({ items: [] }),
    });

    expect(capturedInit?.method).toBe('POST');
    expect(capturedInit?.body).toBe(JSON.stringify({ items: [] }));
    expect(capturedInit?.headers).toMatchObject({
      'Content-Type': 'application/json',
    });
  });
});

describe('createApiClient', () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  test('fetches token and delegates to apiRequest', async () => {
    restore = withMockFetch(() => jsonResponse({ ok: true }));

    const api = createApiClient(async () => 'session-jwt');
    const result = await api<{ ok: boolean }>('/api/test');

    expect(result).toEqual({ ok: true });
  });

  test('throws when getToken returns null', async () => {
    const api = createApiClient(async () => null);

    await expect(api('/api/test')).rejects.toThrow('Sign in again to continue.');
  });
});
