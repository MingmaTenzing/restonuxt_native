import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { formatMoney } from '@/utils/format-money';

import { checkoutBalanceBarActionLabel } from './checkout-undo';

interface CheckoutBalanceBarProps {
  amountDueCents: number;
  payableLabel: string;
  isPaid: boolean;
  onPress: () => void;
  bottomInset?: number;
}

export function CheckoutBalanceBar({
  amountDueCents,
  payableLabel,
  isPaid,
  onPress,
  bottomInset = 0,
}: CheckoutBalanceBarProps) {
  const isDark = useColorScheme() === 'dark';
  const actionLabel = checkoutBalanceBarActionLabel(isPaid);

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 px-4"
      style={{ bottom: bottomInset + 12 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={
          isPaid
            ? `Print receipt, ${formatMoney(amountDueCents)} collected`
            : `Collect payment, balance due ${formatMoney(amountDueCents)}`
        }
        className={`overflow-hidden rounded-[28px] border-2 active:opacity-92 ${
          isPaid
            ? 'border-emerald-500/40 bg-emerald-600 dark:bg-emerald-500'
            : 'border-amber-400/50 bg-neutral-950 dark:border-amber-400/40 dark:bg-amber-500'
        }`}
        style={{
          borderCurve: 'continuous',
          boxShadow: isPaid
            ? '0 16px 40px rgba(16, 185, 129, 0.35)'
            : '0 18px 44px rgba(0, 0, 0, 0.32)',
        }}>
        <View className="gap-3 px-4 pb-4 pt-3.5">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1 flex-row items-center gap-3">
              <View
                className={`h-12 w-12 items-center justify-center rounded-2xl ${
                  isPaid ? 'bg-white/20' : 'bg-amber-400 dark:bg-neutral-950/25'
                }`}
                style={{ borderCurve: 'continuous' }}>
                <Ionicons
                  name={isPaid ? 'print' : 'wallet'}
                  size={24}
                  color={isPaid ? '#ECFDF5' : isDark ? '#FAFAFA' : '#18181B'}
                />
              </View>
              <View className="min-w-0 flex-1 gap-0.5">
                <Text
                  className={`text-[11px] font-bold uppercase tracking-[0.22em] ${
                    isPaid
                      ? 'text-emerald-50/90'
                      : 'text-amber-300 dark:text-neutral-950/70'
                  }`}>
                  {isPaid ? 'Paid in full' : 'Balance due'}
                </Text>
                <Text
                  className={`text-3xl font-bold tracking-tight tabular-nums ${
                    isPaid ? 'text-white' : 'text-white dark:text-neutral-950'
                  }`}>
                  {formatMoney(amountDueCents)}
                </Text>
                <Text
                  className={`text-sm ${
                    isPaid
                      ? 'text-emerald-50/80'
                      : 'text-neutral-300 dark:text-neutral-950/70'
                  }`}
                  numberOfLines={1}>
                  {payableLabel}
                </Text>
              </View>
            </View>
          </View>

          <View
            className={`flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3.5 ${
              isPaid ? 'bg-white/20' : 'bg-amber-400 dark:bg-neutral-950'
            }`}
            style={{ borderCurve: 'continuous' }}>
            <Text
              className={`text-base font-bold ${
                isPaid
                  ? 'text-white'
                  : 'text-neutral-950 dark:text-amber-300'
              }`}>
              {actionLabel}
            </Text>
            <Ionicons
              name={isPaid ? 'print-outline' : 'arrow-up'}
              size={18}
              color={isPaid ? '#FFFFFF' : isDark ? '#FCD34D' : '#18181B'}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
}
