import CommunityDateTimePicker from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, Text, TextInput, useColorScheme, View } from 'react-native';

import {
  applyDatePart,
  applyTimePart,
  formatDateTimeValue,
  fromWebInputValue,
  toWebInputValue,
} from './date-time-value';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  accentColor?: string;
}

type AndroidStep = 'hidden' | 'date' | 'time';

/**
 * Date/time field that works inside RN Modals.
 * iOS compact popovers fail in Modal — use an expandable spinner instead.
 * Android has no datetime dialog — run date then time for `datetime` mode.
 */
export function DateTimeField({
  label,
  value,
  onChange,
  mode = 'datetime',
  minimumDate,
  maximumDate,
  accentColor,
}: DateTimeFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const [androidStep, setAndroidStep] = useState<AndroidStep>('hidden');
  const isDark = useColorScheme() === 'dark';
  const resolvedAccentColor = accentColor ?? (isDark ? '#E4E4E7' : '#18181B');

  const openAndroid = () => {
    if (mode === 'time') setAndroidStep('time');
    else setAndroidStep('date');
  };

  return (
    <View className="gap-2">
      <Text className="px-1 text-sm font-medium text-muted-foreground">{label}</Text>

      {Platform.OS === 'web' ? (
        <TextInput
          value={toWebInputValue(value, mode)}
          onChangeText={(text) => {
            const next = fromWebInputValue(text, mode, value);
            if (next) onChange(next);
          }}
          // @ts-expect-error web-only input type
          type={mode === 'time' ? 'time' : mode === 'date' ? 'date' : 'datetime-local'}
          className="rounded-2xl border border-input bg-card px-4 py-3.5 text-base text-foreground"
          style={{ borderCurve: 'continuous' }}
        />
      ) : Platform.OS === 'ios' ? (
        <View className="overflow-hidden rounded-2xl border border-input bg-card">
          <Pressable
            onPress={() => setIosOpen((open) => !open)}
            className="flex-row items-center justify-between px-4 py-3.5"
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${formatDateTimeValue(value, mode)}`}>
            <Text className="text-base text-foreground">{formatDateTimeValue(value, mode)}</Text>
            <Text className="text-sm font-medium text-primary">{iosOpen ? 'Done' : 'Edit'}</Text>
          </Pressable>
          {iosOpen ? (
            <View className="border-t border-border px-2 pb-2 pt-1">
              <CommunityDateTimePicker
                value={value}
                mode={mode}
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                accentColor={resolvedAccentColor}
                themeVariant={isDark ? 'dark' : 'light'}
                style={{ alignSelf: 'stretch', height: mode === 'datetime' ? 180 : 140 }}
                onValueChange={(_event, date) => {
                  if (date) onChange(date);
                }}
              />
            </View>
          ) : null}
        </View>
      ) : (
        <>
          <Pressable
            onPress={openAndroid}
            className="rounded-2xl border border-input bg-card px-4 py-3.5"
            style={{ borderCurve: 'continuous' }}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${formatDateTimeValue(value, mode)}`}>
            <Text className="text-base text-foreground">{formatDateTimeValue(value, mode)}</Text>
          </Pressable>

          {androidStep === 'date' ? (
            <CommunityDateTimePicker
              value={value}
              mode="date"
              presentation="dialog"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              accentColor={resolvedAccentColor}
              onValueChange={(_event, date) => {
                if (!date) {
                  setAndroidStep('hidden');
                  return;
                }
                const next = applyDatePart(value, date);
                onChange(next);
                if (mode === 'datetime') setAndroidStep('time');
                else setAndroidStep('hidden');
              }}
              onDismiss={() => setAndroidStep('hidden')}
            />
          ) : null}

          {androidStep === 'time' ? (
            <CommunityDateTimePicker
              value={value}
              mode="time"
              presentation="dialog"
              accentColor={resolvedAccentColor}
              onValueChange={(_event, date) => {
                setAndroidStep('hidden');
                if (date) onChange(applyTimePart(value, date));
              }}
              onDismiss={() => setAndroidStep('hidden')}
            />
          ) : null}
        </>
      )}
    </View>
  );
}
