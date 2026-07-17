import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, useColorScheme, View, type ViewStyle } from 'react-native';

import type { PosTable } from './types';

interface PosTableSelectProps {
  tables: PosTable[];
  onTablePress: (table: PosTable) => void;
  isOpeningSession: boolean;
  openingTableId: string | null;
  cardWidth?: number;
  gap?: number;
}

function TableSelectCard({
  table,
  onPress,
  isOpening,
  width,
  style,
}: {
  table: PosTable;
  onPress: () => void;
  isOpening: boolean;
  width?: number;
  style?: ViewStyle;
}) {
  const isDark = useColorScheme() === 'dark';
  const hasSession = !!table.activeSessionId;

  return (
    <Pressable
      onPress={isOpening ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={`Table ${table.number}, ${hasSession ? 'live session' : 'no session'}`}
      className={`min-h-[168px] justify-between overflow-hidden rounded-3xl border-2 bg-card p-5 active:opacity-85 ${
        hasSession ? 'border-emerald-500/60' : 'border-border'
      } ${isOpening ? 'opacity-70' : ''}`}
      style={{
        width,
        borderCurve: 'continuous',
        boxShadow: hasSession ? '0 8px 24px rgba(16, 185, 129, 0.12)' : '0 4px 16px rgba(0, 0, 0, 0.04)',
        ...style,
      }}>
      <View className="gap-4">
        <View
          className={`self-start rounded-2xl px-3 py-1.5 ${
            hasSession ? 'bg-emerald-500/15' : 'bg-muted'
          }`}>
          <Text
            className={`text-xs font-bold uppercase tracking-wider ${
              hasSession ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
            }`}>
            {isOpening ? 'Opening...' : hasSession ? 'Live' : 'Free'}
          </Text>
        </View>

        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Table
          </Text>
          <Text className="text-5xl font-bold tracking-tight text-foreground">
            {table.number}
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            {hasSession
              ? 'Active session — tap to start ordering'
              : 'No session — tap to open and order'}
          </Text>
        </View>
      </View>

      <View
        className={`mt-5 flex-row items-center justify-between rounded-2xl border px-3.5 py-2.5 ${
          hasSession
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : 'border-border bg-muted/50'
        }`}>
        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {hasSession ? 'Session' : 'Seats'}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Ionicons
            name={hasSession ? 'radio-button-on' : 'people-outline'}
            size={14}
            color={hasSession ? '#10B981' : isDark ? '#A1A1AA' : '#71717A'}
          />
          <Text
            className={`text-sm font-semibold ${
              hasSession ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'
            }`}>
            {hasSession ? 'Occupied' : `${table.capacity}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function PosTableSelect({
  tables,
  onTablePress,
  isOpeningSession,
  openingTableId,
  cardWidth,
  gap = 12,
}: PosTableSelectProps) {
  if (tables.length === 0) {
    return (
      <View
        className="rounded-3xl border border-border bg-card p-6"
        style={{ borderCurve: 'continuous' }}>
        <Text className="text-base font-semibold text-foreground">
          No tables configured
        </Text>
        <Text className="mt-2 text-base leading-6 text-muted-foreground">
          Add tables from the Tables tab before taking dining orders.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Table overview
        </Text>
        <Text className="text-base leading-6 text-muted-foreground">
          Tap a live table to order right away. Free tables will ask you to open a session first.
        </Text>
      </View>

      <View className="flex-row flex-wrap" style={{ gap }}>
        {tables.map((table) => (
          <TableSelectCard
            key={table.id}
            table={table}
            width={cardWidth}
            isOpening={isOpeningSession && openingTableId === table.id}
            onPress={() => onTablePress(table)}
          />
        ))}
      </View>
    </View>
  );
}
