import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

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
  accentColor = '#635BFF',
}: DateTimeFieldProps) {
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</Text>
      {Platform.OS === 'ios' ? (
        <View className="flex-row items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-800">
          <DateTimePicker
            value={value}
            mode={mode}
            display="compact"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            accentColor={accentColor}
            onValueChange={(_event, date) => onChange(date)}
          />
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => setShowAndroidPicker(true)}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 dark:border-neutral-700 dark:bg-neutral-800"
            style={{ borderCurve: 'continuous' }}>
            <Text className="text-base text-neutral-900 dark:text-neutral-50">
              {formatValue(value, mode)}
            </Text>
          </Pressable>
          {showAndroidPicker ? (
            <DateTimePicker
              value={value}
              mode={mode}
              presentation="dialog"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              accentColor={accentColor}
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
