import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { PaymentBadge, StatusBadge } from '@/screens/orders/order-badges';
import type { Order, OrderItem } from '@/screens/orders/types';
import { formatDate } from '@/utils/format-date';
import { formatMoney } from '@/utils/format-money';

function itemLineTotalCents(item: OrderItem) {
  const optionsPerUnit = (item.orderItemOptions ?? []).reduce(
    (sum, option) => sum + (option.priceCents ?? 0) * (option.quantity ?? 1),
    0
  );
  return (item.unitPriceCents + optionsPerUnit) * (item.quantity ?? 1);
}

function OrderItemRow({ item, isLast }: { item: OrderItem; isLast: boolean }) {
  const options = item.orderItemOptions ?? [];

  return (
    <View
      className={`gap-1.5 py-3.5 ${isLast ? '' : 'border-b border-border/50 dark:border-border-dark/50'}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-start gap-3">
          <View className="h-7 min-w-7 items-center justify-center rounded-lg bg-muted dark:bg-muted-dark">
            <Text className="text-sm font-bold tabular-nums text-foreground dark:text-foreground-dark">
              {item.quantity}
            </Text>
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-base font-medium leading-5 text-foreground dark:text-foreground-dark">
              {item.itemName}
            </Text>
            {item.specialInstructions ? (
              <Text className="text-sm italic text-muted-foreground dark:text-muted-foreground-dark">
                {item.specialInstructions}
              </Text>
            ) : null}
          </View>
        </View>
        <Text className="text-base font-semibold tabular-nums text-foreground dark:text-foreground-dark">
          {formatMoney(itemLineTotalCents(item))}
        </Text>
      </View>

      {options.length > 0 ? (
        <View className="gap-1 pl-10">
          {options.map((option) => (
            <View key={option.id} className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-sm text-muted-foreground dark:text-muted-foreground-dark">
                + {option.quantity}× {option.name}
              </Text>
              {option.priceCents > 0 ? (
                <Text className="text-sm tabular-nums text-muted-foreground dark:text-muted-foreground-dark">
                  {formatMoney(option.priceCents * (option.quantity ?? 1))}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function CheckoutOrderBlock({ order }: { order: Order }) {
  const items = order.items ?? [];
  const isUnpaid = order.paymentStatus === 'UNPAID';

  return (
    <View
      className={`overflow-hidden rounded-3xl border bg-card dark:bg-card-dark ${
        isUnpaid
          ? 'border-primary/30 dark:border-primary-dark/30'
          : 'border-border dark:border-border-dark'
      }`}
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)' }}>
      <View
        className={`flex-row items-center justify-between gap-3 border-b px-5 py-4 ${
          isUnpaid
            ? 'border-primary/15 bg-primary/5 dark:border-primary-dark/15 dark:bg-primary-dark/10'
            : 'border-border bg-muted/40 dark:border-border-dark dark:bg-muted-dark/40'
        }`}>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
            Order #{order.orderNo}
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {order.customerName || 'Guest'}
            {order.createdAt ? ` · ${formatDate(order.createdAt)}` : ''}
          </Text>
        </View>
        <Text className="text-xl font-bold tabular-nums text-foreground dark:text-foreground-dark">
          {formatMoney(order.totalAmountCents)}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2 px-5 pt-4">
        <StatusBadge status={order.status} />
        <PaymentBadge status={order.paymentStatus} />
        <View className="rounded-full bg-muted px-3 py-1 dark:bg-muted-dark">
          <Text className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground-dark">
            {items.length} {items.length === 1 ? 'line' : 'lines'}
          </Text>
        </View>
      </View>

      <View className="px-5 pb-4 pt-2">
        {items.length === 0 ? (
          <Text className="py-2 text-sm text-muted-foreground dark:text-muted-foreground-dark">
            No line items on this order.
          </Text>
        ) : (
          items.map((item, index) => (
            <OrderItemRow key={item.id} item={item} isLast={index === items.length - 1} />
          ))
        )}
      </View>
    </View>
  );
}
