/** Web cannot open raw TCP sockets to LAN printers from the browser. */
export function sendEscPosToPrinter(_host: string, _port: number, _bytes: Uint8Array) {
  return Promise.reject(
    new Error('Thermal printing only works in the iOS/Android app on the same Wi‑Fi as the printer.')
  );
}
