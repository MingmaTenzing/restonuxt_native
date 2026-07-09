import { Text, TextInput, View } from 'react-native';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad' | 'decimal-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: TextFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8898AA"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
        style={{ borderCurve: 'continuous' }}
      />
    </View>
  );
}
