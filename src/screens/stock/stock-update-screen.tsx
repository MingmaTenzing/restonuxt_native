import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { useApi } from '@/hooks/use-api';
import { formatDate } from '@/utils/format-date';

import { fetchStockItem, updateStockLevel } from './api';
import {
  parseStockNumber,
  resolveNextStockLevel,
  type StockUpdateMode,
} from './stock-form-utils';
import { isLowStock } from './stock-stats';
import { STOCK_CATEGORY_LABELS } from './types';

export default function StockUpdateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { api, isReady } = useApi();
  const queryClient = useQueryClient();

  const [addAmount, setAddAmount] = useState('');
  const [setAmount, setSetAmount] = useState('');
  const [mode, setMode] = useState<StockUpdateMode>('add');
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    data: item,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['stock', id],
    enabled: isReady && Boolean(id),
    queryFn: () => fetchStockItem(api, id),
  });

  const updateMutation = useMutation({
    mutationFn: (currentStock: number) => updateStockLevel(api, id, currentStock),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.setQueryData(['stock', id], updated);
      setAddAmount('');
      setSetAmount(String(updated.currentStock));
      setValidationError(null);
    },
  });

  if (!id) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-base text-muted-foreground">Missing stock item id.</Text>
      </View>
    );
  }

  const handleUpdate = () => {
    if (!item) return;

    const result = resolveNextStockLevel(
      item.currentStock,
      mode === 'add' ? addAmount : setAmount,
      mode
    );
    if (!result.ok) {
      setValidationError(result.error);
      return;
    }

    updateMutation.mutate(result.nextStock);
  };

  const low = item ? isLowStock(item) : false;
  const message =
    validationError ??
    (updateMutation.isError ? (updateMutation.error as Error).message : null);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between border-b border-border/70 px-5 pb-4 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#71717A" />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">Update stock</Text>
        <View className="w-6" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading item...</Text>
        </View>
      ) : null}

      {isError ? (
        <View className="flex-1 justify-center gap-4 px-5">
          <Text className="text-lg font-semibold text-foreground">Item not found</Text>
          <Text className="text-base text-muted-foreground">
            {error instanceof Error ? error.message : 'This stock item may have been removed.'}
          </Text>
          <Button onPress={() => refetch()}>Try again</Button>
        </View>
      ) : null}

      {item ? (
        <View className="flex-1 gap-5 px-5 pt-5">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">{item.name}</Text>
            <Text className="text-base text-muted-foreground">
              {STOCK_CATEGORY_LABELS[item.category]}
              {item.supplier ? ` · ${item.supplier}` : ''}
            </Text>
          </View>

          <View
            className={`rounded-3xl border p-5 ${
              low
                ? 'border-amber-400/60 bg-amber-500/10'
                : 'border-border bg-card'
            }`}
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Current level
            </Text>
            <Text className="mt-1 text-4xl font-bold text-foreground">
              {item.currentStock}{' '}
              <Text className="text-xl font-semibold text-muted-foreground">{item.unit}</Text>
            </Text>
            {low ? (
              <Text className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                Below reorder level ({item.reorderLevel} {item.unit})
              </Text>
            ) : null}
            {item.lastRestocked ? (
              <Text className="mt-1 text-sm text-muted-foreground">
                Last restocked {formatDate(item.lastRestocked)}
              </Text>
            ) : null}
          </View>

          <View className="flex-row gap-2">
            {(['add', 'set'] as StockUpdateMode[]).map((option) => {
              const isActive = mode === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setMode(option)}
                  className={`flex-1 rounded-full py-2.5 ${
                    isActive ? 'bg-primary' : 'border border-border bg-card'
                  }`}
                  style={{ borderCurve: 'continuous' }}>
                  <Text
                    className={`text-center text-sm font-semibold ${
                      isActive ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                    {option === 'add' ? 'Add quantity' : 'Set level'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {mode === 'add' ? (
            <TextField
              label="Add to stock"
              value={addAmount}
              onChangeText={setAddAmount}
              placeholder={String(item.reorderQuantity)}
              keyboardType="decimal-pad"
            />
          ) : (
            <TextField
              label="New stock level"
              value={setAmount || String(item.currentStock)}
              onChangeText={setSetAmount}
              placeholder={String(item.currentStock)}
              keyboardType="decimal-pad"
            />
          )}

          {mode === 'add' && addAmount ? (
            <Text className="text-sm text-muted-foreground">
              New total:{' '}
              <Text className="font-semibold text-foreground">
                {item.currentStock + (parseStockNumber(addAmount) ?? 0)} {item.unit}
              </Text>
            </Text>
          ) : null}

          {message ? <Text className="text-sm text-red-600 dark:text-red-400">{message}</Text> : null}

          <Button onPress={updateMutation.isPending ? undefined : handleUpdate}>
            {updateMutation.isPending ? 'Saving...' : 'Save update'}
          </Button>

          {updateMutation.isSuccess ? (
            <Text className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Stock updated successfully
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
