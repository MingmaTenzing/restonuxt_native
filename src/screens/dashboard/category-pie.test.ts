import { describe, expect, test } from 'bun:test';

import { buildCategoryPieSlices, describePieSlice } from './category-pie';

describe('describePieSlice', () => {
  test('returns empty path for zero sweep', () => {
    expect(describePieSlice(100, 100, 80, 10, 10)).toBe('');
  });

  test('draws a wedge path for a partial slice', () => {
    const path = describePieSlice(100, 100, 80, 0, 90);
    expect(path.startsWith('M 100 100')).toBe(true);
    expect(path).toContain('A 80 80');
    expect(path.endsWith('Z')).toBe(true);
  });

  test('draws a full circle for a 360° slice', () => {
    const path = describePieSlice(100, 100, 80, 0, 360);
    expect(path).toContain('A 80 80 0 1 1');
  });
});

describe('buildCategoryPieSlices', () => {
  test('maps percentages into colored slices with paths', () => {
    const slices = buildCategoryPieSlices([
      { category: 'MAIN_COURSE', percentage: 60 },
      { category: 'BEVERAGE', percentage: 40 },
    ]);

    expect(slices).toHaveLength(2);
    expect(slices[0]?.label).toBe('Main Course');
    expect(slices[0]?.color).toBe('#10B981');
    expect(slices[0]?.path.length).toBeGreaterThan(0);
    expect(slices[1]?.label).toBe('Beverage');
  });

  test('skips zero-percent categories', () => {
    const slices = buildCategoryPieSlices([
      { category: 'DESSERT', percentage: 100 },
      { category: 'SIDE', percentage: 0 },
    ]);
    expect(slices).toHaveLength(1);
    expect(slices[0]?.category).toBe('DESSERT');
  });
});
