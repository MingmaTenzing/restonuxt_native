import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import { apiUrl } from '@/utils/api';

import { MenuItemCard } from './menu-item-card';
import { MenuItemFormModal } from './menu-item-form-modal';
import type { MenuItem, MenuItemInput } from './types';

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
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
}

function groupByCategory(items: MenuItem[]) {
  const groups = new Map<string, MenuItem[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  return [...groups.entries()];
}

function searchItems(items: MenuItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) || (item.description ?? '').toLowerCase().includes(q)
  );
}

export default function MenuScreen() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === 'dark';
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const withToken = async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in again to manage the menu.');
    return token;
  };

  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['menu'],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => apiRequest<MenuItem[]>(await withToken(), '/api/menu'),
  });

  const invalidateMenu = () => queryClient.invalidateQueries({ queryKey: ['menu'] });

  const saveMutation = useMutation({
    mutationFn: async (input: MenuItemInput) => {
      const token = await withToken();
      return editingItem
        ? apiRequest(token, `/api/menu/${editingItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(input),
          })
        : apiRequest(token, '/api/menu', { method: 'POST', body: JSON.stringify(input) });
    },
    onSuccess: () => {
      invalidateMenu();
      setModalVisible(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: MenuItem) =>
      apiRequest(await withToken(), `/api/menu/${item.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateMenu();
      setModalVisible(false);
      setEditingItem(null);
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: async ({ item, isAvailable }: { item: MenuItem; isAvailable: boolean }) =>
      apiRequest(await withToken(), `/api/menu/update_availability/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable }),
      }),
    // Optimistically flip the switch so the UI feels instant.
    onMutate: async ({ item, isAvailable }) => {
      await queryClient.cancelQueries({ queryKey: ['menu'] });
      const previous = queryClient.getQueryData<MenuItem[]>(['menu']);
      queryClient.setQueryData<MenuItem[]>(['menu'], (old = []) =>
        old.map((it) => (it.id === item.id ? { ...it, isAvailable } : it))
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['menu'], context.previous);
    },
    onSettled: () => invalidateMenu(),
  });

  const categories = [...new Set(items.map((item) => item.category))];
  const filteredItems = searchItems(
    categoryFilter ? items.filter((item) => item.category === categoryFilter) : items,
    query
  );
  const sections = groupByCategory(filteredItems);
  const availableCount = items.filter((item) => item.isAvailable).length;

  const openAdd = () => {
    setEditingItem(null);
    saveMutation.reset();
    deleteMutation.reset();
    setModalVisible(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    saveMutation.reset();
    deleteMutation.reset();
    setModalVisible(true);
  };

  const confirmDelete = (item: MenuItem) => {
    Alert.alert('Delete item', `Remove “${item.name}” from the menu? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(item) },
    ]);
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
          Sign in from the Home tab to manage the menu.
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
            Menu
          </Text>
          <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
            {isLoading
              ? 'Loading menu...'
              : `${items.length} ${items.length === 1 ? 'item' : 'items'} · ${availableCount} available`}
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
                placeholder="Search dishes"
                placeholderTextColor="#8E8E93"
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                returnKeyType="search"
                className="flex-1 text-base text-foreground dark:text-foreground-dark"
              />
            </View>

            {categories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2">
                {[null, ...categories].map((option) => {
                  const isActive = option === categoryFilter;
                  return (
                    <Pressable
                      key={option ?? 'all'}
                      onPress={() => setCategoryFilter(option)}
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
                        {option ?? 'All'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
        ) : null}

        {isError ? (
          <View
            className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
            style={{ borderCurve: 'continuous' }}>
            <View className="gap-2">
              <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
                Could not load the menu
              </Text>
              <Text className="text-base leading-6 text-red-700 dark:text-red-300">
                {error instanceof Error ? error.message : 'Unable to load the menu.'}
              </Text>
            </View>
            <Button onPress={() => refetch()}>Try again</Button>
          </View>
        ) : null}

        {!isLoading && !isError && items.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              No menu items yet. Tap the + button to add your first dish.
            </Text>
          </View>
        ) : null}

        {!isLoading && !isError && items.length > 0 && filteredItems.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              No items match your search.
            </Text>
          </View>
        ) : null}

        {sections.map(([category, categoryItems]) => (
          <View key={category} className="gap-3">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-sm font-semibold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground-dark">
                {category}
              </Text>
              <Text className="text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
                {categoryItems.length}
              </Text>
            </View>
            {categoryItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onPress={() => openEdit(item)}
                isToggling={
                  availabilityMutation.isPending &&
                  availabilityMutation.variables?.item.id === item.id
                }
                onToggleAvailability={(isAvailable) =>
                  availabilityMutation.mutate({ item, isAvailable })
                }
              />
            ))}
          </View>
        ))}
      </ScrollView>

      <Pressable
        onPress={openAdd}
        accessibilityRole="button"
        accessibilityLabel="Add menu item"
        hitSlop={8}
        className="absolute bottom-24 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80 dark:bg-primary-dark"
        style={{
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}>
        <Ionicons name="add" size={30} color={isDark ? '#18181B' : '#FAFAFA'} />
      </Pressable>

      <MenuItemFormModal
        visible={isModalVisible}
        item={editingItem}
        categories={categories}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
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
