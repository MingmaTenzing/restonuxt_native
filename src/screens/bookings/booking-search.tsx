import { Ionicons } from '@expo/vector-icons';
import { TextInput, View } from 'react-native';

import type { BookingFilter } from './booking-stats';
import { BookingFilterToggle } from './booking-stats-row';

export function BookingSearch({
  query,
  onQueryChange,
  filter,
  onFilterChange,
}: {
  query: string;
  onQueryChange: (text: string) => void;
  filter: BookingFilter;
  onFilterChange: (filter: BookingFilter) => void;
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
          placeholder="Search name, phone, or table"
          placeholderTextColor="#8E8E93"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
          className="flex-1 text-base text-foreground"
        />
      </View>

      <BookingFilterToggle value={filter} onChange={onFilterChange} />
    </View>
  );
}
