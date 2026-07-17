/** Matches Nitro `POST /api/print-receipt/{session_id}` body validation. */
export function isValidPrinterIp(value: string) {
  return /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(value.trim());
}

export function normalizePrinterIp(value: string) {
  return value.trim();
}

export type PrinterTarget = {
  host: string;
  port: number;
  /** `host:port` used in UI / result payloads */
  target: string;
};

/** Parse `192.168.1.50` or `192.168.1.50:9100` into a LAN printer target. */
export function parsePrinterTarget(value: string): PrinterTarget {
  const normalized = normalizePrinterIp(value);
  if (!isValidPrinterIp(normalized)) {
    throw new Error('Use an IPv4 address, optionally with a port (e.g. 192.168.1.50:9100).');
  }

  const [host, portText] = normalized.split(':');
  const port = portText ? Number(portText) : 9100;
  if (!host || !Number.isFinite(port) || port <= 0 || port > 65535) {
    throw new Error('Invalid printer IP or port.');
  }

  return {
    host,
    port,
    target: `${host}:${port}`,
  };
}
