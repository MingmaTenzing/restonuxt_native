import { Image, Pressable, Switch, Text, useColorScheme, View } from 'react-native';

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
  const isDark = useColorScheme() === 'dark';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${item.name}`}
      className="flex-row items-center gap-4 rounded-3xl border border-border bg-card p-4 active:opacity-70 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          className={`h-16 w-16 rounded-2xl ${item.isAvailable ? '' : 'opacity-40'}`}
        />
      ) : (
        <View
          className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary-dark/15"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-xl font-bold text-primary dark:text-primary-dark">
            {item.name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="flex-1 gap-1">
        <Text
          numberOfLines={1}
          className={`text-base font-semibold ${
            item.isAvailable
              ? 'text-foreground dark:text-foreground-dark'
              : 'text-muted-foreground dark:text-muted-foreground-dark'
          }`}>
          {item.name}
        </Text>
        {item.description ? (
          <Text
            numberOfLines={1}
            className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {item.description}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold tracking-tight text-primary dark:text-primary-dark">
            {formatMoney(item.priceCents)}
          </Text>
          {optionCount > 0 ? (
            <Text className="text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
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
        trackColor={{
          false: isDark ? '#52525B' : '#D4D4D8',
          true: isDark ? '#E4E4E7' : '#18181B',
        }}
      />
    </Pressable>
  );
}
