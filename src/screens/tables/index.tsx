import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import { ResponsiveCardGrid, ScreenScroll } from '@/components/screen-scroll';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import { TableCard } from './table-card';
import { TableFormModal } from './table-form-modal';
import type { Table, TableInput, TableUpdateInput } from './types';

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
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === 'dark';
  const { isTablet, fabStyle } = useResponsiveLayout();
  const [query, setQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  const {
    data: tables = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['tables'],
    enabled: isReady,
    queryFn: async () => {
      const tables = await api<Table[]>('/api/tables');
      return tables.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
    },
  });

  const invalidateTables = () => queryClient.invalidateQueries({ queryKey: ['tables'] });

  const saveMutation = useMutation({
    mutationFn: async (input: TableInput | TableUpdateInput) => {
      if (editingTable) {
        return api<Table>('/api/tables', {
          method: 'PUT',
          body: JSON.stringify({
            table_id: editingTable.id,
            capacity: (input as TableUpdateInput).capacity,
          }),
        });
      }
      const createInput = input as TableInput;
      return api<Table>('/api/tables', {
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
    mutationFn: async (table: Table) => api(`/api/tables/${table.id}`, { method: 'DELETE' }),
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
        <Text className="mt-2 text-center text-base leading-6 text-muted-foreground">
          Sign in from the Home tab to manage tables.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScreenScroll bottomInset={72} refreshing={isFetching} onRefresh={() => refetch()}>
        <View className="gap-2">
          <Text
            className={`font-bold tracking-tight text-foreground ${
              isTablet ? 'text-3xl' : 'text-4xl'
            }`}>
            Tables
          </Text>
          <Text className="text-base leading-6 text-muted-foreground">
            {isLoading
              ? 'Loading tables...'
              : `${tables.length} ${tables.length === 1 ? 'table' : 'tables'} · ${totalCapacity} seats · ${occupiedCount} active`}
          </Text>
        </View>

        {!isError ? (
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
            className="rounded-3xl border border-border bg-card p-5"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground">
              No tables yet. Tap the + button to add your first table.
            </Text>
          </View>
        ) : null}

        {!isLoading && !isError && tables.length > 0 && filteredTables.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground">
              No tables match your search.
            </Text>
          </View>
        ) : null}

        {sections.map(([letter, letterTables]) => (
          <View key={letter} className="gap-3">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {letterLabel(letter)}
              </Text>
              <Text className="text-xs font-medium text-muted-foreground">
                {letterTables.length}
              </Text>
            </View>
            <ResponsiveCardGrid>
              {letterTables.map((table) => (
                <TableCard key={table.id} table={table} onPress={() => openEdit(table)} />
              ))}
            </ResponsiveCardGrid>
          </View>
        ))}
      </ScreenScroll>

      <Pressable
        onPress={openAdd}
        accessibilityRole="button"
        accessibilityLabel="Add table"
        hitSlop={8}
        className="absolute h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
        style={{
          ...fabStyle,
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
