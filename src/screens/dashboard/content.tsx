import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Text, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import { ScreenScroll } from '@/components/screen-scroll';
import { DashboardSkeleton } from '@/components/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { useApi } from '@/hooks/use-api';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import type { ApiClient } from '@/utils/api';
import { formatDate } from '@/utils/format-date';
import { formatMoney } from '@/utils/format-money';

import { DashboardUserAction } from './user-action';
import type {
  DashboardStats,
  PopularItem,
  RecentOrder,
  RevenuePoint,
  RosterOverview,
  SoldByCategory,
  WeeklyKpi,
} from './types';

const DASHBOARD_ENDPOINTS = {
  popularItems: '/api/dashboard/stats/popular-items',
  recentOrders: '/api/dashboard/stats/recent-order',
  revenueTrend: '/api/dashboard/stats/revenue-trend',
  rosterOverview: '/api/dashboard/stats/roster-overview',
  soldByCategory: '/api/dashboard/stats/soldbycategory',
  weeklyKpi: '/api/dashboard/stats/weekly-kpi',
} as const;

const emptyRoster: RosterOverview = {
  totalStaff: 0,
  weeklyShiftCount: 0,
  pendingLeaveRequests: 0,
  startDate: '',
  endDate: '',
};

const emptyKpi: WeeklyKpi = {
  revenueCents: 0,
  weeklyOrderCount: 0,
  todayBookingsCount: 0,
  weeklyShiftCostCents: 0,
  startofWeek: '',
  endOfWeek: '',
};

type RevenueTrendRow = {
  createdAt: string;
  _sum: { totalAmountCents: number | null };
};

function toRevenuePoints(rows: RevenueTrendRow[]): RevenuePoint[] {
  return rows.map((row) => ({
    label: new Intl.DateTimeFormat('en-AU', { month: 'short', day: 'numeric' }).format(
      new Date(row.createdAt)
    ),
    revenueCents: row._sum.totalAmountCents ?? 0,
  }));
}

async function fetchDashboardStats(api: ApiClient): Promise<DashboardStats> {
  const [popularItems, recentOrders, revenueTrend, rosterOverview, soldByCategory, weeklyKpi] =
    await Promise.all([
      api<PopularItem[]>(DASHBOARD_ENDPOINTS.popularItems),
      api<RecentOrder[]>(DASHBOARD_ENDPOINTS.recentOrders),
      api<RevenueTrendRow[]>(DASHBOARD_ENDPOINTS.revenueTrend),
      api<RosterOverview>(DASHBOARD_ENDPOINTS.rosterOverview),
      api<SoldByCategory[]>(DASHBOARD_ENDPOINTS.soldByCategory),
      api<WeeklyKpi>(DASHBOARD_ENDPOINTS.weeklyKpi),
    ]);

  return {
    popularItems,
    recentOrders,
    revenueTrend: toRevenuePoints(revenueTrend),
    rosterOverview,
    soldByCategory,
    weeklyKpi,
  };
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatShortDate(value: string) {
  if (!value) return 'Not set';
  try {
    return formatDate(value);
  } catch {
    return value;
  }
}

function formatTrendLabel(label: string) {
  const date = new Date(label);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return label;
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
        <Text className="text-lg font-semibold text-foreground">
          {title}
        </Text>
        {action ? (
          <Text className="text-sm font-medium text-muted-foreground">
            {action}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function MetricCard({
  label,
  value,
  detail,
  iconName,
  width,
}: {
  label: string;
  value: string;
  detail: string;
  iconName: keyof typeof Ionicons.glyphMap;
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
          {label}
        </Text>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Ionicons name={iconName} size={18} color={isDark ? '#FAFAFA' : '#18181B'} />
        </View>
      </View>
      <View className="gap-1">
        <Text className="text-3xl font-bold tracking-tight text-foreground">
          {value}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {detail}
        </Text>
      </View>
    </View>
  );
}

function RevenueTrendCard({ points }: { points: RevenuePoint[] }) {
  const chartHeight = 128;
  const maxRevenue = Math.max(...points.map((point) => point.revenueCents), 1);
  const visiblePoints = points.slice(-7);

  return (
    <View
      className="gap-4 overflow-hidden rounded-3xl bg-muted/40 p-5"
      style={{ borderCurve: 'continuous' }}>
      {visiblePoints.length > 0 ? (
        <>
          <View className="flex-row items-end" style={{ height: chartHeight }}>
            {visiblePoints.map((point, index) => {
              const barHeight = Math.max((point.revenueCents / maxRevenue) * chartHeight, 6);

              return (
                <View key={`${point.label}-${index}`} className="h-full flex-1 justify-end px-0.5">
                  <View
                    className="w-full rounded-t-xl bg-chart-2"
                    style={{ height: barHeight }}
                  />
                </View>
              );
            })}
          </View>

          <View className="flex-row gap-1">
            {visiblePoints.map((point, index) => (
              <View key={`${point.label}-label-${index}`} className="flex-1 items-center">
                <Text
                  numberOfLines={1}
                  className="text-center text-xs font-medium text-muted-foreground">
                  {formatTrendLabel(point.label)}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center justify-between border-t border-border/60 pt-3">
            <Text className="text-sm text-muted-foreground">
              Peak
            </Text>
            <Text className="text-base font-semibold text-foreground">
              {formatMoney(maxRevenue)}
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

function CategoryShare({ categories }: { categories: SoldByCategory[] }) {
  const visibleCategories = categories.slice(0, 5);

  return (
    <View
      className="gap-4 rounded-3xl border border-border bg-card p-5"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      {visibleCategories.length > 0 ? (
        visibleCategories.map((category) => (
          <View key={category.category} className="gap-2">
            <View className="flex-row items-center justify-between gap-3">
              <Text
                numberOfLines={1}
                className="flex-1 text-base font-medium text-foreground">
                {category.category}
              </Text>
              <Text className="text-sm font-semibold text-muted-foreground">
                {Math.round(category.percentage)}%
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(Math.max(category.percentage, 0), 100)}%` }}
              />
            </View>
          </View>
        ))
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
            key={`${item.name}-${index}`}
            className="flex-row items-center gap-3 border-b border-border px-5 py-4 last:border-b-0">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Text className="text-sm font-bold text-foreground">
                {index + 1}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              className="flex-1 text-base font-medium text-foreground">
              {item.name}
            </Text>
            <Text className="text-sm font-semibold text-muted-foreground">
              {compactNumber(item.sold_quantity)} sold
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
                <Text
                  numberOfLines={1}
                  className="text-base font-semibold text-foreground">
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
            <View className="flex-row items-center justify-between gap-3">
              <View className="rounded-full bg-muted px-3 py-1">
                <Text className="text-xs font-semibold text-muted-foreground">
                  {order.status.toLowerCase()}
                </Text>
              </View>
              <Text className="text-xs font-medium text-muted-foreground">
                {formatShortDate(order.createdAt)}
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
          <Text className="text-sm text-muted-foreground">
            Staff
          </Text>
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-3xl font-bold tracking-tight text-foreground">
            {roster.weeklyShiftCount}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Shifts
          </Text>
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-3xl font-bold tracking-tight text-foreground">
            {roster.pendingLeaveRequests}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Leave
          </Text>
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
  const { api } = useApi();
  const { isTablet, isLargeTablet, contentWidth, horizontalPadding, gridGap } = useResponsiveLayout();
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

  return (
    <ScreenScroll refreshing={isRefetching} onRefresh={() => refetch()}>
      <View className="gap-3">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-2">
            <Text
              className={`font-bold tracking-tight text-foreground ${
                isTablet ? 'text-3xl' : 'text-4xl'
              }`}>
              Dashboard
            </Text>
            <Text className="text-base leading-6 text-muted-foreground">
              Live restaurant performance, orders, menu movement, and roster coverage.
            </Text>
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
          <View className="flex-row flex-wrap" style={{ gap: gridGap }}>
            <MetricCard
              label="Revenue"
              value={formatMoney(stats.weeklyKpi.revenueCents)}
              detail="This week"
              iconName="cash-outline"
              width={metricCardWidth}
            />
            <MetricCard
              label="Orders"
              value={compactNumber(stats.weeklyKpi.weeklyOrderCount)}
              detail="This week"
              iconName="receipt-outline"
              width={metricCardWidth}
            />
            <MetricCard
              label="Bookings"
              value={compactNumber(stats.weeklyKpi.todayBookingsCount)}
              detail="Today"
              iconName="calendar-outline"
              width={metricCardWidth}
            />
            <MetricCard
              label="Shift cost"
              value={formatMoney(stats.weeklyKpi.weeklyShiftCostCents)}
              detail="Scheduled week"
              iconName="people-outline"
              width={metricCardWidth}
            />
          </View>

          {isTablet ? (
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Section title="Revenue trend" action={isRefetching ? 'Refreshing' : 'Last 7 points'}>
                  <RevenueTrendCard points={stats.revenueTrend} />
                </Section>
              </View>
              <View className="flex-1">
                <Section title="Sales by category">
                  <CategoryShare categories={stats.soldByCategory} />
                </Section>
              </View>
            </View>
          ) : (
            <>
              <Section title="Revenue trend" action={isRefetching ? 'Refreshing' : 'Last 7 points'}>
                <RevenueTrendCard points={stats.revenueTrend} />
              </Section>
              <Section title="Sales by category">
                <CategoryShare categories={stats.soldByCategory} />
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
