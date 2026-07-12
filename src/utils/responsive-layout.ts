export const RESPONSIVE = {
  TABLET_MIN_WIDTH: 720,
  LARGE_TABLET_MIN_WIDTH: 1100,
  CONTENT_MAX_WIDTH: 1280,
  HORIZONTAL_PADDING: 20,
  TABLET_HORIZONTAL_PADDING: 28,
  VERTICAL_PADDING: 28,
  GRID_GAP: 16,
  POS_SIDEBAR_WIDTH: 380,
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
  horizontalPadding = getHorizontalPadding(width),
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

export function getPosMenuPaneWidth(width: number, isTablet: boolean) {
  if (!isTablet) return width;
  return Math.max(width - RESPONSIVE.POS_SIDEBAR_WIDTH, RESPONSIVE.TABLET_MIN_WIDTH);
}
