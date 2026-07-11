import { API_BASE_URL } from '@/utils/api';

/** Build a WebSocket URL from the configured API base URL. */
export function websocketUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE_URL.replace(/^http/i, (scheme: string) =>
    scheme.toLowerCase() === 'https' ? 'wss' : 'ws'
  );
  return `${base}${normalizedPath}`;
}
