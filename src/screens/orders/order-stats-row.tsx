import { Text, View } from 'react-native';

import { formatMoney } from '@/utils/format-money';

import type { OrderStats } from './order-stats';

function MetricCard({
  label,
  value,
  accentWrap,
  accentText,
  icon,
}: {
  label: string;
  value: string | number;
  accentWrap: string;
  accentText: string;
  icon: string;
}) {
  return (
    <View
      className="flex-1 gap-3 rounded-3xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      style={{ borderCurve: 'continuous' }}>
      <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</Text>
      <View className="flex-row items-center gap-2">
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${accentWrap}`}
          style={{ borderCurve: 'continuous' }}>
          <Text className={`text-base ${accentText}`}>{icon}</Text>
        </View>
        <Text className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          {value}
        </Text>
      </View>
    </View>
  );
}

export function OrderStatsRow({ stats }: { stats: OrderStats }) {
  return (
    <View className="gap-3">
      {/* Revenue is the signature metric — given its own full-width, high-contrast card. */}
      <View
        className="gap-1.5 rounded-3xl bg-black p-5 dark:bg-white"
        style={{ borderCurve: 'continuous' }}>
        <Text className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Revenue today
        </Text>
        <Text className="text-4xl font-bold tracking-tight text-white dark:text-black">
          {formatMoney(stats.todayRevenueCents)}
        </Text>
        <Text className="text-sm text-neutral-400 dark:text-neutral-500">
          {stats.todayCount} {stats.todayCount === 1 ? 'order' : 'orders'} today
        </Text>
      </View>

      <View className="flex-row gap-3">
        <MetricCard
          label="Pending"
          value={stats.pendingCount}
          icon="⏳"
          accentWrap="bg-amber-100 dark:bg-amber-500/15"
          accentText="text-amber-700 dark:text-amber-400"
        />
        <MetricCard
          label="Unpaid"
          value={stats.unpaidCount}
          icon="💳"
          accentWrap="bg-red-100 dark:bg-red-500/15"
          accentText="text-red-700 dark:text-red-400"
        />
      </View>
    </View>
  );
}
