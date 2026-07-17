import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { PaymentBadge, StatusBadge } from '@/screens/orders/order-badges';
import { countItems } from '@/screens/orders/order-stats';
import type { PaymentMethod } from '@/screens/orders/types';
import { ReceiptPrintPanel } from '@/screens/receipt/receipt-print-panel';
import { formatMoney } from '@/utils/format-money';

import type { SessionCheckout, TableSession } from './types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD_TERMINAL', label: 'Card terminal' },
  { value: 'STRIPE_QR', label: 'Stripe QR' },
];

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface SessionDetailModalProps {
  visible: boolean;
  session: TableSession | null;
  checkout: SessionCheckout | null;
  isLoadingCheckout: boolean;
  onClose: () => void;
  onCloseSession: (paymentMethod: PaymentMethod) => void;
  isClosing: boolean;
  errorMessage: string | null;
}

export function SessionDetailModal({
  visible,
  session,
  checkout,
  isLoadingCheckout,
  onClose,
  onCloseSession,
  isClosing,
  errorMessage,
}: SessionDetailModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  useEffect(() => {
    if (!visible) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Re-seed local draft fields when the sheet opens. */
    setPaymentMethod('CASH');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, session?.id]);

  if (!session) return null;

  const tableNumber = session.table?.number ?? '—';
  const orders = checkout?.orders ?? session.orders ?? [];
  const summary = checkout?.summary;
  const isActive = session.status === 'ACTIVE' || session.status === 'CHECKOUT_PENDING';
  const canClose =
    isActive &&
    summary &&
    (summary.payableOrderIds.length > 0 || (!summary.hasOutstandingBalance && summary.orderCount === 0));
  const hasUnpaidOrders = (summary?.payableOrderIds.length ?? 0) > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border/70 px-5 pb-4 pt-6">
          <Pressable onPress={onClose} hitSlop={12} disabled={isClosing}>
            <Text className="text-base font-medium text-primary">
              Close
            </Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">
            Session details
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-5 py-5"
          keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">
              Table {tableNumber}
            </Text>
            <Text selectable className="text-sm text-muted-foreground">
              Status {session.status.replace(/_/g, ' ')} · Opened {formatDateTime(session.openedAt)}
            </Text>
            {session.closedAt ? (
              <Text selectable className="text-sm text-muted-foreground">
                Closed {formatDateTime(session.closedAt)}
              </Text>
            ) : null}
          </View>

          <ReceiptPrintPanel sessionId={session.id} />

          {isLoadingCheckout ? (
            <Text className="text-base text-muted-foreground">
              Loading checkout summary...
            </Text>
          ) : summary ? (
            <View
              className="gap-3 rounded-3xl border border-border bg-card p-5"
              style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Summary
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">
                  Session total
                </Text>
                <Text className="text-base font-semibold text-foreground">
                  {formatMoney(summary.sessionTotalCents)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">
                  Outstanding
                </Text>
                <Text className="text-base font-semibold text-foreground">
                  {formatMoney(summary.payableTotalCents)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">
                  Paid
                </Text>
                <Text className="text-base font-semibold text-foreground">
                  {formatMoney(summary.paidTotalCents)}
                </Text>
              </View>
            </View>
          ) : null}

          <View className="gap-3">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Orders ({orders.length})
            </Text>
            {orders.length === 0 ? (
              <View
                className="rounded-2xl border border-border bg-card p-4"
                style={{ borderCurve: 'continuous' }}>
                <Text className="text-base leading-6 text-muted-foreground">
                  No orders on this session yet.
                </Text>
              </View>
            ) : (
              orders.map((order) => (
                <View
                  key={order.id}
                  className="gap-3 rounded-2xl border border-border bg-card p-4"
                  style={{ borderCurve: 'continuous' }}>
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 gap-1">
                      <Text className="text-base font-semibold text-foreground">
                        #{order.orderNo} · {order.customerName || 'Guest'}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {countItems(order)} {countItems(order) === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                    <Text className="text-base font-semibold text-foreground">
                      {formatMoney(order.totalAmountCents)}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    <StatusBadge status={order.status} />
                    <PaymentBadge status={order.paymentStatus} />
                  </View>
                </View>
              ))
            )}
          </View>

          {isActive && hasUnpaidOrders ? (
            <View className="gap-2">
              <Text className="px-1 text-sm font-medium text-muted-foreground">
                Payment method
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {PAYMENT_METHODS.map((option) => {
                  const isSelected = paymentMethod === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setPaymentMethod(option.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      className={`rounded-full px-4 py-2 ${
                        isSelected
                          ? 'bg-primary'
                          : 'border border-border bg-card'
                      }`}>
                      <Text
                        className={`text-sm font-semibold ${
                          isSelected
                            ? 'text-primary-foreground'
                            : 'text-neutral-600 dark:text-neutral-300'
                        }`}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {isActive && summary && summary.orderCount === 0 ? (
            <View
              className="rounded-2xl border border-amber-200/80 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/40"
              style={{ borderCurve: 'continuous' }}>
              <Text className="text-sm leading-5 text-amber-800 dark:text-amber-200">
                This session has no orders. Closing will free the table for new guests.
              </Text>
            </View>
          ) : null}

          {errorMessage ? (
            <Text selectable className="text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </Text>
          ) : null}

          {isActive ? (
            <View className="gap-3">
              <Button onPress={isClosing || !canClose ? undefined : () => onCloseSession(paymentMethod)}>
                {isClosing
                  ? 'Closing...'
                  : hasUnpaidOrders
                    ? `Mark paid & close (${formatMoney(summary?.payableTotalCents ?? 0)})`
                    : 'Close session'}
              </Button>
              {!canClose && !isLoadingCheckout ? (
                <Text className="text-center text-sm text-muted-foreground">
                  Unable to close this session right now.
                </Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
