import { Modal, Pressable, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/50 px-6" onPress={onClose}>
        <Pressable
          className="w-full max-w-sm gap-4 rounded-3xl bg-card p-6"
          style={{ borderCurve: 'continuous' }}
          onPress={(event) => event.stopPropagation()}>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}
