import { Modal, Pressable, Text, View } from 'react-native';

import { CheckoutPaymentPanel } from './checkout-payment-panel';
import type { CheckoutPaymentPanelProps } from './checkout-payment-panel';

type CheckoutPaymentSheetProps = Omit<CheckoutPaymentPanelProps, 'controlsScrollable' | 'fillHeight'> & {
  visible: boolean;
  onClose: () => void;
};

export function CheckoutPaymentSheet({
  visible,
  onClose,
  isSubmitting,
  ...panelProps
}: CheckoutPaymentSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={isSubmitting ? undefined : onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border/70 px-5 pb-4 pt-6">
          <Pressable onPress={onClose} hitSlop={12} disabled={isSubmitting}>
            <Text className="text-base font-medium text-primary">Close</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">Collect payment</Text>
          <View className="w-14" />
        </View>

        <View className="min-h-0 flex-1 px-5 pb-5 pt-4">
          <CheckoutPaymentPanel
            {...panelProps}
            isSubmitting={isSubmitting}
            variant="sheet"
            controlsScrollable
            fillHeight
          />
        </View>
      </View>
    </Modal>
  );
}
