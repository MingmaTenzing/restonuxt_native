import { Text, View } from 'react-native';

interface BarChartProps {
  values: number[];
}

export function BarChart({ values }: BarChartProps) {
  const maxValue = Math.max(...values, 1);

  return (
    <View className="h-36 flex-row items-end gap-2 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {values.map((value, index) => (
        <View key={`${value}-${index}`} className="flex-1 items-center gap-2">
          <View
            className="bg-accent dark:bg-accent-dark w-full rounded-t-xl transition-all"
            style={{ height: `${Math.max((value / maxValue) * 100, 8)}%` }}
          />
          <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}
