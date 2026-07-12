import type { Order, OrderItem, PaymentMethod } from '@/screens/orders/types';
import type { SessionCheckoutSummary } from '@/screens/sessions/types';

export type CashOrCard = Extract<PaymentMethod, 'CASH' | 'CARD_TERMINAL'>;

export function parseTenderedCents(value: string) {
  const cleaned = value.trim().replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const dollars = Number.parseFloat(cleaned);
  if (!Number.isFinite(dollars) || dollars < 0) return 0;
  return Math.round(dollars * 100);
}

export function formatTenderedInput(cents: number) {
  return (cents / 100).toFixed(2);
}

export function getChangeDueCents(
  paymentMethod: CashOrCard,
  tenderedCents: number,
  amountDueCents: number
) {
  if (paymentMethod !== 'CASH') return 0;
  return Math.max(tenderedCents - amountDueCents, 0);
}

export function isTableCheckoutPaid(summary: SessionCheckoutSummary) {
  return summary.payableOrderCount === 0 && summary.orderCount > 0;
}

export function isTakeawayCheckoutPaid(order: Order) {
  return order.paymentStatus === 'PAID';
}

export function getTableCheckoutAmountDue(summary: SessionCheckoutSummary) {
  return summary.payableTotalCents;
}

export function getTakeawayCheckoutAmountDue(order: Order) {
  return order.totalAmountCents;
}

export function canAcceptCheckoutPayment({
  isPaid,
  amountDueCents,
  paymentMethod,
  tenderedCents,
}: {
  isPaid: boolean;
  amountDueCents: number;
  paymentMethod: CashOrCard;
  tenderedCents: number;
}) {
  if (isPaid) return false;
  if (amountDueCents <= 0) return false;
  if (paymentMethod === 'CARD_TERMINAL') return true;
  return tenderedCents >= amountDueCents;
}

export function orderItemLineTotalCents(item: OrderItem) {
  const optionsPerUnit = (item.orderItemOptions ?? []).reduce(
    (sum, option) => sum + (option.priceCents ?? 0) * (option.quantity ?? 1),
    0
  );
  return (item.unitPriceCents + optionsPerUnit) * (item.quantity ?? 1);
}
