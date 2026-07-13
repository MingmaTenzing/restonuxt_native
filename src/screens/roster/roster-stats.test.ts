import { describe, expect, test } from 'bun:test';

import { makeLeaveRequest, makeShift, makeStaffSummary } from '@/test/roster-fixtures';

import { filterLeaveRequests, groupShiftsByDay, staffDisplayName } from './roster-stats';
import { startOfWeek } from './roster-week';

describe('groupShiftsByDay', () => {
  const weekStart = startOfWeek(new Date('2026-07-15T12:00:00'));

  test('groups and sorts shifts within the week', () => {
    const shifts = [
      makeShift({
        id: '2',
        date: '2026-07-15T00:00:00.000Z',
        startTime: '14:00',
        endTime: '22:00',
      }),
      makeShift({
        id: '1',
        date: '2026-07-15T00:00:00.000Z',
        startTime: '09:00',
        endTime: '13:00',
      }),
    ];

    const groups = groupShiftsByDay(shifts, weekStart);
    const wednesday = groups.find((group) => group.dateKey === '2026-07-15');
    expect(wednesday?.shifts.map((shift) => shift.id)).toEqual(['1', '2']);
    expect(groups).toHaveLength(7);
  });

  test('includes empty days for the full week', () => {
    const groups = groupShiftsByDay([], weekStart);
    expect(groups.every((group) => group.shifts.length === 0)).toBe(true);
    expect(groups.map((group) => group.dateKey)).toEqual([
      '2026-07-13',
      '2026-07-14',
      '2026-07-15',
      '2026-07-16',
      '2026-07-17',
      '2026-07-18',
      '2026-07-19',
    ]);
  });
});

describe('filterLeaveRequests', () => {
  const requests = [
    makeLeaveRequest({ id: 'p1', status: 'pending' }),
    makeLeaveRequest({ id: 'a1', status: 'approved' }),
    makeLeaveRequest({ id: 'r1', status: 'rejected' }),
    makeLeaveRequest({ id: 'p2', status: 'pending' }),
  ];

  test('filters to pending only', () => {
    expect(filterLeaveRequests(requests, 'pending').map((r) => r.id)).toEqual(['p1', 'p2']);
  });

  test('returns all when status is all', () => {
    expect(filterLeaveRequests(requests, 'all')).toHaveLength(4);
  });
});

describe('staffDisplayName', () => {
  test('joins first and last name', () => {
    expect(staffDisplayName(makeStaffSummary({ firstname: 'Ming', lastName: 'Sherpa' }))).toBe(
      'Ming Sherpa'
    );
  });

  test('falls back when staff is missing', () => {
    expect(staffDisplayName(undefined)).toBe('Unknown staff');
  });
});
