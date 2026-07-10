import { Text, View } from 'react-native';

import type { OrderStatus, OrderType, PaymentStatus } from './types';

function formatLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

const STATUS_STYLES: Record<OrderStatus, { badge: string; text: string }> = {
  PENDING: {
    badge: 'bg-amber-100/80 dark:bg-amber-500/15',
    text: 'text-amber-800 dark:text-amber-300',
  },
  COMPLETED: {
    badge: 'bg-emerald-100/80 dark:bg-emerald-500/15',
    text: 'text-emerald-800 dark:text-emerald-300',
  },
  CANCELLED: {
    badge: 'bg-red-100/80 dark:bg-red-500/15',
    text: 'text-red-800 dark:text-red-300',
  },
};

const PAYMENT_STYLES: Record<PaymentStatus, { badge: string; text: string }> = {
  PAID: {
    badge: 'bg-emerald-100/80 dark:bg-emerald-500/15',
    text: 'text-emerald-800 dark:text-emerald-300',
  },
  UNPAID: {
    badge: 'bg-red-100/80 dark:bg-red-500/15',
    text: 'text-red-800 dark:text-red-300',
  },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
  return (
    <View className={`rounded-full px-3 py-1 ${style.badge}`}>
      <Text className={`text-xs font-semibold ${style.text}`}>{formatLabel(status)}</Text>
    </View>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const style = PAYMENT_STYLES[status] ?? PAYMENT_STYLES.UNPAID;
  return (
    <View className={`rounded-full px-3 py-1 ${style.badge}`}>
      <Text className={`text-xs font-semibold ${style.text}`}>{formatLabel(status)}</Text>
    </View>
  );
}

export function TypeBadge({ type }: { type: OrderType }) {
  return (
    <View className="rounded-full bg-muted px-3 py-1 dark:bg-muted-dark">
      <Text className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
        {formatLabel(type)}
      </Text>
    </View>
  );
}
