import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import type { OrderRange } from './types';

const RANGE_OPTIONS: { value: OrderRange; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All' },
];

export function OrderSearch({
  query,
  onQueryChange,
  range,
  onRangeChange,
}: {
  query: string;
  onQueryChange: (text: string) => void;
  range: OrderRange;
  onRangeChange: (range: OrderRange) => void;
}) {
  return (
    <View className="gap-3">
      <View
        className="flex-row items-center gap-2.5 rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
        style={{ borderCurve: 'continuous' }}>
        <Ionicons name="search" size={18} color="#8898AA" />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search name or order #"
          placeholderTextColor="#8898AA"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
          className="flex-1 text-base text-neutral-900 dark:text-neutral-50"
        />
      </View>

      <View
        className="flex-row gap-1 rounded-full bg-neutral-200/70 p-1 dark:bg-neutral-800/70"
        style={{ borderCurve: 'continuous' }}>
        {RANGE_OPTIONS.map((option) => {
          const isActive = option.value === range;
          return (
            <Pressable
              key={option.value}
              onPress={() => onRangeChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={`flex-1 items-center rounded-full px-3 py-2 ${
                isActive ? 'bg-white dark:bg-neutral-700' : ''
              }`}
              style={{ borderCurve: 'continuous' }}>
              <Text
                className={`text-sm font-semibold ${
                  isActive
                    ? 'text-neutral-900 dark:text-neutral-50'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
