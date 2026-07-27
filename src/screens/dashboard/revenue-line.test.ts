import { describe, expect, test } from 'bun:test';

import { buildRevenueLineGeometry } from './revenue-line';
import type { RevenuePoint } from './types';

describe('buildRevenueLineGeometry', () => {
  test('places peak revenue near the top and builds a line path', () => {
    const points: RevenuePoint[] = [
      { label: 'Mon 20', revenueCents: 0 },
      { label: 'Tue 21', revenueCents: 10000 },
      { label: 'Wed 22', revenueCents: 5000 },
    ];

    const { coords, linePath, maxRevenueCents } = buildRevenueLineGeometry(points, 300, 160, {
      top: 20,
      right: 10,
      bottom: 10,
      left: 10,
    });

    expect(maxRevenueCents).toBe(10000);
    expect(coords).toHaveLength(3);
    expect(coords[1]?.y).toBeLessThan(coords[0]?.y ?? 0);
    expect(coords[1]?.y).toBeLessThan(coords[2]?.y ?? 0);
    expect(linePath.startsWith('M ')).toBe(true);
    expect(linePath).toContain(' L ');
  });

  test('handles a single point without dividing by zero', () => {
    const { coords, linePath } = buildRevenueLineGeometry(
      [{ label: 'Fri 24', revenueCents: 2500 }],
      200,
      120
    );
    expect(coords).toHaveLength(1);
    expect(linePath.startsWith('M ')).toBe(true);
  });
});
