import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { apiUrl } from '@/utils/api';

import { OrderCard } from './order-card';
import { computeOrderStats, searchOrders } from './order-stats';
import { OrderStatsRow } from './order-stats-row';
import { OrderSearch } from './order-search';
import type { Order, OrderRange } from './types';

const ORDERS_API_URL = apiUrl('/api/orders');

async function fetchOrders(token: string, range: OrderRange): Promise<Order[]> {
  const url = `${ORDERS_API_URL}?range=${range}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Unable to load orders (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : (payload.orders ?? payload.data ?? []);
}

export default function OrdersScreen() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [range, setRange] = useState<OrderRange>('day');
  const [query, setQuery] = useState('');

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orders', range],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Sign in again to load orders.');
      return fetchOrders(token, range);
    },
  });

  const stats = computeOrderStats(orders);
  const visibleOrders = searchOrders(orders, query);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-5 dark:bg-black">
        <Text className="text-base font-medium text-neutral-500 dark:text-neutral-400">
          Loading...
        </Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-5 dark:bg-black">
        <Text className="text-center text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Sign in required
        </Text>
        <Text className="mt-2 text-center text-base leading-6 text-neutral-500 dark:text-neutral-400">
          Sign in from the Home tab to view orders.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-black"
      contentContainerClassName="gap-6 px-5 py-6"
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag">
      <View className="gap-2">
        <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Orders</Text>
        <Text className="text-base leading-6 text-neutral-500 dark:text-neutral-400">
          {isLoading
            ? 'Loading orders...'
            : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`}
        </Text>
      </View>

      {!isError && !isLoading ? <OrderStatsRow stats={stats} /> : null}

      {!isError ? (
        <OrderSearch
          query={query}
          onQueryChange={setQuery}
          range={range}
          onRangeChange={setRange}
        />
      ) : null}

      {isError ? (
        <View
          className="gap-4 rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
          style={{ borderCurve: 'continuous' }}>
          <View className="gap-2">
            <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
              Could not load orders
            </Text>
            <Text className="text-base leading-6 text-red-700 dark:text-red-300">
              {error instanceof Error ? error.message : 'Unable to load orders.'}
            </Text>
          </View>
          <Button onPress={() => refetch()}>Try again</Button>
        </View>
      ) : null}

      {!isLoading && !isError && orders.length === 0 ? (
        <View
          className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-base leading-6 text-neutral-500 dark:text-neutral-400">
            No orders in this range yet.
          </Text>
        </View>
      ) : null}

      {!isLoading && !isError && orders.length > 0 && visibleOrders.length === 0 ? (
        <View
          className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-base leading-6 text-neutral-500 dark:text-neutral-400">
            No orders match “{query}”.
          </Text>
        </View>
      ) : null}

      <View className="gap-3">
        {visibleOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onPress={() => router.push(`/order/${order.id}`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
