import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';

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
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#E4E4E7' : '#18181B';

  if (tables.length === 0) {
    return (
      <View
        className="rounded-2xl border border-border bg-card p-4"
        style={{ borderCurve: 'continuous' }}>
        <Text className="text-base text-muted-foreground">
          No tables configured yet.
        </Text>
      </View>
    );
  }

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Choose table
        </Text>
        <Text className="text-sm text-muted-foreground">
          Orders go to the selected table — check this before sending.
        </Text>
      </View>

      {selectedTable ? (
        <View
          className="flex-row items-center gap-4 rounded-3xl border-2 border-primary bg-primary/5 px-5 py-4"
          style={{ borderCurve: 'continuous' }}>
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Text className="text-3xl font-bold text-primary-foreground">
              {selectedTable.number}
            </Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Sending to
            </Text>
            <Text className="text-3xl font-bold tracking-tight text-foreground">
              Table {selectedTable.number}
            </Text>
            <Text
              className={`text-sm font-semibold ${
                selectedTable.activeSessionId
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }`}>
              {selectedTable.activeSessionId
                ? 'Session open · ready for orders'
                : 'Session closed · open before sending'}
            </Text>
          </View>
          <Ionicons name="restaurant" size={28} color={iconColor} />
        </View>
      ) : (
        <View
          className="rounded-3xl border-2 border-dashed border-border bg-muted/60 px-5 py-4"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-base font-semibold text-foreground">
            No table selected
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Tap a table below before adding dishes.
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3">
        {tables.map((table) => {
          const isSelected = table.id === selectedTableId;
          const hasSession = !!table.activeSessionId;
          return (
            <Pressable
              key={table.id}
              onPress={() => onSelect(table.id)}
              accessibilityRole="button"
              accessibilityLabel={`Table ${table.number}, ${hasSession ? 'open' : 'free'}`}
              accessibilityState={{ selected: isSelected }}
              className={`min-w-[96px] items-center gap-1.5 rounded-3xl border-2 px-5 py-4 ${
                isSelected
                  ? 'border-primary bg-primary'
                  : 'border-border bg-card'
              }`}
              style={{
                borderCurve: 'continuous',
                boxShadow: isSelected ? '0 8px 20px rgba(0, 0, 0, 0.14)' : 'none',
              }}>
              <Text
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isSelected
                    ? 'text-primary-foreground/80'
                    : 'text-muted-foreground'
                }`}>
                Table
              </Text>
              <Text
                className={`text-4xl font-bold tracking-tight ${
                  isSelected
                    ? 'text-primary-foreground'
                    : 'text-foreground'
                }`}>
                {table.number}
              </Text>
              <View
                className={`rounded-full px-2.5 py-0.5 ${
                  isSelected
                    ? 'bg-primary-foreground/15'
                    : hasSession
                      ? 'bg-emerald-500/15 dark:bg-emerald-400/15'
                      : 'bg-muted'
                }`}>
                <Text
                  className={`text-xs font-bold ${
                    isSelected
                      ? 'text-primary-foreground'
                      : hasSession
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-muted-foreground'
                  }`}>
                  {hasSession ? 'OPEN' : 'FREE'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedTable && !selectedTable.activeSessionId ? (
        <View
          className="flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-muted px-4 py-3"
          style={{ borderCurve: 'continuous' }}>
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-semibold text-foreground">
              Table {selectedTable.number} needs a session
            </Text>
            <Text className="text-sm leading-5 text-muted-foreground">
              Open the table before sending orders to the kitchen.
            </Text>
          </View>
          <Pressable
            onPress={() => onOpenSession(selectedTable.id)}
            disabled={isOpeningSession}
            accessibilityRole="button"
            className="flex-row items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 active:opacity-80"
            style={{ borderCurve: 'continuous' }}>
            <Ionicons name="restaurant" size={16} color={isDark ? '#18181B' : '#FAFAFA'} />
            <Text className="text-sm font-semibold text-primary-foreground">
              {isOpeningSession && openingTableId === selectedTable.id ? 'Opening...' : 'Open'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
