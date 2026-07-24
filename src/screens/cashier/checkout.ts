import type { Order, OrderItem, PaymentMethod } from '@/screens/orders/types';
import type { SessionCheckoutSummary } from '@/screens/sessions/types';

export type CashOrCard = Extract<PaymentMethod, 'CASH' | 'CARD_TERMINAL'>;

export function parseTenderedCents(value: string) {
  const trimmed = value.trim();
  // Cash tender fields must never accept negatives (a leading "-" would otherwise
  // be stripped by the digit filter and become a positive amount).
  if (!trimmed || trimmed.includes('-')) return 0;
  const cleaned = trimmed.replace(/[^0-9.]/g, '');
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

export type CheckoutPaymentPresentation = 'hidden' | 'sidebar' | 'sheet';

/** Whether the checkout screen should expose payment UI at all. */
export function shouldShowCheckoutPayment({
  isLoading,
  isError,
  orderCount,
}: {
  isLoading: boolean;
  isError: boolean;
  orderCount: number;
}) {
  return !isLoading && !isError && orderCount > 0;
}

/**
 * Mobile uses a floating balance bar + page-sheet popup.
 * Tablet keeps the payment panel in a sidebar.
 */
export function getCheckoutPaymentPresentation({
  isTablet,
  showPayment,
}: {
  isTablet: boolean;
  showPayment: boolean;
}): CheckoutPaymentPresentation {
  if (!showPayment) return 'hidden';
  return isTablet ? 'sidebar' : 'sheet';
}

/** Extra bottom padding so the floating balance bar does not cover receipt content. */
export function getCheckoutScrollBottomPadding({
  isTablet,
  safeBottom,
}: {
  isTablet: boolean;
  safeBottom: number;
}) {
  // Mobile balance bar is taller (amount + Collect payment CTA).
  return isTablet ? 24 : safeBottom + 168;
}

export function formatCheckoutPayableLabel({
  kind,
  payableOrderCount,
  totalItems,
  isPaid = false,
  paidOrderCount = 0,
}: {
  kind: 'table' | 'takeaway';
  payableOrderCount: number;
  totalItems: number;
  isPaid?: boolean;
  paidOrderCount?: number;
}) {
  if (isPaid) {
    if (kind === 'table') {
      return `${paidOrderCount} ${paidOrderCount === 1 ? 'order' : 'orders'} collected`;
    }
    return `${totalItems} ${totalItems === 1 ? 'item' : 'items'} paid`;
  }

  if (kind === 'table') {
    return `${payableOrderCount} payable ${payableOrderCount === 1 ? 'order' : 'orders'}`;
  }
  return `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;
}

/** Panel / chip eyebrow for unpaid vs paid checkout. */
export function checkoutAmountEyebrow(isPaid: boolean) {
  return isPaid ? 'Collected' : 'Balance due';
}

/** Summary strip label for the primary money chip. */
export function checkoutSummaryAmountLabel(isPaid: boolean) {
  return isPaid ? 'Collected' : 'Due now';
}

/** Simulates tapping a quick-cash chip (+10 / +20 / …) on the tender field. */
export function applyQuickCashAmount(currentTenderedCents: number, dollars: number) {
  return formatTenderedInput(Math.max(0, currentTenderedCents) + dollars * 100);
}

/**
 * Full cash-desk decision for the current tender + method.
 * Used by the UI and covered by stress tests so payment gating stays consistent.
 */
export function resolveCheckoutTenderState({
  isPaid,
  amountDueCents,
  paymentMethod,
  tenderedInput,
}: {
  isPaid: boolean;
  amountDueCents: number;
  paymentMethod: CashOrCard;
  tenderedInput: string;
}) {
  const tenderedCents = parseTenderedCents(tenderedInput);
  const changeDueCents = getChangeDueCents(paymentMethod, tenderedCents, amountDueCents);
  const canPay = canAcceptCheckoutPayment({
    isPaid,
    amountDueCents,
    paymentMethod,
    tenderedCents,
  });

  return { tenderedCents, changeDueCents, canPay };
}
