import { Image, Pressable, Switch, Text, View } from 'react-native';

import { formatMoney } from '@/utils/format-money';

import type { MenuItem } from './types';

interface MenuItemCardProps {
  item: MenuItem;
  onPress: () => void;
  onToggleAvailability: (isAvailable: boolean) => void;
  isToggling: boolean;
}

export function MenuItemCard({
  item,
  onPress,
  onToggleAvailability,
  isToggling,
}: MenuItemCardProps) {
  const optionCount = item.options?.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${item.name}`}
      className="flex-row items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-4 active:opacity-70 dark:border-neutral-800 dark:bg-neutral-900"
      style={{ borderCurve: 'continuous' }}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          className={`h-16 w-16 rounded-2xl ${item.isAvailable ? '' : 'opacity-40'}`}
          style={{ borderCurve: 'continuous' }}
        />
      ) : (
        <View
          className="h-16 w-16 items-center justify-center rounded-2xl bg-accent/10"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-xl font-bold text-accent dark:text-accent-dark">
            {item.name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="flex-1 gap-1">
        <Text
          numberOfLines={1}
          className={`text-base font-semibold ${
            item.isAvailable
              ? 'text-neutral-900 dark:text-neutral-50'
              : 'text-neutral-400 dark:text-neutral-500'
          }`}>
          {item.name}
        </Text>
        {item.description ? (
          <Text numberOfLines={1} className="text-sm text-neutral-500 dark:text-neutral-400">
            {item.description}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold tracking-tight text-accent dark:text-accent-dark">
            {formatMoney(item.priceCents)}
          </Text>
          {optionCount > 0 ? (
            <Text className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
              {optionCount} {optionCount === 1 ? 'option' : 'options'}
            </Text>
          ) : null}
        </View>
      </View>

      <Switch
        accessibilityLabel={`${item.name} availability`}
        value={item.isAvailable}
        disabled={isToggling}
        onValueChange={onToggleAvailability}
        thumbColor="#ffffff"
        trackColor={{ false: '#C9D2DC', true: '#635BFF' }}
      />
    </Pressable>
  );
}
