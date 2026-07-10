import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';

import { centsToPriceText, parsePriceCents } from './menu-form-utils';
import type { MenuOptionInput } from './types';

export type MenuOptionSheetMode =
  | { type: 'create' }
  | { type: 'edit'; optionId: string; initial: MenuOptionInput };

interface MenuOptionSheetProps {
  visible: boolean;
  mode: MenuOptionSheetMode | null;
  onClose: () => void;
  onSave: (input: MenuOptionInput, optionId: string | null) => void;
  onRemove?: () => void;
  isSaving: boolean;
  errorMessage: string | null;
}

export function MenuOptionSheet({
  visible,
  mode,
  onClose,
  onSave,
  onRemove,
  isSaving,
  errorMessage,
}: MenuOptionSheetProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const wasSavingRef = useRef(false);

  useEffect(() => {
    if (!visible || !mode) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Re-seed fields when the sheet opens. */
    if (mode.type === 'edit') {
      setName(mode.initial.name);
      setPrice(centsToPriceText(mode.initial.priceCents));
    } else {
      setName('');
      setPrice('');
    }
    setValidationError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, mode]);

  useEffect(() => {
    if (isSaving) {
      wasSavingRef.current = true;
      return;
    }
    if (wasSavingRef.current && visible && !errorMessage) {
      wasSavingRef.current = false;
      onClose();
    }
    if (!isSaving) wasSavingRef.current = false;
  }, [isSaving, errorMessage, visible, onClose]);

  const handleSave = () => {
    const priceCents = parsePriceCents(price);
    if (!name.trim()) {
      setValidationError('Option name is required.');
      return;
    }
    if (priceCents === null) {
      setValidationError('Enter a valid price (0 or greater).');
      return;
    }

    setValidationError(null);
    onSave(
      { name: name.trim(), priceCents },
      mode?.type === 'edit' ? mode.optionId : null
    );
  };

  const message = validationError ?? errorMessage;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-row items-center justify-between border-b border-neutral-200/70 px-5 pb-4 pt-6 dark:border-border-dark">
          <Pressable onPress={onClose} hitSlop={12} disabled={isSaving}>
            <Text className="text-base font-medium text-primary dark:text-primary-dark">
              Cancel
            </Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            {mode?.type === 'edit' ? 'Edit option' : 'Add option'}
          </Text>
          <View className="w-14" />
        </View>

        <View className="gap-4 px-5 pt-5">
          <TextField
            label="Option name"
            value={name}
            onChangeText={setName}
            placeholder="Extra cheese"
            autoCapitalize="words"
          />
          <TextField
            label="Option price"
            value={price}
            onChangeText={setPrice}
            placeholder="1.50"
            keyboardType="decimal-pad"
          />

          {message ? <Text className="text-sm text-red-600 dark:text-red-400">{message}</Text> : null}

          <Button onPress={isSaving ? undefined : handleSave}>
            {isSaving ? 'Saving...' : mode?.type === 'edit' ? 'Save changes' : 'Add option'}
          </Button>

          {onRemove ? (
            <Pressable
              onPress={onRemove}
              disabled={isSaving}
              accessibilityRole="button"
              className="rounded-full border border-red-200 px-5 py-3.5 active:opacity-70 dark:border-red-900/50"
              style={{ borderCurve: 'continuous' }}>
              <Text className="text-center text-base font-semibold text-red-600 dark:text-red-400">
                Remove option
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
