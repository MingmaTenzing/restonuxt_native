import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { formatMoney } from '@/utils/format-money';

interface PosCartBarProps {
  itemCount: number;
  totalCents: number;
  onPress: () => void;
  disabled?: boolean;
}

export function PosCartBar({ itemCount, totalCents, onPress, disabled }: PosCartBarProps) {
  if (itemCount === 0) return null;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={`View cart, ${itemCount} items, ${formatMoney(totalCents)}`}
      className="absolute bottom-24 left-5 right-5 overflow-hidden rounded-3xl border border-dashed border-amber-400/60 bg-card active:opacity-90 dark:border-amber-500/40 dark:bg-card-dark"
      style={{
        borderCurve: 'continuous',
        boxShadow: '0 12px 32px rgba(180, 83, 9, 0.18)',
      }}>
      <View className="h-1.5 bg-amber-500/20 dark:bg-amber-400/15" />
      <View className="flex-row items-center justify-between gap-4 px-5 py-4">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 dark:bg-amber-400/10">
            <Ionicons name="receipt-outline" size={22} color="#B45309" />
          </View>
          <View className="gap-0.5">
            <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
              Tap to review ticket
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
            {formatMoney(totalCents)}
          </Text>
          <Ionicons name="chevron-up" size={18} color="#B45309" />
        </View>
      </View>
    </Pressable>
  );
}
