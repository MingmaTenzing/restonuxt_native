import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { formatMoney } from '@/utils/format-money';

import { MenuOptionSheet, type MenuOptionSheetMode } from './menu-option-sheet';
import type { MenuOption, MenuOptionInput } from './types';

interface MenuOptionsSectionProps {
  menuItemId: string | null;
  savedOptions: MenuOption[];
  draftOptions: MenuOptionInput[];
  onDraftOptionsChange: (options: MenuOptionInput[]) => void;
  onCreateOption: (input: MenuOptionInput) => void;
  onUpdateOption: (optionId: string, input: MenuOptionInput) => void;
  isSavingOption: boolean;
  optionError: string | null;
}

export function MenuOptionsSection({
  menuItemId,
  savedOptions,
  draftOptions,
  onDraftOptionsChange,
  onCreateOption,
  onUpdateOption,
  isSavingOption,
  optionError,
}: MenuOptionsSectionProps) {
  const [sheetMode, setSheetMode] = useState<MenuOptionSheetMode | null>(null);

  const closeSheet = () => setSheetMode(null);

  const handleSave = (input: MenuOptionInput, optionId: string | null) => {
    if (menuItemId) {
      if (optionId) onUpdateOption(optionId, input);
      else onCreateOption(input);
      return;
    }

    if (optionId?.startsWith('draft-')) {
      const index = Number(optionId.replace('draft-', ''));
      onDraftOptionsChange(
        draftOptions.map((option, optionIndex) => (optionIndex === index ? input : option))
      );
      closeSheet();
      return;
    }

    onDraftOptionsChange([...draftOptions, input]);
    closeSheet();
  };

  const handleRemove = () => {
    if (!sheetMode || sheetMode.type !== 'edit' || menuItemId) return;
    const index = Number(sheetMode.optionId.replace('draft-', ''));
    onDraftOptionsChange(draftOptions.filter((_, optionIndex) => optionIndex !== index));
    closeSheet();
  };

  const options = menuItemId ? savedOptions : draftOptions;

  return (
    <View className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="px-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
            Options
          </Text>
          <Text className="px-1 text-xs leading-5 text-muted-foreground dark:text-muted-foreground-dark">
            Add-ons like extra cheese or a side salad.
          </Text>
        </View>
        <Pressable
          onPress={() => setSheetMode({ type: 'create' })}
          accessibilityRole="button"
          accessibilityLabel="Add option"
          className="flex-row items-center gap-1 rounded-full bg-primary px-3 py-2 active:opacity-80 dark:bg-primary-dark">
          <Ionicons name="add" size={18} color="#FAFAFA" />
          <Text className="text-sm font-semibold text-primary-foreground dark:text-primary-foreground-dark">
            Add
          </Text>
        </Pressable>
      </View>

      {options.length > 0 ? (
        <View
          className="gap-2 rounded-2xl border border-border bg-card p-3 dark:border-border-dark dark:bg-card-dark"
          style={{ borderCurve: 'continuous' }}>
          {menuItemId
            ? savedOptions.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() =>
                    setSheetMode({
                      type: 'edit',
                      optionId: option.id,
                      initial: { name: option.name, priceCents: option.priceCents },
                    })
                  }
                  accessibilityRole="button"
                  className="flex-row items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5 active:opacity-70 dark:bg-muted-dark/50">
                  <View className="flex-1 gap-0.5">
                    <Text className="text-base font-medium text-foreground dark:text-foreground-dark">
                      {option.name}
                    </Text>
                    <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                      {formatMoney(option.priceCents)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </Pressable>
              ))
            : draftOptions.map((option, index) => (
                <Pressable
                  key={`draft-${index}`}
                  onPress={() =>
                    setSheetMode({
                      type: 'edit',
                      optionId: `draft-${index}`,
                      initial: { name: option.name, priceCents: option.priceCents },
                    })
                  }
                  accessibilityRole="button"
                  className="flex-row items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5 active:opacity-70 dark:bg-muted-dark/50">
                  <View className="flex-1 gap-0.5">
                    <Text className="text-base font-medium text-foreground dark:text-foreground-dark">
                      {option.name}
                    </Text>
                    <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                      {formatMoney(option.priceCents)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </Pressable>
              ))}
        </View>
      ) : (
        <Pressable
          onPress={() => setSheetMode({ type: 'create' })}
          accessibilityRole="button"
          className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-5 active:opacity-70 dark:border-border-dark dark:bg-muted-dark/20"
          style={{ borderCurve: 'continuous' }}>
          <Text className="text-center text-sm text-muted-foreground dark:text-muted-foreground-dark">
            No options yet. Tap to add one.
          </Text>
        </Pressable>
      )}

      <MenuOptionSheet
        visible={sheetMode !== null}
        mode={sheetMode}
        onClose={closeSheet}
        onSave={handleSave}
        onRemove={sheetMode?.type === 'edit' && !menuItemId ? handleRemove : undefined}
        isSaving={isSavingOption}
        errorMessage={optionError}
      />
    </View>
  );
}
