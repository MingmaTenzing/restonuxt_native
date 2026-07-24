export const RESPONSIVE = {
  TABLET_MIN_WIDTH: 720,
  LARGE_TABLET_MIN_WIDTH: 1100,
  CONTENT_MAX_WIDTH: 1280,
  HORIZONTAL_PADDING: 20,
  TABLET_HORIZONTAL_PADDING: 28,
  VERTICAL_PADDING: 28,
  GRID_GAP: 16,
  POS_SIDEBAR_WIDTH: 380,
  POS_MENU_PANE_MIN_WIDTH: 320,
} as const;

export function isTabletWidth(width: number) {
  return width >= RESPONSIVE.TABLET_MIN_WIDTH;
}

export function isLargeTabletWidth(width: number) {
  return width >= RESPONSIVE.LARGE_TABLET_MIN_WIDTH;
}

export function getListColumns(width: number) {
  if (width >= RESPONSIVE.LARGE_TABLET_MIN_WIDTH) return 3;
  if (width >= RESPONSIVE.TABLET_MIN_WIDTH) return 2;
  return 1;
}

/** Dense product grids (POS menu, menu admin). */
export function getProductGridColumns(width: number) {
  if (width < 380) return 1;
  if (width >= RESPONSIVE.LARGE_TABLET_MIN_WIDTH) return 4;
  if (width >= RESPONSIVE.TABLET_MIN_WIDTH) return 3;
  return 2;
}

/** Floor-plan table tiles (POS table pick). Always multi-column — never a single long stack. */
export function getTableGridColumns(width: number) {
  if (width >= RESPONSIVE.LARGE_TABLET_MIN_WIDTH) return 4;
  if (width >= RESPONSIVE.TABLET_MIN_WIDTH) return 3;
  return 2;
}

export function getHorizontalPadding(width: number) {
  return isTabletWidth(width)
    ? RESPONSIVE.TABLET_HORIZONTAL_PADDING
    : RESPONSIVE.HORIZONTAL_PADDING;
}

export function getContentWidth(width: number, maxWidth = RESPONSIVE.CONTENT_MAX_WIDTH) {
  return Math.min(width, maxWidth);
}

export function getGridCardWidth(
  width: number,
  columns: number,
  horizontalPadding: number = getHorizontalPadding(width),
  gap = RESPONSIVE.GRID_GAP
) {
  const contentWidth = getContentWidth(width);
  const available = contentWidth - horizontalPadding * 2;
  if (columns <= 1) return available;
  return (available - gap * (columns - 1)) / columns;
}

export function getGridCardWidthForPane(
  paneWidth: number,
  columns: number,
  horizontalPadding: number,
  gap = RESPONSIVE.GRID_GAP
) {
  const available = paneWidth - horizontalPadding * 2;
  if (columns <= 1) return available;
  return (available - gap * (columns - 1)) / columns;
}

export function getScrollContentStyle(width: number, extra?: Record<string, unknown>) {
  const isTablet = isTabletWidth(width);
  const contentWidth = getContentWidth(width);
  const horizontalPadding = getHorizontalPadding(width);

  return {
    gap: 24,
    paddingHorizontal: horizontalPadding,
    paddingTop: RESPONSIVE.VERTICAL_PADDING,
    paddingBottom: RESPONSIVE.VERTICAL_PADDING,
    width: isTablet ? contentWidth : undefined,
    alignSelf: isTablet ? ('center' as const) : undefined,
    maxWidth: RESPONSIVE.CONTENT_MAX_WIDTH,
    ...extra,
  };
}

export function getFabPosition(width: number) {
  const isTablet = isTabletWidth(width);
  const contentWidth = getContentWidth(width);
  const horizontalPadding = getHorizontalPadding(width);
  const inset = isTablet ? Math.max(horizontalPadding, (width - contentWidth) / 2 + horizontalPadding) : horizontalPadding;

  return { bottom: 96, right: inset };
}

export function getPosSidebarWidth(screenWidth: number) {
  if (!isTabletWidth(screenWidth)) return 0;
  if (screenWidth >= RESPONSIVE.LARGE_TABLET_MIN_WIDTH) {
    return RESPONSIVE.POS_SIDEBAR_WIDTH;
  }
  return Math.min(340, Math.max(280, Math.round(screenWidth * 0.38)));
}

export function getPosMenuPaneWidth(width: number, isTablet: boolean) {
  if (!isTablet) return width;
  return Math.max(
    width - getPosSidebarWidth(width),
    RESPONSIVE.POS_MENU_PANE_MIN_WIDTH
  );
}

/** Tighter padding than general list screens — POS needs density for menu grids. */
export function getPosMenuScrollContentStyle(
  screenWidth: number,
  isTablet: boolean,
  extra?: Record<string, unknown>
) {
  const horizontalPadding = isTablet ? 20 : 16;
  const verticalPadding = 12;

  if (!isTablet) {
    return getScrollContentStyle(screenWidth, {
      gap: 16,
      paddingHorizontal: horizontalPadding,
      paddingTop: verticalPadding,
      paddingBottom: verticalPadding,
      ...extra,
    });
  }

  return {
    gap: 16,
    paddingHorizontal: horizontalPadding,
    paddingTop: verticalPadding,
    paddingBottom: verticalPadding,
    ...extra,
  };
}
