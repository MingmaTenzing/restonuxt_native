import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { formatMoney } from '@/utils/format-money';

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

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        isPaid
          ? `Payment complete, ${formatMoney(amountDueCents)} collected`
          : `Collect payment, balance due ${formatMoney(amountDueCents)}`
      }
      className="absolute left-5 right-5 overflow-hidden rounded-3xl bg-neutral-950 active:opacity-90 dark:bg-card"
      style={{
        bottom: bottomInset + 16,
        borderCurve: 'continuous',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
      }}>
      <View className="flex-row items-center justify-between gap-4 px-5 py-4">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10 dark:bg-primary/15">
            <Ionicons
              name={isPaid ? 'checkmark-circle' : 'wallet-outline'}
              size={22}
              color={isPaid ? '#34D399' : isDark ? '#E4E4E7' : '#FAFAFA'}
            />
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-muted-foreground">
              {isPaid ? 'Paid' : 'Balance due'}
            </Text>
            <Text className="text-sm text-neutral-400 dark:text-muted-foreground" numberOfLines={1}>
              {payableLabel}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-bold tracking-tight text-white dark:text-foreground">
            {formatMoney(amountDueCents)}
          </Text>
          <Ionicons
            name="chevron-up"
            size={18}
            color={isDark ? '#E4E4E7' : '#FAFAFA'}
          />
        </View>
      </View>
    </Pressable>
  );
}
