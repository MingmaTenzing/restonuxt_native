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
  { key: 'month', label: 'This month', valueKey: 'thisMonth' },
  { key: 'upcoming', label: 'Upcoming', valueKey: 'upcoming' },
  { key: 'guests', label: 'Total guests', valueKey: 'totalGuests' },
];

const HORIZONTAL_PADDING = 40;
const CARD_GAP = 12;

function StatCard({
  label,
  value,
  accent,
  width,
}: {
  label: string;
  value: number;
  accent: Accent;
  width: number;
}) {
  const isDark = useColorScheme() === 'dark';
  const valueSize = width < 150 ? 24 : width < 180 ? 28 : 30;

  return (
    <View
      className="gap-3 rounded-3xl border border-border bg-card p-4"
      style={{
        width,
        borderCurve: 'continuous',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
      }}>
      <Text numberOfLines={1} className="text-xs font-medium text-muted-foreground">
        {label}
      </Text>

      <View className="min-w-0 flex-row items-center gap-2">
        <View
          className={`h-9 w-9 shrink-0 items-center justify-center rounded-full ${accent.iconWrap}`}
          style={{ borderCurve: 'continuous' }}>
          <Ionicons
            name={accent.iconName}
            size={18}
            color={isDark ? accent.iconDark : accent.iconLight}
          />
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          className={`min-w-0 flex-1 font-semibold tracking-tight ${accent.value}`}
          style={{ fontSize: valueSize, fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function BookingStatsRow({ stats }: { stats: BookingStats }) {
  const { isTablet, contentWidth } = useResponsiveLayout();
  const columns = isTablet ? 4 : 2;
  const cardWidth = Math.floor(
    (contentWidth - HORIZONTAL_PADDING - CARD_GAP * (columns - 1)) / columns
  );

  return (
    <View className="flex-row flex-wrap" style={{ gap: CARD_GAP }}>
      {STAT_ITEMS.map((item) => (
        <StatCard
          key={item.key}
          label={item.label}
          value={stats[item.valueKey]}
          accent={ACCENTS[item.key]}
          width={cardWidth}
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
