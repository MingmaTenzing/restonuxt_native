import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';

import { parseStockIdFromScan } from './stock-qr';

export default function StockScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [mountError, setMountError] = useState<string | null>(null);
  const isHandling = useRef(false);

  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (isHandling.current) return;

      const stockId = parseStockIdFromScan(data);
      if (!stockId || stockId === lastScan) return;

      isHandling.current = true;
      setLastScan(stockId);
      router.replace(`/stock/update/${stockId}`);
    },
    [lastScan, router]
  );

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 bg-background px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Ionicons name="camera-outline" size={48} color="#71717A" />
        <Text className="text-center text-xl font-semibold text-foreground">Camera access</Text>
        <Text className="text-center text-base leading-6 text-muted-foreground">
          Allow camera access to scan stock QR labels and jump straight to updating inventory.
        </Text>
        <Button onPress={requestPermission}>Enable camera</Button>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-base font-medium text-primary">Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        className="flex-1"
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcode}
        onMountError={({ message }) => setMountError(message)}
      />

      <View
        className="absolute inset-x-0 top-0 flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/50">
          <Ionicons name="close" size={22} color="#FAFAFA" />
        </Pressable>
        <Text className="text-base font-semibold text-white">Scan stock QR</Text>
        <View className="w-10" />
      </View>

      <View className="absolute inset-x-8 top-1/3 aspect-square rounded-3xl border-2 border-white/80" />

      <View
        className="absolute inset-x-0 bottom-0 items-center gap-2 px-6"
        style={{ paddingBottom: insets.bottom + 24 }}>
        <Text className="text-center text-sm text-white/90">
          Point at a stock label QR code
        </Text>
        {mountError ? (
          <Text className="text-center text-xs text-red-300">{mountError}</Text>
        ) : null}
        {lastScan ? (
          <Text className="text-center text-xs text-white/70">Opening item...</Text>
        ) : null}
      </View>
    </View>
  );
}
