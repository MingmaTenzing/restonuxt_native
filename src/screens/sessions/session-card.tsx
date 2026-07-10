import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { formatMoney } from '@/utils/format-money';

import type { TableSession } from './types';

const STATUS_STYLES = {
  ACTIVE: {
    badge: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'Active',
  },
  CHECKOUT_PENDING: {
    badge: 'bg-amber-500/10 dark:bg-amber-400/10',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'Checkout',
  },
  CLOSED: {
    badge: 'bg-muted dark:bg-muted-dark',
    text: 'text-muted-foreground dark:text-muted-foreground-dark',
    label: 'Closed',
  },
} as const;

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

function sessionTotalCents(session: TableSession) {
  return (session.orders ?? []).reduce((sum, order) => sum + (order.totalAmountCents ?? 0), 0);
}

interface SessionCardProps {
  session: TableSession;
  onPress: () => void;
}

export function SessionCard({ session, onPress }: SessionCardProps) {
  const tableNumber = session.table?.number ?? '—';
  const orderCount = session.orders?.length ?? 0;
  const totalCents = sessionTotalCents(session);
  const statusStyle = STATUS_STYLES[session.status] ?? STATUS_STYLES.ACTIVE;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Session for table ${tableNumber}`}
      className="gap-4 rounded-3xl border border-border bg-card p-5 active:opacity-70 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <View
              className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary-dark/15"
              style={{ borderCurve: 'continuous' }}>
              <Text className="text-sm font-bold text-primary dark:text-primary-dark">
                {tableNumber}
              </Text>
            </View>
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              Table {tableNumber}
            </Text>
          </View>
          <Text
            selectable
            className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            Opened {formatDateTime(session.openedAt)}
            {session.closedAt ? ` · Closed ${formatDateTime(session.closedAt)}` : ''}
          </Text>
        </View>
        <View className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${statusStyle.badge}`}>
          <Ionicons
            name={session.status === 'CLOSED' ? 'checkmark-circle' : 'time'}
            size={14}
            color={session.status === 'ACTIVE' ? '#059669' : session.status === 'CHECKOUT_PENDING' ? '#D97706' : '#8E8E93'}
          />
          <Text className={`text-xs font-semibold ${statusStyle.text}`}>{statusStyle.label}</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
          {orderCount} {orderCount === 1 ? 'order' : 'orders'}
        </Text>
        <Text className="text-lg font-semibold tracking-tight text-foreground dark:text-foreground-dark">
          {formatMoney(totalCents)}
        </Text>
      </View>
    </Pressable>
  );
}
