import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import type { Order, PaymentMethod } from '@/screens/orders/types';
import { apiUrl } from '@/utils/api';

import { SessionCard } from './session-card';
import { SessionCreateModal } from './session-create-modal';
import { SessionDetailModal } from './session-detail-modal';
import type {
  SessionCheckout,
  SessionStatusFilter,
  TableOption,
  TableSession,
} from './types';

async function apiRequest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errorBody = (await response.json()) as { statusMessage?: string; message?: string };
      const detail = errorBody.statusMessage ?? errorBody.message;
      if (detail) message = detail;
    } catch {
      // Keep generic message when the body is not JSON.
    }
    throw new Error(message);
  }
  return response.json();
}

function normalizeTable(raw: Record<string, unknown>) {
  const id = typeof raw.id === 'string' ? raw.id : null;
  const number =
    typeof raw.number === 'string'
      ? raw.number
      : typeof raw.table_number === 'string'
        ? raw.table_number
        : null;
  const capacity = typeof raw.capacity === 'number' ? raw.capacity : null;
  if (!id || !number || capacity === null) return null;
  return { id, number, capacity };
}

function normalizeSessionTable(raw: Record<string, unknown> | null | undefined) {
  if (!raw || typeof raw !== 'object') return null;
  const table = normalizeTable(raw);
  return table;
}

function normalizeOrder(raw: Record<string, unknown>): Order {
  return {
    id: String(raw.id),
    orderNo: Number(raw.orderNo ?? raw.order_no ?? 0),
    checkoutSessionId: String(raw.checkoutSessionId ?? raw.checkout_session_id ?? ''),
    status: (raw.status ?? 'PENDING') as Order['status'],
    totalAmountCents: Number(raw.totalAmountCents ?? raw.total_amount_cents ?? 0),
    paymentStatus: (raw.paymentStatus ?? raw.payment_status ?? 'UNPAID') as Order['paymentStatus'],
    paymentMethod: (raw.paymentMethod ?? raw.payment_method ?? null) as Order['paymentMethod'],
    paidAt: typeof raw.paidAt === 'string' ? raw.paidAt : typeof raw.paid_at === 'string' ? raw.paid_at : null,
    orderType: (raw.orderType ?? raw.order_type ?? 'DINING') as Order['orderType'],
    customerName: String(raw.customerName ?? raw.customer_name ?? ''),
    tableId: typeof raw.tableId === 'string' ? raw.tableId : typeof raw.table_id === 'string' ? raw.table_id : null,
    tableSessionId:
      typeof raw.tableSessionId === 'string'
        ? raw.tableSessionId
        : typeof raw.table_session_id === 'string'
          ? raw.table_session_id
          : null,
    items: Array.isArray(raw.items) ? (raw.items as Order['items']) : undefined,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
  };
}

function normalizeSession(raw: Record<string, unknown>): TableSession {
  const ordersRaw = raw.orders;
  const orders = Array.isArray(ordersRaw)
    ? ordersRaw.map((order) => normalizeOrder(order as Record<string, unknown>))
    : undefined;

  return {
    id: String(raw.id),
    status: (raw.status ?? 'ACTIVE') as TableSession['status'],
    openedAt: String(raw.openedAt ?? raw.opened_at ?? ''),
    closedAt:
      typeof raw.closedAt === 'string'
        ? raw.closedAt
        : typeof raw.closed_at === 'string'
          ? raw.closed_at
          : null,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
    tableId: String(raw.tableId ?? raw.table_id ?? ''),
    table: normalizeSessionTable(raw.table as Record<string, unknown> | undefined),
    orders,
  };
}

function normalizeSessionsResponse(payload: unknown): TableSession[] {
  const list = Array.isArray(payload)
    ? payload
    : ((payload as { data?: unknown; sessions?: unknown })?.data ??
      (payload as { sessions?: unknown })?.sessions ??
      []);

  if (!Array.isArray(list)) return [];
  return list.map((item) => normalizeSession(item as Record<string, unknown>));
}

function normalizeCheckout(raw: Record<string, unknown>): SessionCheckout {
  const session = normalizeSession(raw);
  const summaryRaw = raw.summary as Record<string, unknown> | undefined;
  const summary = {
    orderCount: Number(summaryRaw?.orderCount ?? summaryRaw?.order_count ?? 0),
    payableOrderCount: Number(summaryRaw?.payableOrderCount ?? summaryRaw?.payable_order_count ?? 0),
    paidOrderCount: Number(summaryRaw?.paidOrderCount ?? summaryRaw?.paid_order_count ?? 0),
    payableOrderIds: Array.isArray(summaryRaw?.payableOrderIds)
      ? (summaryRaw.payableOrderIds as string[])
      : Array.isArray(summaryRaw?.payable_order_ids)
        ? (summaryRaw.payable_order_ids as string[])
        : [],
    sessionTotalCents: Number(summaryRaw?.sessionTotalCents ?? summaryRaw?.session_total_cents ?? 0),
    payableTotalCents: Number(summaryRaw?.payableTotalCents ?? summaryRaw?.payable_total_cents ?? 0),
    paidTotalCents: Number(summaryRaw?.paidTotalCents ?? summaryRaw?.paid_total_cents ?? 0),
    hasOutstandingBalance: Boolean(
      summaryRaw?.hasOutstandingBalance ?? summaryRaw?.has_outstanding_balance ?? false
    ),
  };

  return { ...session, orders: session.orders ?? [], summary };
}

function normalizeTablesForPicker(payload: unknown): TableOption[] {
  const list = Array.isArray(payload)
    ? payload
    : ((payload as { data?: unknown; tables?: unknown })?.data ??
      (payload as { tables?: unknown })?.tables ??
      []);

  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      const table = normalizeTable(item as Record<string, unknown>);
      if (!table) return null;
      const sessionsRaw =
        (item as Record<string, unknown>).sessions ??
        (item as Record<string, unknown>).tableSessions ??
        (item as Record<string, unknown>).table_sessions;
      const hasActiveSession = Array.isArray(sessionsRaw) && sessionsRaw.length > 0;
      return { ...table, hasActiveSession };
    })
    .filter((table): table is TableOption => table !== null)
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
}

function buildSessionsPath(statusFilter: SessionStatusFilter, query: string) {
  const params = new URLSearchParams();
  if (statusFilter !== 'ALL') params.set('status', statusFilter);
  const q = query.trim();
  if (q) params.set('table', q);
  const search = params.toString();
  return `/api/table-sessions${search ? `?${search}` : ''}`;
}

function filterSessionsLocally(sessions: TableSession[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return sessions;
  return sessions.filter((session) => (session.table?.number ?? '').toLowerCase().includes(q));
}

export default function SessionsScreen() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === 'dark';
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatusFilter>('ACTIVE');
  const [isCreateVisible, setCreateVisible] = useState(false);
  const [isDetailVisible, setDetailVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TableSession | null>(null);

  const withToken = async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in again to manage sessions.');
    return token;
  };

  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sessions', statusFilter],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const payload = await apiRequest<unknown>(
        await withToken(),
        buildSessionsPath(statusFilter, '')
      );
      return normalizeSessionsResponse(payload);
    },
  });

  const { data: tables = [], isLoading: isLoadingTables } = useQuery({
    queryKey: ['tables'],
    enabled: isLoaded && isSignedIn && isCreateVisible,
    queryFn: async () => {
      const payload = await apiRequest<unknown>(await withToken(), '/api/tables');
      return normalizeTablesForPicker(payload);
    },
  });

  const {
    data: checkout,
    isLoading: isLoadingCheckout,
  } = useQuery({
    queryKey: ['session-checkout', selectedSession?.id],
    enabled: isLoaded && isSignedIn && isDetailVisible && !!selectedSession?.id,
    queryFn: async () => {
      const payload = await apiRequest<unknown>(
        await withToken(),
        `/api/orders/checkout/table/${selectedSession!.id}`
      );
      return normalizeCheckout(payload as Record<string, unknown>);
    },
  });

  const invalidateSessions = () => {
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
  };

  const createMutation = useMutation({
    mutationFn: async (tableId: string) =>
      apiRequest<TableSession>(await withToken(), '/api/table-sessions/create', {
        method: 'POST',
        body: JSON.stringify({ tableId }),
      }),
    onSuccess: (created) => {
      invalidateSessions();
      setCreateVisible(false);
      setSelectedSession(normalizeSession(created as unknown as Record<string, unknown>));
      setDetailVisible(true);
    },
  });

  const closeMutation = useMutation({
    mutationFn: async ({
      sessionId,
      orderIds,
      paymentMethod,
    }: {
      sessionId: string;
      orderIds: string[];
      paymentMethod: PaymentMethod;
    }) =>
      apiRequest(await withToken(), '/api/orders/checkout/table/mark-paid', {
        method: 'POST',
        body: JSON.stringify({ tableSessionId: sessionId, orderIds, paymentMethod }),
      }),
    onSuccess: () => {
      invalidateSessions();
      setDetailVisible(false);
      setSelectedSession(null);
    },
  });

  const filteredSessions = filterSessionsLocally(sessions, query);
  const activeCount = sessions.filter(
    (session) => session.status === 'ACTIVE' || session.status === 'CHECKOUT_PENDING'
  ).length;
  const closedCount = sessions.filter((session) => session.status === 'CLOSED').length;

  const openCreate = () => {
    createMutation.reset();
    setCreateVisible(true);
  };

  const openDetail = (session: TableSession) => {
    closeMutation.reset();
    setSelectedSession(session);
    setDetailVisible(true);
  };

  const confirmCloseSession = (paymentMethod: PaymentMethod) => {
    if (!selectedSession || !checkout) return;

    const orderIds = checkout.summary.payableOrderIds;
    const title = orderIds.length > 0 ? 'Close & mark paid' : 'Close session';
    const message =
      orderIds.length > 0
        ? `Mark ${orderIds.length} order${orderIds.length === 1 ? '' : 's'} as paid and close this session?`
        : 'Close this session and free the table?';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: () =>
          closeMutation.mutate({
            sessionId: selectedSession.id,
            orderIds,
            paymentMethod,
          }),
      },
    ]);
  };

  const statusFilters: { value: SessionStatusFilter; label: string }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'ALL', label: 'All' },
  ];

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
          Sign in from the Home tab to manage sessions.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-background dark:bg-background-dark"
        contentContainerClassName="gap-6 px-5 py-7"
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag">
        <View className="gap-2">
          <Text className="text-4xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
            Sessions
          </Text>
          <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
            {isLoading
              ? 'Loading sessions...'
              : `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'} · ${activeCount} active · ${closedCount} closed`}
          </Text>
        </View>

        {!isError ? (
          <View className="gap-3">
            <View
              className="flex-row items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 dark:border-border-dark dark:bg-card-dark"
              style={{ borderCurve: 'continuous' }}>
              <Ionicons name="search" size={18} color="#8E8E93" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by table number"
                placeholderTextColor="#8E8E93"
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                returnKeyType="search"
                className="flex-1 text-base text-foreground dark:text-foreground-dark"
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2">
              {statusFilters.map((option) => {
                const isActive = option.value === statusFilter;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setStatusFilter(option.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    className={`rounded-full px-4 py-2 ${
                      isActive
                        ? 'bg-primary dark:bg-primary-dark'
                        : 'border border-border bg-card dark:border-border-dark dark:bg-card-dark'
                    }`}>
                    <Text
                      className={`text-sm font-semibold ${
                        isActive
                          ? 'text-primary-foreground dark:text-primary-foreground-dark'
                          : 'text-neutral-600 dark:text-neutral-300'
                      }`}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {isError ? (
          <View
            className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
            style={{ borderCurve: 'continuous' }}>
            <View className="gap-2">
              <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
                Could not load sessions
              </Text>
              <Text className="text-base leading-6 text-red-700 dark:text-red-300">
                {error instanceof Error ? error.message : 'Unable to load sessions.'}
              </Text>
            </View>
            <Button onPress={() => refetch()}>Try again</Button>
          </View>
        ) : null}

        {!isLoading && !isError && sessions.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              No sessions yet. Tap the + button to open a session for a table.
            </Text>
          </View>
        ) : null}

        {!isLoading && !isError && sessions.length > 0 && filteredSessions.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              No sessions match your search.
            </Text>
          </View>
        ) : null}

        {filteredSessions.map((session) => (
          <SessionCard key={session.id} session={session} onPress={() => openDetail(session)} />
        ))}
      </ScrollView>

      <Pressable
        onPress={openCreate}
        accessibilityRole="button"
        accessibilityLabel="Open session"
        hitSlop={8}
        className="absolute bottom-24 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80 dark:bg-primary-dark"
        style={{
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}>
        <Ionicons name="add" size={30} color={isDark ? '#18181B' : '#FAFAFA'} />
      </Pressable>

      <SessionCreateModal
        visible={isCreateVisible}
        tables={tables}
        isLoadingTables={isLoadingTables}
        onClose={() => setCreateVisible(false)}
        onSubmit={(tableId) => createMutation.mutate(tableId)}
        isSubmitting={createMutation.isPending}
        errorMessage={createMutation.isError ? (createMutation.error as Error).message : null}
      />

      <SessionDetailModal
        visible={isDetailVisible}
        session={selectedSession}
        checkout={checkout ?? null}
        isLoadingCheckout={isLoadingCheckout}
        onClose={() => {
          setDetailVisible(false);
          setSelectedSession(null);
        }}
        onCloseSession={confirmCloseSession}
        isClosing={closeMutation.isPending}
        errorMessage={closeMutation.isError ? (closeMutation.error as Error).message : null}
      />
    </>
  );
}
