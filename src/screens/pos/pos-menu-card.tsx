import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View, type ViewStyle } from 'react-native';

import { formatMoney } from '@/utils/format-money';

import type { PosMenuItem } from './types';

interface PosMenuCardProps {
  item: PosMenuItem;
  onPress: () => void;
  width?: number;
  style?: ViewStyle;
}

export function PosMenuCard({ item, onPress, width, style }: PosMenuCardProps) {
  const optionCount = item.options?.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Add ${item.name}`}
      className="gap-3 rounded-3xl border border-border bg-card p-4 active:opacity-75"
      style={{
        width,
        borderCurve: 'continuous',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
        ...style,
      }}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} className="h-24 w-full rounded-2xl" />
      ) : (
        <View
          className="h-24 items-center justify-center rounded-2xl bg-primary/10"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-3xl font-bold text-primary">
            {item.name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="gap-1">
        <Text
          numberOfLines={2}
          className="min-h-[40px] text-base font-semibold leading-5 text-foreground">
          {item.name}
        </Text>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-base font-bold tracking-tight text-foreground">
            {formatMoney(item.priceCents)}
          </Text>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Ionicons name="add" size={18} color="#FAFAFA" />
          </View>
        </View>
        {optionCount > 0 ? (
          <Text className="text-xs font-medium text-muted-foreground">
            {optionCount} {optionCount === 1 ? 'option' : 'options'}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
