import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import { fetchStockItems } from './api';
import { buildStockQrValue } from './stock-qr';

export default function StockQrLabelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { api, isLoaded, isSignedIn, isReady } = useApi();
  const { isTablet } = useResponsiveLayout();

  const { data: items = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['stock'],
    enabled: isReady,
    queryFn: () => fetchStockItems(api),
  });

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between border-b border-border/70 px-5 pb-4 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#71717A" />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">QR labels</Text>
        <View className="w-6" />
      </View>

      {!isLoaded ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : !isSignedIn ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-center text-base text-muted-foreground">Sign in to view labels.</Text>
        </View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading stock items...</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center gap-4 px-5">
          <Text className="text-base text-muted-foreground">
            {error instanceof Error ? error.message : 'Could not load stock.'}
          </Text>
          <Button onPress={() => refetch()}>Try again</Button>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-center text-base text-muted-foreground">
            Add stock items first, then generate QR labels for each one.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-10 pt-5"
          contentInsetAdjustmentBehavior="automatic">
          <View className="gap-1">
            <Text
              className={`font-bold text-foreground ${isTablet ? 'text-2xl' : 'text-xl'}`}>
              Printable labels
            </Text>
            <Text className="text-sm leading-5 text-muted-foreground">
              Each code opens the stock update screen for that item. Stick them on shelves or
              containers for quick scanning.
            </Text>
          </View>

          <View className={`flex-row flex-wrap gap-4 ${isTablet ? 'justify-start' : ''}`}>
            {items.map((item) => (
              <View
                key={item.id}
                className="w-full max-w-[280px] gap-3 rounded-3xl border border-border bg-card p-4"
                style={{ borderCurve: 'continuous' }}>
                <View className="gap-0.5">
                  <Text numberOfLines={2} className="text-base font-semibold text-foreground">
                    {item.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {item.currentStock} {item.unit} on hand
                  </Text>
                </View>

                <View className="items-center self-center rounded-2xl bg-white p-3">
                  <QRCode value={buildStockQrValue(item.id)} size={140} />
                </View>

                <Text className="text-center text-[10px] text-muted-foreground" numberOfLines={2}>
                  Scan to update
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
