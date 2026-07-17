import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ScreenScroll } from '@/components/screen-scroll';
import { DetailScreenSkeleton } from '@/components/skeleton';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { formatMoney } from '@/utils/format-money';

import { PaymentBadge, StatusBadge, TypeBadge } from '@/screens/orders/order-badges';
import type { Order, OrderItem } from '@/screens/orders/types';
import type { ApiClient } from '@/utils/api';

async function fetchOrder(api: ApiClient, id: string): Promise<Order> {
  try {
    const payload = await api<Record<string, unknown>>(`/api/orders/${id}`);
    return (payload.order ?? payload.data ?? payload) as Order;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      throw new Error('This order no longer exists.');
    }
    throw error;
  }
}

function itemLineTotalCents(item: OrderItem) {
  const optionsPerUnit = (item.orderItemOptions ?? []).reduce(
    (sum, option) => sum + (option.priceCents ?? 0) * (option.quantity ?? 1),
    0
  );
  return (item.unitPriceCents + optionsPerUnit) * (item.quantity ?? 1);
}

function formatDateTime(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-sm font-medium text-muted-foreground">
        {label}
      </Text>
      <Text
        selectable
        className="flex-1 text-right text-base text-foreground">
        {value}
      </Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </Text>
      <View
        className="gap-3 rounded-3xl border border-border bg-card p-5"
        style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
        {children}
      </View>
    </View>
  );
}

function ItemRow({ item }: { item: OrderItem }) {
  const options = item.orderItemOptions ?? [];
  return (
    <View className="gap-1.5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row gap-2">
          <Text className="text-base font-semibold text-muted-foreground">
            {item.quantity}×
          </Text>
          <Text className="flex-1 text-base font-medium text-foreground">
            {item.itemName}
          </Text>
        </View>
        <Text className="text-base font-semibold text-foreground">
          {formatMoney(itemLineTotalCents(item))}
        </Text>
      </View>

      {options.length > 0 ? (
        <View className="gap-0.5 pl-7">
          {options.map((option) => (
            <View key={option.id} className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-sm text-muted-foreground">
                + {option.name}
                {option.quantity > 1 ? ` ×${option.quantity}` : ''}
              </Text>
              {option.priceCents > 0 ? (
                <Text className="text-sm text-muted-foreground">
                  {formatMoney(option.priceCents * (option.quantity ?? 1))}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {item.specialInstructions ? (
        <Text className="pl-7 text-sm italic text-muted-foreground">
          “{item.specialInstructions}”
        </Text>
      ) : null}
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, isReady } = useApi();
  const { isTablet } = useResponsiveLayout();

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['order', id],
    enabled: isReady && !!id,
    queryFn: () => fetchOrder(api, id!),
  });

  const headerTitle = order ? `Order #${order.orderNo}` : 'Order';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: headerTitle,
          headerBackTitle: 'Orders',
        }}
      />
      <ScreenScroll refreshing={isRefetching} onRefresh={() => refetch()}>
        {isLoading ? <DetailScreenSkeleton /> : null}

        {isError ? (
          <View
            className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
              Could not load order
            </Text>
            <Text className="text-base leading-6 text-red-700 dark:text-red-300">
              {error instanceof Error ? error.message : 'Something went wrong.'}
            </Text>
            <Button onPress={() => refetch()}>Try again</Button>
          </View>
        ) : null}

        {order ? (
          <>
            <View className="gap-3">
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1 gap-1">
                  <Text
                    className={`font-bold tracking-tight text-foreground ${
                      isTablet ? 'text-3xl' : 'text-4xl'
                    }`}>
                    {order.customerName || 'Guest'}
                  </Text>
                  <Text className="text-base text-muted-foreground">
                    Order #{order.orderNo}
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap gap-2">
                <StatusBadge status={order.status} />
                <PaymentBadge status={order.paymentStatus} />
                <TypeBadge type={order.orderType} />
              </View>
            </View>

            <SectionCard title={`Items (${(order.items ?? []).length})`}>
              {(order.items ?? []).length === 0 ? (
                <Text className="text-base text-muted-foreground">
                  No items on this order.
                </Text>
              ) : (
                (order.items ?? []).map((item, index) => (
                  <View key={item.id} className="gap-3">
                    {index > 0 ? <View className="h-px bg-muted" /> : null}
                    <ItemRow item={item} />
                  </View>
                ))
              )}
              <View className="h-px bg-muted" />
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-foreground">
                  Total
                </Text>
                <Text className="text-xl font-bold tracking-tight text-foreground">
                  {formatMoney(order.totalAmountCents)}
                </Text>
              </View>
            </SectionCard>

            <SectionCard title="Payment">
              <DetailRow label="Status" value={formatLabel(order.paymentStatus)} />
              {order.paymentMethod ? (
                <DetailRow label="Method" value={formatLabel(order.paymentMethod)} />
              ) : null}
              {formatDateTime(order.paidAt) ? (
                <DetailRow label="Paid at" value={formatDateTime(order.paidAt)!} />
              ) : null}
            </SectionCard>

            <SectionCard title="Details">
              <DetailRow label="Type" value={formatLabel(order.orderType)} />
              {order.table?.number ? <DetailRow label="Table" value={order.table.number} /> : null}
              {formatDateTime(order.createdAt) ? (
                <DetailRow label="Placed" value={formatDateTime(order.createdAt)!} />
              ) : null}
            </SectionCard>
          </>
        ) : null}
      </ScreenScroll>
    </>
  );
}
