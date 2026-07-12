import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import {
  getContentWidth,
  getFabPosition,
  getGridCardWidth,
  getHorizontalPadding,
  getListColumns,
  getPosMenuPaneWidth,
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
    const posProductColumns = getProductGridColumns(posMenuPaneWidth);
    const posProductCardWidth = getGridCardWidth(
      posMenuPaneWidth,
      posProductColumns,
      horizontalPadding,
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
      posSidebarWidth: RESPONSIVE.POS_SIDEBAR_WIDTH,
      scrollContentStyle: getScrollContentStyle(width),
      fabStyle: getFabPosition(width),
    };
  }, [width, height]);
}
