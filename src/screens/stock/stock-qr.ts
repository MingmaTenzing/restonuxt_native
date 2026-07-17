import { API_BASE_URL } from '@/utils/api';

const STOCK_UPDATE_PATH = /\/(?:dashboard\/)?stock\/update\/([^/?#]+)/i;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** QR payload for printed labels — matches the RestoQuick dashboard update route. */
export function buildStockQrValue(stockId: string, baseUrl = API_BASE_URL) {
  const root = baseUrl.replace(/\/$/, '');
  return `${root}/dashboard/stock/update/${stockId}`;
}

/** Extract a stock item id from a scanned QR code or deep link. */
export function parseStockIdFromScan(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const pathMatch = value.match(STOCK_UPDATE_PATH);
  if (pathMatch?.[1]) return pathMatch[1];

  if (UUID_PATTERN.test(value)) return value;

  try {
    const url = new URL(value);
    const urlMatch = url.pathname.match(STOCK_UPDATE_PATH);
    if (urlMatch?.[1]) return urlMatch[1];
  } catch {
    // Not a URL — fall through.
  }

  return null;
}
