import { describe, expect, test } from 'bun:test';

import {
  getGridCardWidth,
  getListColumns,
  getProductGridColumns,
  isTabletWidth,
} from './responsive-layout';

describe('responsive-layout', () => {
  test('detects tablet widths', () => {
    expect(isTabletWidth(719)).toBe(false);
    expect(isTabletWidth(720)).toBe(true);
  });

  test('returns list columns by breakpoint', () => {
    expect(getListColumns(390)).toBe(1);
    expect(getListColumns(800)).toBe(2);
    expect(getListColumns(1200)).toBe(3);
  });

  test('returns denser product grid columns', () => {
    expect(getProductGridColumns(360)).toBe(1);
    expect(getProductGridColumns(500)).toBe(2);
    expect(getProductGridColumns(900)).toBe(3);
    expect(getProductGridColumns(1200)).toBe(4);
  });

  test('computes card width for multi-column grids', () => {
    const cardWidth = getGridCardWidth(800, 2, 28, 16);
    expect(cardWidth).toBeGreaterThan(300);
  });
});
