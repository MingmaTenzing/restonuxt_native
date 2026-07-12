import { Pressable, Text, View } from 'react-native';

import { formatMoney } from '@/utils/format-money';

import { lineTotalCents } from './cart';
import type { CartLine } from './types';

interface PosCartLineRowProps {
  line: CartLine;
  onDecrement: () => void;
  onIncrement: () => void;
  onRemove: () => void;
}

export function PosCartLineRow({ line, onDecrement, onIncrement, onRemove }: PosCartLineRowProps) {
  return (
    <View
      className="gap-3 rounded-2xl border border-border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous' }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
            {line.itemName}
          </Text>
          {line.options.length > 0 ? (
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
              {line.options.map((option) => `${option.quantity}× ${option.name}`).join(', ')}
            </Text>
          ) : null}
          {line.specialInstructions ? (
            <Text className="text-sm italic text-muted-foreground dark:text-muted-foreground-dark">
              “{line.specialInstructions}”
            </Text>
          ) : null}
        </View>
        <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
          {formatMoney(lineTotalCents(line))}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onDecrement}
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center rounded-xl border border-border dark:border-border-dark">
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">−</Text>
          </Pressable>
          <Text className="min-w-6 text-center text-base font-semibold text-foreground dark:text-foreground-dark">
            {line.quantity}
          </Text>
          <Pressable
            onPress={onIncrement}
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center rounded-xl bg-primary dark:bg-primary-dark">
            <Text className="text-lg font-semibold text-primary-foreground dark:text-primary-foreground-dark">
              +
            </Text>
          </Pressable>
        </View>
        <Pressable onPress={onRemove} accessibilityRole="button">
          <Text className="text-sm font-semibold text-red-600 dark:text-red-400">Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}
