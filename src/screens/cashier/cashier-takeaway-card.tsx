import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

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
  const itemCount = countItems(order);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Checkout takeaway order ${order.orderNo}`}
      className="gap-4 rounded-3xl border border-border bg-card p-5 active:opacity-70 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <View
              className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10"
              style={{ borderCurve: 'continuous' }}>
              <Ionicons name="bag-handle-outline" size={18} color="#047857" />
            </View>
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              #{order.orderNo} · {order.customerName || 'Guest'}
            </Text>
          </View>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
            {formatTime(order.createdAt) ? ` · ${formatTime(order.createdAt)}` : ''}
          </Text>
        </View>
        <Text className="text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
          {formatMoney(order.totalAmountCents)}
        </Text>
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-row flex-wrap gap-2">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} />
        </View>
        <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
          Collect payment
        </Text>
      </View>
    </Pressable>
  );
}
