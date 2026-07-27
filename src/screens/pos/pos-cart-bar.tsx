import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
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
  const { colors } = useTheme();

  if (itemCount === 0) return null;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={`View cart, ${itemCount} items, ${formatMoney(totalCents)}${
        destinationLabel ? `, table ${destinationLabel}` : ''
      }`}
      className="absolute bottom-24 left-5 right-5 overflow-hidden rounded-3xl bg-primary active:opacity-90"
      style={{
        borderCurve: 'continuous',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.28)',
        opacity: disabled ? 0.55 : 1,
      }}>
      <View className="flex-row items-center justify-between gap-4 px-5 py-4">
        <View className="flex-row items-center gap-3">
          <View className="relative">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15">
              {destinationLabel ? (
                <Text className="text-lg font-bold text-primary-foreground">
                  {destinationLabel}
                </Text>
              ) : (
                <Ionicons name="receipt" size={22} color={colors.primaryForeground} />
              )}
            </View>
            <View className="absolute -right-1.5 -top-1.5 min-w-6 items-center justify-center rounded-full bg-primary-foreground px-1.5 py-0.5">
              <Text className="text-[11px] font-bold text-primary">{itemCount}</Text>
            </View>
          </View>

          <View className="gap-0.5">
            <Text className="text-base font-bold text-primary-foreground">
              {destinationLabel ? `Table ${destinationLabel} ticket` : 'Order ticket'}
            </Text>
            <Text className="text-sm font-medium text-primary-foreground/75">
              Tap to review · {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2 rounded-2xl bg-primary-foreground/15 px-3 py-2">
          <Text className="text-lg font-bold tracking-tight text-primary-foreground">
            {formatMoney(totalCents)}
          </Text>
          <Ionicons name="chevron-up" size={18} color={colors.primaryForeground} />
        </View>
      </View>
    </Pressable>
  );
}
