import type { SessionCheckout } from '@/screens/sessions/types';
import type { ApiClient } from '@/utils/api';

import { buildSessionReceiptEscPos } from './escpos';
import { parsePrinterTarget } from './printer-ip';

export type PrintReceiptResult = {
  ok: boolean;
  sessionId: string;
  printerTarget: string;
  itemCount: number;
  totalCents: number;
};

export type SendEscPos = (host: string, port: number, bytes: Uint8Array) => Promise<void>;

/**
 * Print a table-session receipt from this device to a LAN thermal printer.
 * Session data is loaded from the API; ESC/POS bytes are sent over TCP to `printerIp`.
 */
export async function printSessionReceipt(
  api: ApiClient,
  sessionId: string,
  printerIp: string,
  send: SendEscPos
): Promise<PrintReceiptResult> {
  const target = parsePrinterTarget(printerIp);
  const checkout = await api<SessionCheckout>(`/api/orders/checkout/table/${sessionId}`);
  const { bytes, itemCount, totalCents } = buildSessionReceiptEscPos(checkout);

  try {
    await send(target.host, target.port, bytes);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : `Printer not connected at ${target.target}`;
    throw new Error(message);
  }

  return {
    ok: true,
    sessionId: checkout.id,
    printerTarget: target.target,
    itemCount,
    totalCents,
  };
}
