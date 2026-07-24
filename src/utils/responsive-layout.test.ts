import { describe, expect, test } from 'bun:test';

import {
  getGridCardWidth,
  getGridCardWidthForPane,
  getListColumns,
  getPosMenuPaneWidth,
  getPosMenuScrollContentStyle,
  getPosSidebarWidth,
  getProductGridColumns,
  getTableGridColumns,
  isTabletWidth,
} from './responsive-layout';

describe('responsive-layout', () => {
  test('detects tablet widths', () => {
    expect(isTabletWidth(719)).toBe(false);
    expect(isTabletWidth(720)).toBe(true);
  });

  test('phone vs tablet breakpoint matches checkout payment presentation split', () => {
    // Cashier checkout uses isTablet from this helper: phones get the
    // balance-due popup sheet, tablets get the sidebar payment panel.
    expect(isTabletWidth(390)).toBe(false);
    expect(isTabletWidth(768)).toBe(true);
    expect(isTabletWidth(1024)).toBe(true);
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

  test('returns floor table grid columns (never a single stack)', () => {
    expect(getTableGridColumns(320)).toBe(2);
    expect(getTableGridColumns(390)).toBe(2);
    expect(getTableGridColumns(800)).toBe(3);
    expect(getTableGridColumns(1200)).toBe(4);
  });

  test('computes card width for multi-column grids', () => {
    const cardWidth = getGridCardWidth(800, 2, 28, 16);
    expect(cardWidth).toBeGreaterThan(300);
  });

  test('sizes POS sidebar and menu pane for tablets', () => {
    expect(getPosSidebarWidth(390)).toBe(0);
    expect(getPosSidebarWidth(720)).toBeGreaterThanOrEqual(280);
    expect(getPosSidebarWidth(720)).toBeLessThanOrEqual(340);
    expect(getPosSidebarWidth(1200)).toBe(380);

    const menuPaneWidth = getPosMenuPaneWidth(720, true);
    expect(menuPaneWidth).toBe(720 - getPosSidebarWidth(720));
    expect(menuPaneWidth).toBeGreaterThanOrEqual(320);
  });

  test('computes POS product card width from pane width', () => {
    const paneWidth = getPosMenuPaneWidth(900, true);
    const columns = getProductGridColumns(paneWidth);
    const cardWidth = getGridCardWidthForPane(paneWidth, columns, 20, 16);
    expect(cardWidth).toBeGreaterThan(120);
  });

  test('POS scroll content uses tighter padding than general screens', () => {
    const phone = getPosMenuScrollContentStyle(390, false);
    expect(phone.paddingHorizontal).toBe(16);
    expect(phone.paddingTop).toBe(12);
    expect(phone.gap).toBe(16);

    const tablet = getPosMenuScrollContentStyle(900, true);
    expect(tablet.paddingHorizontal).toBe(20);
    expect(tablet.paddingTop).toBe(12);
    expect(tablet.gap).toBe(16);
  });
});
