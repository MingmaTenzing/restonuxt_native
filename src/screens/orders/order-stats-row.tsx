import { Ionicons } from '@expo/vector-icons';
import { Text, useColorScheme, View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import { formatMoney } from '@/utils/format-money';

import type { OrderStats } from './order-stats';

function MetricCard({
  label,
  value,
  accentWrap,
  iconName,
  iconColor,
}: {
  label: string;
  value: string | number;
  accentWrap: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}) {
  return (
    <View
      className="flex-1 gap-3 rounded-3xl border border-border bg-card p-4"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <Text className="text-xs font-medium text-muted-foreground">
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${accentWrap}`}
          style={{ borderCurve: 'continuous' }}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <Text className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </Text>
      </View>
    </View>
  );
}

export function OrderStatsRow({
  stats,
  isRefreshing = false,
}: {
  stats: OrderStats;
  isRefreshing?: boolean;
}) {
  const isDark = useColorScheme() === 'dark';
  const { isTablet, contentWidth, horizontalPadding, gridGap } = useResponsiveLayout();
  const metricWidth = (contentWidth - horizontalPadding * 2 - gridGap) / 2;

  return (
    <View className="gap-3" style={{ opacity: isRefreshing ? 0.65 : 1 }}>
      {/* Revenue is the signature metric — given its own full-width, high-contrast card. */}
      <View
        className="gap-1.5 rounded-3xl bg-neutral-950 p-5"
        style={{ borderCurve: 'continuous', boxShadow: '0 14px 30px rgba(0, 0, 0, 0.16)' }}>
        <Text className="text-xs font-medium uppercase tracking-wider text-neutral-300">
          Revenue today
        </Text>
        <Text className={`font-semibold tracking-tight text-white ${isTablet ? 'text-5xl' : 'text-4xl'}`}>
          {formatMoney(stats.todayRevenueCents)}
        </Text>
        <Text className="text-sm text-neutral-400">
          {stats.todayCount} {stats.todayCount === 1 ? 'order' : 'orders'} today
        </Text>
      </View>

      <View className="flex-row flex-wrap" style={{ gap: gridGap }}>
        <View style={{ width: metricWidth }}>
          <MetricCard
            label="Pending"
            value={stats.pendingCount}
            iconName="time-outline"
            iconColor={isDark ? '#FBBF24' : '#B45309'}
            accentWrap="bg-amber-100 dark:bg-amber-500/15"
          />
        </View>
        <View style={{ width: metricWidth }}>
          <MetricCard
            label="Unpaid"
            value={stats.unpaidCount}
            iconName="card-outline"
            iconColor={isDark ? '#F87171' : '#B91C1C'}
            accentWrap="bg-red-100 dark:bg-red-500/15"
          />
        </View>
      </View>
    </View>
  );
}
