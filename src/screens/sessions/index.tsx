import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import { ResponsiveCardGrid, ScreenScroll } from '@/components/screen-scroll';
import { CardGridSkeleton, ListScreenSkeleton } from '@/components/skeleton';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import type { PaymentMethod } from '@/screens/orders/types';
import type { Table } from '@/screens/tables/types';

import { SessionCard } from './session-card';
import { SessionCreateModal } from './session-create-modal';
import { SessionDetailModal } from './session-detail-modal';
import type {
  SessionCheckout,
  SessionStatusFilter,
  TableOption,
  TableSession,
} from './types';

function mapTableOptions(tables: Table[]): TableOption[] {
  return tables
    .map((table) => ({
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      hasActiveSession: (table.sessions?.length ?? 0) > 0,
    }))
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
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === 'dark';
  const { isTablet, fabStyle } = useResponsiveLayout();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatusFilter>('ACTIVE');
  const [isCreateVisible, setCreateVisible] = useState(false);
  const [isDetailVisible, setDetailVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TableSession | null>(null);

  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['sessions', statusFilter],
    enabled: isReady,
    queryFn: () => api<TableSession[]>(buildSessionsPath(statusFilter, '')),
  });

  const { data: tables = [], isLoading: isLoadingTables } = useQuery({
    queryKey: ['tables'],
    enabled: isReady && isCreateVisible,
    queryFn: async () => mapTableOptions(await api<Table[]>('/api/tables')),
  });

  const {
    data: checkout,
    isLoading: isLoadingCheckout,
  } = useQuery({
    queryKey: ['session-checkout', selectedSession?.id],
    enabled: isReady && isDetailVisible && !!selectedSession?.id,
    queryFn: () => api<SessionCheckout>(`/api/orders/checkout/table/${selectedSession!.id}`),
  });

  const invalidateSessions = () => {
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
  };

  const createMutation = useMutation({
    mutationFn: async (tableId: string) =>
      api<TableSession>('/api/table-sessions/create', {
        method: 'POST',
        body: JSON.stringify({ tableId }),
      }),
    onSuccess: (created) => {
      invalidateSessions();
      setCreateVisible(false);
      setSelectedSession(created);
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
      api('/api/orders/checkout/table/mark-paid', {
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
      <View className="flex-1 bg-background">
        <ScreenScroll bottomInset={72}>
          <ListScreenSkeleton filters cards={4} />
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
          Sign in from the Home tab to manage sessions.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScreenScroll bottomInset={72} refreshing={isRefetching} onRefresh={() => refetch()}>
        <View className="gap-2">
          <Text
            className={`font-bold tracking-tight text-foreground ${
              isTablet ? 'text-3xl' : 'text-4xl'
            }`}>
            Sessions
          </Text>
          <Text className="text-base leading-6 text-muted-foreground">
            {isLoading
              ? 'Loading sessions...'
              : `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'} · ${activeCount} active · ${closedCount} closed`}
          </Text>
        </View>

        {!isError ? (
          <View className="gap-3">
            <View
              className="flex-row items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3"
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
                className="flex-1 text-base text-foreground"
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
            className="rounded-3xl border border-border bg-card p-5"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground">
              No sessions yet. Tap the + button to open a session for a table.
            </Text>
          </View>
        ) : null}

        {!isLoading && !isError && sessions.length > 0 && filteredSessions.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground">
              No sessions match your search.
            </Text>
          </View>
        ) : null}

        {isLoading ? (
          <CardGridSkeleton />
        ) : (
          <ResponsiveCardGrid>
            {filteredSessions.map((session) => (
              <SessionCard key={session.id} session={session} onPress={() => openDetail(session)} />
            ))}
          </ResponsiveCardGrid>
        )}
      </ScreenScroll>

      <Pressable
        onPress={openCreate}
        accessibilityRole="button"
        accessibilityLabel="Open session"
        hitSlop={8}
        className="absolute h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
        style={{
          ...fabStyle,
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
