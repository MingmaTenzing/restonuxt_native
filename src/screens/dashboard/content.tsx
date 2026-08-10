import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import { Image, ScrollView, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
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
  dayGreeting,
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
const FOOD_CARD_WIDTH = 148;

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
      <View className="flex-row items-end justify-between gap-3">
        <Text className="text-xl font-bold tracking-tight text-foreground">{title}</Text>
        {action ? (
          <Text className="pb-0.5 text-sm font-medium text-muted-foreground">{action}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function KpiChip({ card }: { card: DashboardKpiCard }) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className="min-w-[132px] gap-2 rounded-2xl border border-border bg-card px-4 py-3.5"
      style={{ borderCurve: 'continuous' }}>
      <View className="flex-row items-center gap-2">
        <View className="h-7 w-7 items-center justify-center rounded-full bg-muted">
          <Ionicons name={card.iconName} size={14} color={isDark ? '#FAFAFA' : '#18181B'} />
        </View>
        <Text className="text-xs font-medium text-muted-foreground">{card.label}</Text>
      </View>
      <Text className="text-xl font-bold tracking-tight text-foreground">{card.value}</Text>
      <Text className="text-[11px] text-muted-foreground">{card.detail}</Text>
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
    (isTablet
      ? (contentWidth - horizontalPadding * 2 - 16) / 2
      : contentWidth - horizontalPadding * 2) - 40,
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

          <View className="border-border/60 flex-row items-center justify-between border-t pt-3">
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
          <View
            className="items-center justify-center"
            style={{ width: PIE_SIZE, height: PIE_SIZE }}>
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

function PopularFoodsRow({ items }: { items: PopularItem[] }) {
  const visibleItems = items.slice(0, 8);
  const { horizontalPadding } = useResponsiveLayout();

  if (visibleItems.length === 0) {
    return (
      <View
        className="items-center justify-center rounded-3xl border border-border bg-card px-5 py-8"
        style={{ borderCurve: 'continuous' }}>
        <Text className="text-center text-base leading-6 text-muted-foreground">
          Popular items will appear once customers start ordering.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingRight: horizontalPadding }}
      style={{ marginHorizontal: -horizontalPadding, paddingLeft: horizontalPadding }}>
      {visibleItems.map((item, index) => (
        <View key={item.id} style={{ width: FOOD_CARD_WIDTH }} className="gap-2">
          <View className="relative">
            {item.imageUrl ? (
              <View
                className="overflow-hidden rounded-2xl bg-muted"
                style={{ height: 112, borderCurve: 'continuous' }}>
                <Image source={{ uri: item.imageUrl }} className="h-full w-full" resizeMode="cover" />
              </View>
            ) : (
              <View
                className="items-center justify-center rounded-2xl bg-muted"
                style={{ height: 112, borderCurve: 'continuous' }}>
                <Text className="text-3xl font-bold text-foreground/30">
                  {item.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <View className="absolute left-2 top-2 h-6 min-w-6 items-center justify-center rounded-full bg-black/70 px-1.5">
              <Text className="text-[11px] font-bold text-white">{index + 1}</Text>
            </View>
          </View>
          <View className="gap-0.5 px-0.5">
            <Text numberOfLines={2} className="text-sm font-semibold leading-5 text-foreground">
              {item.name}
            </Text>
            <Text numberOfLines={1} className="text-xs text-muted-foreground">
              {formatMoney(item.priceCents)} · {item.sold_quantity} sold
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
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
          <View key={order.id} className="gap-3 border-b border-border px-5 py-4 last:border-b-0">
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
  const { isTablet, horizontalPadding } = useResponsiveLayout();
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
  const greeting = dayGreeting();
  const todayLabel = new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  const weekLabel =
    stats.weeklyKpi.startofWeek || stats.weeklyKpi.endOfWeek
      ? `${formatShortDate(stats.weeklyKpi.startofWeek)} – ${formatShortDate(stats.weeklyKpi.endOfWeek)}`
      : undefined;

  return (
    <ScreenScroll refreshing={isRefetching} onRefresh={() => refetch()}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            className={`font-bold tracking-tight text-foreground ${
              isTablet ? 'text-2xl' : 'text-[28px]'
            }`}>
            {greeting}, {name}
          </Text>
          <Text className="mt-0.5 text-sm text-muted-foreground">{todayLabel}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <ThemeToggle variant="compact" />
          <DashboardUserAction />
        </View>
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
          <Section title="Trending now" action="Last 30 days">
            <TrendingFoodsCarousel items={stats.popularItems} />
          </Section>

          <View className="gap-3">
            <View className="flex-row items-end justify-between gap-3">
              <Text className="text-xl font-bold tracking-tight text-foreground">This week</Text>
              {weekLabel ? (
                <Text className="pb-0.5 text-sm font-medium text-muted-foreground">{weekLabel}</Text>
              ) : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingRight: horizontalPadding }}
              style={{ marginHorizontal: -horizontalPadding, paddingLeft: horizontalPadding }}>
              {kpiCards.map((card) => (
                <KpiChip key={card.key} card={card} />
              ))}
            </ScrollView>
          </View>

          <Section title="Popular near you" action="Top sellers">
            <PopularFoodsRow items={stats.popularItems} />
          </Section>

          <Section title="Recent orders">
            <RecentOrders orders={stats.recentOrders} />
          </Section>

          {isTablet ? (
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Section title="Revenue" action={isRefetching ? 'Refreshing' : 'Last 7 days'}>
                  <RevenueTrendCard points={stats.revenueTrend} />
                </Section>
              </View>
              <View className="flex-1">
                <Section title="By category">
                  <CategoryPie categories={stats.soldByCategory} />
                </Section>
              </View>
            </View>
          ) : (
            <>
              <Section title="Revenue" action={isRefetching ? 'Refreshing' : 'Last 7 days'}>
                <RevenueTrendCard points={stats.revenueTrend} />
              </Section>
              <Section title="By category">
                <CategoryPie categories={stats.soldByCategory} />
              </Section>
            </>
          )}

          <Section title="Team roster">
            <RosterCard roster={stats.rosterOverview} />
          </Section>
        </>
      )}
    </ScreenScroll>
  );
}
