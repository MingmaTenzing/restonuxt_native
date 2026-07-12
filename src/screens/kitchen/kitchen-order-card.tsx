import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { RelativeTime } from '@/components/relative-time';
import { TypeBadge } from '@/screens/orders/order-badges';
import type { Order, OrderItem } from '@/screens/orders/types';

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function ItemLine({ item }: { item: OrderItem }) {
  const options = item.orderItemOptions ?? [];

  return (
    <View className="gap-1">
      <View className="flex-row items-start gap-2">
        <Text className="min-w-8 text-lg font-bold text-amber-600 dark:text-amber-400">
          {item.quantity}×
        </Text>
        <Text className="flex-1 text-lg font-semibold text-foreground">
          {item.itemName}
        </Text>
      </View>

      {options.length > 0 ? (
        <View className="ml-10 gap-0.5">
          {options.map((option) => (
            <Text
              key={option.id}
              className="text-sm font-medium text-muted-foreground">
              + {option.quantity > 1 ? `${option.quantity}× ` : ''}
              {option.name}
            </Text>
          ))}
        </View>
      ) : null}

      {item.specialInstructions ? (
        <Text className="ml-10 text-sm font-semibold italic text-amber-700 dark:text-amber-300">
          Note: {item.specialInstructions}
        </Text>
      ) : null}
    </View>
  );
}

interface KitchenOrderCardProps {
  order: Order;
  isNew?: boolean;
  variant?: 'active' | 'completed';
  actionPending?: boolean;
  onMarkComplete?: () => void;
  onRecall?: () => void;
}

export function KitchenOrderCard({
  order,
  isNew,
  variant = 'active',
  actionPending = false,
  onMarkComplete,
  onRecall,
}: KitchenOrderCardProps) {
  const items = order.items ?? [];
  const tableLabel = order.table?.number ? `Table ${order.table.number}` : null;

  return (
    <View
      className={`gap-4 rounded-3xl border p-5 ${
        isNew
          ? 'border-amber-400 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-950/30'
          : 'border-border bg-card'
      }`}
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)' }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-3xl font-bold tracking-tight text-foreground">
            #{order.orderNo}
          </Text>
          <Text className="text-lg font-semibold text-foreground">
            {order.customerName || 'Guest'}
          </Text>
          {tableLabel ? (
            <Text className="text-base font-medium text-muted-foreground">
              {tableLabel}
            </Text>
          ) : null}
        </View>

        <View className="items-end gap-2">
          <TypeBadge type={order.orderType} />
          <Text className="text-sm font-medium text-muted-foreground">
            {formatTime(order.createdAt)}
          </Text>
          <RelativeTime
            date={order.createdAt}
            className="text-sm font-semibold text-amber-700 dark:text-amber-300"
          />
        </View>
      </View>

      <View className="h-px bg-neutral-200" />

      <View className="gap-3">
        {items.length === 0 ? (
          <Text className="text-base text-muted-foreground">
            No items listed.
          </Text>
        ) : (
          items.map((item) => <ItemLine key={item.id} item={item} />)
        )}
      </View>

      {variant === 'active' && onMarkComplete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mark order ${order.orderNo} as completed`}
          disabled={actionPending}
          onPress={onMarkComplete}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 active:opacity-80 disabled:opacity-60 dark:bg-emerald-500"
          style={{ borderCurve: 'continuous' }}>
          {actionPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">Mark as Completed</Text>
          )}
        </Pressable>
      ) : null}

      {variant === 'completed' && onRecall ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Recall order ${order.orderNo} to kitchen`}
          disabled={actionPending}
          onPress={onRecall}
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 active:opacity-80 disabled:opacity-60 dark:border-amber-500/50 dark:bg-amber-950/40"
          style={{ borderCurve: 'continuous' }}>
          {actionPending ? (
            <ActivityIndicator color="#b45309" />
          ) : (
            <Text className="text-base font-semibold text-amber-800 dark:text-amber-200">
              Recall to Kitchen
            </Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
