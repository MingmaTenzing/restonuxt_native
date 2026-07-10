import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';

import type { TableOption } from './types';

interface SessionCreateModalProps {
  visible: boolean;
  tables: TableOption[];
  isLoadingTables: boolean;
  onClose: () => void;
  onSubmit: (tableId: string) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export function SessionCreateModal({
  visible,
  tables,
  isLoadingTables,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: SessionCreateModalProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    /* eslint-disable react-hooks/set-state-in-effect -- Re-seed local draft fields when the sheet opens. */
    setSelectedTableId(null);
    setValidationError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [visible]);

  const handleSubmit = () => {
    if (!selectedTableId) {
      setValidationError('Select a table to open a session.');
      return;
    }
    setValidationError(null);
    onSubmit(selectedTableId);
  };

  const message = validationError ?? errorMessage;
  const availableTables = tables.filter((table) => !table.hasActiveSession);
  const occupiedTables = tables.filter((table) => table.hasActiveSession);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-row items-center justify-between border-b border-neutral-200/70 px-5 pb-4 pt-6 dark:border-border-dark">
          <Pressable onPress={onClose} hitSlop={12} disabled={isSubmitting}>
            <Text className="text-base font-medium text-primary dark:text-primary-dark">
              Cancel
            </Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Open session
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 py-5"
          keyboardShouldPersistTaps="handled">
          <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
            Start a dining session for a table. Tables with an active session are shown separately.
          </Text>

          {isLoadingTables ? (
            <Text className="text-base text-muted-foreground dark:text-muted-foreground-dark">
              Loading tables...
            </Text>
          ) : tables.length === 0 ? (
            <View
              className="rounded-2xl border border-border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
              style={{ borderCurve: 'continuous' }}>
              <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
                No tables found. Add tables first from the Tables tab.
              </Text>
            </View>
          ) : (
            <>
              {availableTables.length > 0 ? (
                <View className="gap-2">
                  <Text className="px-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
                    Available tables
                  </Text>
                  {availableTables.map((table) => {
                    const isSelected = selectedTableId === table.id;
                    return (
                      <Pressable
                        key={table.id}
                        onPress={() => setSelectedTableId(table.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        className={`flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
                          isSelected
                            ? 'border-primary bg-primary/5 dark:border-primary-dark dark:bg-primary-dark/10'
                            : 'border-border bg-card dark:border-border-dark dark:bg-card-dark'
                        }`}
                        style={{ borderCurve: 'continuous' }}>
                        <View>
                          <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                            Table {table.number}
                          </Text>
                          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                            Seats {table.capacity}
                          </Text>
                        </View>
                        {isSelected ? (
                          <Text className="text-sm font-semibold text-primary dark:text-primary-dark">
                            Selected
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {occupiedTables.length > 0 ? (
                <View className="gap-2">
                  <Text className="px-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
                    Already active
                  </Text>
                  {occupiedTables.map((table) => (
                    <Pressable
                      key={table.id}
                      onPress={() => setSelectedTableId(table.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedTableId === table.id }}
                      className={`flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
                        selectedTableId === table.id
                          ? 'border-amber-500 bg-amber-500/5 dark:border-amber-400 dark:bg-amber-400/10'
                          : 'border-border bg-muted dark:border-border-dark dark:bg-muted-dark'
                      }`}
                      style={{ borderCurve: 'continuous' }}>
                      <View>
                        <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                          Table {table.number}
                        </Text>
                        <Text className="text-sm text-amber-700 dark:text-amber-300">
                          Has active session — will resume existing
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          )}

          {message ? (
            <Text selectable className="text-sm text-red-600 dark:text-red-400">
              {message}
            </Text>
          ) : null}

          <View className="mt-2">
            <Button onPress={isSubmitting ? undefined : handleSubmit}>
              {isSubmitting ? 'Opening...' : 'Open session'}
            </Button>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
