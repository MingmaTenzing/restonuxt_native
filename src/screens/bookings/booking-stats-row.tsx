import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import type { BookingFilter, BookingStats } from './booking-stats';

type Accent = {
  iconName: keyof typeof Ionicons.glyphMap;
  iconWrap: string;
  iconLight: string;
  iconDark: string;
  value: string;
};

const ACCENTS: Record<'today' | 'month' | 'upcoming' | 'guests', Accent> = {
  today: {
    iconName: 'calendar-outline',
    iconWrap: 'bg-accent/15',
    iconLight: '#635BFF',
    iconDark: '#7A73FF',
    value: 'text-neutral-900 dark:text-neutral-50',
  },
  month: {
    iconName: 'trending-up-outline',
    iconWrap: 'bg-blue-100 dark:bg-blue-500/15',
    iconLight: '#1D4ED8',
    iconDark: '#60A5FA',
    value: 'text-neutral-900 dark:text-neutral-50',
  },
  upcoming: {
    iconName: 'time-outline',
    iconWrap: 'bg-amber-100 dark:bg-amber-500/15',
    iconLight: '#B45309',
    iconDark: '#FBBF24',
    value: 'text-neutral-900 dark:text-neutral-50',
  },
  guests: {
    iconName: 'people-outline',
    iconWrap: 'bg-neutral-200 dark:bg-neutral-700',
    iconLight: '#404040',
    iconDark: '#E5E5E5',
    value: 'text-neutral-900 dark:text-neutral-50',
  },
};

function StatCard({ label, value, accent }: { label: string; value: number; accent: Accent }) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View
      className="flex-1  gap-3 rounded-3xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      style={{ borderCurve: 'continuous' }}>
      <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</Text>

      <View className=" flex flex-row gap-2">
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${accent.iconWrap}`}
          style={{ borderCurve: 'continuous' }}>
          <Ionicons
            name={accent.iconName}
            size={18}
            color={isDark ? accent.iconDark : accent.iconLight}
          />
        </View>
        <View className="gap-0.5">
          <Text className={`text-3xl font-bold tracking-tight ${accent.value}`}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

export function BookingStatsRow({ stats }: { stats: BookingStats }) {
  return (
    <View className="flex-1  flex-row flex-wrap gap-3">
      <StatCard label="Today" value={stats.today} accent={ACCENTS.today} />
      <StatCard label="This month" value={stats.thisMonth} accent={ACCENTS.month} />

      <StatCard label="Upcoming" value={stats.upcoming} accent={ACCENTS.upcoming} />
      <StatCard label="Total guests" value={stats.totalGuests} accent={ACCENTS.guests} />
    </View>
  );
}

const OPTIONS: { value: BookingFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'all', label: 'All' },
];

export function BookingFilterToggle({
  value,
  onChange,
}: {
  value: BookingFilter;
  onChange: (filter: BookingFilter) => void;
}) {
  return (
    <View
      className="flex-row gap-1 rounded-full bg-neutral-200/70 p-1 dark:bg-neutral-800/70"
      style={{ borderCurve: 'continuous' }}>
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            className={`flex-1 items-center rounded-full px-4 py-2 ${
              isActive ? 'bg-white dark:bg-neutral-700' : ''
            }`}
            style={{ borderCurve: 'continuous' }}>
            <Text
              className={`text-sm font-semibold ${
                isActive
                  ? 'text-neutral-900 dark:text-neutral-50'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
