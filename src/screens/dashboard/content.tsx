import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import { Image, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button } from '@/components/button';
import { ScreenScroll } from '@/components/screen-scroll';
import { DashboardSkeleton } from '@/components/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { StatusBadge, TypeBadge } from '@/screens/orders/order-badges';
import { formatDate } from '@/utils/format-date';
import { formatMoney } from '@/utils/format-money';

import { fetchDashboardStats } from './api';
import { buildCategoryPieSlices } from './category-pie';
import {
  buildWeeklyKpiCards,
  categoryLabel,
  emptyKpi,
  emptyRoster,
  formatChartMoney,
  welcomeName,
  type DashboardKpiCard,
} from './dashboard-stats';
import { buildRevenueLineGeometry } from './revenue-line';
import { TrendingFoodsCarousel } from './trending-foods-carousel';
import { DashboardUserAction } from './user-action';
import type {
  DashboardStats,
  PopularItem,
  RecentOrder,
  RevenuePoint,
  RosterOverview,
  SoldByCategory,
} from './types';

const PIE_SIZE = 180;
const LINE_CHART_HEIGHT = 168;

function formatShortDate(value: string) {
  if (!value) return 'Not set';
  try {
    return formatDate(value);
  } catch {
    return value;
  }
}

function formatOrderTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        {action ? (
          <Text className="text-sm font-medium text-muted-foreground">{action}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function MetricCard({
  card,
  width,
}: {
  card: DashboardKpiCard;
  width?: number;
}) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className="gap-4 rounded-3xl border border-border bg-card p-4"
      style={{
        width,
        flex: width ? undefined : 1,
        borderCurve: 'continuous',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      }}>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {card.label}
        </Text>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Ionicons name={card.iconName} size={18} color={isDark ? '#FAFAFA' : '#18181B'} />
        </View>
      </View>
      <View className="gap-1">
        <Text className="text-3xl font-bold tracking-tight text-foreground">{card.value}</Text>
        <Text className="text-sm text-muted-foreground">{card.detail}</Text>
      </View>
    </View>
  );
}

function RevenueTrendCard({ points }: { points: RevenuePoint[] }) {
  const isDark = useColorScheme() === 'dark';
  const { width: windowWidth } = useWindowDimensions();
  const { contentWidth, horizontalPadding, isTablet } = useResponsiveLayout();
  const lineColor = isDark ? '#60A5FA' : '#2563EB';

  // Card sits in full width or half of a tablet row; subtract card padding.
  const chartWidth = Math.max(
    (isTablet ? (contentWidth - horizontalPadding * 2 - 16) / 2 : contentWidth - horizontalPadding * 2) -
      40,
    Math.min(windowWidth - 64, 280)
  );

  const { coords, linePath, maxRevenueCents } = buildRevenueLineGeometry(
    points,
    chartWidth,
    LINE_CHART_HEIGHT
  );

  return (
    <View
      className="gap-4 overflow-hidden rounded-3xl border border-border bg-card p-5"
      style={{ borderCurve: 'continuous' }}>
      {coords.length > 0 ? (
        <>
          <View style={{ width: chartWidth, height: LINE_CHART_HEIGHT }}>
            <Svg width={chartWidth} height={LINE_CHART_HEIGHT}>
              <Path
                d={linePath}
                stroke={lineColor}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {coords.map((coord) => (
                <Circle
                  key={`dot-${coord.label}`}
                  cx={coord.x}
                  cy={coord.y}
                  r={4.5}
                  fill={lineColor}
                  stroke={isDark ? '#18181B' : '#FFFFFF'}
                  strokeWidth={2}
                />
              ))}
            </Svg>

            {coords.map((coord) => (
              <Text
                key={`price-${coord.label}`}
                numberOfLines={1}
                className="absolute text-center text-[10px] font-semibold text-foreground"
                style={{
                  width: 48,
                  left: coord.x - 24,
                  top: Math.max(coord.y - 22, 0),
                }}>
                {formatChartMoney(coord.revenueCents)}
              </Text>
            ))}
          </View>

          <View className="flex-row">
            {coords.map((coord) => (
              <View key={`label-${coord.label}`} className="flex-1 items-center px-0.5">
                <Text
                  numberOfLines={1}
                  className="text-center text-[11px] font-medium text-muted-foreground">
                  {coord.label}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center justify-between border-t border-border/60 pt-3">
            <Text className="text-sm text-muted-foreground">Peak day</Text>
            <Text className="text-base font-semibold text-foreground">
              {formatMoney(maxRevenueCents)}
            </Text>
          </View>
        </>
      ) : (
        <Text className="text-base leading-6 text-muted-foreground">
          Revenue trend data will appear once orders are recorded.
        </Text>
      )}
    </View>
  );
}

function CategoryPie({ categories }: { categories: SoldByCategory[] }) {
  const slices = buildCategoryPieSlices(categories, PIE_SIZE);

  return (
    <View
      className="gap-5 rounded-3xl border border-border bg-card p-5"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      {slices.length > 0 ? (
        <View className="flex-row flex-wrap items-center gap-5">
          <View className="items-center justify-center" style={{ width: PIE_SIZE, height: PIE_SIZE }}>
            <Svg width={PIE_SIZE} height={PIE_SIZE} viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`}>
              {slices.map((slice) => (
                <Path key={slice.category} d={slice.path} fill={slice.color} />
              ))}
            </Svg>
          </View>

          <View className="min-w-[140px] flex-1 gap-3">
            {slices.map((slice) => (
              <View key={slice.category} className="flex-row items-center justify-between gap-3">
                <View className="flex-1 flex-row items-center gap-2">
                  <View className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
                  <Text numberOfLines={1} className="flex-1 text-sm text-muted-foreground">
                    {slice.label}
                  </Text>
                </View>
                <Text className="text-sm font-semibold text-foreground">
                  {Math.round(slice.percentage)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text className="text-base leading-6 text-muted-foreground">
          Category sales will appear once menu items have been sold.
        </Text>
      )}
    </View>
  );
}

function PopularItems({ items }: { items: PopularItem[] }) {
  const visibleItems = items.slice(0, 5);

  return (
    <View
      className="overflow-hidden rounded-3xl border border-border bg-card"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      {visibleItems.length > 0 ? (
        visibleItems.map((item, index) => (
          <View
            key={item.id}
            className="flex-row items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0">
            <View className="relative">
              {item.imageUrl ? (
                <View className="h-14 w-14 overflow-hidden rounded-2xl" style={{ borderCurve: 'continuous' }}>
                  <Image source={{ uri: item.imageUrl }} className="h-full w-full" />
                </View>
              ) : (
                <View
                  className="h-14 w-14 items-center justify-center rounded-2xl bg-muted"
                  style={{ borderCurve: 'continuous' }}>
                  <Text className="text-lg font-bold text-foreground">
                    {item.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="absolute -left-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-foreground">
                <Text className="text-[11px] font-bold text-background">{index + 1}</Text>
              </View>
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
              <Text numberOfLines={1} className="text-base font-semibold text-foreground">
                {item.name}
              </Text>
              <Text numberOfLines={1} className="text-sm text-muted-foreground">
                {categoryLabel(item.category)} · {formatMoney(item.priceCents)}
              </Text>
            </View>
            <Text className="text-sm font-semibold text-muted-foreground">
              {item.sold_quantity} sold
            </Text>
          </View>
        ))
      ) : (
        <Text className="p-5 text-base leading-6 text-muted-foreground">
          Popular items will appear once customers start ordering.
        </Text>
      )}
    </View>
  );
}

function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  const visibleOrders = orders.slice(0, 5);

  return (
    <View
      className="overflow-hidden rounded-3xl border border-border bg-card"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      {visibleOrders.length > 0 ? (
        visibleOrders.map((order) => (
          <View
            key={order.id}
            className="gap-3 border-b border-border px-5 py-4 last:border-b-0">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text numberOfLines={1} className="text-base font-semibold text-foreground">
                  {order.customerName || 'Guest'}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  #{order.orderNo ?? 'New'} · {order.itemCount} item
                  {order.itemCount === 1 ? '' : 's'}
                  {order.tableNumber ? ` · Table ${order.tableNumber}` : ''}
                </Text>
              </View>
              <Text className="text-base font-semibold text-foreground">
                {formatMoney(order.totalAmountCents)}
              </Text>
            </View>
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <View className="flex-row flex-wrap items-center gap-2">
                <TypeBadge type={order.orderType} />
                <StatusBadge status={order.status} />
              </View>
              <Text className="text-xs font-medium text-muted-foreground">
                {formatOrderTime(order.createdAt)}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text className="p-5 text-base leading-6 text-muted-foreground">
          Recent orders will appear here as they come in.
        </Text>
      )}
    </View>
  );
}

function RosterCard({ roster }: { roster: RosterOverview }) {
  return (
    <View
      className="gap-4 rounded-3xl border border-border bg-card p-5"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      <View className="flex-row gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-3xl font-bold tracking-tight text-foreground">
            {roster.totalStaff}
          </Text>
          <Text className="text-sm text-muted-foreground">Staff</Text>
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-3xl font-bold tracking-tight text-foreground">
            {roster.weeklyShiftCount}
          </Text>
          <Text className="text-sm text-muted-foreground">Shifts</Text>
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-3xl font-bold tracking-tight text-foreground">
            {roster.pendingLeaveRequests}
          </Text>
          <Text className="text-sm text-muted-foreground">Leave</Text>
        </View>
      </View>
      <View className="h-px bg-border" />
      <Text className="text-sm text-muted-foreground">
        Roster window {formatShortDate(roster.startDate)} to {formatShortDate(roster.endDate)}
      </Text>
    </View>
  );
}

export function DashboardContent() {
  const { user } = useUser();
  const { api } = useApi();
  const { isTablet, isLargeTablet, contentWidth, horizontalPadding, gridGap } =
    useResponsiveLayout();
  const metricColumns = isLargeTablet ? 4 : 2;
  const metricCardWidth =
    (contentWidth - horizontalPadding * 2 - gridGap * (metricColumns - 1)) / metricColumns;
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetchDashboardStats(api),
  });

  const stats: DashboardStats = data ?? {
    popularItems: [],
    recentOrders: [],
    revenueTrend: [],
    rosterOverview: emptyRoster,
    soldByCategory: [],
    weeklyKpi: emptyKpi,
  };

  const kpiCards = buildWeeklyKpiCards(stats.weeklyKpi);
  const name = welcomeName(user?.firstName, user?.fullName);
  const todayLabel = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <ScreenScroll refreshing={isRefetching} onRefresh={() => refetch()}>
      <View className="gap-2">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-2">
            <Text
              className={`font-bold tracking-tight text-foreground ${
                isTablet ? 'text-3xl' : 'text-4xl'
              }`}>
              Hi, {name}
            </Text>
            <Text className="text-base leading-6 text-muted-foreground">
              Welcome back — a quick look at how things are going today.
            </Text>
            <Text className="text-sm font-medium text-muted-foreground">{todayLabel}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <ThemeToggle variant="compact" />
            <DashboardUserAction />
          </View>
        </View>

        {stats.weeklyKpi.startofWeek || stats.weeklyKpi.endOfWeek ? (
          <Text className="text-sm font-medium text-muted-foreground">
            Week of {formatShortDate(stats.weeklyKpi.startofWeek)} to{' '}
            {formatShortDate(stats.weeklyKpi.endOfWeek)}
          </Text>
        ) : null}
      </View>

      {isError ? (
        <View
          className="gap-4 rounded-3xl border border-red-200/80 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40"
          style={{ borderCurve: 'continuous' }}>
          <View className="gap-2">
            <Text className="text-lg font-semibold text-red-950 dark:text-red-200">
              Could not load dashboard
            </Text>
            <Text className="text-base leading-6 text-red-700 dark:text-red-300">
              {error instanceof Error ? error.message : 'Unable to load dashboard stats.'}
            </Text>
          </View>
          <Button onPress={() => refetch()}>Try again</Button>
        </View>
      ) : null}

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <Section title="Top trending foods" action="Swipe · last 30 days">
            <TrendingFoodsCarousel items={stats.popularItems} />
          </Section>

          <View className="flex-row flex-wrap" style={{ gap: gridGap }}>
            {kpiCards.map((card) => (
              <MetricCard key={card.key} card={card} width={metricCardWidth} />
            ))}
          </View>

          {isTablet ? (
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Section title="Revenue trend" action={isRefetching ? 'Refreshing' : 'Last 7 days'}>
                  <RevenueTrendCard points={stats.revenueTrend} />
                </Section>
              </View>
              <View className="flex-1">
                <Section title="Sales by category">
                  <CategoryPie categories={stats.soldByCategory} />
                </Section>
              </View>
            </View>
          ) : (
            <>
              <Section title="Revenue trend" action={isRefetching ? 'Refreshing' : 'Last 7 days'}>
                <RevenueTrendCard points={stats.revenueTrend} />
              </Section>
              <Section title="Sales by category">
                <CategoryPie categories={stats.soldByCategory} />
              </Section>
            </>
          )}

          <Section title="Operations">
            <RosterCard roster={stats.rosterOverview} />
          </Section>

          {isTablet ? (
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Section title="Popular items">
                  <PopularItems items={stats.popularItems} />
                </Section>
              </View>
              <View className="flex-1">
                <Section title="Recent orders">
                  <RecentOrders orders={stats.recentOrders} />
                </Section>
              </View>
            </View>
          ) : (
            <>
              <Section title="Popular items">
                <PopularItems items={stats.popularItems} />
              </Section>
              <Section title="Recent orders">
                <RecentOrders orders={stats.recentOrders} />
              </Section>
            </>
          )}
        </>
      )}
    </ScreenScroll>
  );
}
