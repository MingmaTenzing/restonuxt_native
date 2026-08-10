import { describe, expect, test } from 'bun:test';

import { computeBookingStats, filterBookings, searchBookings } from './booking-stats';
import type { Booking } from './types';

function booking(partial: Partial<Booking> & Pick<Booking, 'id' | 'customerName'>): Booking {
  return {
    customerPhone: '+61400000000',
    bookingTime: '2026-07-28T12:00:00.000Z',
    guestCount: 2,
    specialRequest: null,
    status: 'CONFIRMED',
    tableId: null,
    table: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...partial,
  };
}

function hoursFromNowIso(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function daysFromNowIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const sample: Booking[] = [
  booking({
    id: '1',
    customerName: 'Jane Doe',
    customerPhone: '+61 400 111 222',
    specialRequest: 'Window seat',
    table: { id: 't1', number: '12', capacity: 4 },
  }),
  booking({
    id: '2',
    customerName: 'Alex Kim',
    customerPhone: '+61 400 333 444',
    specialRequest: null,
    table: { id: 't2', number: '5', capacity: 2 },
  }),
];

describe('computeBookingStats', () => {
  test('returns zeros for empty list', () => {
    expect(computeBookingStats([])).toEqual({
      today: 0,
      thisMonth: 0,
      upcoming: 0,
      totalGuests: 0,
    });
  });

  test('counts today, this month, upcoming, and guests', () => {
    const stats = computeBookingStats([
      booking({
        id: 'today',
        customerName: 'Today',
        bookingTime: hoursFromNowIso(1),
        guestCount: 4,
        status: 'CONFIRMED',
      }),
      booking({
        id: 'later-month',
        customerName: 'Later',
        bookingTime: daysFromNowIso(5),
        guestCount: 2,
        status: 'PENDING',
      }),
      booking({
        id: 'past',
        customerName: 'Past',
        bookingTime: daysFromNowIso(-40),
        guestCount: 3,
        status: 'COMPLETED',
      }),
      booking({
        id: 'cancelled-future',
        customerName: 'Cancelled',
        bookingTime: hoursFromNowIso(2),
        guestCount: 1,
        status: 'CANCELLED',
      }),
    ]);

    expect(stats.today).toBe(2); // today + cancelled-future (same day)
    expect(stats.thisMonth).toBeGreaterThanOrEqual(2);
    expect(stats.upcoming).toBe(2); // today confirmed + later pending (not cancelled/completed)
    expect(stats.totalGuests).toBe(10);
  });

  test('skips invalid bookingTime', () => {
    expect(
      computeBookingStats([
        booking({ id: 'bad', customerName: 'Bad', bookingTime: 'not-a-date', guestCount: 5 }),
      ])
    ).toEqual({
      today: 0,
      thisMonth: 0,
      upcoming: 0,
      totalGuests: 0,
    });
  });
});

describe('searchBookings', () => {
  test('returns all bookings when query is empty', () => {
    expect(searchBookings(sample, '   ')).toHaveLength(2);
  });

  test('matches customer name case-insensitively', () => {
    expect(searchBookings(sample, 'jane').map((b) => b.id)).toEqual(['1']);
  });

  test('matches phone number', () => {
    expect(searchBookings(sample, '333 444').map((b) => b.id)).toEqual(['2']);
  });

  test('matches table number', () => {
    expect(searchBookings(sample, '12').map((b) => b.id)).toEqual(['1']);
  });

  test('matches special request', () => {
    expect(searchBookings(sample, 'window').map((b) => b.id)).toEqual(['1']);
  });
});

describe('filterBookings', () => {
  test('all returns every booking', () => {
    expect(filterBookings(sample, 'all')).toHaveLength(2);
  });

  test('today returns only same-day bookings', () => {
    const bookings = [
      booking({ id: 'today', customerName: 'Today', bookingTime: hoursFromNowIso(1) }),
      booking({ id: 'other', customerName: 'Other', bookingTime: daysFromNowIso(3) }),
    ];
    expect(filterBookings(bookings, 'today').map((b) => b.id)).toEqual(['today']);
  });

  test('today skips invalid bookingTime', () => {
    expect(
      filterBookings(
        [booking({ id: 'bad', customerName: 'Bad', bookingTime: 'not-a-date' })],
        'today'
      )
    ).toHaveLength(0);
  });
});
