import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Button } from '@/components/button';
import { useKitchenWebSocket } from '@/hooks/use-kitchen-websocket';
import {
  fetchCompletedOrders,
  fetchPendingOrders,
  updateOrderStatus,
} from '@/screens/kitchen/api';
import { applyKitchenEvent } from '@/screens/kitchen/apply-kitchen-event';
import {
  prependCompletedOrder,
  removeOrder,
  sortCompletedOrders,
  sortKitchenOrders,
  upsertOrder,
} from '@/screens/kitchen/order-queue';
import type { KitchenConnectionState, KitchenQueueTab } from '@/screens/kitchen/types';
import type { Order } from '@/screens/orders/types';

import { KitchenOrderCard } from './kitchen-order-card';

const HORIZONTAL_PADDING = 20;
const GRID_GAP = 16;

function ConnectionBadge({ state }: { state: KitchenConnectionState }) {
  const styles: Record<KitchenConnectionState, { dot: string; label: string; text: string }> = {
    connected: {
      dot: 'bg-emerald-500',
      label: 'Live',
      text: 'text-emerald-800 dark:text-emerald-300',
    },
    connecting: {
      dot: 'bg-amber-400',
      label: 'Connecting',
      text: 'text-amber-800 dark:text-amber-300',
    },
    reconnecting: {
      dot: 'bg-amber-400',
      label: 'Reconnecting',
      text: 'text-amber-800 dark:text-amber-300',
    },
    disconnected: {
      dot: 'bg-red-500',
      label: 'Offline',
      text: 'text-red-800 dark:text-red-300',
    },
  };

  const style = styles[state];

  return (
    <View className="flex-row items-center gap-2 rounded-full bg-muted px-3 py-1.5 dark:bg-muted-dark">
      <View className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
      <Text className={`text-sm font-semibold ${style.text}`}>{style.label}</Text>
    </View>
  );
}

function QueueTabs({
  activeTab,
  onChange,
  activeCount,
  completedCount,
}: {
  activeTab: KitchenQueueTab;
  onChange: (tab: KitchenQueueTab) => void;
  activeCount: number;
  completedCount: number;
}) {
  const tabs: { id: KitchenQueueTab; label: string; count: number }[] = [
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'completed', label: 'Completed', count: completedCount },
  ];

  return (
    <View className="flex-row gap-2">
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.id)}
            className={`rounded-full px-4 py-2.5 active:opacity-80 ${
              selected
                ? 'bg-primary dark:bg-primary-dark'
                : 'border border-border bg-card dark:border-border-dark dark:bg-card-dark'
            }`}
            style={{ borderCurve: 'continuous' }}>
            <Text
              className={`text-sm font-semibold ${
                selected
                  ? 'text-primary-foreground dark:text-primary-foreground-dark'
                  : 'text-foreground dark:text-foreground-dark'
              }`}>
              {tab.label} ({tab.count})
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function KitchenScreen() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<KitchenQueueTab>('active');
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(() => new Set());
  const [pendingActionOrderId, setPendingActionOrderId] = useState<string | null>(null);
  const newOrderTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const numColumns = width >= 1100 ? 3 : width >= 720 ? 2 : 1;
  const cardWidth =
    numColumns === 1
      ? width - HORIZONTAL_PADDING * 2
      : (width - HORIZONTAL_PADDING * 2 - GRID_GAP * (numColumns - 1)) / numColumns;

  const withToken = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in again to load kitchen orders.');
    return token;
  }, [getToken]);

  const {
    data: pendingOrders = [],
    isLoading: isPendingLoading,
    isError: isPendingError,
    error: pendingError,
    refetch: refetchPending,
    isRefetching: isPendingRefetching,
  } = useQuery({
    queryKey: ['kitchen', 'pending-orders'],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => sortKitchenOrders(await fetchPendingOrders(await withToken())),
    refetchOnReconnect: true,
    staleTime: 30_000,
  });

  const {
    data: completedOrders = [],
    isLoading: isCompletedLoading,
    isError: isCompletedError,
    error: completedError,
    refetch: refetchCompleted,
    isRefetching: isCompletedRefetching,
  } = useQuery({
    queryKey: ['kitchen', 'completed-orders'],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => sortCompletedOrders(await fetchCompletedOrders(await withToken())),
    refetchOnReconnect: true,
    staleTime: 30_000,
  });

  const markOrderAsNew = useCallback((orderId: string) => {
    setNewOrderIds((current) => new Set(current).add(orderId));

    const existing = newOrderTimersRef.current.get(orderId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      setNewOrderIds((current) => {
        const next = new Set(current);
        next.delete(orderId);
        return next;
      });
      newOrderTimersRef.current.delete(orderId);
    }, 45_000);

    newOrderTimersRef.current.set(orderId, timer);
  }, []);

  useEffect(() => {
    const timers = newOrderTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const handleKitchenEvent = useCallback(
    (message: { type: string; payload: unknown }) => {
      const pending =
        queryClient.getQueryData<Order[]>(['kitchen', 'pending-orders']) ?? [];
      const completed =
        queryClient.getQueryData<Order[]>(['kitchen', 'completed-orders']) ?? [];
      const next = applyKitchenEvent(
        { pending, completed },
        message as Parameters<typeof applyKitchenEvent>[1],
        markOrderAsNew,
      );

      queryClient.setQueryData(['kitchen', 'pending-orders'], next.pending);
      queryClient.setQueryData(['kitchen', 'completed-orders'], next.completed);
    },
    [markOrderAsNew, queryClient]
  );

  const syncAfterReconnect = useCallback(() => {
    void refetchPending();
    void refetchCompleted();
  }, [refetchCompleted, refetchPending]);

  const { connectionState, reconnect } = useKitchenWebSocket({
    enabled: isLoaded && isSignedIn,
    getToken,
    onMessage: handleKitchenEvent,
    onReconnect: syncAfterReconnect,
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: 'COMPLETED' | 'PENDING';
    }) => updateOrderStatus(await withToken(), orderId, status),
    onMutate: ({ orderId }) => {
      setPendingActionOrderId(orderId);
    },
    onSuccess: (updatedOrder, { status }) => {
      if (status === 'COMPLETED') {
        queryClient.setQueryData<Order[]>(['kitchen', 'pending-orders'], (current = []) =>
          removeOrder(current, updatedOrder.id)
        );
        queryClient.setQueryData<Order[]>(['kitchen', 'completed-orders'], (current = []) =>
          prependCompletedOrder(current, updatedOrder)
        );
      } else {
        queryClient.setQueryData<Order[]>(['kitchen', 'completed-orders'], (current = []) =>
          removeOrder(current, updatedOrder.id)
        );
        queryClient.setQueryData<Order[]>(['kitchen', 'pending-orders'], (current = []) => {
          markOrderAsNew(updatedOrder.id);
          return upsertOrder(current, updatedOrder);
        });
      }
    },
    onSettled: () => {
      setPendingActionOrderId(null);
    },
  });

  const visibleOrders = activeTab === 'active' ? pendingOrders : completedOrders;
  const isLoading = activeTab === 'active' ? isPendingLoading : isCompletedLoading;
  const isError = activeTab === 'active' ? isPendingError : isCompletedError;
  const error = activeTab === 'active' ? pendingError : completedError;
  const isRefetching = isPendingRefetching || isCompletedRefetching;

  const refetchAll = useCallback(() => {
    void refetchPending();
    void refetchCompleted();
  }, [refetchCompleted, refetchPending]);

  const orderCountLabel = useMemo(() => {
    if (isPendingLoading && isCompletedLoading) return 'Loading orders...';
    if (activeTab === 'active') {
      return `${pendingOrders.length} pending ${pendingOrders.length === 1 ? 'order' : 'orders'}`;
    }
    return `${completedOrders.length} completed in the last 24h`;
  }, [
    activeTab,
    completedOrders.length,
    isCompletedLoading,
    isPendingLoading,
    pendingOrders.length,
  ]);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5 dark:bg-background-dark">
        <Text className="text-base font-medium text-muted-foreground dark:text-muted-foreground-dark">
          Loading...
        </Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5 dark:bg-background-dark">
        <Text className="text-center text-xl font-semibold text-foreground dark:text-foreground-dark">
          Sign in required
        </Text>
        <Text className="mt-2 text-center text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
          Sign in from the Home tab to open the kitchen display.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <View className="gap-4 border-b border-neutral-200/80 px-5 pb-4 pt-7 dark:border-border-dark">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-1">
            <Text className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
              Kitchen
            </Text>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              {orderCountLabel}
            </Text>
          </View>
          <ConnectionBadge state={connectionState} />
        </View>

        <QueueTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          activeCount={pendingOrders.length}
          completedCount={completedOrders.length}
        />

        {connectionState === 'disconnected' ? (
          <View
            className="gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/40"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-base leading-6 text-amber-900 dark:text-amber-200">
              Real-time updates are offline. Orders still load from the server, but new tickets may be
              delayed until the connection recovers.
            </Text>
            <Button onPress={() => reconnect()}>Reconnect now</Button>
          </View>
        ) : null}
      </View>

      {isError ? (
        <View className="flex-1 justify-center gap-4 px-5">
          <View
            className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
            style={{ borderCurve: 'continuous' }}>
            <View className="gap-2">
              <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
                Could not load orders
              </Text>
              <Text className="text-base leading-6 text-red-700 dark:text-red-300">
                {error instanceof Error ? error.message : 'Unable to load kitchen orders.'}
              </Text>
            </View>
            <Button onPress={refetchAll}>Try again</Button>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: HORIZONTAL_PADDING,
            paddingVertical: 20,
            gap: GRID_GAP,
          }}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetchAll} />
          }>
          {!isLoading && visibleOrders.length === 0 ? (
            <View
              className="rounded-3xl border border-border bg-card p-6 dark:border-border-dark dark:bg-card-dark"
              style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
              <Text className="text-center text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
                {activeTab === 'active'
                  ? 'No pending orders right now. New tickets will appear here automatically.'
                  : 'No completed orders in the last 24 hours.'}
              </Text>
            </View>
          ) : null}

          {isLoading ? (
            <View className="py-10">
              <Text className="text-center text-base text-muted-foreground dark:text-muted-foreground-dark">
                Loading kitchen queue...
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
              {visibleOrders.map((order) => (
                <View key={order.id} style={{ width: cardWidth }}>
                  <KitchenOrderCard
                    order={order}
                    isNew={activeTab === 'active' && newOrderIds.has(order.id)}
                    variant={activeTab}
                    actionPending={pendingActionOrderId === order.id && statusMutation.isPending}
                    onMarkComplete={
                      activeTab === 'active'
                        ? () => statusMutation.mutate({ orderId: order.id, status: 'COMPLETED' })
                        : undefined
                    }
                    onRecall={
                      activeTab === 'completed'
                        ? () => statusMutation.mutate({ orderId: order.id, status: 'PENDING' })
                        : undefined
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
