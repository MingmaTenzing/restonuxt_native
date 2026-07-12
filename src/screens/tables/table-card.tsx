import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import type { Table } from './types';

interface TableCardProps {
  table: Table;
  onPress: () => void;
}

export function TableCard({ table, onPress }: TableCardProps) {
  const activeSessions = table.sessions?.length ?? 0;
  const isOccupied = activeSessions > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit table ${table.number}`}
      className="flex-row items-center gap-4 rounded-3xl border border-border bg-card p-4 active:opacity-70"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View
        className={`h-14 w-14 items-center justify-center rounded-2xl ${
          isOccupied
            ? 'bg-amber-500/15 dark:bg-amber-400/15'
            : 'bg-primary/10'
        }`}
        style={{ borderCurve: 'continuous' }}>
        <Text
          className={`text-lg font-bold ${
            isOccupied ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
          }`}>
          {table.number}
        </Text>
      </View>

      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-foreground">
          Table {table.number}
        </Text>
        <Text className="text-sm text-muted-foreground">
          Seats {table.capacity}
        </Text>
      </View>

      {isOccupied ? (
        <View className="flex-row items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 dark:bg-amber-400/10">
          <Ionicons name="people" size={14} color="#D97706" />
          <Text className="text-xs font-semibold text-amber-600 dark:text-amber-400">Active</Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 dark:bg-emerald-400/10">
          <Ionicons name="checkmark-circle" size={14} color="#059669" />
          <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Free</Text>
        </View>
      )}
    </Pressable>
  );
}
