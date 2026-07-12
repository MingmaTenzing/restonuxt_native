import { Children, PropsWithChildren } from 'react';
import { ScrollView, ScrollViewProps, View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

type ScreenScrollProps = PropsWithChildren<
  ScrollViewProps & {
    bottomInset?: number;
  }
>;

export function ScreenScroll({ children, bottomInset = 0, ...scrollProps }: ScreenScrollProps) {
  const { scrollContentStyle } = useResponsiveLayout();

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerStyle={{
        ...scrollContentStyle,
        paddingBottom: (scrollContentStyle.paddingBottom as number) + bottomInset,
      }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      {...scrollProps}>
      {children}
    </ScrollView>
  );
}

interface ResponsiveCardGridProps {
  children: React.ReactNode;
  columns?: number;
  cardWidth?: number;
  gap?: number;
}

export function ResponsiveCardGrid({
  children,
  columns: columnsOverride,
  cardWidth: cardWidthOverride,
  gap: gapOverride,
}: ResponsiveCardGridProps) {
  const { listColumns, cardWidth, gridGap } = useResponsiveLayout();
  const columns = columnsOverride ?? listColumns;
  const width = cardWidthOverride ?? cardWidth;
  const gap = gapOverride ?? gridGap;
  const items = Children.toArray(children);

  if (columns === 1) {
    return <View style={{ gap }}>{items}</View>;
  }

  return (
    <View className="flex-row flex-wrap" style={{ gap }}>
      {items.map((child, index) => (
        <View key={index} style={{ width }}>
          {child}
        </View>
      ))}
    </View>
  );
}
