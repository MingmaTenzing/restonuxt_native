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
      <Text className="px-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className="rounded-2xl border border-input bg-card px-4 py-3.5 text-base text-foreground dark:border-input-dark dark:bg-card-dark dark:text-foreground-dark"
        style={{ borderCurve: 'continuous' }}
      />
    </View>
  );
}
