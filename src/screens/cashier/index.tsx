import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ResponsiveCardGrid, ScreenScroll } from '@/components/screen-scroll';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import type { PaymentMethod } from '@/screens/orders/types';
import { formatMoney } from '@/utils/format-money';

import {
  closeTakeawaySale,
  fetchActiveSessions,
  fetchSessionCheckout,
  fetchUnpaidTakeawayOrders,
  markTablePaid,
} from './api';
import { CashierCheckoutSheet } from './cashier-checkout-sheet';
import { CashierSessionCard } from './cashier-session-card';
import { CashierTakeawayCard } from './cashier-takeaway-card';
import type { Order } from '@/screens/orders/types';
import type { TableSession } from '@/screens/sessions/types';
import type { CashierMode, CashierTableSession, CashierTarget } from './types';

const MODES: { value: CashierMode; label: string }[] = [
  { value: 'TABLES', label: 'Tables' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
];

export default function CashierScreen() {
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<CashierMode>('TABLES');
  const [isSheetVisible, setSheetVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TableSession | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { isTablet } = useResponsiveLayout();

  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    isError: isSessionsError,
    error: sessionsError,
    refetch: refetchSessions,
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
  } = useQuery({
    queryKey: ['cashier-takeaway'],
    enabled: isReady && mode === 'TAKEAWAY',
    queryFn: () => fetchUnpaidTakeawayOrders(api),
  });

  const {
    data: checkout,
    isLoading: isLoadingCheckout,
  } = useQuery({
    queryKey: ['cashier-checkout', selectedSession?.id],
    enabled: isReady && isSheetVisible && !!selectedSession?.id,
    queryFn: () => fetchSessionCheckout(api, selectedSession!.id),
  });

  const checkoutTarget = useMemo<CashierTarget | null>(() => {
    if (selectedOrder) return { mode: 'TAKEAWAY', order: selectedOrder };
    if (selectedSession && checkout) {
      return { mode: 'TABLE', session: selectedSession, checkout };
    }
    return null;
  }, [selectedOrder, selectedSession, checkout]);

  const invalidateCashier = () => {
    queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['cashier-takeaway'] });
    queryClient.invalidateQueries({ queryKey: ['cashier-checkout'] });
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const settleMutation = useMutation({
    mutationFn: async (paymentMethod: PaymentMethod) => {
      if (!checkoutTarget) throw new Error('No checkout selected.');

      if (checkoutTarget.mode === 'TABLE') {
        return markTablePaid(api, {
          tableSessionId: checkoutTarget.session.id,
          orderIds: checkoutTarget.checkout.summary.payableOrderIds,
          paymentMethod,
        });
      }

      return closeTakeawaySale(api, {
        orderId: checkoutTarget.order.id,
        paymentMethod,
      });
    },
    onSuccess: () => {
      invalidateCashier();
      setSheetVisible(false);
      setSelectedSession(null);
      setSelectedOrder(null);
      settleMutation.reset();
      Alert.alert('Payment recorded', 'The order has been marked as paid.', [{ text: 'OK' }]);
    },
  });

  const tableOutstanding = sessions.reduce((sum, session) => sum + session.outstandingCents, 0);
  const takeawayOutstanding = takeawayOrders.reduce(
    (sum, order) => sum + order.totalAmountCents,
    0
  );

  const openTableCheckout = (session: CashierTableSession) => {
    settleMutation.reset();
    setSelectedOrder(null);
    setSelectedSession(session);
    setSheetVisible(true);
  };

  const openTakeawayCheckout = (order: (typeof takeawayOrders)[number]) => {
    settleMutation.reset();
    setSelectedSession(null);
    setSelectedOrder(order);
    setSheetVisible(true);
  };

  const confirmSettle = (paymentMethod: PaymentMethod) => {
    if (!checkoutTarget) return;

    const amountCents =
      checkoutTarget.mode === 'TABLE'
        ? checkoutTarget.checkout.summary.payableTotalCents
        : checkoutTarget.order.totalAmountCents;

    Alert.alert(
      'Confirm payment',
      `Mark ${formatMoney(amountCents)} as paid via ${paymentMethod.replace(/_/g, ' ').toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => settleMutation.mutate(paymentMethod) },
      ]
    );
  };

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

  return (
    <>
      <ScreenScroll>
        <View className={`gap-2 ${isTablet ? 'flex-row items-end justify-between' : ''}`}>
          <View className="flex-1 gap-2">
            <Text
              className={`font-bold tracking-tight text-foreground dark:text-foreground-dark ${
                isTablet ? 'text-3xl' : 'text-4xl'
              }`}>
              Cashier
            </Text>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              {isLoading
                ? 'Loading queue...'
                : `${queueCount} in queue · ${formatMoney(outstanding)} outstanding`}
            </Text>
          </View>
        </View>

        <View
          className="flex-row items-center justify-between rounded-3xl border border-emerald-200/70 bg-emerald-50 px-5 py-4 dark:border-emerald-900/50 dark:bg-emerald-950/30"
          style={{ borderCurve: 'continuous' }}>
          <View className="gap-1">
            <Text className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Register total
            </Text>
            <Text className="text-3xl font-bold tracking-tight text-emerald-800 dark:text-emerald-200">
              {formatMoney(outstanding)}
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 dark:bg-emerald-500">
            <Ionicons name="cash-outline" size={24} color="#ECFDF5" />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2">
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
                    ? 'bg-emerald-700 dark:bg-emerald-500'
                    : 'border border-border bg-card dark:border-border-dark dark:bg-card-dark'
                }`}>
                <Text
                  className={`text-sm font-semibold ${
                    isActive ? 'text-emerald-50' : 'text-neutral-600 dark:text-neutral-300'
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
            className="rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              No active table sessions. New dining orders will appear here when guests are seated.
            </Text>
          </View>
        ) : null}

        {!isLoading && !isError && mode === 'TAKEAWAY' && takeawayOrders.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              No unpaid takeaway orders. New pickup orders from POS will show up here.
            </Text>
          </View>
        ) : null}

        {mode === 'TABLES' ? (
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

      <CashierCheckoutSheet
        visible={isSheetVisible}
        target={checkoutTarget}
        isLoading={!!selectedSession && isLoadingCheckout}
        onClose={() => {
          setSheetVisible(false);
          setSelectedSession(null);
          setSelectedOrder(null);
        }}
        onConfirm={confirmSettle}
        isSubmitting={settleMutation.isPending}
        errorMessage={settleMutation.isError ? (settleMutation.error as Error).message : null}
      />
    </>
  );
}
