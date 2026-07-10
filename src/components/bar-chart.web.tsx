import { Text, View } from 'react-native';

interface BarChartProps {
  values: number[];
}

export function BarChart({ values }: BarChartProps) {
  const maxValue = Math.max(...values, 1);

  return (
    <View
      className="h-36 flex-row items-end gap-2 rounded-3xl border border-border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)' }}>
      {values.map((value, index) => (
        <View key={`${value}-${index}`} className="flex-1 items-center gap-2">
          <View
            className="w-full rounded-t-xl bg-chart-2 transition-all dark:bg-chart-2-dark"
            style={{ height: `${Math.max((value / maxValue) * 100, 8)}%` }}
          />
          <Text className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground-dark">
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}
