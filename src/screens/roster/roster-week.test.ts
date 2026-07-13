import { describe, expect, test } from 'bun:test';

import {
  formatWeekLabel,
  shiftWeek,
  startOfWeek,
  toDateKey,
  toWeekRange,
  weekDayKeys,
} from './roster-week';

describe('toWeekRange', () => {
  test('returns Monday-start week for a Wednesday', () => {
    const range = toWeekRange(new Date('2026-07-15T12:00:00'));
    expect(range.start.getDay()).toBe(1);
    expect(toDateKey(range.startIso)).toBe('2026-07-13');
    expect(toDateKey(range.endIso)).toBe('2026-07-19');
  });

  test('handles Sunday by anchoring to previous Monday', () => {
    const range = toWeekRange(new Date('2026-07-19T12:00:00'));
    expect(toDateKey(range.startIso)).toBe('2026-07-13');
    expect(toDateKey(range.endIso)).toBe('2026-07-19');
  });
});

describe('shiftWeek', () => {
  test('moves forward and backward by seven days', () => {
    const anchor = new Date('2026-07-15T12:00:00');
    expect(toDateKey(shiftWeek(anchor, 1).toISOString())).toBe('2026-07-22');
    expect(toDateKey(shiftWeek(anchor, -1).toISOString())).toBe('2026-07-08');
  });
});

describe('formatWeekLabel', () => {
  test('formats start and end dates', () => {
    const start = startOfWeek(new Date('2026-07-15T12:00:00'));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    expect(formatWeekLabel(start, end)).toBe('Jul 13 – Jul 19');
  });
});

describe('weekDayKeys', () => {
  test('returns seven consecutive day keys', () => {
    const start = startOfWeek(new Date('2026-07-15T12:00:00'));
    expect(weekDayKeys(start)).toEqual([
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
