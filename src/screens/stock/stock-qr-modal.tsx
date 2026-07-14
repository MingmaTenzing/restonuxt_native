import { Pressable, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { BottomSheetModal } from '@/components/bottom-sheet-modal';

import { buildStockQrValue } from './stock-qr';
import type { StockItem } from './types';

interface StockQrModalProps {
  visible: boolean;
  item: StockItem | null;
  onClose: () => void;
}

export function StockQrModal({ visible, item, onClose }: StockQrModalProps) {
  if (!item) return null;

  const qrValue = buildStockQrValue(item.id);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      placement="center"
      contentClassName="gap-4 rounded-3xl bg-card p-6">
      <View className="gap-1">
        <Text className="text-center text-lg font-bold text-foreground">{item.name}</Text>
        <Text className="text-center text-sm text-muted-foreground">
          Scan to update stock on any device
        </Text>
      </View>

      <View className="items-center rounded-2xl bg-white p-4">
        <QRCode value={qrValue} size={200} />
      </View>

      <Text className="text-center text-xs text-muted-foreground" selectable>
        {qrValue}
      </Text>

      <Pressable
        onPress={onClose}
        className="rounded-full bg-primary py-3 active:opacity-80"
        style={{ borderCurve: 'continuous' }}>
        <Text className="text-center text-base font-semibold text-primary-foreground">Done</Text>
      </Pressable>
    </BottomSheetModal>
  );
}
