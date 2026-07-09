import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';

import type { MenuItem, MenuItemInput } from './types';

interface MenuItemFormModalProps {
  visible: boolean;
  /** When set, the modal edits this item; otherwise it creates a new one. */
  item: MenuItem | null;
  categories: string[];
  onClose: () => void;
  onSubmit: (input: MenuItemInput) => void;
  onDelete: (item: MenuItem) => void;
  isSubmitting: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
}

function centsToPriceText(cents: number) {
  return (cents / 100).toFixed(2);
}

function parsePriceCents(text: string): number | null {
  const value = Number(text.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export function MenuItemFormModal({
  visible,
  item,
  categories,
  onClose,
  onSubmit,
  onDelete,
  isSubmitting,
  isDeleting,
  errorMessage,
}: MenuItemFormModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Re-seed the form whenever the modal opens for a different item.
  useEffect(() => {
    if (!visible) return;
    setName(item?.name ?? '');
    setCategory(item?.category ?? '');
    setPrice(item ? centsToPriceText(item.priceCents) : '');
    setDescription(item?.description ?? '');
    setImageUrl(item?.imageUrl ?? '');
    setValidationError(null);
  }, [visible, item]);

  const handleSubmit = () => {
    const priceCents = parsePriceCents(price);
    if (!name.trim()) {
      setValidationError('Name is required.');
      return;
    }
    if (!category.trim()) {
      setValidationError('Category is required.');
      return;
    }
    if (priceCents === null) {
      setValidationError('Enter a valid price greater than 0.');
      return;
    }

    setValidationError(null);
    onSubmit({
      name: name.trim(),
      category: category.trim(),
      priceCents,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      isAvailable: item ? item.isAvailable : true,
    });
  };

  const message = validationError ?? errorMessage;
  const isBusy = isSubmitting || isDeleting;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-neutral-50 dark:bg-black">
        <View className="flex-row items-center justify-between px-5 pb-4 pt-6">
          <Pressable onPress={onClose} hitSlop={12} disabled={isBusy}>
            <Text className="text-base font-medium text-neutral-500 dark:text-neutral-400">
              Cancel
            </Text>
          </Pressable>
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {item ? 'Edit Item' : 'New Item'}
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-10"
          keyboardShouldPersistTaps="handled">
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Margherita Pizza"
            autoCapitalize="words"
          />

          <View className="gap-2">
            <TextField
              label="Category"
              value={category}
              onChangeText={setCategory}
              placeholder="Mains"
              autoCapitalize="words"
            />
            {categories.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {categories.map((option) => {
                  const isActive = option === category.trim();
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setCategory(option)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      className={`rounded-full px-3 py-1.5 ${
                        isActive
                          ? 'bg-accent dark:bg-accent-dark'
                          : 'bg-neutral-200/70 dark:bg-neutral-800/70'
                      }`}>
                      <Text
                        className={`text-xs font-semibold ${
                          isActive ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                        }`}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          <TextField
            label="Price"
            value={price}
            onChangeText={setPrice}
            placeholder="12.50"
            keyboardType="decimal-pad"
          />
          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="San Marzano tomatoes, fresh basil..."
            autoCapitalize="sentences"
          />
          <TextField
            label="Image URL"
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
            autoCapitalize="none"
          />

          {message ? (
            <Text className="text-sm text-red-600 dark:text-red-400">{message}</Text>
          ) : null}

          <View className="mt-2 gap-3">
            <Button onPress={handleSubmit}>
              {isSubmitting ? 'Saving...' : item ? 'Save Changes' : 'Add Item'}
            </Button>
            {item ? (
              <Pressable
                onPress={() => onDelete(item)}
                disabled={isBusy}
                accessibilityRole="button"
                className="rounded-2xl border border-red-200 px-5 py-4 active:opacity-70 dark:border-red-900/50"
                style={{ borderCurve: 'continuous' }}>
                <Text className="text-center text-base font-semibold text-red-600 dark:text-red-400">
                  {isDeleting ? 'Deleting...' : 'Delete Item'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
