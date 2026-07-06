import { Text, View } from 'react-native';

import { formatDate } from '@/utils/format-date';

import type { Booking, BookingStatus } from './types';

const STATUS_STYLES: Record<BookingStatus, { badge: string; text: string }> = {
  PENDING: {
    badge: 'bg-amber-100 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-400',
  },
  CONFIRMED: {
    badge: 'bg-blue-100 dark:bg-blue-500/15',
    text: 'text-blue-700 dark:text-blue-400',
  },
  SEATED: {
    badge: 'bg-accent/15',
    text: 'text-accent dark:text-accent-dark',
  },
  COMPLETED: {
    badge: 'bg-neutral-200 dark:bg-neutral-700',
    text: 'text-neutral-700 dark:text-neutral-200',
  },
  CANCELLED: {
    badge: 'bg-red-100 dark:bg-red-500/15',
    text: 'text-red-700 dark:text-red-400',
  },
  NO_SHOW: {
    badge: 'bg-red-100 dark:bg-red-500/15',
    text: 'text-red-700 dark:text-red-400',
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
      <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</Text>
      <Text
        selectable
        className="flex-1 text-right text-base text-neutral-900 dark:text-neutral-100">
        {value}
      </Text>
    </View>
  );
}

export function BookingCard({ booking }: { booking: Booking }) {
  const status = STATUS_STYLES[booking.status] ?? STATUS_STYLES.PENDING;

  return (
    <View
      className="gap-4 rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      style={{ borderCurve: 'continuous' }}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1.5">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {booking.customerName}
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatBookingTime(booking.bookingTime)}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${status.badge}`}>
          <Text className={`text-xs font-semibold ${status.text}`}>
            {formatLabel(booking.status)}
          </Text>
        </View>
      </View>

      <View className="h-px bg-neutral-100 dark:bg-neutral-800" />

      <View className="gap-3">
        <DetailRow label="Phone" value={booking.customerPhone} />
        <DetailRow
          label="Guests"
          value={`${booking.guestCount} ${booking.guestCount === 1 ? 'guest' : 'guests'}`}
        />
        {booking.table ? <DetailRow label="Table" value={booking.table.number} /> : null}
        {booking.specialRequest ? <DetailRow label="Note" value={booking.specialRequest} /> : null}
      </View>
    </View>
  );
}
