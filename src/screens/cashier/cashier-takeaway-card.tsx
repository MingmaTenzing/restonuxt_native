import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { PaymentBadge, StatusBadge } from '@/screens/orders/order-badges';
import { countItems } from '@/screens/orders/order-stats';
import type { Order } from '@/screens/orders/types';
import { formatMoney } from '@/utils/format-money';

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

interface CashierTakeawayCardProps {
  order: Order;
  onPress: () => void;
}

export function CashierTakeawayCard({ order, onPress }: CashierTakeawayCardProps) {
  const isDark = useColorScheme() === 'dark';
  const itemCount = countItems(order);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Checkout takeaway order ${order.orderNo}`}
      className="gap-4 rounded-3xl border border-border bg-card p-5 active:opacity-70 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 flex-row items-start gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary-dark/15"
            style={{ borderCurve: 'continuous' }}>
            <Ionicons name="bag-handle-outline" size={20} color={isDark ? '#E4E4E7' : '#18181B'} />
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              #{order.orderNo} · {order.customerName || 'Guest'}
            </Text>
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
              {formatTime(order.createdAt) ? ` · ${formatTime(order.createdAt)}` : ''}
            </Text>
          </View>
        </View>
        <Text className="text-xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
          {formatMoney(order.totalAmountCents)}
        </Text>
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4 dark:border-border-dark/60">
        <View className="flex-row flex-wrap gap-2">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} />
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
            Checkout
          </Text>
          <Ionicons name="chevron-forward" size={14} color={isDark ? '#E4E4E7' : '#18181B'} />
        </View>
      </View>
    </Pressable>
  );
}
