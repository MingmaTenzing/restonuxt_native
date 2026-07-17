import { Ionicons } from '@expo/vector-icons';
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
      className="gap-3 rounded-2xl border border-border bg-card p-4"
      style={{ borderCurve: 'continuous' }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-foreground">
            {line.itemName}
          </Text>
          {line.options.length > 0 ? (
            <Text className="text-sm text-muted-foreground">
              {line.options.map((option) => `${option.quantity}× ${option.name}`).join(', ')}
            </Text>
          ) : null}
          {line.specialInstructions ? (
            <Text className="text-sm italic text-muted-foreground">
              “{line.specialInstructions}”
            </Text>
          ) : null}
        </View>
        <Text className="text-base font-semibold text-foreground">
          {formatMoney(lineTotalCents(line))}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onDecrement}
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center rounded-xl border border-border">
            <Text className="text-lg font-semibold text-foreground">−</Text>
          </Pressable>
          <Text className="min-w-6 text-center text-base font-semibold text-foreground">
            {line.quantity}
          </Text>
          <Pressable
            onPress={onIncrement}
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <Text className="text-lg font-semibold text-foreground">+</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel="Remove item"
          hitSlop={4}
          className="h-9 w-9 items-center justify-center rounded-xl border border-border">
          <Ionicons name="trash-outline" size={18} color="#DC2626" />
        </Pressable>
      </View>
    </View>
  );
}
