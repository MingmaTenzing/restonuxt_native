import { describe, expect, test } from 'bun:test';

import {
  buildWeeklyKpiCards,
  categoryLabel,
  compactNumber,
  dayGreeting,
  formatCategoryShare,
  formatChartMoney,
  toRevenuePoints,
  welcomeName,
  type RevenueTrendRow,
} from './dashboard-stats';
import type { WeeklyKpi } from './types';

describe('toRevenuePoints', () => {
  test('aggregates timestamp rows into the last 7 local days', () => {
    const now = new Date(2026, 6, 24, 15, 0, 0); // 24 Jul 2026 local
    const day22 = new Date(2026, 6, 22, 10, 0, 0).toISOString();
    const day22Later = new Date(2026, 6, 22, 18, 30, 0).toISOString();
    const day24 = new Date(2026, 6, 24, 9, 0, 0).toISOString();

    const rows: RevenueTrendRow[] = [
      { createdAt: day22, _sum: { totalAmountCents: 1000 } },
      { createdAt: day22Later, _sum: { totalAmountCents: 500 } },
      { createdAt: day24, _sum: { totalAmountCents: 8000 } },
    ];

    const points = toRevenuePoints(rows, { days: 7, now });
    expect(points).toHaveLength(7);
    expect(points.map((p) => p.revenueCents)).toEqual([0, 0, 0, 0, 1500, 0, 8000]);
    expect(points[4]?.label.length).toBeGreaterThan(0);
    expect(points[6]?.label.length).toBeGreaterThan(0);
    expect(new Set(points.map((p) => p.label)).size).toBe(7);
  });
});

describe('formatChartMoney', () => {
  test('formats compact dollar labels for chart points', () => {
    expect(formatChartMoney(0)).toBe('$0');
    expect(formatChartMoney(4500)).toBe('$45');
    expect(formatChartMoney(1250)).toBe('$12.5');
  });
});

describe('buildWeeklyKpiCards', () => {
  test('builds the four compact weekly KPI cards', () => {
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
    expect(cards[0]?.label).toBe('Revenue');
    expect(cards[0]?.detail).toBe('This week');
    expect(cards[1]?.value).toBe('42');
    expect(cards[2]?.detail).toBe('Today');
    expect(cards[3]?.label).toBe('Shift cost');
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

describe('welcomeName', () => {
  test('prefers first name then falls back', () => {
    expect(welcomeName('Ming', 'Mingma Sherpa')).toBe('Ming');
    expect(welcomeName(null, 'Mingma Sherpa')).toBe('Mingma');
    expect(welcomeName(null, null)).toBe('there');
  });
});

describe('dayGreeting', () => {
  test('returns morning, afternoon, or evening by hour', () => {
    expect(dayGreeting(new Date(2026, 6, 28, 8, 0, 0))).toBe('Good morning');
    expect(dayGreeting(new Date(2026, 6, 28, 14, 0, 0))).toBe('Good afternoon');
    expect(dayGreeting(new Date(2026, 6, 28, 20, 0, 0))).toBe('Good evening');
  });
});
