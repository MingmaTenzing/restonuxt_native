import type { Order } from '@/screens/orders/types';
import type { SessionCheckout } from '@/screens/sessions/types';
import type { ApiClient } from '@/utils/api';

import { buildSessionReceiptEscPos, buildTakeawayReceiptEscPos } from './escpos';
import { parsePrinterTarget } from './printer-ip';

export type PrintReceiptTarget =
  | { kind: 'table'; sessionId: string }
  | { kind: 'takeaway'; orderId: string };

export type PrintReceiptResult = {
  ok: boolean;
  id: string;
  kind: PrintReceiptTarget['kind'];
  printerTarget: string;
  itemCount: number;
  totalCents: number;
};

export type SendEscPos = (host: string, port: number, bytes: Uint8Array) => Promise<void>;

async function fetchCheckoutOrder(api: ApiClient, orderId: string) {
  try {
    const payload = await api<Record<string, unknown>>(`/api/orders/${orderId}`);
    return (payload.order ?? payload.data ?? payload) as Order;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      throw new Error('This order no longer exists.');
    }
    throw error;
  }
}

async function sendReceipt(
  send: SendEscPos,
  target: ReturnType<typeof parsePrinterTarget>,
  bytes: Uint8Array
) {
  try {
    await send(target.host, target.port, bytes);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : `Printer not connected at ${target.target}`;
    throw new Error(message);
  }
}

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
  await sendReceipt(send, target, bytes);

  return {
    ok: true,
    id: checkout.id,
    kind: 'table',
    printerTarget: target.target,
    itemCount,
    totalCents,
  };
}

/**
 * Print a takeaway order receipt from this device to a LAN thermal printer.
 */
export async function printTakeawayReceipt(
  api: ApiClient,
  orderId: string,
  printerIp: string,
  send: SendEscPos
): Promise<PrintReceiptResult> {
  const target = parsePrinterTarget(printerIp);
  const order = await fetchCheckoutOrder(api, orderId);
  const { bytes, itemCount, totalCents } = buildTakeawayReceiptEscPos(order);
  await sendReceipt(send, target, bytes);

  return {
    ok: true,
    id: order.id,
    kind: 'takeaway',
    printerTarget: target.target,
    itemCount,
    totalCents,
  };
}

export async function printReceipt(
  api: ApiClient,
  receipt: PrintReceiptTarget,
  printerIp: string,
  send: SendEscPos
): Promise<PrintReceiptResult> {
  if (receipt.kind === 'table') {
    return printSessionReceipt(api, receipt.sessionId, printerIp, send);
  }
  return printTakeawayReceipt(api, receipt.orderId, printerIp, send);
}
