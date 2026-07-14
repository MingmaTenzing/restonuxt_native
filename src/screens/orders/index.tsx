import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ResponsiveCardGrid, ScreenScroll } from '@/components/screen-scroll';
import { CardGridSkeleton, OrderStatsSkeleton } from '@/components/skeleton';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { unwrapList, type ApiClient } from '@/utils/api';

import { OrderCard } from './order-card';
import { computeOrderStats, searchOrders } from './order-stats';
import { OrderStatsRow } from './order-stats-row';
import { OrderSearch } from './order-search';
import type { Order, OrderRange } from './types';

async function fetchOrders(api: ApiClient, range: OrderRange): Promise<Order[]> {
  const payload = await api<unknown>(`/api/orders?range=${range}`);
  return unwrapList<Order>(payload, ['orders', 'data']);
}

export default function OrdersScreen() {
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const router = useRouter();
  const { isTablet } = useResponsiveLayout();
  const [range, setRange] = useState<OrderRange>('day');
  const [query, setQuery] = useState('');

  const { data: dayOrders = [], isLoading: isDayLoading } = useQuery({
    queryKey: ['orders', 'day'],
    enabled: isReady,
    queryFn: () => fetchOrders(api, 'day'),
    staleTime: 30_000,
  });

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['orders', range],
    enabled: isReady,
    queryFn: () => fetchOrders(api, range),
    placeholderData: keepPreviousData,
  });

  const stats = computeOrderStats(dayOrders);
  const visibleOrders = searchOrders(orders, query);

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-background">
        <ScreenScroll>
          <View className="gap-2">
            <Text
              className={`font-bold tracking-tight text-foreground ${
                isTablet ? 'text-3xl' : 'text-4xl'
              }`}>
              Orders
            </Text>
          </View>
          <OrderSearch query="" onQueryChange={() => {}} range="day" onRangeChange={() => {}} />
          <OrderStatsSkeleton />
          <CardGridSkeleton />
        </ScreenScroll>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-center text-xl font-semibold text-foreground">Sign in required</Text>
        <Text className="mt-2 text-center text-base leading-6 text-muted-foreground">
          Sign in from the Home tab to view orders.
        </Text>
      </View>
    );
  }

  return (
    <ScreenScroll refreshing={isRefetching} onRefresh={() => refetch()}>
      <View className="gap-2">
        <Text
          className={`font-bold tracking-tight text-foreground ${
            isTablet ? 'text-3xl' : 'text-4xl'
          }`}>
          Orders
        </Text>
        <Text className="text-base leading-6 text-muted-foreground">
          {isLoading
            ? 'Loading orders...'
            : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`}
        </Text>
      </View>

      {!isError ? (
        <OrderSearch
          query={query}
          onQueryChange={setQuery}
          range={range}
          onRangeChange={setRange}
        />
      ) : null}

      {!isError ? (
        isDayLoading ? <OrderStatsSkeleton /> : <OrderStatsRow stats={stats} />
      ) : null}

      {isError ? (
        <View
          className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
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
          className="rounded-3xl border border-border bg-card p-5"
          style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
          <Text className="text-base leading-6 text-muted-foreground">
            No orders in this range yet.
          </Text>
        </View>
      ) : null}

      {!isLoading && !isError && orders.length > 0 && visibleOrders.length === 0 ? (
        <View
          className="rounded-3xl border border-border bg-card p-5"
          style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
          <Text className="text-base leading-6 text-muted-foreground">
            No orders match “{query}”.
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <CardGridSkeleton />
      ) : (
        <ResponsiveCardGrid>
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => router.push(`/order/${order.id}`)}
            />
          ))}
        </ResponsiveCardGrid>
      )}
    </ScreenScroll>
  );
}
