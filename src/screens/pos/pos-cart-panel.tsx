import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { formatMoney } from '@/utils/format-money';

import { cartTotalCents, removeCartLine, updateCartLineQuantity } from './cart';
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
  destinationLabel?: string | null;
  variant?: 'sheet' | 'sidebar';
  topInset?: number;
  bottomInset?: number;
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
  destinationLabel = null,
  variant = 'sheet',
  topInset = 0,
  bottomInset = 0,
}: PosCartPanelProps) {
  const totalCents = cartTotalCents(lines);
  const isSidebar = variant === 'sidebar';

  const content = (
    <>
      {destinationLabel ? (
        <View
          className="flex-row items-center gap-3 rounded-3xl border-2 border-primary bg-primary/5 px-4 py-3.5 dark:border-primary-dark dark:bg-primary-dark/10"
          style={{ borderCurve: 'continuous' }}>
          <View className="h-12 min-w-12 items-center justify-center rounded-2xl bg-primary px-3 dark:bg-primary-dark">
            <Text className="text-xl font-bold text-primary-foreground dark:text-primary-foreground-dark">
              {destinationLabel}
            </Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-muted-foreground-dark">
              Destination
            </Text>
            <Text className="text-xl font-bold text-foreground dark:text-foreground-dark">
              Table {destinationLabel}
            </Text>
          </View>
        </View>
      ) : null}

      <View
        className="gap-1 rounded-3xl border border-dashed border-border bg-muted/50 px-5 py-4 dark:border-border-dark dark:bg-muted-dark/40"
        style={{ borderCurve: 'continuous' }}>
        <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground dark:text-muted-foreground-dark">
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
          {destinationLabel ? ` · Table ${destinationLabel}` : ''}
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
      <View className="min-h-0 flex-1 border-l border-border bg-background dark:border-border-dark dark:bg-background-dark">
        <View
          className="border-b border-border px-5 pb-4 dark:border-border-dark"
          style={{ paddingTop: topInset + 16 }}>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Order ticket
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {destinationLabel
              ? `Sending to Table ${destinationLabel}`
              : 'Live cart — always visible on tablet'}
          </Text>
        </View>
        <ScrollView
          className="min-h-0 flex-1"
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: 20,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: Math.max(bottomInset, 20) + 8,
          }}
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
