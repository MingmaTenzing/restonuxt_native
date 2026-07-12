// Base URL for the RestoQuick API. Set EXPO_PUBLIC_API_BASE_URL in .env.
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  throw new Error('Add EXPO_PUBLIC_API_BASE_URL to the .env file');
}

export const API_BASE_URL = BASE_URL;

/** Build a full API URL from a path, e.g. apiUrl('/api/orders'). */
export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Authenticated fetch with Nitro error messages. API responses use camelCase per RESTOQUICK_DOC.md. */
export async function apiRequest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errorBody = (await response.json()) as { statusMessage?: string; message?: string };
      const detail = errorBody.statusMessage ?? errorBody.message;
      if (detail) message = detail;
    } catch {
      // Keep generic message when the body is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

/** Unwrap list endpoints that return a raw array or `{ data | orders | ... }`. */
export function unwrapList<T>(
  payload: unknown,
  keys: string[] = ['data', 'orders', 'sessions', 'tables', 'menu', 'items']
): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }

  return [];
}
