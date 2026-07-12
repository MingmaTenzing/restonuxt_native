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
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  canSubmit: boolean;
  submitLabel: string;
}

export function PosCartSheet({
  visible,
  lines,
  customerName,
  onCustomerNameChange,
  onClose,
  onUpdateLines,
  onSubmit,
  isSubmitting,
  errorMessage,
  canSubmit,
  submitLabel,
}: PosCartSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-row items-center justify-between border-b border-neutral-200/70 px-5 pb-4 pt-6 dark:border-border-dark">
          <Pressable onPress={onClose} hitSlop={12} disabled={isSubmitting}>
            <Text className="text-base font-medium text-primary dark:text-primary-dark">Close</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Order ticket
          </Text>
          <View className="w-14" />
        </View>

        <PosCartPanel
          lines={lines}
          customerName={customerName}
          onCustomerNameChange={onCustomerNameChange}
          onUpdateLines={onUpdateLines}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          canSubmit={canSubmit}
          submitLabel={submitLabel}
        />
      </View>
    </Modal>
  );
}
