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
        className="flex-row items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3"
        style={{ borderCurve: 'continuous' }}>
        <Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search name or order #"
          placeholderTextColor="#8E8E93"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
          className="flex-1 text-base text-foreground"
        />
      </View>

      <View
        className="flex-row gap-1 rounded-full bg-muted p-1"
        style={{ borderCurve: 'continuous' }}>
        {RANGE_OPTIONS.map((option) => {
          const isActive = option.value === range;
          return (
            <Pressable
              key={option.value}
              onPress={() => onRangeChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={`flex-1 items-center rounded-full px-3 py-2 ${isActive ? 'bg-card' : ''}`}
              style={{
                borderCurve: 'continuous',
                boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.10)' : 'none',
              }}>
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
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
