import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { formatMoney } from '@/utils/format-money';

import type { CashierTableSession } from './types';

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface CashierSessionCardProps {
  session: CashierTableSession;
  onPress: () => void;
}

export function CashierSessionCard({ session, onPress }: CashierSessionCardProps) {
  const isDark = useColorScheme() === 'dark';
  const tableNumber = session.table?.number ?? '—';
  const hasBalance = session.outstandingCents > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Checkout table ${tableNumber}`}
      className="gap-4 rounded-3xl border border-border bg-card p-5 active:opacity-70"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 flex-row items-center gap-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl bg-primary"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-base font-bold text-primary-foreground">
              {tableNumber}
            </Text>
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-lg font-semibold text-foreground">
              Table {tableNumber}
            </Text>
            <Text className="text-sm text-muted-foreground">
              Opened {formatDateTime(session.openedAt)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
      </View>

      <View className="flex-row items-end justify-between gap-3 border-t border-border/60 pt-4">
        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Outstanding
          </Text>
          <Text className="text-2xl font-bold tracking-tight text-foreground">
            {formatMoney(session.outstandingCents)}
          </Text>
        </View>
        <View className="items-end gap-2">
          <Text className="text-sm text-muted-foreground">
            {session.unpaidOrderCount} unpaid · {(session.orders ?? []).length} total
          </Text>
          {hasBalance ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-1">
              <Ionicons
                name="wallet-outline"
                size={12}
                color={isDark ? '#18181B' : '#FAFAFA'}
              />
              <Text className="text-xs font-semibold text-primary-foreground">
                Collect
              </Text>
            </View>
          ) : (
            <View className="rounded-full bg-muted px-3 py-1">
              <Text className="text-xs font-semibold text-muted-foreground">
                Settled
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
