import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';

import { validateStockForm } from './stock-form-utils';
import {
  STOCK_CATEGORIES,
  STOCK_CATEGORY_LABELS,
  type StockCategory,
  type StockItemInput,
} from './types';

interface StockFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: StockItemInput) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export function StockFormModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: StockFormModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StockCategory>('INGREDIENTS');
  const [currentStock, setCurrentStock] = useState('0');
  const [unit, setUnit] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [reorderQuantity, setReorderQuantity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Re-seed draft fields when the sheet opens. */
    setName('');
    setCategory('INGREDIENTS');
    setCurrentStock('0');
    setUnit('');
    setReorderLevel('');
    setReorderQuantity('');
    setSupplier('');
    setValidationError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible]);

  const handleSubmit = () => {
    const result = validateStockForm({
      name,
      category,
      currentStock,
      unit,
      reorderLevel,
      reorderQuantity,
      supplier,
    });

    if (!result.ok) {
      setValidationError(result.error);
      return;
    }

    setValidationError(null);
    onSubmit(result.input);
  };

  const message = validationError ?? errorMessage;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border/70 px-5 pb-4 pt-6">
          <Pressable onPress={onClose} hitSlop={12} disabled={isSubmitting}>
            <Text className="text-base font-medium text-primary">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">New stock item</Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-10 pt-5"
          keyboardShouldPersistTaps="handled">
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Fresh basil"
            autoCapitalize="words"
          />

          <View className="gap-2">
            <Text className="px-1 text-sm font-medium text-muted-foreground">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {STOCK_CATEGORIES.map((option) => {
                const isActive = option === category;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setCategory(option)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    className={`rounded-full px-3 py-1.5 ${isActive ? 'bg-primary' : 'bg-muted'}`}>
                    <Text
                      className={`text-xs font-semibold ${
                        isActive ? 'text-primary-foreground' : 'text-neutral-600 dark:text-neutral-300'
                      }`}>
                      {STOCK_CATEGORY_LABELS[option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField
                label="Starting stock"
                value={currentStock}
                onChangeText={setCurrentStock}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <TextField
                label="Unit"
                value={unit}
                onChangeText={setUnit}
                placeholder="kg"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField
                label="Reorder level"
                value={reorderLevel}
                onChangeText={setReorderLevel}
                placeholder="5"
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <TextField
                label="Reorder quantity"
                value={reorderQuantity}
                onChangeText={setReorderQuantity}
                placeholder="10"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TextField
            label="Supplier"
            value={supplier}
            onChangeText={setSupplier}
            placeholder="Optional"
            autoCapitalize="words"
          />

          {message ? <Text className="text-sm text-red-600 dark:text-red-400">{message}</Text> : null}

          <Button onPress={isSubmitting ? undefined : handleSubmit}>
            {isSubmitting ? 'Adding...' : 'Add to inventory'}
          </Button>
        </ScrollView>
      </View>
    </Modal>
  );
}
