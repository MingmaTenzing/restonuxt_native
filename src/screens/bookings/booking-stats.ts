import type { Booking } from './types';

export type BookingFilter = 'today' | 'all';

export interface BookingStats {
  today: number;
  thisMonth: number;
  upcoming: number;
  totalGuests: number;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

const ACTIVE_STATUSES = new Set(['PENDING', 'CONFIRMED', 'SEATED']);

export function computeBookingStats(bookings: Booking[]): BookingStats {
  const now = new Date();
  let today = 0;
  let thisMonth = 0;
  let upcoming = 0;
  let totalGuests = 0;

  for (const booking of bookings) {
    const date = new Date(booking.bookingTime);
    if (Number.isNaN(date.getTime())) continue;

    if (isSameDay(date, now)) today += 1;
    if (isSameMonth(date, now)) thisMonth += 1;
    if (date.getTime() >= now.getTime() && ACTIVE_STATUSES.has(booking.status)) upcoming += 1;
    totalGuests += booking.guestCount ?? 0;
  }

  return { today, thisMonth, upcoming, totalGuests };
}

export function filterBookings(bookings: Booking[], filter: BookingFilter): Booking[] {
  if (filter === 'all') return bookings;

  const now = new Date();
  return bookings.filter((booking) => {
    const date = new Date(booking.bookingTime);
    if (Number.isNaN(date.getTime())) return false;
    return isSameDay(date, now);
  });
}
