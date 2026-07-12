import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { PosTable } from './types';

interface PosTablePickerProps {
  tables: PosTable[];
  selectedTableId: string | null;
  onSelect: (tableId: string) => void;
  isOpeningSession: boolean;
  openingTableId: string | null;
  onOpenSession: (tableId: string) => void;
}

export function PosTablePicker({
  tables,
  selectedTableId,
  onSelect,
  isOpeningSession,
  openingTableId,
  onOpenSession,
}: PosTablePickerProps) {
  if (tables.length === 0) {
    return (
      <View
        className="rounded-2xl border border-border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
        style={{ borderCurve: 'continuous' }}>
        <Text className="text-base text-muted-foreground dark:text-muted-foreground-dark">
          No tables configured yet.
        </Text>
      </View>
    );
  }

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;

  return (
    <View className="gap-3">
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground-dark">
        Table
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2">
        {tables.map((table) => {
          const isSelected = table.id === selectedTableId;
          const hasSession = !!table.activeSessionId;
          return (
            <Pressable
              key={table.id}
              onPress={() => onSelect(table.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className={`min-w-[72px] items-center gap-1 rounded-2xl border px-4 py-3 ${
                isSelected
                  ? 'border-amber-600 bg-amber-500/15 dark:border-amber-400 dark:bg-amber-400/10'
                  : 'border-border bg-card dark:border-border-dark dark:bg-card-dark'
              }`}
              style={{ borderCurve: 'continuous' }}>
              <Text
                className={`text-lg font-bold ${
                  isSelected
                    ? 'text-amber-800 dark:text-amber-200'
                    : 'text-foreground dark:text-foreground-dark'
                }`}>
                {table.number}
              </Text>
              <Text
                className={`text-xs font-medium ${
                  hasSession
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground dark:text-muted-foreground-dark'
                }`}>
                {hasSession ? 'Open' : 'Free'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedTable && !selectedTable.activeSessionId ? (
        <View
          className="flex-row items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/40"
          style={{ borderCurve: 'continuous' }}>
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Table {selectedTable.number} needs a session
            </Text>
            <Text className="text-sm leading-5 text-amber-800 dark:text-amber-200">
              Open the table before sending orders to the kitchen.
            </Text>
          </View>
          <Pressable
            onPress={() => onOpenSession(selectedTable.id)}
            disabled={isOpeningSession}
            accessibilityRole="button"
            className="flex-row items-center gap-1.5 rounded-full bg-amber-700 px-4 py-2 active:opacity-80 dark:bg-amber-500"
            style={{ borderCurve: 'continuous' }}>
            <Ionicons name="restaurant" size={14} color="#FFFBEB" />
            <Text className="text-sm font-semibold text-amber-50">
              {isOpeningSession && openingTableId === selectedTable.id ? 'Opening...' : 'Open'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
