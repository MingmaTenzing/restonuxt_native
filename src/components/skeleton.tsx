import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

interface SkeletonProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={`rounded-2xl bg-muted ${className}`}
      style={[{ borderCurve: 'continuous' }, style, animatedStyle]}
    />
  );
}

export function ScreenHeaderSkeleton({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <View className="gap-2">
      <Skeleton className="h-9 w-40 rounded-xl" />
      {subtitle ? <Skeleton className="h-5 w-56" /> : null}
    </View>
  );
}

export function SearchBarSkeleton() {
  return <Skeleton className="h-12 w-full rounded-2xl" />;
}

export function FilterChipsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View className="flex-row gap-2">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-9 flex-1 rounded-full" />
      ))}
    </View>
  );
}

export function StatsRowSkeleton({ count = 4 }: { count?: number }) {
  const { isLargeTablet, contentWidth, horizontalPadding, gridGap } = useResponsiveLayout();
  const columns = isLargeTablet ? Math.min(count, 4) : 2;
  const cardWidth = Math.floor(
    (contentWidth - horizontalPadding * 2 - gridGap * (columns - 1)) / columns
  );

  return (
    <View className="flex-row flex-wrap" style={{ gap: gridGap }}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-24 rounded-3xl" style={{ width: cardWidth }} />
      ))}
    </View>
  );
}

export function OrderStatsSkeleton() {
  const { isTablet, contentWidth, horizontalPadding, gridGap } = useResponsiveLayout();
  const metricWidth = (contentWidth - horizontalPadding * 2 - gridGap) / 2;

  return (
    <View className="gap-3">
      <Skeleton className={`w-full rounded-3xl ${isTablet ? 'h-32' : 'h-28'}`} />
      <View className="flex-row flex-wrap" style={{ gap: gridGap }}>
        <Skeleton className="h-24 rounded-3xl" style={{ width: metricWidth }} />
        <Skeleton className="h-24 rounded-3xl" style={{ width: metricWidth }} />
      </View>
    </View>
  );
}

export function CardGridSkeleton({
  count,
  cardWidth: cardWidthOverride,
}: {
  count?: number;
  cardWidth?: number;
}) {
  const { listColumns, cardWidth, gridGap } = useResponsiveLayout();
  const items = count ?? listColumns * 2;
  const width = cardWidthOverride ?? cardWidth;

  return (
    <View className="flex-row flex-wrap" style={{ gap: gridGap }}>
      {Array.from({ length: items }, (_, index) => (
        <Skeleton key={index} className="h-36 rounded-3xl" style={{ width }} />
      ))}
    </View>
  );
}

export function ListScreenSkeleton({
  statsCount = 0,
  search = true,
  filters = false,
  cards = 4,
}: {
  statsCount?: number;
  search?: boolean;
  filters?: boolean;
  cards?: number;
}) {
  return (
    <View className="gap-6">
      <ScreenHeaderSkeleton />
      {search ? <SearchBarSkeleton /> : null}
      {filters ? <FilterChipsSkeleton /> : null}
      {statsCount > 0 ? <StatsRowSkeleton count={statsCount} /> : null}
      <CardGridSkeleton count={cards} />
    </View>
  );
}

export function DashboardSkeleton() {
  const { isTablet, isLargeTablet, contentWidth, horizontalPadding, gridGap } = useResponsiveLayout();
  const metricColumns = isLargeTablet ? 4 : 2;
  const metricCardWidth =
    (contentWidth - horizontalPadding * 2 - gridGap * (metricColumns - 1)) / metricColumns;

  return (
    <View className="gap-6">
      <ScreenHeaderSkeleton />
      <View className="flex-row flex-wrap" style={{ gap: gridGap }}>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-3xl" style={{ width: metricCardWidth }} />
        ))}
      </View>
      {isTablet ? (
        <View className="flex-row gap-4">
          <Skeleton className="h-48 flex-1 rounded-3xl" />
          <Skeleton className="h-48 flex-1 rounded-3xl" />
        </View>
      ) : (
        <>
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </>
      )}
      <Skeleton className="h-36 w-full rounded-3xl" />
      {isTablet ? (
        <View className="flex-row gap-4">
          <Skeleton className="h-56 flex-1 rounded-3xl" />
          <Skeleton className="h-56 flex-1 rounded-3xl" />
        </View>
      ) : (
        <>
          <Skeleton className="h-56 w-full rounded-3xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
        </>
      )}
    </View>
  );
}

export function KitchenQueueSkeleton() {
  const { cardWidth, gridGap, listColumns } = useResponsiveLayout();
  const count = listColumns * 2;

  return (
    <View className="flex-row flex-wrap" style={{ gap: gridGap }}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-52 rounded-3xl" style={{ width: cardWidth }} />
      ))}
    </View>
  );
}

export function DetailScreenSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton className="h-28 w-full rounded-3xl" />
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="h-56 w-full rounded-3xl" />
    </View>
  );
}
