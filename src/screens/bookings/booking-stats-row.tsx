import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

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
    iconWrap: 'bg-primary/10',
    iconLight: '#18181B',
    iconDark: '#E4E4E7',
    value: 'text-foreground',
  },
  month: {
    iconName: 'trending-up-outline',
    iconWrap: 'bg-blue-100 dark:bg-blue-500/15',
    iconLight: '#1D4ED8',
    iconDark: '#60A5FA',
    value: 'text-foreground',
  },
  upcoming: {
    iconName: 'time-outline',
    iconWrap: 'bg-amber-100 dark:bg-amber-500/15',
    iconLight: '#B45309',
    iconDark: '#FBBF24',
    value: 'text-foreground',
  },
  guests: {
    iconName: 'people-outline',
    iconWrap: 'bg-muted',
    iconLight: '#404040',
    iconDark: '#E5E5E5',
    value: 'text-foreground',
  },
};

const STAT_ITEMS: {
  key: keyof typeof ACCENTS;
  label: string;
  valueKey: keyof BookingStats;
}[] = [
  { key: 'today', label: 'Today', valueKey: 'today' },
  { key: 'month', label: 'Month', valueKey: 'thisMonth' },
  { key: 'upcoming', label: 'Upcoming', valueKey: 'upcoming' },
  { key: 'guests', label: 'Guests', valueKey: 'totalGuests' },
];

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: Accent;
}) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className="min-w-[104px] flex-1 gap-1 rounded-2xl border border-border bg-card px-3 py-2.5"
      style={{ borderCurve: 'continuous' }}>
      <View className="flex-row items-center gap-1.5">
        <View
          className={`h-6 w-6 shrink-0 items-center justify-center rounded-full ${accent.iconWrap}`}
          style={{ borderCurve: 'continuous' }}>
          <Ionicons
            name={accent.iconName}
            size={13}
            color={isDark ? accent.iconDark : accent.iconLight}
          />
        </View>
        <Text numberOfLines={1} className="flex-1 text-[11px] font-medium text-muted-foreground">
          {label}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        className={`text-xl font-semibold tracking-tight ${accent.value}`}
        style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
    </View>
  );
}

export function BookingStatsRow({ stats }: { stats: BookingStats }) {
  const { gridGap } = useResponsiveLayout();

  return (
    <View className="flex-row" style={{ gap: Math.min(gridGap, 8) }}>
      {STAT_ITEMS.map((item) => (
        <StatCard
          key={item.key}
          label={item.label}
          value={stats[item.valueKey]}
          accent={ACCENTS[item.key]}
        />
      ))}
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
      className="flex-row gap-1 rounded-full bg-muted p-1"
      style={{ borderCurve: 'continuous' }}>
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            className={`flex-1 items-center rounded-full px-4 py-2 ${isActive ? 'bg-card' : ''}`}
            style={{
              borderCurve: 'continuous',
              boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.10)' : 'none',
            }}>
            <Text
              className={`text-sm font-semibold ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
