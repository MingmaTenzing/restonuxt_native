import { Modal, Platform, Pressable, StyleSheet, useColorScheme, View, type ViewProps } from 'react-native';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Bottom sheet (default) or centered card. */
  placement?: 'bottom' | 'center';
  contentClassName?: string;
  contentStyle?: ViewProps['style'];
}

function ModalBackdrop({ onPress }: { onPress: () => void }) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Pressable
      className="absolute inset-0"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Dismiss">
      <View
        pointerEvents="none"
        className={`absolute inset-0 ${isDark ? 'bg-black/15' : 'bg-black/10'}`}
        style={Platform.OS === 'web' ? styles.webBackdrop : undefined}
      />
    </Pressable>
  );
}

const SHEET_SHADOW = {
  borderCurve: 'continuous' as const,
  zIndex: 1,
  boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08)',
};

const CARD_SHADOW = {
  borderCurve: 'continuous' as const,
  zIndex: 1,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
};

export function BottomSheetModal({
  visible,
  onClose,
  children,
  placement = 'bottom',
  contentClassName = '',
  contentStyle,
}: BottomSheetModalProps) {
  const isBottom = placement === 'bottom';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        className={
          isBottom ? 'flex-1 justify-end' : 'flex-1 items-center justify-center px-6'
        }>
        <ModalBackdrop onPress={onClose} />
        <View
          className={
            isBottom
              ? `rounded-t-3xl bg-background ${contentClassName}`
              : `w-full max-w-sm ${contentClassName}`
          }
          style={[isBottom ? SHEET_SHADOW : CARD_SHADOW, contentStyle]}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  webBackdrop: {
    // @ts-expect-error web-only CSS property
    backdropFilter: 'blur(4px)',
  },
});
