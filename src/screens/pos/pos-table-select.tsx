import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import type { PosTable } from './types';

interface PosTableSelectProps {
  tables: PosTable[];
  onTablePress: (table: PosTable) => void;
  isOpeningSession: boolean;
  openingTableId: string | null;
  cardWidth: number;
  gap?: number;
}

function TableSelectCard({
  table,
  onPress,
  isOpening,
  width,
  compact,
}: {
  table: PosTable;
  onPress: () => void;
  isOpening: boolean;
  width: number;
  compact: boolean;
}) {
  const isDark = useColorScheme() === 'dark';
  const hasSession = !!table.activeSessionId;
  const mutedIcon = isDark ? '#A1A1AA' : '#71717A';

  return (
    <Pressable
      onPress={isOpening ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={`Table ${table.number}, ${hasSession ? 'live session' : 'no session'}`}
      className={`justify-between overflow-hidden rounded-3xl border-2 bg-card active:opacity-85 ${
        compact ? 'min-h-[132px] p-3.5' : 'min-h-[148px] p-4'
      } ${hasSession ? 'border-emerald-500/60' : 'border-border'} ${isOpening ? 'opacity-70' : ''}`}
      style={{
        width,
        borderCurve: 'continuous',
        boxShadow: hasSession
          ? '0 8px 24px rgba(16, 185, 129, 0.12)'
          : '0 4px 16px rgba(0, 0, 0, 0.04)',
      }}>
      <View className="flex-row items-start justify-between gap-2">
        <View
          className={`rounded-full px-2.5 py-1 ${
            hasSession ? 'bg-emerald-500/15' : 'bg-muted'
          }`}>
          <Text
            className={`text-[10px] font-bold uppercase tracking-wider ${
              hasSession ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
            }`}>
            {isOpening ? 'Opening…' : hasSession ? 'Live' : 'Free'}
          </Text>
        </View>
        <Ionicons
          name={hasSession ? 'radio-button-on' : 'ellipse-outline'}
          size={14}
          color={hasSession ? '#10B981' : mutedIcon}
        />
      </View>

      <View className="items-center py-1">
        <Text
          className={`font-bold tracking-tight text-foreground ${
            compact ? 'text-4xl' : 'text-5xl'
          }`}>
          {table.number}
        </Text>
      </View>

      <View className="flex-row items-center justify-center gap-1.5">
        <Ionicons
          name={hasSession ? 'restaurant-outline' : 'people-outline'}
          size={13}
          color={hasSession ? '#10B981' : mutedIcon}
        />
        <Text
          className={`text-xs font-semibold ${
            hasSession ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
          }`}>
          {hasSession ? 'Order' : `${table.capacity} seats`}
        </Text>
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
        <Text className="text-base font-semibold text-foreground">No tables configured</Text>
        <Text className="mt-2 text-base leading-6 text-muted-foreground">
          Add tables from the Tables tab before taking dining orders.
        </Text>
      </View>
    );
  }

  const liveCount = tables.filter((table) => !!table.activeSessionId).length;
  const freeCount = tables.length - liveCount;
  const compact = cardWidth < 160;

  return (
    <View className="gap-4">
      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Floor
          </Text>
          <Text className="text-base leading-6 text-muted-foreground">
            Tap a live table to order. Free tables open a session first.
          </Text>
        </View>

        <View className="flex-row gap-2">
          <View
            className="flex-1 flex-row items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5"
            style={{ borderCurve: 'continuous' }}>
            <View className="h-2 w-2 rounded-full bg-emerald-500" />
            <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {liveCount} live
            </Text>
          </View>
          <View
            className="flex-1 flex-row items-center gap-2 rounded-2xl border border-border bg-muted/60 px-3 py-2.5"
            style={{ borderCurve: 'continuous' }}>
            <View className="h-2 w-2 rounded-full bg-zinc-400" />
            <Text className="text-sm font-semibold text-muted-foreground">{freeCount} free</Text>
          </View>
        </View>
      </View>

      <View className="flex-row flex-wrap" style={{ gap }}>
        {tables.map((table) => (
          <TableSelectCard
            key={table.id}
            table={table}
            width={cardWidth}
            compact={compact}
            isOpening={isOpeningSession && openingTableId === table.id}
            onPress={() => onTablePress(table)}
          />
        ))}
      </View>
    </View>
  );
}
