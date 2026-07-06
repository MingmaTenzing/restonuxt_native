import { Pressable, Text, View } from 'react-native';

import { formatMoney } from '@/utils/format-money';

import { PaymentBadge, StatusBadge, TypeBadge } from './order-badges';
import { countItems } from './order-stats';
import type { Order } from './types';

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const itemCount = countItems(order);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order number ${order.orderNo} for ${order.customerName}`}
      className="gap-4 rounded-3xl border border-neutral-200 bg-white p-5 active:opacity-70 dark:border-neutral-800 dark:bg-neutral-900"
      style={{ borderCurve: 'continuous' }}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-neutral-400 dark:text-neutral-500">
              #{order.orderNo}
            </Text>
            <Text
              numberOfLines={1}
              className="flex-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {order.customerName || 'Guest'}
            </Text>
          </View>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
            {formatTime(order.createdAt) ? ` · ${formatTime(order.createdAt)}` : ''}
          </Text>
        </View>
        <Text className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          {formatMoney(order.totalAmountCents)}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <StatusBadge status={order.status} />
        <PaymentBadge status={order.paymentStatus} />
        <TypeBadge type={order.orderType} />
      </View>
    </Pressable>
  );
}
