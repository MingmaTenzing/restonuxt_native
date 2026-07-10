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
    iconWrap: 'bg-primary/10 dark:bg-primary-dark/15',
    iconLight: '#18181B',
    iconDark: '#E4E4E7',
    value: 'text-foreground dark:text-foreground-dark',
  },
  month: {
    iconName: 'trending-up-outline',
    iconWrap: 'bg-blue-100 dark:bg-blue-500/15',
    iconLight: '#1D4ED8',
    iconDark: '#60A5FA',
    value: 'text-foreground dark:text-foreground-dark',
  },
  upcoming: {
    iconName: 'time-outline',
    iconWrap: 'bg-amber-100 dark:bg-amber-500/15',
    iconLight: '#B45309',
    iconDark: '#FBBF24',
    value: 'text-foreground dark:text-foreground-dark',
  },
  guests: {
    iconName: 'people-outline',
    iconWrap: 'bg-muted dark:bg-accent-dark',
    iconLight: '#404040',
    iconDark: '#E5E5E5',
    value: 'text-foreground dark:text-foreground-dark',
  },
};

function StatCard({ label, value, accent }: { label: string; value: number; accent: Accent }) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View
      className="flex-1  gap-3 rounded-3xl border border-border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <Text className="text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
        {label}
      </Text>

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
          <Text className={`text-3xl font-semibold tracking-tight ${accent.value}`}>{value}</Text>
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
      className="flex-row gap-1 rounded-full bg-muted p-1 dark:bg-muted-dark"
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
              isActive ? 'bg-card dark:bg-accent-dark' : ''
            }`}
            style={{
              borderCurve: 'continuous',
              boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.10)' : 'none',
            }}>
            <Text
              className={`text-sm font-semibold ${
                isActive
                  ? 'text-foreground dark:text-foreground-dark'
                  : 'text-muted-foreground dark:text-muted-foreground-dark'
              }`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
