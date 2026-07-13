import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';

import {
  parseStockNumber,
  resolveNextStockLevel,
  type StockUpdateMode,
} from './stock-form-utils';
import type { StockItem } from './types';

interface StockRestockModalProps {
  visible: boolean;
  item: StockItem | null;
  mode: StockUpdateMode;
  onClose: () => void;
  onSubmit: (nextStock: number) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export function StockRestockModal({
  visible,
  item,
  mode,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: StockRestockModalProps) {
  const [quantity, setQuantity] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !item) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Re-seed when sheet opens. */
    setQuantity(mode === 'set' ? String(item.currentStock) : '');
    setValidationError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, item, mode]);

  if (!item) return null;

  const handleSubmit = () => {
    const result = resolveNextStockLevel(item.currentStock, quantity, mode);
    if (!result.ok) {
      setValidationError(result.error);
      return;
    }

    setValidationError(null);
    onSubmit(result.nextStock);
  };

  const message = validationError ?? errorMessage;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/45" onPress={onClose}>
        <Pressable
          className="gap-4 rounded-t-3xl bg-background px-5 pb-8 pt-5"
          style={{ borderCurve: 'continuous' }}
          onPress={(event) => event.stopPropagation()}>
          <View className="gap-1">
            <Text className="text-xl font-bold text-foreground">
              {mode === 'add' ? 'Restock' : 'Set stock level'}
            </Text>
            <Text className="text-base text-muted-foreground">
              {item.name} · currently {item.currentStock} {item.unit}
            </Text>
          </View>

          <TextField
            label={mode === 'add' ? 'Add quantity' : 'New stock level'}
            value={quantity}
            onChangeText={setQuantity}
            placeholder={mode === 'add' ? String(item.reorderQuantity) : String(item.currentStock)}
            keyboardType="decimal-pad"
          />

          {mode === 'add' && quantity ? (
            <Text className="text-sm text-muted-foreground">
              New total:{' '}
              <Text className="font-semibold text-foreground">
                {item.currentStock + (parseStockNumber(quantity) ?? 0)} {item.unit}
              </Text>
            </Text>
          ) : null}

          {message ? <Text className="text-sm text-red-600 dark:text-red-400">{message}</Text> : null}

          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-full border border-border py-3.5 active:opacity-70"
              style={{ borderCurve: 'continuous' }}>
              <Text className="text-center text-base font-semibold text-foreground">Cancel</Text>
            </Pressable>
            <View className="flex-1">
              <Button onPress={isSubmitting ? undefined : handleSubmit}>
                {isSubmitting ? 'Saving...' : 'Update stock'}
              </Button>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
