import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';

import type { Table, TableInput, TableUpdateInput } from './types';

interface TableFormModalProps {
  visible: boolean;
  table: Table | null;
  onClose: () => void;
  onSubmit: (input: TableInput | TableUpdateInput) => void;
  onDelete: (table: Table) => void;
  isSubmitting: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
}

export function TableFormModal({
  visible,
  table,
  onClose,
  onSubmit,
  onDelete,
  isSubmitting,
  isDeleting,
  errorMessage,
}: TableFormModalProps) {
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Re-seed local draft fields when the sheet opens. */
    setNumber(table?.number ?? '');
    setCapacity(table ? String(table.capacity) : '');
    setValidationError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible, table]);

  const handleSubmit = () => {
    const seats = Number.parseInt(capacity, 10);
    if (!table && !number.trim()) {
      setValidationError('Table number is required.');
      return;
    }
    if (!Number.isFinite(seats) || seats <= 0) {
      setValidationError('Enter a valid capacity greater than 0.');
      return;
    }

    setValidationError(null);
    if (table) {
      onSubmit({ capacity: seats });
    } else {
      onSubmit({ number: number.trim(), capacity: seats });
    }
  };

  const message = validationError ?? errorMessage;
  const isBusy = isSubmitting || isDeleting;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border/70 px-5 pb-4 pt-6">
          <Pressable onPress={onClose} hitSlop={12} disabled={isBusy}>
            <Text className="text-base font-medium text-primary">
              Cancel
            </Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">
            {table ? 'Table details' : 'New table'}
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 py-5"
          keyboardShouldPersistTaps="handled">
          {table ? (
            <View className="gap-2">
              <Text className="px-1 text-sm font-medium text-muted-foreground">
                Table number
              </Text>
              <View
                className="rounded-2xl border border-input bg-muted px-4 py-3.5"
                style={{ borderCurve: 'continuous' }}>
                <Text className="text-base text-muted-foreground">
                  {table.number}
                </Text>
              </View>
              <Text className="px-1 text-xs text-muted-foreground">
                Table numbers cannot be changed after creation.
              </Text>
            </View>
          ) : (
            <TextField
              label="Table number"
              value={number}
              onChangeText={setNumber}
              placeholder="A1"
              autoCapitalize="characters"
            />
          )}

          <TextField
            label="Capacity"
            value={capacity}
            onChangeText={setCapacity}
            placeholder="4"
            keyboardType="number-pad"
          />

          {table && (table.sessions?.length ?? 0) > 0 ? (
            <View
              className="rounded-2xl border border-amber-200/80 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/40"
              style={{ borderCurve: 'continuous' }}>
              <Text className="text-sm leading-5 text-amber-800 dark:text-amber-200">
                This table has an active session. You can still update capacity, but deleting may
                affect in-progress orders.
              </Text>
            </View>
          ) : null}

          {message ? (
            <Text className="text-sm text-red-600 dark:text-red-400">{message}</Text>
          ) : null}

          <View className="mt-2 gap-3">
            <Button onPress={isBusy ? undefined : handleSubmit}>
              {isSubmitting ? 'Saving...' : table ? 'Save changes' : 'Add table'}
            </Button>
            {table ? (
              <Pressable
                onPress={() => onDelete(table)}
                disabled={isBusy}
                accessibilityRole="button"
                className="rounded-full border border-red-200 px-5 py-3.5 active:opacity-70 dark:border-red-900/50"
                style={{ borderCurve: 'continuous' }}>
                <Text className="text-center text-base font-semibold text-red-600 dark:text-red-400">
                  {isDeleting ? 'Deleting...' : 'Delete table'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
