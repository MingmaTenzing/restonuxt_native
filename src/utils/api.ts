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
