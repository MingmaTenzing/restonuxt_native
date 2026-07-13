import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import { ResponsiveCardGrid, ScreenScroll } from '@/components/screen-scroll';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import {
  createStockItem,
  deleteStockItem,
  fetchStockItems,
  updateStockLevel,
} from './api';
import { StockFormModal } from './stock-form-modal';
import { StockItemCard } from './stock-item-card';
import { StockQrModal } from './stock-qr-modal';
import { StockRestockModal } from './stock-restock-modal';
import { computeStockStats, filterStockItems } from './stock-stats';
import {
  STOCK_CATEGORY_LABELS,
  type StockFilter,
  type StockItem,
  type StockItemInput,
} from './types';

const FILTER_OPTIONS: { value: StockFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low stock' },
  { value: 'INGREDIENTS', label: 'Ingredients' },
  { value: 'BEVERAGES', label: 'Beverages' },
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'OTHER', label: 'Other' },
];

export default function StockScreen() {
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { isTablet, fabStyle } = useResponsiveLayout();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [isFormVisible, setFormVisible] = useState(false);
  const [restockItem, setRestockItem] = useState<StockItem | null>(null);
  const [restockMode, setRestockMode] = useState<'add' | 'set'>('add');
  const [qrItem, setQrItem] = useState<StockItem | null>(null);
  const [detailItem, setDetailItem] = useState<StockItem | null>(null);

  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['stock'],
    enabled: isReady,
    queryFn: () => fetchStockItems(api),
  });

  const invalidateStock = () => queryClient.invalidateQueries({ queryKey: ['stock'] });

  const createMutation = useMutation({
    mutationFn: (input: StockItemInput) => createStockItem(api, input),
    onSuccess: () => {
      invalidateStock();
      setFormVisible(false);
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, currentStock }: { id: string; currentStock: number }) =>
      updateStockLevel(api, id, currentStock),
    onSuccess: () => {
      invalidateStock();
      setRestockItem(null);
      setDetailItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (item: StockItem) => deleteStockItem(api, item.id),
    onSuccess: () => {
      invalidateStock();
      setDetailItem(null);
    },
  });

  const stats = computeStockStats(items);
  const visibleItems = filterStockItems(items, filter, query);

  const openRestock = (item: StockItem, mode: 'add' | 'set' = 'add') => {
    setRestockMode(mode);
    setRestockItem(item);
    updateStockMutation.reset();
  };

  const confirmDelete = (item: StockItem) => {
    Alert.alert('Remove item', `Delete “${item.name}” from inventory? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(item),
      },
    ]);
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-base font-medium text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-center text-xl font-semibold text-foreground">Sign in required</Text>
        <Text className="mt-2 text-center text-base leading-6 text-muted-foreground">
          Sign in from the Home tab to manage stock.
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
            Stock
          </Text>
          <Text className="text-base leading-6 text-muted-foreground">
            {isLoading
              ? 'Loading inventory...'
              : `${items.length} ${items.length === 1 ? 'item' : 'items'} tracked`}
          </Text>
        </View>

        {!isError ? (
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.push('/stock/scan')}
              accessibilityRole="button"
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 active:opacity-70"
              style={{ borderCurve: 'continuous' }}>
              <Ionicons name="scan-outline" size={18} color={isDark ? '#E4E4E7' : '#18181B'} />
              <Text className="text-sm font-semibold text-foreground">Scan QR</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/stock/qr-labels')}
              accessibilityRole="button"
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 active:opacity-70"
              style={{ borderCurve: 'continuous' }}>
              <Ionicons name="qr-code-outline" size={18} color={isDark ? '#E4E4E7' : '#18181B'} />
              <Text className="text-sm font-semibold text-foreground">QR labels</Text>
            </Pressable>
          </View>
        ) : null}

        {!isError && items.length > 0 ? (
          <View className="flex-row gap-2">
            <View
              className="flex-1 rounded-2xl border border-border bg-card p-3"
              style={{ borderCurve: 'continuous' }}>
              <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total
              </Text>
              <Text className="mt-1 text-2xl font-bold text-foreground">{stats.total}</Text>
            </View>
            <View
              className="flex-1 rounded-2xl border border-amber-400/50 bg-amber-500/10 p-3"
              style={{ borderCurve: 'continuous' }}>
              <Text className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Low
              </Text>
              <Text className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-200">
                {stats.lowStock}
              </Text>
            </View>
            <View
              className="flex-1 rounded-2xl border border-border bg-card p-3"
              style={{ borderCurve: 'continuous' }}>
              <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categories
              </Text>
              <Text className="mt-1 text-2xl font-bold text-foreground">{stats.categories}</Text>
            </View>
          </View>
        ) : null}

        {!isError ? (
          <View className="gap-3">
            <View
              className="flex-row items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3"
              style={{ borderCurve: 'continuous' }}>
              <Ionicons name="search" size={18} color="#8E8E93" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search stock"
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
              {FILTER_OPTIONS.map((option) => {
                const isActive = option.value === filter;
                const count =
                  option.value === 'low' && stats.lowStock > 0 ? stats.lowStock : undefined;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setFilter(option.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    className={`flex-row items-center gap-1.5 rounded-full px-4 py-2 ${
                      isActive ? 'bg-primary' : 'border border-border bg-card'
                    }`}>
                    <Text
                      className={`text-sm font-semibold ${
                        isActive ? 'text-primary-foreground' : 'text-neutral-600 dark:text-neutral-300'
                      }`}>
                      {option.label}
                    </Text>
                    {count !== undefined ? (
                      <View
                        className={`rounded-full px-1.5 py-0.5 ${
                          isActive ? 'bg-primary-foreground/20' : 'bg-amber-500/15'
                        }`}>
                        <Text
                          className={`text-[10px] font-bold ${
                            isActive
                              ? 'text-primary-foreground'
                              : 'text-amber-700 dark:text-amber-300'
                          }`}>
                          {count}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <ResponsiveCardGrid>
          {visibleItems.map((item) => (
            <StockItemCard
              key={item.id}
              item={item}
              onPress={() => setDetailItem(item)}
              onRestock={() => openRestock(item, 'add')}
              onShowQr={() => setQrItem(item)}
            />
          ))}
        </ResponsiveCardGrid>

        {isError ? (
          <View
            className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
            style={{ borderCurve: 'continuous' }}>
            <View className="gap-2">
              <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
                Could not load stock
              </Text>
              <Text className="text-base leading-6 text-red-700 dark:text-red-300">
                {error instanceof Error ? error.message : 'Unable to load inventory.'}
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
              No stock items yet. Tap + to add your first ingredient or supply.
            </Text>
          </View>
        ) : null}

        {!isLoading && !isError && items.length > 0 && visibleItems.length === 0 ? (
          <View
            className="rounded-3xl border border-border bg-card p-5"
            style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
            <Text className="text-base leading-6 text-muted-foreground">
              No items match your filters.
            </Text>
          </View>
        ) : null}
      </ScreenScroll>

      <Pressable
        onPress={() => {
          createMutation.reset();
          setFormVisible(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Add stock item"
        hitSlop={8}
        className="absolute h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
        style={{
          ...fabStyle,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}>
        <Ionicons name="add" size={30} color={isDark ? '#18181B' : '#FAFAFA'} />
      </Pressable>

      <StockFormModal
        visible={isFormVisible}
        onClose={() => setFormVisible(false)}
        onSubmit={(input) => createMutation.mutate(input)}
        isSubmitting={createMutation.isPending}
        errorMessage={createMutation.isError ? (createMutation.error as Error).message : null}
      />

      <StockRestockModal
        visible={restockItem !== null}
        item={restockItem}
        mode={restockMode}
        onClose={() => setRestockItem(null)}
        onSubmit={(currentStock) => {
          if (!restockItem) return;
          updateStockMutation.mutate({ id: restockItem.id, currentStock });
        }}
        isSubmitting={updateStockMutation.isPending}
        errorMessage={
          updateStockMutation.isError ? (updateStockMutation.error as Error).message : null
        }
      />

      <StockQrModal visible={qrItem !== null} item={qrItem} onClose={() => setQrItem(null)} />

      {detailItem ? (
        <DetailSheet
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onRestock={() => openRestock(detailItem, 'add')}
          onSetLevel={() => openRestock(detailItem, 'set')}
          onShowQr={() => {
            setDetailItem(null);
            setQrItem(detailItem);
          }}
          onDelete={() => confirmDelete(detailItem)}
          isDeleting={deleteMutation.isPending}
        />
      ) : null}
    </>
  );
}

function DetailSheet({
  item,
  onClose,
  onRestock,
  onSetLevel,
  onShowQr,
  onDelete,
  isDeleting,
}: {
  item: StockItem;
  onClose: () => void;
  onRestock: () => void;
  onSetLevel: () => void;
  onShowQr: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="gap-4 rounded-t-3xl bg-background px-5 pb-10 pt-5"
          style={{ borderCurve: 'continuous' }}
          onPress={(event) => event.stopPropagation()}>
          <View className="gap-1">
            <Text className="text-2xl font-bold text-foreground">{item.name}</Text>
            <Text className="text-base text-muted-foreground">
              {STOCK_CATEGORY_LABELS[item.category]}
              {item.supplier ? ` · ${item.supplier}` : ''}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-muted p-4" style={{ borderCurve: 'continuous' }}>
              <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                On hand
              </Text>
              <Text className="mt-1 text-3xl font-bold text-foreground">
                {item.currentStock}{' '}
                <Text className="text-lg font-semibold text-muted-foreground">{item.unit}</Text>
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-muted p-4" style={{ borderCurve: 'continuous' }}>
              <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reorder
              </Text>
              <Text className="mt-1 text-lg font-semibold text-foreground">
                {item.reorderLevel} {item.unit}
              </Text>
              <Text className="text-sm text-muted-foreground">
                +{item.reorderQuantity} {item.unit} typical
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <Button onPress={onRestock}>Add stock</Button>
            <Button onPress={onSetLevel}>Set exact level</Button>
            <Pressable
              onPress={onShowQr}
              className="rounded-full border border-border py-3.5 active:opacity-70"
              style={{ borderCurve: 'continuous' }}>
              <Text className="text-center text-base font-semibold text-foreground">Show QR code</Text>
            </Pressable>
            <Pressable
              onPress={onDelete}
              disabled={isDeleting}
              className="rounded-full border border-red-200 py-3.5 active:opacity-70 dark:border-red-900/50"
              style={{ borderCurve: 'continuous' }}>
              <Text className="text-center text-base font-semibold text-red-600 dark:text-red-400">
                {isDeleting ? 'Deleting...' : 'Delete item'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
