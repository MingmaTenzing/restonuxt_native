import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { formatMoney } from '@/utils/format-money';

import { cartTotalCents, lineTotalCents, removeCartLine, updateCartLineQuantity } from './cart';
import type { CartLine } from './types';
import { PosCartLineRow } from './pos-cart-line-row';

interface PosCartPanelProps {
  lines: CartLine[];
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  onUpdateLines: (lines: CartLine[]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  canSubmit: boolean;
  submitLabel: string;
  variant?: 'sheet' | 'sidebar';
}

export function PosCartPanel({
  lines,
  customerName,
  onCustomerNameChange,
  onUpdateLines,
  onSubmit,
  isSubmitting,
  errorMessage,
  canSubmit,
  submitLabel,
  variant = 'sheet',
}: PosCartPanelProps) {
  const totalCents = cartTotalCents(lines);
  const isSidebar = variant === 'sidebar';

  const content = (
    <>
      <View
        className="gap-1 rounded-3xl border border-dashed border-amber-400/50 bg-amber-50/60 px-5 py-4 dark:border-amber-500/30 dark:bg-amber-950/20"
        style={{ borderCurve: 'continuous' }}>
        <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
          Kitchen ticket
        </Text>
        <Text
          className={`font-bold tracking-tight text-foreground dark:text-foreground-dark ${
            isSidebar ? 'text-2xl' : 'text-3xl'
          }`}>
          {formatMoney(totalCents)}
        </Text>
        <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
          {lines.length} {lines.length === 1 ? 'line' : 'lines'} on this ticket
        </Text>
      </View>

      <TextField
        label="Guest name"
        value={customerName}
        onChangeText={onCustomerNameChange}
        placeholder="Walk-in guest"
        autoCapitalize="words"
      />

      <View className="gap-3">
        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground-dark">
          Items
        </Text>
        {lines.length === 0 ? (
          <View
            className="rounded-2xl border border-border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-base text-muted-foreground dark:text-muted-foreground-dark">
              Your ticket is empty. Add dishes from the menu.
            </Text>
          </View>
        ) : (
          lines.map((line) => (
            <PosCartLineRow
              key={line.id}
              line={line}
              onDecrement={() =>
                onUpdateLines(updateCartLineQuantity(lines, line.id, line.quantity - 1))
              }
              onIncrement={() =>
                onUpdateLines(updateCartLineQuantity(lines, line.id, line.quantity + 1))
              }
              onRemove={() => onUpdateLines(removeCartLine(lines, line.id))}
            />
          ))
        )}
      </View>

      {errorMessage ? (
        <Text selectable className="text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </Text>
      ) : null}

      <Button onPress={isSubmitting || !canSubmit ? undefined : onSubmit}>
        {isSubmitting ? 'Sending to kitchen...' : submitLabel}
      </Button>
    </>
  );

  if (isSidebar) {
    return (
      <View className="flex-1 border-l border-border bg-background dark:border-border-dark dark:bg-background-dark">
        <View className="border-b border-border px-5 py-4 dark:border-border-dark">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Order ticket
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            Live cart — always visible on tablet
          </Text>
        </View>
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-5 py-5"
          keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-5 px-5 py-5"
      keyboardShouldPersistTaps="handled">
      {content}
    </ScrollView>
  );
}
