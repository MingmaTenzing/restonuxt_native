import { Text, View } from 'react-native';

interface BarChartProps {
  values: number[];
}

export function BarChart({ values }: BarChartProps) {
  const maxValue = Math.max(...values, 1);

  return (
    <View className="h-36 flex-row items-end gap-2 rounded-3xl bg-white p-4">
      {values.map((value, index) => (
        <View key={`${value}-${index}`} className="flex-1 items-center gap-2">
          <View
            className="w-full rounded-t-xl bg-emerald-500"
            style={{ height: `${Math.max((value / maxValue) * 100, 8)}%` }}
          />
          <Text className="text-xs font-semibold text-zinc-500">{value}</Text>
        </View>
      ))}
    </View>
  );
}
