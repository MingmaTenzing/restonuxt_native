import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import { apiUrl } from '@/utils/api';

import { TableCard } from './table-card';
import { TableFormModal } from './table-form-modal';
import type { Table, TableInput, TableUpdateInput } from './types';

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

function normalizeSession(raw: Record<string, unknown>) {
  const id = typeof raw.id === 'string' ? raw.id : null;
  const openedAt =
    typeof raw.openedAt === 'string'
      ? raw.openedAt
      : typeof raw.opened_at === 'string'
        ? raw.opened_at
        : null;
  if (!id || !openedAt) return null;
  return { id, openedAt };
}

function normalizeTable(raw: Record<string, unknown>): Table {
  const sessionsRaw = raw.sessions ?? raw.tableSessions ?? raw.table_sessions;
  const sessions = Array.isArray(sessionsRaw)
    ? sessionsRaw
        .map((session) => normalizeSession(session as Record<string, unknown>))
        .filter((session): session is NonNullable<typeof session> => session !== null)
    : undefined;

  return {
    id: String(raw.id),
    number: String(raw.number ?? raw.table_number ?? ''),
    capacity: Number(raw.capacity ?? 0),
    sessions,
  };
}

function normalizeTablesResponse(payload: unknown): Table[] {
  const list = Array.isArray(payload)
    ? payload
    : ((payload as { data?: unknown; tables?: unknown })?.data ??
      (payload as { tables?: unknown })?.tables ??
      []);

  if (!Array.isArray(list)) return [];
  return list
    .map((item) => normalizeTable(item as Record<string, unknown>))
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
}

function getTableLetter(tableNumber: string) {
  const first = tableNumber.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}

function letterLabel(letter: string) {
  return letter === '#' ? '0–9' : letter;
}

function searchTables(tables: Table[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return tables;
  return tables.filter((table) => table.number.toLowerCase().includes(q));
}

function groupByLetter(tables: Table[]) {
  const groups = new Map<string, Table[]>();
  for (const table of tables) {
    const letter = getTableLetter(table.number);
    const list = groups.get(letter) ?? [];
    list.push(table);
    groups.set(letter, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    })
    .map(([letter, groupTables]) => [
      letter,
      groupTables.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })),
    ] as const);
}

export default function TablesScreen() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === 'dark';
  const [query, setQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  const withToken = async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in again to manage tables.');
    return token;
  };

  const {
    data: tables = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tables'],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const payload = await apiRequest<unknown>(await withToken(), '/api/tables');
      return normalizeTablesResponse(payload);
    },
  });

  const invalidateTables = () => queryClient.invalidateQueries({ queryKey: ['tables'] });

  const saveMutation = useMutation({
    mutationFn: async (input: TableInput | TableUpdateInput) => {
      const token = await withToken();
      if (editingTable) {
        return apiRequest<Table>(token, '/api/tables', {
          method: 'PUT',
          body: JSON.stringify({
            table_id: editingTable.id,
            capacity: (input as TableUpdateInput).capacity,
          }),
        });
      }
      const createInput = input as TableInput;
      return apiRequest<Table>(token, '/api/tables', {
        method: 'POST',
        body: JSON.stringify({
          table_number: createInput.number,
          capacity: createInput.capacity,
        }),
      });
    },
    onSuccess: () => {
      invalidateTables();
      setModalVisible(false);
      setEditingTable(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (table: Table) =>
      apiRequest(await withToken(), `/api/tables/${table.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateTables();
      setModalVisible(false);
      setEditingTable(null);
    },
  });

  const filteredTables = searchTables(tables, query);
  const sections = groupByLetter(filteredTables);
  const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);
  const occupiedCount = tables.filter((table) => (table.sessions?.length ?? 0) > 0).length;

  const openAdd = () => {
    setEditingTable(null);
    saveMutation.reset();
    deleteMutation.reset();
    setModalVisible(true);
  };

  const openEdit = (table: Table) => {
    setEditingTable(table);
    saveMutation.reset();
    deleteMutation.reset();
    setModalVisible(true);
  };

  const confirmDelete = (table: Table) => {
    Alert.alert(
      'Delete table',
      `Remove table “${table.number}”? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(table) },
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
          Sign in from the Home tab to manage tables.
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
            Tables
          </Text>
          <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
            {isLoading
              ? 'Loading tables...'
              : `${tables.length} ${tables.length === 1 ? 'table' : 'tables'} · ${totalCapacity} seats · ${occupiedCount} active`}
          </Text>
        </View>

        {!isError ? (
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
        ) : null}

        {isError ? (
          <View
            className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
            style={{ borderCurve: 'continuous' }}>
            <View className="gap-2">
              <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
                Could not load tables
              </Text>
              <Text className="text-base leading-6 text-red-700 dark:text-red-300">
                {error instanceof Error ? error.message : 'Unable to load tables.'}
              </Text>
            </View>
            <Button onPress={() => refetch()}>Try again</Button>
          </View>
        ) : null}

        {!isLoading && !isError && tables.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              No tables yet. Tap the + button to add your first table.
            </Text>
          </View>
        ) : null}

        {!isLoading && !isError && tables.length > 0 && filteredTables.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              No tables match your search.
            </Text>
          </View>
        ) : null}

        {sections.map(([letter, letterTables]) => (
          <View key={letter} className="gap-3">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-sm font-semibold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground-dark">
                {letterLabel(letter)}
              </Text>
              <Text className="text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
                {letterTables.length}
              </Text>
            </View>
            {letterTables.map((table) => (
              <TableCard key={table.id} table={table} onPress={() => openEdit(table)} />
            ))}
          </View>
        ))}
      </ScrollView>

      <Pressable
        onPress={openAdd}
        accessibilityRole="button"
        accessibilityLabel="Add table"
        hitSlop={8}
        className="absolute bottom-24 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80 dark:bg-primary-dark"
        style={{
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}>
        <Ionicons name="add" size={30} color={isDark ? '#18181B' : '#FAFAFA'} />
      </Pressable>

      <TableFormModal
        visible={isModalVisible}
        table={editingTable}
        onClose={() => {
          setModalVisible(false);
          setEditingTable(null);
        }}
        onSubmit={(input) => saveMutation.mutate(input)}
        onDelete={confirmDelete}
        isSubmitting={saveMutation.isPending}
        isDeleting={deleteMutation.isPending}
        errorMessage={
          saveMutation.isError
            ? (saveMutation.error as Error).message
            : deleteMutation.isError
              ? (deleteMutation.error as Error).message
              : null
        }
      />
    </>
  );
}
