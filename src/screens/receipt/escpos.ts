import type { Order, OrderItem } from '@/screens/orders/types';
import type { SessionCheckout } from '@/screens/sessions/types';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const ITEM_COLUMN_WIDTH = 24;
const LINE_WIDTH = 42;

function encodeAscii(text: string) {
  // Match Nuxt `removeSpecialCharacters` — keep printable ASCII only.
  const cleaned = text.replace(/[^\x20-\x7E]/g, '?');
  const bytes = new Uint8Array(cleaned.length);
  for (let i = 0; i < cleaned.length; i++) {
    bytes[i] = cleaned.charCodeAt(i);
  }
  return bytes;
}

function concatBytes(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function cmd(...values: number[]) {
  return new Uint8Array(values);
}

function textLine(text: string) {
  return concatBytes([encodeAscii(text), cmd(LF)]);
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function padColumns(name: string, qty: string, amount: string) {
  const clipped = name.padEnd(ITEM_COLUMN_WIDTH).slice(0, ITEM_COLUMN_WIDTH);
  return `${clipped}${qty.padStart(3)}${amount.padStart(9)}`;
}

function optionName(option: NonNullable<OrderItem['orderItemOptions']>[number]) {
  return option.name?.trim() || 'Option';
}

export type PrintableReceiptItem = {
  name: string;
  qty: number;
  amountCents: number;
  options: { name: string; qty: number; priceCents: number }[];
};

export function collectPrintableItems(orders: Order[]): PrintableReceiptItem[] {
  return orders.flatMap((order) =>
    (order.items ?? []).map((item) => ({
      name: item.itemName,
      qty: item.quantity,
      amountCents: item.unitPriceCents * item.quantity,
      options: (item.orderItemOptions ?? []).map((option) => ({
        name: optionName(option),
        qty: option.quantity,
        priceCents: option.priceCents,
      })),
    }))
  );
}

export function sessionTotalCents(orders: Order[]) {
  return orders.reduce((sum, order) => sum + order.totalAmountCents, 0);
}

function buildReceiptEscPos({
  subtitle,
  metaLines,
  orders,
}: {
  subtitle: string;
  metaLines: string[];
  orders: Order[];
}) {
  const items = collectPrintableItems(orders);
  const totalCents = sessionTotalCents(orders);
  const chunks: Uint8Array[] = [];

  const push = (...parts: Uint8Array[]) => {
    chunks.push(...parts);
  };

  // Initialize
  push(cmd(ESC, 0x40));

  // Center header
  push(cmd(ESC, 0x61, 1));
  push(cmd(ESC, 0x45, 1));
  push(textLine('RESTO QUICK'));
  push(cmd(ESC, 0x45, 0));
  push(textLine(subtitle));
  push(cmd(LF));

  // Left meta
  push(cmd(ESC, 0x61, 0));
  push(textLine('='.repeat(LINE_WIDTH)));
  for (const line of metaLines) {
    push(textLine(line));
  }
  push(textLine('='.repeat(LINE_WIDTH)));

  push(cmd(ESC, 0x45, 1));
  push(textLine(padColumns('Item', 'Qty', 'Amount')));
  push(cmd(ESC, 0x45, 0));

  for (const item of items) {
    push(cmd(ESC, 0x45, 1));
    push(textLine(padColumns(item.name, String(item.qty), formatMoney(item.amountCents))));
    push(cmd(ESC, 0x45, 0));

    for (const option of item.options) {
      push(
        textLine(
          padColumns(
            `  + ${option.name}`,
            String(option.qty),
            formatMoney(option.priceCents)
          )
        )
      );
    }
  }

  push(textLine('='.repeat(LINE_WIDTH)));
  push(cmd(ESC, 0x61, 2));
  push(cmd(ESC, 0x45, 1));
  push(textLine(`TOTAL:         ${formatMoney(totalCents)}`));
  push(cmd(ESC, 0x45, 0));

  push(cmd(LF));
  push(cmd(ESC, 0x61, 1));
  push(textLine('Thank you for dining with us!'));
  push(textLine('Visit again :)'));
  push(cmd(LF));
  push(cmd(LF));

  // Partial cut
  push(cmd(GS, 0x56, 0x41, 0x03));

  return {
    bytes: concatBytes(chunks),
    itemCount: items.length,
    totalCents,
  };
}

/** Build ESC/POS bytes for a table-session receipt (80mm Epson-compatible). */
export function buildSessionReceiptEscPos(checkout: SessionCheckout) {
  const orders = checkout.orders ?? [];
  const tableNumber = checkout.table?.number ?? '—';

  return buildReceiptEscPos({
    subtitle: 'Table Session Receipt',
    metaLines: [
      `Receipt No: ${checkout.id}`,
      `Date: ${new Date().toLocaleString()}`,
      `Table: ${tableNumber}`,
      `Status: ${checkout.status}`,
    ],
    orders,
  });
}

/** Build ESC/POS bytes for a takeaway order receipt (matches Nuxt cashier takeaway print). */
export function buildTakeawayReceiptEscPos(order: Order) {
  return buildReceiptEscPos({
    subtitle: 'Takeaway Receipt',
    metaLines: [
      `Order: #${order.orderNo}`,
      `Customer: ${order.customerName?.trim() || 'Walk-in'}`,
      `Date: ${new Date(order.createdAt).toLocaleString()}`,
      `Status: ${order.paymentStatus}`,
    ],
    orders: [order],
  });
}
