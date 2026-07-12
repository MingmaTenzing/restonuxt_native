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
      className="gap-4 rounded-3xl border border-border bg-card p-5 active:opacity-70 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 flex-row items-center gap-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl bg-primary dark:bg-primary-dark"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-base font-bold text-primary-foreground dark:text-primary-foreground-dark">
              {tableNumber}
            </Text>
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              Table {tableNumber}
            </Text>
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
              Opened {formatDateTime(session.openedAt)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
      </View>

      <View className="flex-row items-end justify-between gap-3 border-t border-border/60 pt-4 dark:border-border-dark/60">
        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground-dark">
            Outstanding
          </Text>
          <Text className="text-2xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
            {formatMoney(session.outstandingCents)}
          </Text>
        </View>
        <View className="items-end gap-2">
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {session.unpaidOrderCount} unpaid · {(session.orders ?? []).length} total
          </Text>
          {hasBalance ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-1 dark:bg-primary-dark">
              <Ionicons
                name="wallet-outline"
                size={12}
                color={isDark ? '#18181B' : '#FAFAFA'}
              />
              <Text className="text-xs font-semibold text-primary-foreground dark:text-primary-foreground-dark">
                Collect
              </Text>
            </View>
          ) : (
            <View className="rounded-full bg-muted px-3 py-1 dark:bg-muted-dark">
              <Text className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground-dark">
                Settled
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
