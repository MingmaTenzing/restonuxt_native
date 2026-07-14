import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CardGridSkeleton, ListScreenSkeleton } from '@/components/skeleton';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { formatMoney } from '@/utils/format-money';
import {
  createTableSession,
  fetchPosMenu,
  fetchPosTables,
  submitDiningOrder,
  submitTakeawayOrder,
} from './api';
import {
  addCartLine,
  buildOrderItemCreates,
  cartItemCount,
  cartTotalCents,
  clearCart,
  createCartLineId,
} from './cart';
import { PosCartBar } from './pos-cart-bar';
import { PosCartPanel } from './pos-cart-panel';
import { PosCartSheet } from './pos-cart-sheet';
import { PosDiningHeader } from './pos-dining-header';
import {
  applyEnterDiningOrder,
  applyModeChange as nextModeState,
  applyOpenedSession,
  applyReturnToTableSelect,
  isPosOrdering,
  openSessionConfirmCopy,
  resolveChangeTable,
  resolveModeChange,
  resolveTablePress,
  type DiningStep,
} from './pos-flow';
import { PosItemSheet } from './pos-item-sheet';
import { PosMenuCard } from './pos-menu-card';
import { getPosSubmitBlocker } from './pos-order';
import { PosTableSelect } from './pos-table-select';
import type { CartLine, PosMenuItem, PosMode, PosTable } from './types';

const MODES: { value: PosMode; label: string; hint: string }[] = [
  { value: 'DINING', label: 'Dining', hint: 'Pick a table first' },
  { value: 'TAKEAWAY', label: 'Takeaway', hint: 'Pack for pickup' },
];

function groupByCategory(items: PosMenuItem[]) {
  const groups = new Map<string, PosMenuItem[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  return [...groups.entries()];
}

function searchItems(items: PosMenuItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) || (item.description ?? '').toLowerCase().includes(q)
  );
}

function confirmDestructiveAction({
  title,
  message,
  confirmLabel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export default function PosScreen() {
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const {
    isTablet,
    gridGap,
    posProductCardWidth,
    posSidebarWidth,
    posScrollContentStyle,
    cardWidth,
    listColumns,
  } = useResponsiveLayout();

  const [mode, setMode] = useState<PosMode>('DINING');
  const [diningStep, setDiningStep] = useState<DiningStep>('pick-table');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('Guest');
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [isCartVisible, setCartVisible] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<PosMenuItem | null>(null);

  const isOrdering = isPosOrdering({ mode, diningStep });
  const tableCardWidth = listColumns > 1 ? cardWidth : undefined;

  const {
    data: menuItems = [],
    isLoading: isLoadingMenu,
    isError: isMenuError,
    error: menuError,
    refetch: refetchMenu,
    isRefetching: isRefetchingMenu,
  } = useQuery({
    queryKey: ['pos-menu'],
    enabled: isReady && isOrdering,
    queryFn: () => fetchPosMenu(api),
  });

  const {
    data: tables = [],
    isLoading: isLoadingTables,
    refetch: refetchTables,
    isRefetching: isRefetchingTables,
  } = useQuery({
    queryKey: ['pos-tables'],
    enabled: isReady && mode === 'DINING',
    queryFn: () => fetchPosTables(api),
  });

  const openSessionMutation = useMutation({
    mutationFn: async (tableId: string) => createTableSession(api, tableId),
    onSuccess: (session, tableId) => {
      queryClient.setQueryData<PosTable[]>(['pos-tables'], (current) =>
        current ? applyOpenedSession(current, tableId, session.id) : current
      );
      queryClient.invalidateQueries({ queryKey: ['pos-tables'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const items = buildOrderItemCreates(cartLines);
      const name = customerName.trim() || 'Guest';

      if (mode === 'DINING') {
        if (!selectedTableId) throw new Error('Select a table before submitting.');
        const table = tables.find((entry) => entry.id === selectedTableId);
        if (!table?.activeSessionId) {
          throw new Error('Open a table session before submitting a dining order.');
        }
        return submitDiningOrder(api, {
          tableId: selectedTableId,
          customerName: name,
          totalAmountCents: totalCents,
          items,
        });
      }

      return submitTakeawayOrder(api, {
        customerName: name,
        totalAmountCents: totalCents,
        items,
      });
    },
    onSuccess: (order) => {
      setCartLines([]);
      setCartVisible(false);
      submitMutation.reset();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      Alert.alert(
        'Order sent',
        `Order #${order.orderNo} is on its way to the kitchen.`,
        [{ text: 'OK' }]
      );
    },
  });

  const categories = useMemo(() => [...new Set(menuItems.map((item) => item.category))], [menuItems]);
  const filteredItems = searchItems(
    categoryFilter ? menuItems.filter((item) => item.category === categoryFilter) : menuItems,
    query
  );
  const sections = groupByCategory(filteredItems);
  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;
  const itemCount = cartItemCount(cartLines);
  const totalCents = cartTotalCents(cartLines);

  const destinationLabel = mode === 'DINING' ? (selectedTable?.number ?? null) : null;

  const submitLabel =
    mode === 'DINING'
      ? `Send to Table ${selectedTable?.number ?? ''} · ${formatMoney(totalCents)}`
      : `Send takeaway · ${formatMoney(totalCents)}`;

  const resetTicket = () => {
    setCartLines([]);
    setCartVisible(false);
    setCategoryFilter(null);
    setQuery('');
    setCustomizingItem(null);
  };

  const enterDiningOrder = (tableId: string) => {
    const next = applyEnterDiningOrder(tableId);
    setSelectedTableId(next.selectedTableId);
    setDiningStep(next.diningStep);
  };

  const returnToTableSelect = () => {
    resetTicket();
    const next = applyReturnToTableSelect();
    setSelectedTableId(next.selectedTableId);
    setDiningStep(next.diningStep);
  };

  const commitModeChange = (nextMode: PosMode) => {
    const next = nextModeState(nextMode);
    resetTicket();
    setMode(next.mode);
    setSelectedTableId(next.selectedTableId);
    setDiningStep(next.diningStep);
  };

  const handleModeChange = (nextMode: PosMode) => {
    const decision = resolveModeChange({
      currentMode: mode,
      nextMode,
      cartLineCount: cartLines.length,
    });

    if (decision.kind === 'noop') return;

    if (decision.kind === 'confirm-clear-ticket') {
      confirmDestructiveAction({
        title: 'Switch service?',
        message: 'Switching will clear the current ticket.',
        confirmLabel: 'Switch',
        onConfirm: () => commitModeChange(nextMode),
      });
      return;
    }

    commitModeChange(nextMode);
  };

  const handleTablePress = (table: PosTable) => {
    const action = resolveTablePress({
      table,
      isOpeningSession: openSessionMutation.isPending,
    });

    if (action.kind === 'ignore') return;

    if (action.kind === 'enter-order') {
      enterDiningOrder(action.tableId);
      return;
    }

    const copy = openSessionConfirmCopy(action.tableNumber);
    Alert.alert(copy.title, copy.message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: copy.confirmLabel,
        onPress: () => {
          openSessionMutation.mutate(action.tableId, {
            onSuccess: () => enterDiningOrder(action.tableId),
          });
        },
      },
    ]);
  };

  const handleChangeTable = () => {
    const decision = resolveChangeTable({ cartLineCount: cartLines.length });
    if (decision.kind === 'proceed') {
      returnToTableSelect();
      return;
    }

    confirmDestructiveAction({
      title: 'Change table?',
      message: 'Going back will clear the current ticket.',
      confirmLabel: 'Change table',
      onConfirm: returnToTableSelect,
    });
  };

  const handleMenuPress = (item: PosMenuItem) => {
    if ((item.options?.length ?? 0) > 0) {
      setCustomizingItem(item);
      return;
    }

    setCartLines((lines) =>
      addCartLine(lines, {
        id: createCartLineId(),
        menuItemId: item.id,
        itemName: item.name,
        unitPriceCents: item.priceCents,
        quantity: 1,
        specialInstructions: null,
        options: [],
      })
    );
  };

  const handleSubmitOrder = () => {
    if (submitMutation.isPending) return;

    const blocker = getPosSubmitBlocker({
      lineCount: cartLines.length,
      customerName,
      mode,
      selectedTableId,
      hasActiveSession: !!selectedTable?.activeSessionId,
      tableNumber: selectedTable?.number,
    });

    if (blocker?.kind === 'empty-cart') {
      Alert.alert('Empty cart', 'Add at least one dish before sending to the kitchen.');
      return;
    }

    if (blocker?.kind === 'missing-customer-name') {
      Alert.alert('Guest name required', 'Enter a guest name for this ticket.');
      return;
    }

    if (blocker?.kind === 'missing-table' || blocker?.kind === 'missing-session') {
      returnToTableSelect();
      return;
    }

    submitMutation.mutate();
  };

  const cartPanelProps = {
    lines: cartLines,
    customerName,
    onCustomerNameChange: setCustomerName,
    onUpdateLines: setCartLines,
    onClearCart: () => setCartLines(clearCart()),
    onSubmit: handleSubmitOrder,
    isSubmitting: submitMutation.isPending,
    errorMessage: submitMutation.isError ? (submitMutation.error as Error).message : null,
    submitLabel,
    destinationLabel,
  };

  const modeToggle = (
    <View className="gap-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {MODES.map((option) => {
          const isActive = option.value === mode;
          return (
            <Pressable
              key={option.value}
              onPress={() => handleModeChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={`rounded-2xl px-4 py-3 ${
                isActive ? 'bg-primary' : 'border border-border bg-card'
              }`}
              style={{ borderCurve: 'continuous' }}>
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-primary-foreground' : 'text-neutral-600 dark:text-neutral-300'
                }`}>
                {option.label}
              </Text>
              <Text
                className={`text-xs ${
                  isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}>
                {option.hint}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-background">
        <ListScreenSkeleton filters cards={6} />
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
          Sign in from the Home tab to take orders.
        </Text>
      </View>
    );
  }

  const tableSelectPane = (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        ...posScrollContentStyle,
        paddingTop: Math.max(insets.top, 12) + 16,
        paddingBottom: Math.max((posScrollContentStyle.paddingBottom as number) ?? 28, insets.bottom + 16),
        gap: 24,
      }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl
          refreshing={isRefetchingTables}
          onRefresh={() => {
            void refetchTables();
          }}
        />
      }>
      <View className="gap-2">
        <Text className="text-4xl font-bold tracking-tight text-foreground">POS</Text>
        <Text className="text-base leading-6 text-muted-foreground">
          Choose a table to see which sessions are live, then start the order.
        </Text>
      </View>

      {modeToggle}

      {isLoadingTables ? (
        <CardGridSkeleton count={4} />
      ) : (
        <PosTableSelect
          tables={tables}
          onTablePress={handleTablePress}
          isOpeningSession={openSessionMutation.isPending}
          openingTableId={openSessionMutation.variables ?? null}
          cardWidth={tableCardWidth}
          gap={gridGap}
        />
      )}

      {openSessionMutation.isError ? (
        <Text selectable className="text-sm text-red-600 dark:text-red-400">
          {(openSessionMutation.error as Error).message}
        </Text>
      ) : null}
    </ScrollView>
  );

  const menuPane = (
    <ScrollView
      className="flex-1 bg-background"
      style={{ flex: 1 }}
      contentContainerStyle={{
        ...posScrollContentStyle,
        paddingTop: isTablet
          ? Math.max(insets.top, 12) + 16
          : (posScrollContentStyle.paddingTop as number),
        paddingBottom:
          !isTablet && itemCount > 0
            ? 160
            : Math.max((posScrollContentStyle.paddingBottom as number) ?? 28, insets.bottom + 16),
        gap: 20,
      }}
      contentInsetAdjustmentBehavior={isTablet ? 'never' : 'automatic'}
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl
          refreshing={isRefetchingMenu}
          onRefresh={() => {
            void refetchMenu();
          }}
        />
      }>
      <View className="gap-2">
        <Text
          className={`font-bold tracking-tight text-foreground ${
            isTablet ? 'text-3xl' : 'text-4xl'
          }`}>
          {mode === 'DINING' ? `Table ${selectedTable?.number ?? ''}` : 'Takeaway'}
        </Text>
        <Text className="text-base leading-6 text-muted-foreground">
          {isLoadingMenu
            ? 'Loading menu...'
            : `${menuItems.length} dishes ready · ${mode === 'DINING' ? 'table service' : 'takeaway'}`}
        </Text>
      </View>

      {modeToggle}

      {mode === 'DINING' && selectedTable ? (
        <PosDiningHeader tableNumber={selectedTable.number} onChangeTable={handleChangeTable} />
      ) : null}

      {!isMenuError ? (
        <View className="gap-3">
          <View
            className="flex-row items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3"
            style={{ borderCurve: 'continuous' }}>
            <Ionicons name="search" size={18} color="#8E8E93" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search menu"
              placeholderTextColor="#8E8E93"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
              className="flex-1 text-base text-foreground"
            />
          </View>

          {categories.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {[null, ...categories].map((option) => {
                const isActive = option === categoryFilter;
                return (
                  <Pressable
                    key={option ?? 'all'}
                    onPress={() => setCategoryFilter(option)}
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
                      {option ?? 'All'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      {isMenuError ? (
        <View
          className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
          style={{ borderCurve: 'continuous' }}>
          <View className="gap-2">
            <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
              Could not load menu
            </Text>
            <Text className="text-base leading-6 text-red-700 dark:text-red-300">
              {menuError instanceof Error ? menuError.message : 'Unable to load menu.'}
            </Text>
          </View>
          <Button onPress={() => refetchMenu()}>Try again</Button>
        </View>
      ) : null}

      {!isLoadingMenu && !isMenuError && menuItems.length === 0 ? (
        <View
          className="rounded-3xl border border-border bg-card p-5"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-base leading-6 text-muted-foreground">
            No available menu items. Mark dishes as available in the Menu tab.
          </Text>
        </View>
      ) : null}

      {!isLoadingMenu && !isMenuError && menuItems.length > 0 && filteredItems.length === 0 ? (
        <View
          className="rounded-3xl border border-border bg-card p-5"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-base leading-6 text-muted-foreground">
            No dishes match your search.
          </Text>
        </View>
      ) : null}

      {isLoadingMenu ? (
        <CardGridSkeleton count={6} />
      ) : (
        sections.map(([category, categoryItems]) => (
          <View key={category} className="gap-3">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </Text>
              <Text className="text-xs font-medium text-muted-foreground">
                {categoryItems.length}
              </Text>
            </View>
            <View className="flex-row flex-wrap" style={{ gap: gridGap }}>
              {categoryItems.map((item) => (
                <PosMenuCard
                  key={item.id}
                  item={item}
                  width={posProductCardWidth}
                  onPress={() => handleMenuPress(item)}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="min-h-0 flex-1 flex-row items-stretch">
        <View className="min-h-0 min-w-0 flex-1">
          {isOrdering ? menuPane : tableSelectPane}
        </View>

        {isTablet && isOrdering ? (
          <View className="min-h-0 self-stretch" style={{ width: posSidebarWidth }}>
            <PosCartPanel
              {...cartPanelProps}
              variant="sidebar"
              topInset={Math.max(insets.top, 12)}
              bottomInset={insets.bottom}
            />
          </View>
        ) : null}
      </View>

      {!isTablet && isOrdering ? (
        <>
          <PosCartBar
            itemCount={itemCount}
            totalCents={totalCents}
            destinationLabel={destinationLabel}
            onPress={() => setCartVisible(true)}
          />
          <PosCartSheet
            visible={isCartVisible}
            onClose={() => setCartVisible(false)}
            {...cartPanelProps}
          />
        </>
      ) : null}

      {isOrdering ? (
        <PosItemSheet
          visible={!!customizingItem}
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAdd={(line) => setCartLines((lines) => addCartLine(lines, line))}
        />
      ) : null}
    </View>
  );
}
