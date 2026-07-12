import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { formatMoney } from '@/utils/format-money';

import { createCartLineId, lineTotalCents } from './cart';
import type { CartLine, PosMenuItem } from './types';

interface PosItemSheetProps {
  visible: boolean;
  item: PosMenuItem | null;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
}

export function PosItemSheet({ visible, item, onClose, onAdd }: PosItemSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!visible || !item) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Re-seed local draft fields when the sheet opens. */
    setQuantity(1);
    setSpecialInstructions('');
    setOptionQuantities({});
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, item?.id]);

  if (!item) return null;

  const options = item.options ?? [];
  const selectedOptions = options
    .filter((option) => (optionQuantities[option.id] ?? 0) > 0)
    .map((option) => ({
      menuOptionId: option.id,
      name: option.name,
      priceCents: option.priceCents,
      quantity: optionQuantities[option.id] ?? 0,
    }));

  const previewLine: CartLine = {
    id: 'preview',
    menuItemId: item.id,
    itemName: item.name,
    unitPriceCents: item.priceCents,
    quantity,
    specialInstructions: specialInstructions.trim() || null,
    options: selectedOptions,
  };

  const handleAdd = () => {
    onAdd({
      ...previewLine,
      id: createCartLineId(),
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border/70 px-5 pb-4 pt-6">
          <Pressable onPress={onClose} hitSlop={12}>
            <Text className="text-base font-medium text-primary">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">
            Customize
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-5 py-5"
          keyboardShouldPersistTaps="handled">
          <View className="gap-1">
            <Text className="text-2xl font-bold text-foreground">
              {item.name}
            </Text>
            <Text className="text-base font-semibold text-foreground">
              {formatMoney(item.priceCents)} base
            </Text>
            {item.description ? (
              <Text className="text-sm leading-5 text-muted-foreground">
                {item.description}
              </Text>
            ) : null}
          </View>

          <View className="gap-2">
            <Text className="px-1 text-sm font-medium text-muted-foreground">
              Quantity
            </Text>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setQuantity((value) => Math.max(1, value - 1))}
                accessibilityRole="button"
                className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card">
                <Text className="text-xl font-semibold text-foreground">
                  −
                </Text>
              </Pressable>
              <Text className="min-w-8 text-center text-xl font-bold text-foreground">
                {quantity}
              </Text>
              <Pressable
                onPress={() => setQuantity((value) => value + 1)}
                accessibilityRole="button"
                className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card">
                <Text className="text-xl font-semibold text-foreground">
                  +
                </Text>
              </Pressable>
            </View>
          </View>

          {options.length > 0 ? (
            <View className="gap-3">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Add-ons
              </Text>
              {options.map((option) => {
                const count = optionQuantities[option.id] ?? 0;
                return (
                  <View
                    key={option.id}
                    className="flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                    style={{ borderCurve: 'continuous' }}>
                    <View className="flex-1 gap-0.5">
                      <Text className="text-base font-medium text-foreground">
                        {option.name}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        +{formatMoney(option.priceCents)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Pressable
                        onPress={() =>
                          setOptionQuantities((current) => ({
                            ...current,
                            [option.id]: Math.max(0, (current[option.id] ?? 0) - 1),
                          }))
                        }
                        accessibilityRole="button"
                        className="h-9 w-9 items-center justify-center rounded-xl border border-border">
                        <Text className="text-lg font-semibold text-foreground">
                          −
                        </Text>
                      </Pressable>
                      <Text className="min-w-6 text-center text-base font-semibold text-foreground">
                        {count}
                      </Text>
                      <Pressable
                        onPress={() =>
                          setOptionQuantities((current) => ({
                            ...current,
                            [option.id]: (current[option.id] ?? 0) + 1,
                          }))
                        }
                        accessibilityRole="button"
                        className="h-9 w-9 items-center justify-center rounded-xl bg-primary">
                        <Text className="text-lg font-semibold text-primary-foreground">
                          +
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View className="gap-2">
            <Text className="px-1 text-sm font-medium text-muted-foreground">
              Special instructions
            </Text>
            <TextInput
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              placeholder="No onions, extra spicy..."
              placeholderTextColor="#8E8E93"
              multiline
              className="min-h-[88px] rounded-2xl border border-input bg-card px-4 py-3.5 text-base text-foreground"
              style={{ borderCurve: 'continuous', textAlignVertical: 'top' }}
            />
          </View>

          <View
            className="flex-row items-center justify-between rounded-2xl border border-border bg-muted px-4 py-3"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-sm font-medium text-muted-foreground">
              Line total
            </Text>
            <Text className="text-lg font-bold text-foreground">
              {formatMoney(lineTotalCents(previewLine))}
            </Text>
          </View>

          <Button onPress={handleAdd}>Add to ticket</Button>
        </ScrollView>
      </View>
    </Modal>
  );
}
