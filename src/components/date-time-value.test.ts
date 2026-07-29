import { describe, expect, test } from 'bun:test';

import {
  applyDatePart,
  applyTimePart,
  formatDateTimeValue,
  fromWebInputValue,
  toWebInputValue,
} from './date-time-value';

describe('applyDatePart', () => {
  test('replaces calendar day and keeps time', () => {
    const base = new Date(2026, 6, 28, 18, 30, 0);
    const picked = new Date(2026, 7, 5, 9, 0, 0);
    const next = applyDatePart(base, picked);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(7);
    expect(next.getDate()).toBe(5);
    expect(next.getHours()).toBe(18);
    expect(next.getMinutes()).toBe(30);
  });
});

describe('applyTimePart', () => {
  test('replaces time and keeps calendar day', () => {
    const base = new Date(2026, 6, 28, 18, 30, 0);
    const picked = new Date(2026, 0, 1, 11, 45, 0);
    const next = applyTimePart(base, picked);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(6);
    expect(next.getDate()).toBe(28);
    expect(next.getHours()).toBe(11);
    expect(next.getMinutes()).toBe(45);
  });
});

describe('formatDateTimeValue', () => {
  test('returns empty string for invalid dates', () => {
    expect(formatDateTimeValue(new Date(Number.NaN), 'datetime')).toBe('');
  });

  test('includes date and time for datetime mode', () => {
    const formatted = formatDateTimeValue(new Date(2026, 6, 28, 14, 5, 0), 'datetime');
    expect(formatted).toContain('·');
    expect(formatted.length).toBeGreaterThan(5);
  });
});

describe('web input value round-trip', () => {
  test('toWebInputValue formats local parts', () => {
    const date = new Date(2026, 6, 28, 9, 5, 0);
    expect(toWebInputValue(date, 'date')).toBe('2026-07-28');
    expect(toWebInputValue(date, 'time')).toBe('09:05');
    expect(toWebInputValue(date, 'datetime')).toBe('2026-07-28T09:05');
  });

  test('fromWebInputValue parses date, time, and datetime-local', () => {
    const base = new Date(2026, 0, 1, 12, 0, 0);
    const dateOnly = fromWebInputValue('2026-07-28', 'date', base);
    expect(dateOnly?.getFullYear()).toBe(2026);
    expect(dateOnly?.getMonth()).toBe(6);
    expect(dateOnly?.getDate()).toBe(28);
    expect(dateOnly?.getHours()).toBe(12);

    const timeOnly = fromWebInputValue('18:30', 'time', base);
    expect(timeOnly?.getHours()).toBe(18);
    expect(timeOnly?.getMinutes()).toBe(30);

    const both = fromWebInputValue('2026-08-01T19:15', 'datetime', base);
    expect(both?.getFullYear()).toBe(2026);
    expect(both?.getMonth()).toBe(7);
    expect(both?.getDate()).toBe(1);
    expect(both?.getHours()).toBe(19);
    expect(both?.getMinutes()).toBe(15);
  });
});
