import { Modal, Pressable, Text, View } from 'react-native';

import { PosCartPanel } from './pos-cart-panel';
import type { CartLine } from './types';

interface PosCartSheetProps {
  visible: boolean;
  lines: CartLine[];
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  onClose: () => void;
  onUpdateLines: (lines: CartLine[]) => void;
  onClearCart: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  submitLabel: string;
}

export function PosCartSheet({
  visible,
  lines,
  customerName,
  onCustomerNameChange,
  onClose,
  onUpdateLines,
  onClearCart,
  onSubmit,
  isSubmitting,
  errorMessage,
  submitLabel,
}: PosCartSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border/70 px-5 pb-4 pt-6">
          <Pressable onPress={onClose} hitSlop={12} disabled={isSubmitting}>
            <Text className="text-base font-medium text-primary">Close</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">
            Order ticket
          </Text>
          <View className="w-14" />
        </View>

        <PosCartPanel
          lines={lines}
          customerName={customerName}
          onCustomerNameChange={onCustomerNameChange}
          onUpdateLines={onUpdateLines}
          onClearCart={onClearCart}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          submitLabel={submitLabel}
        />
      </View>
    </Modal>
  );
}
