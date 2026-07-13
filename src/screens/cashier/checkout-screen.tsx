import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { countItems } from '@/screens/orders/order-stats';
import { formatDate } from '@/utils/format-date';
import { formatMoney } from '@/utils/format-money';

import {
  closeTakeawaySale,
  fetchCheckoutOrder,
  fetchSessionCheckout,
  markTablePaid,
} from './api';
import { CheckoutOrderBlock } from './checkout-order-block';
import { CheckoutBalanceBar } from './checkout-balance-bar';
import {
  canAcceptCheckoutPayment,
  formatTenderedInput,
  getChangeDueCents,
  getTableCheckoutAmountDue,
  getTakeawayCheckoutAmountDue,
  isTableCheckoutPaid,
  isTakeawayCheckoutPaid,
  parseTenderedCents,
  type CashOrCard,
} from './checkout';
import { CheckoutPaymentPanel } from './checkout-payment-panel';
import { CheckoutPaymentSheet } from './checkout-payment-sheet';

type CheckoutKind = 'table' | 'takeaway';

function SummaryChip({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View
      className={`min-w-[100px] flex-1 gap-1 rounded-2xl border px-4 py-3 ${
        highlight
          ? 'border-primary/25 bg-primary/5'
          : 'border-border bg-card'
      }`}
      style={{ borderCurve: 'continuous' }}>
      <Text className="text-xs font-medium text-muted-foreground">
        {label}
      </Text>
      <Text
        className={`text-base font-bold tabular-nums ${
          highlight
            ? 'text-foreground'
            : 'text-foreground'
        }`}>
        {value}
      </Text>
    </View>
  );
}

function CheckoutSkeleton() {
  return (
    <View className="gap-4">
      <View className="flex-row gap-3">
        {[1, 2, 3].map((key) => (
          <View
            key={key}
            className="h-16 flex-1 rounded-2xl bg-muted"
            style={{ borderCurve: 'continuous' }}
          />
        ))}
      </View>
      {[1, 2].map((key) => (
        <View
          key={key}
          className="h-48 rounded-3xl bg-muted"
          style={{ borderCurve: 'continuous' }}
        />
      ))}
    </View>
  );
}

export function CashierCheckoutScreen({
  kind,
  id,
}: {
  kind: CheckoutKind;
  id: string;
}) {
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { isTablet, horizontalPadding } = useResponsiveLayout();

  const [paymentMethod, setPaymentMethod] = useState<CashOrCard>('CASH');
  const [tenderedDollars, setTenderedDollars] = useState('');
  const [isPaymentSheetVisible, setPaymentSheetVisible] = useState(false);

  const tableQuery = useQuery({
    queryKey: ['cashier-checkout', id],
    enabled: isReady && kind === 'table' && !!id,
    queryFn: () => fetchSessionCheckout(api, id),
  });

  const takeawayQuery = useQuery({
    queryKey: ['cashier-checkout-order', id],
    enabled: isReady && kind === 'takeaway' && !!id,
    queryFn: () => fetchCheckoutOrder(api, id),
  });

  const isLoading = kind === 'table' ? tableQuery.isLoading : takeawayQuery.isLoading;
  const isError = kind === 'table' ? tableQuery.isError : takeawayQuery.isError;
  const error = kind === 'table' ? tableQuery.error : takeawayQuery.error;
  const isFetching = kind === 'table' ? tableQuery.isFetching : takeawayQuery.isFetching;

  const checkout = kind === 'table' ? tableQuery.data : undefined;
  const takeawayOrder = kind === 'takeaway' ? takeawayQuery.data : undefined;

  const orders = useMemo(() => {
    if (kind === 'table') return checkout?.orders ?? [];
    return takeawayOrder ? [takeawayOrder] : [];
  }, [kind, checkout, takeawayOrder]);

  const totalItems = useMemo(
    () => orders.reduce((sum, order) => sum + countItems(order), 0),
    [orders]
  );

  const amountDueCents =
    kind === 'table'
      ? checkout
        ? getTableCheckoutAmountDue(checkout.summary)
        : 0
      : takeawayOrder
        ? getTakeawayCheckoutAmountDue(takeawayOrder)
        : 0;

  const isPaid =
    kind === 'table'
      ? checkout
        ? isTableCheckoutPaid(checkout.summary)
        : false
      : takeawayOrder
        ? isTakeawayCheckoutPaid(takeawayOrder)
        : false;

  const tenderedCents = parseTenderedCents(tenderedDollars);
  const changeDueCents = getChangeDueCents(paymentMethod, tenderedCents, amountDueCents);

  const canPay = canAcceptCheckoutPayment({
    isPaid: !!isPaid,
    amountDueCents,
    paymentMethod,
    tenderedCents,
  });

  const invalidateCashier = () => {
    queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['cashier-takeaway'] });
    queryClient.invalidateQueries({ queryKey: ['cashier-checkout'] });
    queryClient.invalidateQueries({ queryKey: ['cashier-checkout-order'] });
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const settleMutation = useMutation({
    mutationFn: async () => {
      if (kind === 'table') {
        if (!checkout) throw new Error('Checkout details are still loading.');
        return markTablePaid(api, {
          tableSessionId: id,
          orderIds: checkout.summary.payableOrderIds,
          paymentMethod,
        });
      }

      return closeTakeawaySale(api, {
        orderId: id,
        paymentMethod,
      });
    },
    onSuccess: async () => {
      setPaymentSheetVisible(false);
      invalidateCashier();
      setTenderedDollars('');
      if (kind === 'table') await tableQuery.refetch();
      else await takeawayQuery.refetch();
      Alert.alert('Payment recorded', 'The sale has been closed.', [
        {
          text: 'Done',
          onPress: () => {
            if (router.canGoBack()) router.back();
            else router.replace('/cashier');
          },
        },
      ]);
    },
  });

  const handleAddQuickAmount = (dollars: number) => {
    const nextCents = tenderedCents + dollars * 100;
    setTenderedDollars(formatTenderedInput(nextCents));
  };

  const handleSetExactAmount = () => {
    setTenderedDollars(formatTenderedInput(amountDueCents));
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/cashier');
  };

  const title =
    kind === 'table'
      ? `Table ${checkout?.table?.number ?? '—'}`
      : `Order #${takeawayOrder?.orderNo ?? '—'}`;

  const subtitle =
    kind === 'table'
      ? checkout
        ? `Opened ${formatDate(checkout.openedAt)}${
            checkout.table?.capacity ? ` · Seats ${checkout.table.capacity}` : ''
          }`
        : 'Table session checkout'
      : takeawayOrder
        ? `${takeawayOrder.customerName || 'Walk-in'} · ${formatDate(takeawayOrder.createdAt)}`
        : 'Takeaway checkout';

  const payableLabel =
    kind === 'table'
      ? `${checkout?.summary.payableOrderCount ?? 0} payable ${(checkout?.summary.payableOrderCount ?? 0) === 1 ? 'order' : 'orders'}`
      : `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;

  const handleRefresh = () => {
    if (kind === 'table') void tableQuery.refetch();
    else void takeawayQuery.refetch();
  };

  const paymentPanelProps = {
    amountDueCents,
    payableLabel,
    paymentMethod,
    onPaymentMethodChange: setPaymentMethod,
    tenderedDollars,
    onTenderedChange: setTenderedDollars,
    onAddQuickAmount: handleAddQuickAmount,
    onSetExactAmount: handleSetExactAmount,
    changeDueCents,
    canPay,
    isSubmitting: settleMutation.isPending,
    isPaid: !!isPaid,
    errorMessage: settleMutation.isError ? (settleMutation.error as Error).message : null,
    onSubmit: () => settleMutation.mutate(),
  };

  const showPayment = !isLoading && !isError && orders.length > 0;

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-base font-medium text-muted-foreground">
          Loading...
        </Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-center text-xl font-semibold text-foreground">
          Sign in required
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="border-b border-border"
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: horizontalPadding,
          paddingBottom: 20,
        }}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          accessibilityRole="button"
          className="mb-5 flex-row items-center gap-1.5 self-start rounded-full border border-border bg-card px-3.5 py-2"
          style={{ borderCurve: 'continuous' }}>
          <Ionicons name="chevron-back" size={16} color="#71717A" />
          <Text className="text-sm font-medium text-muted-foreground">
            Cashier
          </Text>
        </Pressable>

        <View className="flex-row items-start justify-between gap-4">
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {kind === 'table' ? 'Table checkout' : 'Takeaway checkout'}
            </Text>
            <Text
              className={`font-bold tracking-tight text-foreground ${
                isTablet ? 'text-3xl' : 'text-4xl'
              }`}>
              {title}
            </Text>
            <Text className="text-base text-muted-foreground">
              {isLoading ? 'Loading checkout details...' : subtitle}
            </Text>
          </View>

          {!isLoading && !isError ? (
            <View
              className={`rounded-full px-3 py-1.5 ${
                isPaid
                  ? 'bg-emerald-500/15 dark:bg-emerald-400/15'
                  : 'bg-primary/10'
              }`}>
              <Text
                className={`text-xs font-bold uppercase tracking-wider ${
                  isPaid
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-foreground'
                }`}>
                {isPaid ? 'Paid' : 'Unpaid'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className={`min-h-0 flex-1 ${isTablet ? 'flex-row' : ''}`}>
        <ScrollView
          className="min-h-0 flex-1"
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: 16,
            paddingHorizontal: horizontalPadding,
            paddingTop: 16,
            paddingBottom: isTablet ? 24 : insets.bottom + 112,
          }}
          contentInsetAdjustmentBehavior="never"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />
          }>
          {isError ? (
            <View
              className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
              style={{ borderCurve: 'continuous' }}>
              <View className="gap-2">
                <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
                  Could not load checkout
                </Text>
                <Text className="text-base leading-6 text-red-700 dark:text-red-300">
                  {error instanceof Error ? error.message : 'Unable to load checkout details.'}
                </Text>
              </View>
              <Button onPress={handleRefresh}>Try again</Button>
            </View>
          ) : null}

          {isLoading ? <CheckoutSkeleton /> : null}

          {!isLoading && !isError && orders.length === 0 ? (
            <View
              className="items-center gap-3 rounded-3xl border border-dashed border-border bg-card px-5 py-10"
              style={{ borderCurve: 'continuous' }}>
              <Ionicons name="receipt-outline" size={32} color="#A1A1AA" />
              <Text className="text-center text-base leading-6 text-muted-foreground">
                {kind === 'table'
                  ? 'No orders in this session yet.'
                  : 'This takeaway order could not be found.'}
              </Text>
            </View>
          ) : null}

          {!isLoading && !isError && orders.length > 0 ? (
            <>
              <View className="flex-row flex-wrap gap-3">
                <SummaryChip label="Orders" value={String(orders.length)} />
                <SummaryChip label="Items" value={String(totalItems)} />
                {kind === 'table' && checkout ? (
                  <>
                    <SummaryChip
                      label="Session total"
                      value={formatMoney(checkout.summary.sessionTotalCents)}
                    />
                    {checkout.summary.paidTotalCents > 0 ? (
                      <SummaryChip
                        label="Already paid"
                        value={formatMoney(checkout.summary.paidTotalCents)}
                      />
                    ) : null}
                  </>
                ) : null}
                <SummaryChip
                  label="Due now"
                  value={formatMoney(amountDueCents)}
                  highlight={!isPaid && amountDueCents > 0}
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {kind === 'table' ? 'Session orders' : 'Order details'}
                </Text>
                <Text className="text-lg font-semibold text-foreground">
                  {kind === 'table' ? 'Receipt breakdown' : 'Items on this order'}
                </Text>
              </View>

              {orders.map((order) => (
                <CheckoutOrderBlock key={order.id} order={order} />
              ))}
            </>
          ) : null}
        </ScrollView>

        {showPayment && isTablet ? (
          <View
            className="min-h-0 w-[380px] flex-1 border-l border-border"
            style={{
              paddingHorizontal: horizontalPadding,
              paddingTop: 16,
              paddingBottom: insets.bottom + 16,
              paddingLeft: 20,
            }}>
            <CheckoutPaymentPanel
              {...paymentPanelProps}
              controlsScrollable
              fillHeight
            />
          </View>
        ) : null}
      </View>

      {showPayment && !isTablet ? (
        <>
          <CheckoutBalanceBar
            amountDueCents={amountDueCents}
            payableLabel={payableLabel}
            isPaid={!!isPaid}
            onPress={() => setPaymentSheetVisible(true)}
            bottomInset={insets.bottom}
          />
          <CheckoutPaymentSheet
            visible={isPaymentSheetVisible}
            onClose={() => setPaymentSheetVisible(false)}
            {...paymentPanelProps}
          />
        </>
      ) : null}
    </View>
  );
}
