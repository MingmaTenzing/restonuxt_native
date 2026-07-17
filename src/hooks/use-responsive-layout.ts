import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import {
  getContentWidth,
  getFabPosition,
  getGridCardWidth,
  getGridCardWidthForPane,
  getHorizontalPadding,
  getListColumns,
  getPosMenuPaneWidth,
  getPosMenuScrollContentStyle,
  getPosSidebarWidth,
  getProductGridColumns,
  getScrollContentStyle,
  isLargeTabletWidth,
  isTabletWidth,
  RESPONSIVE,
} from '@/utils/responsive-layout';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isTablet = isTabletWidth(width);
    const isLargeTablet = isLargeTabletWidth(width);
    const contentWidth = getContentWidth(width);
    const horizontalPadding = getHorizontalPadding(width);
    const listColumns = getListColumns(width);
    const productColumns = getProductGridColumns(width);
    const cardWidth = getGridCardWidth(width, listColumns, horizontalPadding, RESPONSIVE.GRID_GAP);
    const productCardWidth = getGridCardWidth(
      width,
      productColumns,
      horizontalPadding,
      RESPONSIVE.GRID_GAP
    );
    const posMenuPaneWidth = getPosMenuPaneWidth(width, isTablet);
    const posSidebarWidth = getPosSidebarWidth(width);
    const posProductColumns = getProductGridColumns(posMenuPaneWidth);
    // Match getPosMenuScrollContentStyle horizontal padding (tighter than list screens).
    const posHorizontalPadding = isTablet ? 20 : 16;
    const posProductCardWidth = getGridCardWidthForPane(
      posMenuPaneWidth,
      posProductColumns,
      posHorizontalPadding,
      RESPONSIVE.GRID_GAP
    );

    return {
      width,
      height,
      isTablet,
      isLargeTablet,
      contentWidth,
      horizontalPadding,
      gridGap: RESPONSIVE.GRID_GAP,
      listColumns,
      productColumns,
      cardWidth,
      productCardWidth,
      posMenuPaneWidth,
      posProductColumns,
      posProductCardWidth,
      posSidebarWidth,
      posScrollContentStyle: getPosMenuScrollContentStyle(width, isTablet),
      scrollContentStyle: getScrollContentStyle(width),
      fabStyle: getFabPosition(width),
    };
  }, [width, height]);
}
