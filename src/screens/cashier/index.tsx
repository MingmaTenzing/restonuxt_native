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
import type { Order } from '@/screens/orders/types';
import { formatMoney } from '@/utils/format-money';

import {
  fetchActiveSessions,
  fetchClosedSessions,
  fetchPaidTakeawayOrders,
  fetchUnpaidTakeawayOrders,
} from './api';
import { sessionCollectedCents } from './cashier-paid';
import { CashierSessionCard } from './cashier-session-card';
import { CashierTakeawayCard } from './cashier-takeaway-card';
import type { CashierMode, CashierTableSession } from './types';

const MODES: { value: CashierMode; label: string }[] = [
  { value: 'TABLES', label: 'Tables' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
  { value: 'CLOSED_TABLES', label: 'Closed' },
  { value: 'PAID_TAKEAWAY', label: 'Paid takeaway' },
];

function isQueueMode(mode: CashierMode) {
  return mode === 'TABLES' || mode === 'TAKEAWAY';
}

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

  const {
    data: closedSessions = [],
    isLoading: isLoadingClosed,
    isError: isClosedError,
    error: closedError,
    refetch: refetchClosed,
    isRefetching: isRefetchingClosed,
  } = useQuery({
    queryKey: ['cashier-closed-sessions'],
    enabled: isReady && mode === 'CLOSED_TABLES',
    queryFn: () => fetchClosedSessions(api),
  });

  const {
    data: paidTakeawayOrders = [],
    isLoading: isLoadingPaidTakeaway,
    isError: isPaidTakeawayError,
    error: paidTakeawayError,
    refetch: refetchPaidTakeaway,
    isRefetching: isRefetchingPaidTakeaway,
  } = useQuery({
    queryKey: ['cashier-paid-takeaway'],
    enabled: isReady && mode === 'PAID_TAKEAWAY',
    queryFn: () => fetchPaidTakeawayOrders(api),
  });

  const tableOutstanding = sessions.reduce((sum, session) => sum + session.outstandingCents, 0);
  const takeawayOutstanding = takeawayOrders.reduce(
    (sum, order) => sum + order.totalAmountCents,
    0
  );
  const closedCollected = closedSessions.reduce(
    (sum, session) => sum + sessionCollectedCents(session),
    0
  );
  const paidTakeawayCollected = paidTakeawayOrders.reduce(
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

  const isError =
    mode === 'TABLES'
      ? isSessionsError
      : mode === 'TAKEAWAY'
        ? isTakeawayError
        : mode === 'CLOSED_TABLES'
          ? isClosedError
          : isPaidTakeawayError;
  const error =
    mode === 'TABLES'
      ? sessionsError
      : mode === 'TAKEAWAY'
        ? takeawayError
        : mode === 'CLOSED_TABLES'
          ? closedError
          : paidTakeawayError;
  const isLoading =
    mode === 'TABLES'
      ? isLoadingSessions
      : mode === 'TAKEAWAY'
        ? isLoadingTakeaway
        : mode === 'CLOSED_TABLES'
          ? isLoadingClosed
          : isLoadingPaidTakeaway;
  const isRefreshing =
    mode === 'TABLES'
      ? isRefetchingSessions
      : mode === 'TAKEAWAY'
        ? isRefetchingTakeaway
        : mode === 'CLOSED_TABLES'
          ? isRefetchingClosed
          : isRefetchingPaidTakeaway;

  const totalCents =
    mode === 'TABLES'
      ? tableOutstanding
      : mode === 'TAKEAWAY'
        ? takeawayOutstanding
        : mode === 'CLOSED_TABLES'
          ? closedCollected
          : paidTakeawayCollected;
  const queueCount =
    mode === 'TABLES'
      ? sessions.length
      : mode === 'TAKEAWAY'
        ? takeawayOrders.length
        : mode === 'CLOSED_TABLES'
          ? closedSessions.length
          : paidTakeawayOrders.length;

  const handleRefresh = () => {
    if (mode === 'TABLES') void refetchSessions();
    else if (mode === 'TAKEAWAY') void refetchTakeaway();
    else if (mode === 'CLOSED_TABLES') void refetchClosed();
    else void refetchPaidTakeaway();
  };

  const subtitle = isLoading
    ? 'Loading...'
    : isQueueMode(mode)
      ? `${queueCount} in queue · ${formatMoney(totalCents)} outstanding`
      : mode === 'CLOSED_TABLES'
        ? `${queueCount} closed · ${formatMoney(totalCents)} collected`
        : `${queueCount} paid today · ${formatMoney(totalCents)} collected`;

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
          <Text className="text-base leading-6 text-muted-foreground">{subtitle}</Text>
        </View>
      </View>

      <View
        className="flex-row items-center justify-between rounded-3xl border border-border bg-card px-5 py-4"
        style={{ borderCurve: 'continuous' }}>
        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isQueueMode(mode) ? 'Register total' : 'Collected'}
          </Text>
          <Text className="text-3xl font-bold tracking-tight text-foreground">
            {formatMoney(totalCents)}
          </Text>
        </View>
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: isQueueMode(mode)
              ? isDark
                ? colors.accent
                : colors.primary
              : isDark
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(16, 185, 129, 0.15)',
          }}>
          <Ionicons
            name={isQueueMode(mode) ? 'cash-outline' : 'checkmark-done-outline'}
            size={24}
            color={
              isQueueMode(mode)
                ? isDark
                  ? colors.text
                  : colors.primaryForeground
                : '#059669'
            }
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
                isActive ? 'bg-primary' : 'border border-border bg-card'
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
          <Button onPress={handleRefresh}>Try again</Button>
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

      {!isLoading && !isError && mode === 'CLOSED_TABLES' && closedSessions.length === 0 ? (
        <View
          className="rounded-3xl border border-border bg-card p-5"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-base leading-6 text-muted-foreground">
            No closed table sessions yet. Paid dining checks will show up here for receipt reprints.
          </Text>
        </View>
      ) : null}

      {!isLoading && !isError && mode === 'PAID_TAKEAWAY' && paidTakeawayOrders.length === 0 ? (
        <View
          className="rounded-3xl border border-border bg-card p-5"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-base leading-6 text-muted-foreground">
            No paid takeaway orders today. Settled pickups will appear here so you can reprint
            receipts.
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
      ) : mode === 'TAKEAWAY' ? (
        <ResponsiveCardGrid>
          {takeawayOrders.map((order) => (
            <CashierTakeawayCard
              key={order.id}
              order={order}
              onPress={() => openTakeawayCheckout(order)}
            />
          ))}
        </ResponsiveCardGrid>
      ) : mode === 'CLOSED_TABLES' ? (
        <ResponsiveCardGrid>
          {closedSessions.map((session) => (
            <CashierSessionCard
              key={session.id}
              session={session}
              variant="paid"
              onPress={() => openTableCheckout(session)}
            />
          ))}
        </ResponsiveCardGrid>
      ) : (
        <ResponsiveCardGrid>
          {paidTakeawayOrders.map((order) => (
            <CashierTakeawayCard
              key={order.id}
              order={order}
              variant="paid"
              onPress={() => openTakeawayCheckout(order)}
            />
          ))}
        </ResponsiveCardGrid>
      )}
    </ScreenScroll>
  );
}
