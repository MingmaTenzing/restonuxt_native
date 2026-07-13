import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { formatDate } from '@/utils/format-date';

import { isLowStock, stockLevelPercent } from './stock-stats';
import { STOCK_CATEGORY_LABELS, type StockItem } from './types';

interface StockItemCardProps {
  item: StockItem;
  onPress: () => void;
  onRestock: () => void;
  onShowQr: () => void;
}

export function StockItemCard({ item, onPress, onRestock, onShowQr }: StockItemCardProps) {
  const low = isLowStock(item);
  const fill = stockLevelPercent(item);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.currentStock} ${item.unit}`}
      className={`rounded-3xl border bg-card p-4 active:opacity-80 ${
        low ? 'border-amber-400/70 dark:border-amber-500/50' : 'border-border'
      }`}
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View className="flex-row items-start gap-3">
        <View
          className={`h-14 w-14 items-center justify-center rounded-2xl ${
            low ? 'bg-amber-500/15' : 'bg-primary/10'
          }`}
          style={{ borderCurve: 'continuous' }}>
          <Text className={`text-lg font-bold ${low ? 'text-amber-700 dark:text-amber-300' : 'text-primary'}`}>
            {item.currentStock}
          </Text>
          <Text className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {item.unit}
          </Text>
        </View>

        <View className="min-w-0 flex-1 gap-1.5">
          <View className="flex-row items-center gap-2">
            <Text numberOfLines={1} className="flex-1 text-base font-semibold text-foreground">
              {item.name}
            </Text>
            {low ? (
              <View className="rounded-full bg-amber-500/15 px-2 py-0.5">
                <Text className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Low
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="text-xs font-medium text-muted-foreground">
            {STOCK_CATEGORY_LABELS[item.category]}
            {item.supplier ? ` · ${item.supplier}` : ''}
          </Text>

          <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <View
              className={`h-full rounded-full ${low ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${fill}%` }}
            />
          </View>

          <Text className="text-xs text-muted-foreground">
            Reorder at {item.reorderLevel} {item.unit}
            {item.lastRestocked ? ` · ${formatDate(item.lastRestocked)}` : ''}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onRestock();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Restock ${item.name}`}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-primary py-2.5 active:opacity-80"
          style={{ borderCurve: 'continuous' }}>
          <Ionicons name="add-circle-outline" size={16} color="#FAFAFA" />
          <Text className="text-sm font-semibold text-primary-foreground">Restock</Text>
        </Pressable>

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onShowQr();
          }}
          accessibilityRole="button"
          accessibilityLabel={`QR code for ${item.name}`}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background active:opacity-70"
          style={{ borderCurve: 'continuous' }}>
          <Ionicons name="qr-code-outline" size={18} color="#71717A" />
        </Pressable>
      </View>
    </Pressable>
  );
}
