import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { PaymentBadge, StatusBadge } from '@/screens/orders/order-badges';
import { countItems } from '@/screens/orders/order-stats';
import type { PaymentMethod } from '@/screens/orders/types';
import { formatMoney } from '@/utils/format-money';

import type { CashierTarget } from './types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD_TERMINAL', label: 'Card terminal' },
  { value: 'STRIPE_QR', label: 'Stripe QR' },
];

interface CashierCheckoutSheetProps {
  visible: boolean;
  target: CashierTarget | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: PaymentMethod) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export function CashierCheckoutSheet({
  visible,
  target,
  isLoading,
  onClose,
  onConfirm,
  isSubmitting,
  errorMessage,
}: CashierCheckoutSheetProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  useEffect(() => {
    if (!visible) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Re-seed local draft fields when the sheet opens. */
    setPaymentMethod('CASH');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, target]);

  if (!target) return null;

  const isTable = target.mode === 'TABLE';
  const title = isTable
    ? `Table ${target.checkout.table?.number ?? '—'}`
    : `Takeaway #${target.order.orderNo}`;
  const amountCents = isTable
    ? target.checkout.summary.payableTotalCents
    : target.order.totalAmountCents;
  const orders = isTable ? target.checkout.orders : [target.order];
  const canPay = amountCents > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-row items-center justify-between border-b border-neutral-200/70 px-5 pb-4 pt-6 dark:border-border-dark">
          <Pressable onPress={onClose} hitSlop={12} disabled={isSubmitting}>
            <Text className="text-base font-medium text-primary dark:text-primary-dark">Close</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Checkout
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-5 py-5"
          keyboardShouldPersistTaps="handled">
          <View
            className="gap-2 rounded-3xl border border-emerald-200/70 bg-emerald-50 px-5 py-5 dark:border-emerald-900/50 dark:bg-emerald-950/30"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              Amount due
            </Text>
            <Text className="text-4xl font-bold tracking-tight text-emerald-800 dark:text-emerald-200">
              {formatMoney(amountCents)}
            </Text>
            <Text className="text-base font-medium text-emerald-900 dark:text-emerald-100">{title}</Text>
          </View>

          {isLoading ? (
            <Text className="text-base text-muted-foreground dark:text-muted-foreground-dark">
              Loading checkout details...
            </Text>
          ) : (
            <View className="gap-3">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground-dark">
                Orders ({orders.length})
              </Text>
              {orders.map((order) => (
                <View
                  key={order.id}
                  className="gap-3 rounded-2xl border border-border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
                  style={{ borderCurve: 'continuous' }}>
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 gap-1">
                      <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                        #{order.orderNo} · {order.customerName || 'Guest'}
                      </Text>
                      <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                        {countItems(order)} {countItems(order) === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                    <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                      {formatMoney(order.totalAmountCents)}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    <StatusBadge status={order.status} />
                    <PaymentBadge status={order.paymentStatus} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {isTable && target.checkout.summary.paidTotalCents > 0 ? (
            <View className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 dark:border-border-dark dark:bg-card-dark">
              <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                Already paid this session
              </Text>
              <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                {formatMoney(target.checkout.summary.paidTotalCents)}
              </Text>
            </View>
          ) : null}

          <View className="gap-2">
            <Text className="px-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
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
                        ? 'bg-emerald-700 dark:bg-emerald-500'
                        : 'border border-border bg-card dark:border-border-dark dark:bg-card-dark'
                    }`}>
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-emerald-50' : 'text-neutral-600 dark:text-neutral-300'
                      }`}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {errorMessage ? (
            <Text selectable className="text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </Text>
          ) : null}

          <Button onPress={isSubmitting || !canPay || isLoading ? undefined : () => onConfirm(paymentMethod)}>
            {isSubmitting
              ? 'Processing...'
              : canPay
                ? `Mark paid · ${formatMoney(amountCents)}`
                : 'Nothing to collect'}
          </Button>

          {isTable && !canPay && !isLoading ? (
            <Text className="text-center text-sm text-muted-foreground dark:text-muted-foreground-dark">
              This session has no unpaid orders right now.
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
