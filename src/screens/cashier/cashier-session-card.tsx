import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { formatMoney } from '@/utils/format-money';

import { closedSessionHasUnpaid, sessionCollectedCents } from './cashier-paid';
import type { CashierTableSession } from './types';

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
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
  /** Closed history tab — receipt/collect for settled or undone sales. */
  variant?: 'queue' | 'paid';
}

export function CashierSessionCard({
  session,
  onPress,
  variant = 'queue',
}: CashierSessionCardProps) {
  const isDark = useColorScheme() === 'dark';
  const tableNumber = session.table?.number ?? '—';
  const isClosedTab = variant === 'paid';
  const hasBalance = session.outstandingCents > 0;
  const hasUnpaid = closedSessionHasUnpaid(session);
  const collectedCents = sessionCollectedCents(session);
  const orderCount = (session.orders ?? []).length;

  const amountLabel = isClosedTab ? (hasUnpaid ? 'Outstanding' : 'Collected') : 'Outstanding';
  const amountCents = isClosedTab
    ? hasUnpaid
      ? session.outstandingCents
      : collectedCents
    : session.outstandingCents;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        isClosedTab
          ? hasUnpaid
            ? `Table ${tableNumber} closed with unpaid balance, collect payment`
            : `View paid table ${tableNumber} and print receipt`
          : `Checkout table ${tableNumber}`
      }
      className="gap-4 rounded-3xl border border-border bg-card p-5 active:opacity-70"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 flex-row items-center gap-3">
          <View
            className={`h-12 w-12 items-center justify-center rounded-2xl ${
              isClosedTab ? (hasUnpaid ? 'bg-amber-500/15' : 'bg-emerald-500/15') : 'bg-primary'
            }`}
            style={{ borderCurve: 'continuous' }}>
            <Text
              className={`text-base font-bold ${
                isClosedTab
                  ? hasUnpaid
                    ? 'text-amber-800 dark:text-amber-300'
                    : 'text-emerald-700 dark:text-emerald-400'
                  : 'text-primary-foreground'
              }`}>
              {tableNumber}
            </Text>
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-lg font-semibold text-foreground">Table {tableNumber}</Text>
              {isClosedTab && hasUnpaid ? (
                <View className="rounded-full bg-red-100/80 px-2.5 py-0.5 dark:bg-red-500/15">
                  <Text className="text-[11px] font-bold uppercase tracking-wide text-red-800 dark:text-red-300">
                    Unpaid
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="text-sm text-muted-foreground">
              {isClosedTab
                ? `Closed ${formatDateTime(session.closedAt)}`
                : `Opened ${formatDateTime(session.openedAt)}`}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
      </View>

      <View className="flex-row items-end justify-between gap-3 border-t border-border/60 pt-4">
        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {amountLabel}
          </Text>
          <Text className="text-2xl font-bold tracking-tight text-foreground">
            {formatMoney(amountCents)}
          </Text>
        </View>
        <View className="items-end gap-2">
          <Text className="text-sm text-muted-foreground">
            {isClosedTab
              ? hasUnpaid
                ? `${session.unpaidOrderCount} unpaid · ${orderCount} total`
                : `${orderCount} ${orderCount === 1 ? 'order' : 'orders'}`
              : `${session.unpaidOrderCount} unpaid · ${orderCount} total`}
          </Text>
          {isClosedTab && hasUnpaid ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-1">
              <Ionicons name="wallet-outline" size={12} color={isDark ? '#18181B' : '#FAFAFA'} />
              <Text className="text-xs font-semibold text-primary-foreground">Collect</Text>
            </View>
          ) : isClosedTab ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 dark:bg-emerald-400/15">
              <Ionicons name="print-outline" size={12} color="#059669" />
              <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Receipt
              </Text>
            </View>
          ) : hasBalance ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-1">
              <Ionicons name="wallet-outline" size={12} color={isDark ? '#18181B' : '#FAFAFA'} />
              <Text className="text-xs font-semibold text-primary-foreground">Collect</Text>
            </View>
          ) : (
            <View className="rounded-full bg-muted px-3 py-1">
              <Text className="text-xs font-semibold text-muted-foreground">Settled</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
