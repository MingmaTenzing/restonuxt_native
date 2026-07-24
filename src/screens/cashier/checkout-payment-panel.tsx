import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import type { PaymentMethod } from '@/screens/orders/types';
import type { PrintReceiptTarget } from '@/screens/receipt/api';
import { ReceiptPrintPanel } from '@/screens/receipt/receipt-print-panel';
import { formatMoney } from '@/utils/format-money';

import { checkoutAmountEyebrow } from './checkout';

const QUICK_AMOUNTS = [10, 20, 50, 100];

const METHODS: {
  value: Extract<PaymentMethod, 'CASH' | 'CARD_TERMINAL'>;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'CASH', label: 'Cash', icon: 'cash-outline' },
  { value: 'CARD_TERMINAL', label: 'Card', icon: 'card-outline' },
];

interface CheckoutPaymentPanelProps {
  amountDueCents: number;
  payableLabel: string;
  paymentMethod: Extract<PaymentMethod, 'CASH' | 'CARD_TERMINAL'>;
  onPaymentMethodChange: (method: Extract<PaymentMethod, 'CASH' | 'CARD_TERMINAL'>) => void;
  tenderedDollars: string;
  onTenderedChange: (value: string) => void;
  onAddQuickAmount: (dollars: number) => void;
  onSetExactAmount: () => void;
  changeDueCents: number;
  canPay: boolean;
  isSubmitting: boolean;
  isPaid: boolean;
  errorMessage: string | null;
  onSubmit: () => void;
  onUndoPaid?: () => void;
  isUndoingPaid?: boolean;
  printTarget: PrintReceiptTarget;
  controlsScrollable?: boolean;
  fillHeight?: boolean;
  variant?: 'card' | 'sheet';
}

export type { CheckoutPaymentPanelProps };

function AmountHeader({
  amountDueCents,
  payableLabel,
  isPaid,
}: {
  amountDueCents: number;
  payableLabel: string;
  isPaid: boolean;
}) {
  return (
    <View className={`gap-4 px-5 py-5 ${isPaid ? 'bg-emerald-950' : 'bg-neutral-950'}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text
            className={`text-xs font-semibold uppercase tracking-[0.2em] ${
              isPaid ? 'text-emerald-300/80' : 'text-neutral-400'
            }`}>
            {checkoutAmountEyebrow(isPaid)}
          </Text>
          <Text className="text-4xl font-bold tracking-tight text-white">
            {formatMoney(amountDueCents)}
          </Text>
          <Text className={`text-sm ${isPaid ? 'text-emerald-100/70' : 'text-neutral-400'}`}>
            {payableLabel}
          </Text>
        </View>
        <View
          className={`h-11 w-11 items-center justify-center rounded-2xl ${
            isPaid ? 'bg-emerald-400/20' : 'bg-white/10'
          }`}>
          <Ionicons
            name={isPaid ? 'checkmark-circle' : 'wallet-outline'}
            size={22}
            color={isPaid ? '#6EE7B7' : '#FAFAFA'}
          />
        </View>
      </View>
    </View>
  );
}

export function CheckoutPaymentPanel({
  amountDueCents,
  payableLabel,
  paymentMethod,
  onPaymentMethodChange,
  tenderedDollars,
  onTenderedChange,
  onAddQuickAmount,
  onSetExactAmount,
  changeDueCents,
  canPay,
  isSubmitting,
  isPaid,
  errorMessage,
  onSubmit,
  onUndoPaid,
  isUndoingPaid = false,
  printTarget,
  controlsScrollable = false,
  fillHeight = false,
  variant = 'card',
}: CheckoutPaymentPanelProps) {
  const isDark = useColorScheme() === 'dark';

  const controls = (
    <View className="gap-5 px-5 pb-5 pt-5">
      {isPaid ? (
        <View className="gap-5">
          <ReceiptPrintPanel target={printTarget} embedded />

          {errorMessage ? (
            <View
              className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40"
              style={{ borderCurve: 'continuous' }}>
              <Text selectable className="text-sm text-red-700 dark:text-red-300">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {onUndoPaid ? (
            <View className="gap-2 border-t border-border pt-4">
              <Pressable
                onPress={isUndoingPaid ? undefined : onUndoPaid}
                disabled={isUndoingPaid}
                accessibilityRole="button"
                accessibilityLabel="Undo payment"
                className={`flex-row items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3.5 ${
                  isUndoingPaid ? 'bg-muted opacity-70' : 'bg-background active:opacity-80'
                }`}
                style={{ borderCurve: 'continuous' }}>
                <Ionicons
                  name={isUndoingPaid ? 'hourglass-outline' : 'arrow-undo-outline'}
                  size={18}
                  color={isDark ? '#E4E4E7' : '#18181B'}
                />
                <Text className="text-sm font-semibold text-foreground">
                  {isUndoingPaid ? 'Undoing…' : 'Undo payment'}
                </Text>
              </Pressable>
              <Text className="text-center text-xs leading-4 text-muted-foreground">
                Only if this sale was closed by mistake.
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <>
          <ReceiptPrintPanel target={printTarget} compact />

          <View className="gap-2">
            <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment method
            </Text>
            <View className="flex-row gap-1 rounded-2xl bg-muted p-1">
              {METHODS.map((method) => {
                const isSelected = paymentMethod === method.value;
                return (
                  <Pressable
                    key={method.value}
                    onPress={() => onPaymentMethodChange(method.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 py-3 ${
                      isSelected ? 'bg-card dark:bg-accent' : ''
                    }`}
                    style={{
                      borderCurve: 'continuous',
                      boxShadow: isSelected ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                    }}>
                    <Ionicons
                      name={method.icon}
                      size={18}
                      color={isSelected ? (isDark ? '#E4E4E7' : '#18181B') : '#71717A'}
                    />
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                      {method.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {paymentMethod === 'CASH' ? (
            <View className="gap-4">
              <View className="gap-2">
                <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tendered amount
                </Text>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={tenderedDollars}
                    onChangeText={onTenderedChange}
                    placeholder="0.00"
                    placeholderTextColor="#8E8E93"
                    keyboardType="decimal-pad"
                    className="flex-1 rounded-2xl border border-border bg-background px-4 py-3.5 text-2xl font-bold tabular-nums text-foreground"
                    style={{ borderCurve: 'continuous' }}
                  />
                  <Pressable
                    onPress={onSetExactAmount}
                    accessibilityRole="button"
                    className="rounded-2xl border border-border bg-background px-4 py-3.5"
                    style={{ borderCurve: 'continuous' }}>
                    <Text className="text-sm font-semibold text-foreground">Exact</Text>
                  </Pressable>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <Pressable
                    key={amount}
                    onPress={() => onAddQuickAmount(amount)}
                    accessibilityRole="button"
                    className="min-w-[72px] flex-1 items-center rounded-2xl border border-border bg-background py-2.5 active:opacity-70"
                    style={{ borderCurve: 'continuous' }}>
                    <Text className="text-sm font-semibold text-foreground">+{amount}</Text>
                  </Pressable>
                ))}
              </View>

              <View
                className="bg-muted/50 flex-row items-center justify-between rounded-2xl border border-border px-4 py-4"
                style={{ borderCurve: 'continuous' }}>
                <Text className="text-sm font-medium text-muted-foreground">Change due</Text>
                <Text
                  className={`text-2xl font-bold tabular-nums ${
                    changeDueCents > 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-foreground'
                  }`}>
                  {formatMoney(changeDueCents)}
                </Text>
              </View>
            </View>
          ) : (
            <View
              className="bg-muted/50 flex-row items-start gap-3 rounded-2xl border border-border px-4 py-4"
              style={{ borderCurve: 'continuous' }}>
              <View className="bg-primary/10 mt-0.5 h-9 w-9 items-center justify-center rounded-xl">
                <Ionicons name="card-outline" size={18} color={isDark ? '#E4E4E7' : '#18181B'} />
              </View>
              <Text className="flex-1 text-sm leading-5 text-muted-foreground">
                Present the card terminal to the customer. Confirm payment on the device, then close
                the sale here.
              </Text>
            </View>
          )}

          {errorMessage ? (
            <View
              className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40"
              style={{ borderCurve: 'continuous' }}>
              <Text selectable className="text-sm text-red-700 dark:text-red-300">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <Button onPress={isSubmitting || !canPay ? undefined : onSubmit}>
            {isSubmitting
              ? 'Closing sale...'
              : canPay
                ? `Close sale · ${formatMoney(amountDueCents)}`
                : paymentMethod === 'CASH'
                  ? 'Enter tendered amount'
                  : 'Nothing to collect'}
          </Button>
        </>
      )}
    </View>
  );

  return (
    <View
      className={`overflow-hidden bg-card ${
        variant === 'sheet'
          ? 'flex-1 rounded-3xl border border-border'
          : `rounded-3xl border border-border ${fillHeight ? 'flex-1' : ''}`
      }`}
      style={
        variant === 'sheet'
          ? { borderCurve: 'continuous' }
          : { borderCurve: 'continuous', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)' }
      }>
      <AmountHeader
        amountDueCents={amountDueCents}
        payableLabel={payableLabel}
        isPaid={isPaid}
      />

      {controlsScrollable ? (
        <ScrollView
          style={fillHeight ? { flex: 1 } : { maxHeight: 320 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {controls}
        </ScrollView>
      ) : (
        controls
      )}
    </View>
  );
}
