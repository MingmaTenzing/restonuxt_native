import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, useColorScheme, View } from 'react-native';

interface PosDiningHeaderProps {
  tableNumber: string;
  onChangeTable: () => void;
}

export function PosDiningHeader({ tableNumber, onChangeTable }: PosDiningHeaderProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className="flex-row items-center gap-4 rounded-3xl border-2 border-primary bg-primary/5 px-4 py-3.5"
      style={{ borderCurve: 'continuous' }}>
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
        <Text className="text-2xl font-bold text-primary-foreground">{tableNumber}</Text>
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Dining order
        </Text>
        <Text className="text-xl font-bold text-foreground">Table {tableNumber}</Text>
        <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          Live session · ready for kitchen
        </Text>
      </View>

      <Pressable
        onPress={onChangeTable}
        accessibilityRole="button"
        accessibilityLabel="Change table"
        className="flex-row items-center gap-1 rounded-full border border-border bg-card px-3 py-2 active:opacity-80"
        style={{ borderCurve: 'continuous' }}>
        <Ionicons name="swap-horizontal" size={16} color={isDark ? '#E4E4E7' : '#18181B'} />
        <Text className="text-sm font-semibold text-foreground">Change</Text>
      </Pressable>
    </View>
  );
}
