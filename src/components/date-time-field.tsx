import CommunityDateTimePicker from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, Text, useColorScheme, View } from 'react-native';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  accentColor?: string;
}

function formatValue(date: Date, mode: 'date' | 'time' | 'datetime') {
  if (Number.isNaN(date.getTime())) return '';
  const datePart = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (mode === 'date') return datePart;
  if (mode === 'time') return timePart;
  return `${datePart} · ${timePart}`;
}

export function DateTimeField({
  label,
  value,
  onChange,
  mode = 'datetime',
  minimumDate,
  maximumDate,
  accentColor,
}: DateTimeFieldProps) {
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const isDark = useColorScheme() === 'dark';
  const resolvedAccentColor = accentColor ?? (isDark ? '#E4E4E7' : '#18181B');

  return (
    <View className="gap-2">
      <Text className="px-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
        {label}
      </Text>
      {Platform.OS === 'ios' ? (
        <View className="flex-row items-center justify-between rounded-2xl border border-input bg-card px-4 py-2 dark:border-input-dark dark:bg-card-dark">
          <CommunityDateTimePicker
            value={value}
            mode={mode}
            display="compact"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            accentColor={resolvedAccentColor}
            onValueChange={(_event, date) => onChange(date)}
          />
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => setShowAndroidPicker(true)}
            className="rounded-2xl border border-input bg-card px-4 py-3.5 dark:border-input-dark dark:bg-card-dark"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-base text-foreground dark:text-foreground-dark">
              {formatValue(value, mode)}
            </Text>
          </Pressable>
          {showAndroidPicker ? (
            <CommunityDateTimePicker
              value={value}
              mode={mode}
              presentation="dialog"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              accentColor={resolvedAccentColor}
              onValueChange={(_event, date) => {
                setShowAndroidPicker(false);
                onChange(date);
              }}
              onDismiss={() => setShowAndroidPicker(false)}
            />
          ) : null}
        </>
      )}
    </View>
  );
}
