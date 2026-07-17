import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  UIManager,
  useColorScheme,
  View,
} from 'react-native';

import { formatDate } from '@/utils/format-date';

import type { Booking, BookingStatus } from './types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STATUS_STYLES: Record<BookingStatus, { badge: string; text: string }> = {
  PENDING: {
    badge: 'bg-amber-100/80 dark:bg-amber-500/15',
    text: 'text-amber-800 dark:text-amber-300',
  },
  CONFIRMED: {
    badge: 'bg-blue-100/80 dark:bg-blue-500/15',
    text: 'text-blue-800 dark:text-blue-300',
  },
  SEATED: {
    badge: 'bg-emerald-100/80 dark:bg-emerald-500/15',
    text: 'text-emerald-800 dark:text-emerald-300',
  },
  COMPLETED: {
    badge: 'bg-neutral-200 dark:bg-neutral-700',
    text: 'text-neutral-700 dark:text-neutral-200',
  },
  CANCELLED: {
    badge: 'bg-red-100/80 dark:bg-red-500/15',
    text: 'text-red-800 dark:text-red-300',
  },
  NO_SHOW: {
    badge: 'bg-red-100/80 dark:bg-red-500/15',
    text: 'text-red-800 dark:text-red-300',
  },
};

function formatLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

export function formatBookingTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${formatDate(iso)} · ${time}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-sm font-medium text-muted-foreground">
        {label}
      </Text>
      <Text
        selectable
        className="flex-1 text-right text-base text-foreground">
        {value}
      </Text>
    </View>
  );
}

export function BookingCard({ booking }: { booking: Booking }) {
  const status = STATUS_STYLES[booking.status] ?? STATUS_STYLES.PENDING;
  const [expanded, setExpanded] = useState(false);
  const isDark = useColorScheme() === 'dark';

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`Booking for ${booking.customerName}`}
      className="gap-4 rounded-3xl border border-border bg-card p-5 active:opacity-90"
      style={{ borderCurve: 'continuous', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)' }}>
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1 gap-1.5">
          <Text className="text-lg font-semibold text-foreground">
            {booking.customerName}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {formatBookingTime(booking.bookingTime)}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${status.badge}`}>
          <Text className={`text-xs font-semibold ${status.text}`}>
            {formatLabel(booking.status)}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={isDark ? '#98989D' : '#8E8E93'}
        />
      </View>

      {expanded ? (
        <>
          <View className="h-px bg-muted" />

          <View className="gap-3">
            <DetailRow label="Phone" value={booking.customerPhone} />
            <DetailRow
              label="Guests"
              value={`${booking.guestCount} ${booking.guestCount === 1 ? 'guest' : 'guests'}`}
            />
            {booking.table ? <DetailRow label="Table" value={booking.table.number} /> : null}
            {booking.specialRequest ? (
              <DetailRow label="Note" value={booking.specialRequest} />
            ) : null}
          </View>
        </>
      ) : null}
    </Pressable>
  );
}
