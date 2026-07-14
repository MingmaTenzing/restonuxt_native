import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ResponsiveCardGrid, ScreenScroll } from '@/components/screen-scroll';
import { CardGridSkeleton, ListScreenSkeleton } from '@/components/skeleton';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/utils/format-money';

import { fetchActiveSessions, fetchUnpaidTakeawayOrders } from './api';
import { CashierSessionCard } from './cashier-session-card';
import { CashierTakeawayCard } from './cashier-takeaway-card';
import type { CashierMode, CashierTableSession } from './types';
import type { Order } from '@/screens/orders/types';

const MODES: { value: CashierMode; label: string }[] = [
  { value: 'TABLES', label: 'Tables' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
];

export default function CashierScreen() {
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const router = useRouter();
  const [mode, setMode] = useState<CashierMode>('TABLES');
  const { isTablet } = useResponsiveLayout();
  const { isDark, colors } = useTheme();

  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    isError: isSessionsError,
    error: sessionsError,
    refetch: refetchSessions,
    isRefetching: isRefetchingSessions,
  } = useQuery({
    queryKey: ['cashier-sessions'],
    enabled: isReady && mode === 'TABLES',
    queryFn: () => fetchActiveSessions(api),
  });

  const {
    data: takeawayOrders = [],
    isLoading: isLoadingTakeaway,
    isError: isTakeawayError,
    error: takeawayError,
    refetch: refetchTakeaway,
    isRefetching: isRefetchingTakeaway,
  } = useQuery({
    queryKey: ['cashier-takeaway'],
    enabled: isReady && mode === 'TAKEAWAY',
    queryFn: () => fetchUnpaidTakeawayOrders(api),
  });

  const tableOutstanding = sessions.reduce((sum, session) => sum + session.outstandingCents, 0);
  const takeawayOutstanding = takeawayOrders.reduce(
    (sum, order) => sum + order.totalAmountCents,
    0
  );

  const openTableCheckout = (session: CashierTableSession) => {
    router.push(`/cashier/checkout/table/${session.id}`);
  };

  const openTakeawayCheckout = (order: Order) => {
    router.push(`/cashier/checkout/takeaway/${order.id}`);
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-background">
        <ScreenScroll>
          <ListScreenSkeleton statsCount={1} filters cards={4} />
        </ScreenScroll>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-center text-xl font-semibold text-foreground">
          Sign in required
        </Text>
        <Text className="mt-2 text-center text-base leading-6 text-muted-foreground">
          Sign in from the Home tab to collect payments.
        </Text>
      </View>
    );
  }

  const isError = mode === 'TABLES' ? isSessionsError : isTakeawayError;
  const error = mode === 'TABLES' ? sessionsError : takeawayError;
  const isLoading = mode === 'TABLES' ? isLoadingSessions : isLoadingTakeaway;
  const outstanding = mode === 'TABLES' ? tableOutstanding : takeawayOutstanding;
  const queueCount = mode === 'TABLES' ? sessions.length : takeawayOrders.length;
  const isRefreshing = mode === 'TABLES' ? isRefetchingSessions : isRefetchingTakeaway;

  const handleRefresh = () => {
    if (mode === 'TABLES') void refetchSessions();
    else void refetchTakeaway();
  };

  return (
    <ScreenScroll refreshing={isRefreshing} onRefresh={handleRefresh}>
      <View className={`gap-2 ${isTablet ? 'flex-row items-end justify-between' : ''}`}>
        <View className="flex-1 gap-2">
          <Text
            className={`font-bold tracking-tight text-foreground ${
              isTablet ? 'text-3xl' : 'text-4xl'
            }`}>
            Cashier
          </Text>
          <Text className="text-base leading-6 text-muted-foreground">
            {isLoading
              ? 'Loading queue...'
              : `${queueCount} in queue · ${formatMoney(outstanding)} outstanding`}
          </Text>
        </View>
      </View>

      <View
        className="flex-row items-center justify-between rounded-3xl border border-border bg-card px-5 py-4"
        style={{ borderCurve: 'continuous' }}>
        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Register total
          </Text>
          <Text className="text-3xl font-bold tracking-tight text-foreground">
            {formatMoney(outstanding)}
          </Text>
        </View>
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: isDark ? colors.accent : colors.primary }}>
          <Ionicons
            name="cash-outline"
            size={24}
            color={isDark ? colors.text : colors.primaryForeground}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {MODES.map((option) => {
          const isActive = option.value === mode;
          return (
            <Pressable
              key={option.value}
              onPress={() => setMode(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={`rounded-full px-4 py-2 ${
                isActive
                  ? 'bg-primary'
                  : 'border border-border bg-card'
              }`}>
              <Text
                className={`text-sm font-semibold ${
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isError ? (
        <View
          className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
          style={{ borderCurve: 'continuous' }}>
          <View className="gap-2">
            <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
              Could not load cashier queue
            </Text>
            <Text className="text-base leading-6 text-red-700 dark:text-red-300">
              {error instanceof Error ? error.message : 'Unable to load payments queue.'}
            </Text>
          </View>
          <Button onPress={() => (mode === 'TABLES' ? refetchSessions() : refetchTakeaway())}>
            Try again
          </Button>
        </View>
      ) : null}

      {!isLoading && !isError && mode === 'TABLES' && sessions.length === 0 ? (
        <View
          className="rounded-3xl border border-border bg-card p-5"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-base leading-6 text-muted-foreground">
            No active table sessions. New dining orders will appear here when guests are seated.
          </Text>
        </View>
      ) : null}

      {!isLoading && !isError && mode === 'TAKEAWAY' && takeawayOrders.length === 0 ? (
        <View
          className="rounded-3xl border border-border bg-card p-5"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-base leading-6 text-muted-foreground">
            No unpaid takeaway orders. New pickup orders from POS will show up here.
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <CardGridSkeleton />
      ) : mode === 'TABLES' ? (
        <ResponsiveCardGrid>
          {sessions.map((session) => (
            <CashierSessionCard
              key={session.id}
              session={session}
              onPress={() => openTableCheckout(session)}
            />
          ))}
        </ResponsiveCardGrid>
      ) : (
        <ResponsiveCardGrid>
          {takeawayOrders.map((order) => (
            <CashierTakeawayCard
              key={order.id}
              order={order}
              onPress={() => openTakeawayCheckout(order)}
            />
          ))}
        </ResponsiveCardGrid>
      )}
    </ScreenScroll>
  );
}
