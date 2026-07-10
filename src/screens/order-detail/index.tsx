import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { apiUrl } from '@/utils/api';
import { formatMoney } from '@/utils/format-money';

import { PaymentBadge, StatusBadge, TypeBadge } from '@/screens/orders/order-badges';
import type { Order, OrderItem } from '@/screens/orders/types';

const ORDERS_API_URL = apiUrl('/api/orders');

async function fetchOrder(token: string, id: string): Promise<Order> {
  const response = await fetch(`${ORDERS_API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) throw new Error('This order no longer exists.');
  if (!response.ok) throw new Error(`Unable to load order (${response.status})`);

  const payload = await response.json();
  return payload.order ?? payload.data ?? payload;
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
      <Text className="text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
        {label}
      </Text>
      <Text
        selectable
        className="flex-1 text-right text-base text-foreground dark:text-foreground-dark">
        {value}
      </Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground-dark">
        {title}
      </Text>
      <View
        className="gap-3 rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
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
          <Text className="text-base font-semibold text-muted-foreground dark:text-muted-foreground-dark">
            {item.quantity}×
          </Text>
          <Text className="flex-1 text-base font-medium text-foreground dark:text-foreground-dark">
            {item.itemName}
          </Text>
        </View>
        <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
          {formatMoney(itemLineTotalCents(item))}
        </Text>
      </View>

      {options.length > 0 ? (
        <View className="gap-0.5 pl-7">
          {options.map((option) => (
            <View key={option.id} className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-sm text-muted-foreground dark:text-muted-foreground-dark">
                + {option.name}
                {option.quantity > 1 ? ` ×${option.quantity}` : ''}
              </Text>
              {option.priceCents > 0 ? (
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  {formatMoney(option.priceCents * (option.quantity ?? 1))}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {item.specialInstructions ? (
        <Text className="pl-7 text-sm italic text-muted-foreground dark:text-muted-foreground-dark">
          “{item.specialInstructions}”
        </Text>
      ) : null}
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['order', id],
    enabled: isLoaded && isSignedIn && !!id,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Sign in again to load this order.');
      return fetchOrder(token, id!);
    },
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
      <ScrollView
        className="flex-1 bg-background dark:bg-background-dark"
        contentContainerClassName="gap-6 px-5 py-7"
        contentInsetAdjustmentBehavior="automatic">
        {isLoading ? (
          <View className="items-center justify-center py-16">
            <Text className="text-base font-medium text-muted-foreground dark:text-muted-foreground-dark">
              Loading order...
            </Text>
          </View>
        ) : null}

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
                  <Text className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
                    {order.customerName || 'Guest'}
                  </Text>
                  <Text className="text-base text-muted-foreground dark:text-muted-foreground-dark">
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
                <Text className="text-base text-muted-foreground dark:text-muted-foreground-dark">
                  No items on this order.
                </Text>
              ) : (
                (order.items ?? []).map((item, index) => (
                  <View key={item.id} className="gap-3">
                    {index > 0 ? <View className="h-px bg-muted dark:bg-muted-dark" /> : null}
                    <ItemRow item={item} />
                  </View>
                ))
              )}
              <View className="h-px bg-muted dark:bg-muted-dark" />
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                  Total
                </Text>
                <Text className="text-xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
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
      </ScrollView>
    </>
  );
}
