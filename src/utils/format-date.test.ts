import { describe, expect, test } from 'bun:test';

import { formatDate } from './format-date';

describe('formatDate', () => {
  test('formats ISO timestamps into a readable local date string', () => {
    const result = formatDate('2026-07-05T00:00:00.000Z');
    expect(result).toContain('2026');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns a stable non-empty string for valid dates', () => {
    expect(formatDate('2026-01-15T12:30:00.000Z')).toBeTruthy();
    expect(formatDate(new Date('2026-12-25T08:00:00.000Z').toISOString())).toBeTruthy();
  });
});
