import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { formatMoney } from '@/utils/format-money';

import { cartTotalCents } from './cart';
import type { CartLine } from './types';
import { PosCartLineRow } from './pos-cart-line-row';

interface PosCartPanelProps {
  lines: CartLine[];
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  onIncrease: (line: CartLine) => void;
  onDecrease: (line: CartLine) => void;
  onRemove: (line: CartLine) => void;
  onClearCart: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
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
  onIncrease,
  onDecrease,
  onRemove,
  onClearCart,
  onSubmit,
  isSubmitting,
  errorMessage,
  submitLabel,
  destinationLabel = null,
  variant = 'sheet',
  topInset = 0,
  bottomInset = 0,
}: PosCartPanelProps) {
  const totalCents = cartTotalCents(lines);
  const isSidebar = variant === 'sidebar';

  const handleClearCart = () => {
    Alert.alert('Empty cart', 'Remove all items from this ticket?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: onClearCart },
    ]);
  };

  const content = (
    <>
      {destinationLabel ? (
        <View
          className="flex-row items-center gap-3 rounded-3xl border-2 border-primary bg-primary/5 px-4 py-3.5"
          style={{ borderCurve: 'continuous' }}>
          <View className="h-12 min-w-12 items-center justify-center rounded-2xl bg-primary px-3">
            <Text className="text-xl font-bold text-primary-foreground">
              {destinationLabel}
            </Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Destination
            </Text>
            <Text className="text-xl font-bold text-foreground">
              Table {destinationLabel}
            </Text>
          </View>
        </View>
      ) : null}

      <View
        className="gap-1 rounded-3xl border border-dashed border-border bg-muted/50 px-5 py-4"
        style={{ borderCurve: 'continuous' }}>
        <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Kitchen ticket
        </Text>
        <Text
          className={`font-bold tracking-tight text-foreground ${
            isSidebar ? 'text-2xl' : 'text-3xl'
          }`}>
          {formatMoney(totalCents)}
        </Text>
        <Text className="text-sm text-muted-foreground">
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
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Items
          </Text>
          {lines.length > 0 ? (
            <Pressable
              onPress={isSubmitting ? undefined : handleClearCart}
              accessibilityRole="button"
              accessibilityLabel="Empty cart"
              hitSlop={8}
              className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                isSubmitting
                  ? 'border-border bg-muted/40'
                  : 'border-red-200/90 bg-red-50/60 active:opacity-80 dark:border-red-900/50 dark:bg-red-950/25'
              }`}
              style={{ borderCurve: 'continuous' }}>
              <Ionicons
                name="cart-outline"
                size={16}
                color={isSubmitting ? '#A1A1AA' : '#DC2626'}
              />
              <Ionicons
                name="close-circle"
                size={14}
                color={isSubmitting ? '#A1A1AA' : '#DC2626'}
              />
            </Pressable>
          ) : null}
        </View>
        {lines.length === 0 ? (
          <View
            className="rounded-2xl border border-border bg-card p-4"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-base text-muted-foreground">
              Your ticket is empty. Add dishes from the menu.
            </Text>
          </View>
        ) : (
          lines.map((line) => (
            <PosCartLineRow
              key={line.id}
              line={line}
              onDecrement={() => onDecrease(line)}
              onIncrement={() => onIncrease(line)}
              onRemove={() => onRemove(line)}
            />
          ))
        )}
      </View>

      {errorMessage ? (
        <Text selectable className="text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </Text>
      ) : null}

      <Button onPress={onSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Sending to kitchen...' : submitLabel}
      </Button>
    </>
  );

  if (isSidebar) {
    return (
      <View className="min-h-0 flex-1 border-l border-border bg-background">
        <View
          className="border-b border-border px-5 pb-4"
          style={{ paddingTop: topInset + 16 }}>
          <Text className="text-lg font-semibold text-foreground">
            Order ticket
          </Text>
          <Text className="text-sm text-muted-foreground">
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
