import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';

import { parseStockIdFromScan } from './stock-qr';

export default function StockScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const hasHandledScan = useRef(false);

  const handleScannedData = useCallback(
    async (data: string) => {
      if (hasHandledScan.current) return;

      const stockId = parseStockIdFromScan(data);
      if (!stockId) {
        setErrorMessage('That QR code is not a stock label. Try another label.');
        return;
      }

      hasHandledScan.current = true;
      setErrorMessage(null);
      try {
        await CameraView.dismissScanner();
      } catch {
        // Android dismisses automatically after a successful scan.
      }
      router.replace(`/stock/update/${stockId}`);
    },
    [router]
  );

  useEffect(() => {
    const subscription = CameraView.onModernBarcodeScanned((event) => {
      void handleScannedData(event.data);
    });
    return () => subscription.remove();
  }, [handleScannedData]);

  const launchNativeScanner = useCallback(async () => {
    if (Platform.OS === 'web') return;
    if (!CameraView.isModernBarcodeScannerAvailable) {
      setErrorMessage('QR scanning is not available on this device.');
      return;
    }

    hasHandledScan.current = false;
    setErrorMessage(null);
    setIsLaunching(true);
    try {
      await CameraView.launchScanner({
        barcodeTypes: ['qr'],
        isGuidanceEnabled: true,
        isHighlightingEnabled: true,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not open the camera scanner.'
      );
    } finally {
      setIsLaunching(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      hasHandledScan.current = false;

      if (Platform.OS === 'web') return;
      if (!permission?.granted) return;
      if (!CameraView.isModernBarcodeScannerAvailable) return;

      void launchNativeScanner();

      return () => {
        void CameraView.dismissScanner().catch(() => {
          // Ignore — scanner may already be closed.
        });
      };
    }, [launchNativeScanner, permission?.granted])
  );

  const openSettings = () => {
    void Linking.openSettings();
  };

  if (Platform.OS === 'web') {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 bg-background px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Ionicons name="phone-portrait-outline" size={48} color="#71717A" />
        <Text className="text-center text-xl font-semibold text-foreground">
          Use the mobile app
        </Text>
        <Text className="text-center text-base leading-6 text-muted-foreground">
          Stock QR scanning needs the device camera. Open RestoQuick on iOS or Android to scan
          labels.
        </Text>
        <Button onPress={() => router.back()}>Go back</Button>
      </View>
    );
  }

  if (!permission) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Text className="text-base text-muted-foreground">Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    const canAskAgain = permission.canAskAgain !== false;

    return (
      <View
        className="flex-1 items-center justify-center gap-4 bg-background px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Ionicons name="camera-outline" size={48} color="#71717A" />
        <Text className="text-center text-xl font-semibold text-foreground">Camera access</Text>
        <Text className="text-center text-base leading-6 text-muted-foreground">
          {canAskAgain
            ? 'Allow camera access to scan stock QR labels and jump straight to updating inventory.'
            : 'Camera permission is turned off. Enable it in Settings to scan stock QR labels.'}
        </Text>
        {canAskAgain ? (
          <Button
            onPress={async () => {
              const next = await requestPermission();
              if (next.granted) void launchNativeScanner();
            }}>
            Enable camera
          </Button>
        ) : (
          <Button onPress={openSettings}>Open Settings</Button>
        )}
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-base font-medium text-primary">Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className="flex-1 items-center justify-center gap-4 bg-background px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Ionicons name="scan-outline" size={48} color="#71717A" />
      <Text className="text-center text-xl font-semibold text-foreground">Scan stock QR</Text>
      <Text className="text-center text-base leading-6 text-muted-foreground">
        {isLaunching
          ? 'Opening camera...'
          : 'Point the camera at a printed stock label QR code.'}
      </Text>

      {errorMessage ? (
        <Text selectable className="text-center text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </Text>
      ) : null}

      <Button onPress={() => void launchNativeScanner()} disabled={isLaunching}>
        {isLaunching ? 'Opening...' : 'Open scanner'}
      </Button>

      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text className="text-base font-medium text-primary">Cancel</Text>
      </Pressable>
    </View>
  );
}
