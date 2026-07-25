import { describe, expect, test } from 'bun:test';

import {
  buildWeeklyKpiCards,
  categoryLabel,
  compactNumber,
  formatCategoryShare,
  greetingForHour,
  toRevenuePoints,
  type RevenueTrendRow,
} from './dashboard-stats';
import type { WeeklyKpi } from './types';

describe('toRevenuePoints', () => {
  test('maps API rows to chart points with cents', () => {
    const rows: RevenueTrendRow[] = [
      { createdAt: '2026-07-20T00:00:00.000Z', _sum: { totalAmountCents: 12500 } },
      { createdAt: '2026-07-21T00:00:00.000Z', _sum: { totalAmountCents: null } },
    ];

    const points = toRevenuePoints(rows);
    expect(points).toHaveLength(2);
    expect(points[0]?.revenueCents).toBe(12500);
    expect(points[1]?.revenueCents).toBe(0);
    expect(points[0]?.label.length).toBeGreaterThan(0);
  });
});

describe('buildWeeklyKpiCards', () => {
  test('builds the four web dashboard KPI cards', () => {
    const kpi: WeeklyKpi = {
      revenueCents: 45000,
      weeklyOrderCount: 42,
      todayBookingsCount: 7,
      weeklyShiftCostCents: 128500,
      startofWeek: '2026-07-20',
      endOfWeek: '2026-07-26',
    };

    const cards = buildWeeklyKpiCards(kpi);
    expect(cards.map((c) => c.key)).toEqual(['revenue', 'orders', 'bookings', 'shift-cost']);
    expect(cards[0]?.label).toBe('Weekly revenue');
    expect(cards[1]?.value).toBe('42');
    expect(cards[2]?.change).toBe('Today');
    expect(cards[3]?.headline).toBe('Rostered payroll estimate');
  });
});

describe('formatCategoryShare', () => {
  test('adds human labels and clamps percentage', () => {
    const formatted = formatCategoryShare([
      { category: 'MAIN_COURSE', percentage: 45 },
      { category: 'UNKNOWN_CAT', percentage: 150 },
    ]);

    expect(formatted[0]?.label).toBe('Main Course');
    expect(formatted[0]?.color).toBe('#10B981');
    expect(formatted[1]?.label).toBe('UNKNOWN_CAT');
    expect(formatted[1]?.percentage).toBe(100);
  });
});

describe('categoryLabel', () => {
  test('maps known menu categories', () => {
    expect(categoryLabel('BEVERAGE')).toBe('Beverage');
    expect(categoryLabel('CUSTOM')).toBe('CUSTOM');
  });
});

describe('compactNumber', () => {
  test('formats large counts compactly', () => {
    expect(compactNumber(0)).toBe('0');
    expect(compactNumber(1200)).toMatch(/1(\.\d)?K/i);
  });
});

describe('greetingForHour', () => {
  test('returns time-of-day greeting', () => {
    expect(greetingForHour(8)).toBe('Good morning');
    expect(greetingForHour(14)).toBe('Good afternoon');
    expect(greetingForHour(20)).toBe('Good evening');
  });
});
