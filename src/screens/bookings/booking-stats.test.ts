import { describe, expect, test } from 'bun:test';

import { filterBookings, searchBookings } from './booking-stats';
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
});
