import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Text, useColorScheme, View } from 'react-native';

import { Button } from '@/components/button';
import { ScreenScroll } from '@/components/screen-scroll';
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

async function fetchJson<T>(api: ApiClient, path: string): Promise<T> {
  return api<T>(path);
}

function unwrapArray<T>(payload: unknown, keys: string[] = []): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  for (const key of keys) {
    const value = (payload as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }

  const values = Object.values(payload);
  const firstArray = values.find(Array.isArray);
  return (firstArray as T[] | undefined) ?? [];
}

function unwrapObject<T>(payload: unknown, fallback: T, keys: string[] = []): T {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return fallback;

  for (const key of keys) {
    const value = (payload as Record<string, unknown>)[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as T;
  }

  return payload as T;
}

function normalizeRevenueTrend(payload: unknown): RevenuePoint[] {
  return unwrapArray<Record<string, unknown>>(payload, ['revenueTrend', 'trend', 'data']).map(
    (point, index) => {
      const labelSource =
        point.label ?? point.date ?? point.day ?? point.week ?? `Point ${index + 1}`;
      const valueSource =
        point.revenueCents ??
        point.revenue_cents ??
        point.totalRevenueCents ??
        point.totalAmountCents ??
        point.value ??
        point.total ??
        0;

      return {
        label: String(labelSource),
        revenueCents: Number(valueSource) || 0,
      };
    }
  );
}

async function fetchDashboardStats(api: ApiClient): Promise<DashboardStats> {
  const [popularItems, recentOrders, revenueTrend, rosterOverview, soldByCategory, weeklyKpi] =
    await Promise.all([
      fetchJson<unknown>(api, DASHBOARD_ENDPOINTS.popularItems),
      fetchJson<unknown>(api, DASHBOARD_ENDPOINTS.recentOrders),
      fetchJson<unknown>(api, DASHBOARD_ENDPOINTS.revenueTrend),
      fetchJson<unknown>(api, DASHBOARD_ENDPOINTS.rosterOverview),
      fetchJson<unknown>(api, DASHBOARD_ENDPOINTS.soldByCategory),
      fetchJson<unknown>(api, DASHBOARD_ENDPOINTS.weeklyKpi),
    ]);

  return {
    popularItems: unwrapArray<PopularItem>(popularItems, ['popularItems', 'items', 'data']),
    recentOrders: unwrapArray<RecentOrder>(recentOrders, ['recentOrders', 'orders', 'data']),
    revenueTrend: normalizeRevenueTrend(revenueTrend),
    rosterOverview: unwrapObject<RosterOverview>(rosterOverview, emptyRoster, [
      'rosterOverview',
      'overview',
      'data',
    ]),
    soldByCategory: unwrapArray<SoldByCategory>(soldByCategory, [
      'soldByCategory',
      'categories',
      'data',
    ]),
    weeklyKpi: unwrapObject<WeeklyKpi>(weeklyKpi, emptyKpi, ['weeklyKpi', 'kpi', 'data']),
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
        <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          {title}
        </Text>
        {action ? (
          <Text className="text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
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
      className="gap-4 rounded-3xl border border-border bg-card p-4 dark:border-border-dark dark:bg-card-dark"
      style={{
        width,
        flex: width ? undefined : 1,
        borderCurve: 'continuous',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      }}>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground-dark">
          {label}
        </Text>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-muted dark:bg-muted-dark">
          <Ionicons name={iconName} size={18} color={isDark ? '#FAFAFA' : '#18181B'} />
        </View>
      </View>
      <View className="gap-1">
        <Text className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
          {value}
        </Text>
        <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
          {detail}
        </Text>
      </View>
    </View>
  );
}

function RevenueTrendCard({ points }: { points: RevenuePoint[] }) {
  const maxRevenue = Math.max(...points.map((point) => point.revenueCents), 1);
  const visiblePoints = points.slice(-7);

  return (
    <View
      className="gap-5 rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      {visiblePoints.length > 0 ? (
        <>
          <View className="h-36 flex-row items-end gap-2">
            {visiblePoints.map((point, index) => (
              <View key={`${point.label}-${index}`} className="flex-1 items-center gap-2">
                <View
                  className="w-full rounded-t-xl bg-chart-2 dark:bg-chart-2-dark"
                  style={{
                    height: `${Math.max((point.revenueCents / maxRevenue) * 100, 8)}%`,
                  }}
                />
                <Text
                  numberOfLines={1}
                  className="text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
                  {formatTrendLabel(point.label)}
                </Text>
              </View>
            ))}
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
              Peak
            </Text>
            <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
              {formatMoney(maxRevenue)}
            </Text>
          </View>
        </>
      ) : (
        <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
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
      className="gap-4 rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      {visibleCategories.length > 0 ? (
        visibleCategories.map((category) => (
          <View key={category.category} className="gap-2">
            <View className="flex-row items-center justify-between gap-3">
              <Text
                numberOfLines={1}
                className="flex-1 text-base font-medium text-foreground dark:text-foreground-dark">
                {category.category}
              </Text>
              <Text className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground-dark">
                {Math.round(category.percentage)}%
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-muted dark:bg-muted-dark">
              <View
                className="h-full rounded-full bg-primary dark:bg-primary-dark"
                style={{ width: `${Math.min(Math.max(category.percentage, 0), 100)}%` }}
              />
            </View>
          </View>
        ))
      ) : (
        <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
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
      className="overflow-hidden rounded-3xl border border-border bg-card dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      {visibleItems.length > 0 ? (
        visibleItems.map((item, index) => (
          <View
            key={`${item.name}-${index}`}
            className="flex-row items-center gap-3 border-b border-border px-5 py-4 last:border-b-0 dark:border-border-dark">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-muted dark:bg-muted-dark">
              <Text className="text-sm font-bold text-foreground dark:text-foreground-dark">
                {index + 1}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              className="flex-1 text-base font-medium text-foreground dark:text-foreground-dark">
              {item.name}
            </Text>
            <Text className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground-dark">
              {compactNumber(item.sold_quantity)} sold
            </Text>
          </View>
        ))
      ) : (
        <Text className="p-5 text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
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
      className="overflow-hidden rounded-3xl border border-border bg-card dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      {visibleOrders.length > 0 ? (
        visibleOrders.map((order) => (
          <View
            key={order.id}
            className="gap-3 border-b border-border px-5 py-4 last:border-b-0 dark:border-border-dark">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text
                  numberOfLines={1}
                  className="text-base font-semibold text-foreground dark:text-foreground-dark">
                  {order.customerName || 'Guest'}
                </Text>
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  #{order.orderNo ?? 'New'} · {order.itemCount} item
                  {order.itemCount === 1 ? '' : 's'}
                  {order.tableNumber ? ` · Table ${order.tableNumber}` : ''}
                </Text>
              </View>
              <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                {formatMoney(order.totalAmountCents)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <View className="rounded-full bg-muted px-3 py-1 dark:bg-muted-dark">
                <Text className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground-dark">
                  {order.status.toLowerCase()}
                </Text>
              </View>
              <Text className="text-xs font-medium text-muted-foreground dark:text-muted-foreground-dark">
                {formatShortDate(order.createdAt)}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text className="p-5 text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
          Recent orders will appear here as they come in.
        </Text>
      )}
    </View>
  );
}

function RosterCard({ roster }: { roster: RosterOverview }) {
  return (
    <View
      className="gap-4 rounded-3xl border border-border bg-card p-5 dark:border-border-dark dark:bg-card-dark"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      <View className="flex-row gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
            {roster.totalStaff}
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            Staff
          </Text>
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
            {roster.weeklyShiftCount}
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            Shifts
          </Text>
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground-dark">
            {roster.pendingLeaveRequests}
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            Leave
          </Text>
        </View>
      </View>
      <View className="h-px bg-border dark:bg-border-dark" />
      <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
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
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
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
    <ScreenScroll>
      <View className="gap-3">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-2">
            <Text
              className={`font-bold tracking-tight text-foreground dark:text-foreground-dark ${
                isTablet ? 'text-3xl' : 'text-4xl'
              }`}>
              Dashboard
            </Text>
            <Text className="text-base leading-6 text-muted-foreground dark:text-muted-foreground-dark">
              Live restaurant performance, orders, menu movement, and roster coverage.
            </Text>
          </View>
          <DashboardUserAction />
        </View>
        {stats.weeklyKpi.startofWeek || stats.weeklyKpi.endOfWeek ? (
          <Text className="text-sm font-medium text-muted-foreground dark:text-muted-foreground-dark">
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

      <View className="flex-row flex-wrap" style={{ gap: gridGap }}>
        <MetricCard
          label="Revenue"
          value={formatMoney(stats.weeklyKpi.revenueCents)}
          detail={isLoading ? 'Loading...' : 'This week'}
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
            <Section title="Revenue trend" action={isFetching ? 'Refreshing' : 'Last 7 points'}>
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
          <Section title="Revenue trend" action={isFetching ? 'Refreshing' : 'Last 7 points'}>
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
    </ScreenScroll>
  );
}
