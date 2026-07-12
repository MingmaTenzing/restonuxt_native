import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { formatMoney } from '@/utils/format-money';

interface PosCartBarProps {
  itemCount: number;
  totalCents: number;
  onPress: () => void;
  destinationLabel?: string | null;
  disabled?: boolean;
}

export function PosCartBar({
  itemCount,
  totalCents,
  onPress,
  destinationLabel = null,
  disabled,
}: PosCartBarProps) {
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#E4E4E7' : '#18181B';

  if (itemCount === 0) return null;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={`View cart, ${itemCount} items, ${formatMoney(totalCents)}${
        destinationLabel ? `, table ${destinationLabel}` : ''
      }`}
      className="absolute bottom-24 left-5 right-5 overflow-hidden rounded-3xl border border-border bg-card active:opacity-90"
      style={{
        borderCurve: 'continuous',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
      }}>
      <View className="h-1.5 bg-primary/15" />
      <View className="flex-row items-center justify-between gap-4 px-5 py-4">
        <View className="flex-row items-center gap-3">
          {destinationLabel ? (
            <View className="h-11 min-w-11 items-center justify-center rounded-2xl bg-primary px-2.5">
              <Text className="text-lg font-bold text-primary-foreground">
                {destinationLabel}
              </Text>
            </View>
          ) : (
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <Ionicons name="receipt-outline" size={22} color={iconColor} />
            </View>
          )}
          <View className="gap-0.5">
            <Text className="text-base font-semibold text-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
              {destinationLabel ? ` · Table ${destinationLabel}` : ''}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {destinationLabel ? 'Confirm table, then send' : 'Tap to review ticket'}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-bold tracking-tight text-foreground">
            {formatMoney(totalCents)}
          </Text>
          <Ionicons name="chevron-up" size={18} color={iconColor} />
        </View>
      </View>
    </Pressable>
  );
}
