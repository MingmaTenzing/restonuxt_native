import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import { ResponsiveCardGrid, ScreenScroll } from '@/components/screen-scroll';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import { MenuItemCard } from './menu-item-card';
import { buildCreateMenuItemBody } from './menu-form-utils';
import { MenuItemFormModal } from './menu-item-form-modal';
import type { MenuItem, MenuItemInput, MenuOption, MenuOptionInput } from './types';

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
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === 'dark';
  const { isTablet, fabStyle } = useResponsiveLayout();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['menu'],
    enabled: isReady,
    queryFn: () => api<MenuItem[]>('/api/menu'),
  });

  const invalidateMenu = () => queryClient.invalidateQueries({ queryKey: ['menu'] });

  const saveMutation = useMutation({
    mutationFn: async (input: MenuItemInput) =>
      editingItem
        ? api(`/api/menu/${editingItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(input),
          })
        : api('/api/menu', {
            method: 'POST',
            body: JSON.stringify(buildCreateMenuItemBody(input)),
          }),
    onSuccess: () => {
      invalidateMenu();
      setModalVisible(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: MenuItem) => api(`/api/menu/${item.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateMenu();
      setModalVisible(false);
      setEditingItem(null);
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: async ({ item, isAvailable }: { item: MenuItem; isAvailable: boolean }) =>
      api(`/api/menu/update_availability/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable }),
      }),
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

  const createOptionMutation = useMutation({
    mutationFn: async ({
      menuItemId,
      input,
    }: {
      menuItemId: string;
      input: MenuOptionInput;
    }) =>
      api<MenuOption>('/api/menu/menu_item_options', {
        method: 'POST',
        body: JSON.stringify({
          create_menu_option: {
            menuItemId,
            name: input.name,
            priceCents: input.priceCents,
          },
        }),
      }),
    onSuccess: () => invalidateMenu(),
  });

  const updateOptionMutation = useMutation({
    mutationFn: async ({
      optionId,
      input,
    }: {
      optionId: string;
      input: MenuOptionInput;
    }) =>
      api<MenuOption>(`/api/menu/menu_item_options/${optionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          update_menu_option: {
            name: input.name,
            priceCents: input.priceCents,
          },
        }),
      }),
    onSuccess: () => invalidateMenu(),
  });

  const categories = [...new Set(items.map((item) => item.category))];
  const filteredItems = searchItems(
    categoryFilter ? items.filter((item) => item.category === categoryFilter) : items,
    query
  );
  const sections = groupByCategory(filteredItems);
  const availableCount = items.filter((item) => item.isAvailable).length;

  const editingItemLive = editingItem
    ? (items.find((item) => item.id === editingItem.id) ?? editingItem)
    : null;

  const openAdd = () => {
    setEditingItem(null);
    saveMutation.reset();
    deleteMutation.reset();
    createOptionMutation.reset();
    updateOptionMutation.reset();
    setModalVisible(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    saveMutation.reset();
    deleteMutation.reset();
    createOptionMutation.reset();
    updateOptionMutation.reset();
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
          Sign in from the Home tab to manage the menu.
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
            Menu
          </Text>
          <Text className="text-base leading-6 text-muted-foreground">
            {isLoading
              ? 'Loading menu...'
              : `${items.length} ${items.length === 1 ? 'item' : 'items'} · ${availableCount} available`}
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
                placeholder="Search dishes"
                placeholderTextColor="#8E8E93"
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                returnKeyType="search"
                className="flex-1 text-base text-foreground"
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
                          ? 'bg-primary'
                          : 'border border-border bg-card'
                      }`}>
                      <Text
                        className={`text-sm font-semibold ${
                          isActive
                            ? 'text-primary-foreground'
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
            className="rounded-3xl border border-border bg-card p-5"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground">
              No menu items yet. Tap the + button to add your first dish.
            </Text>
          </View>
        ) : null}

        {!isLoading && !isError && items.length > 0 && filteredItems.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground">
              No items match your search.
            </Text>
          </View>
        ) : null}

        {sections.map(([category, categoryItems]) => (
          <View key={category} className="gap-3">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </Text>
              <Text className="text-xs font-medium text-muted-foreground">
                {categoryItems.length}
              </Text>
            </View>
            <ResponsiveCardGrid>
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
            </ResponsiveCardGrid>
          </View>
        ))}
      </ScreenScroll>

      <Pressable
        onPress={openAdd}
        accessibilityRole="button"
        accessibilityLabel="Add menu item"
        hitSlop={8}
        className="absolute h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
        style={{
          ...fabStyle,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}>
        <Ionicons name="add" size={30} color={isDark ? '#18181B' : '#FAFAFA'} />
      </Pressable>

      <MenuItemFormModal
        visible={isModalVisible}
        item={editingItemLive}
        categories={categories}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
        }}
        onSubmit={(input) => saveMutation.mutate(input)}
        onDelete={confirmDelete}
        onCreateOption={(menuItemId, input) =>
          createOptionMutation.mutate({ menuItemId, input })
        }
        onUpdateOption={(optionId, input) => updateOptionMutation.mutate({ optionId, input })}
        isSubmitting={saveMutation.isPending}
        isDeleting={deleteMutation.isPending}
        isSavingOption={createOptionMutation.isPending || updateOptionMutation.isPending}
        errorMessage={
          saveMutation.isError
            ? (saveMutation.error as Error).message
            : deleteMutation.isError
              ? (deleteMutation.error as Error).message
              : null
        }
        optionError={
          createOptionMutation.isError
            ? (createOptionMutation.error as Error).message
            : updateOptionMutation.isError
              ? (updateOptionMutation.error as Error).message
              : null
        }
      />
    </>
  );
}
