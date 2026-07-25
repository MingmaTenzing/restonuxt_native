import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, Text, useColorScheme, View } from 'react-native';

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
import {
  buildWeeklyKpiCards,
  emptyKpi,
  emptyRoster,
  formatCategoryShare,
  greetingForHour,
  type DashboardKpiCard,
} from './dashboard-stats';
import { DashboardUserAction } from './user-action';
import type {
  DashboardStats,
  PopularItem,
  RecentOrder,
  RevenuePoint,
  RosterOverview,
  SoldByCategory,
} from './types';

const QUICK_ACTIONS = [
  { label: 'View bookings', href: '/bookings' as const, icon: 'calendar-outline' as const },
  { label: 'Kitchen board', href: '/kitchen' as const, icon: 'restaurant-outline' as const },
  { label: 'Menu', href: '/menu' as const, icon: 'book-outline' as const },
];

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
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-lg font-semibold text-foreground">{title}</Text>
          {subtitle ? (
            <Text className="text-sm text-muted-foreground">{subtitle}</Text>
          ) : null}
        </View>
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
      className="gap-3 rounded-3xl border border-border bg-card p-4"
      style={{
        width,
        flex: width ? undefined : 1,
        borderCurve: 'continuous',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-3">
          <Text className="text-sm text-muted-foreground">{card.label}</Text>
          <Text className="text-3xl font-bold tracking-tight text-foreground">{card.value}</Text>
        </View>
        <View className="rounded-full bg-muted px-2.5 py-1">
          <Text className="text-xs font-semibold text-foreground">{card.change}</Text>
        </View>
      </View>
      <View className="gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>
            {card.headline}
          </Text>
          <Ionicons name={card.iconName} size={16} color={isDark ? '#FAFAFA' : '#18181B'} />
        </View>
        <Text className="text-sm leading-5 text-muted-foreground">{card.description}</Text>
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
      className="gap-4 overflow-hidden rounded-3xl border border-border bg-card p-5"
      style={{ borderCurve: 'continuous' }}>
      {visiblePoints.length > 0 ? (
        <>
          <View className="flex-row items-end" style={{ height: chartHeight }}>
            {visiblePoints.map((point, index) => {
              const barHeight = Math.max((point.revenueCents / maxRevenue) * chartHeight, 6);

              return (
                <View key={`${point.label}-${index}`} className="h-full flex-1 justify-end px-0.5">
                  <View className="w-full rounded-t-xl bg-chart-2" style={{ height: barHeight }} />
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
                  {point.label}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center justify-between border-t border-border/60 pt-3">
            <Text className="text-sm text-muted-foreground">Peak day</Text>
            <Text className="text-base font-semibold text-foreground">{formatMoney(maxRevenue)}</Text>
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
  const visibleCategories = formatCategoryShare(categories).slice(0, 7);

  return (
    <View
      className="gap-4 rounded-3xl border border-border bg-card p-5"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      {visibleCategories.length > 0 ? (
        visibleCategories.map((category) => (
          <View key={category.category} className="gap-2">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 flex-row items-center gap-2">
                <View
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <Text numberOfLines={1} className="flex-1 text-base font-medium text-foreground">
                  {category.label}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-muted-foreground">
                {Math.round(category.percentage)}%
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${category.percentage}%`,
                  backgroundColor: category.color,
                }}
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
  const visibleItems = items.slice(0, 8);
  const maxSold = Math.max(...visibleItems.map((item) => item.sold_quantity), 1);

  return (
    <View
      className="overflow-hidden rounded-3xl border border-border bg-card"
      style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      {visibleItems.length > 0 ? (
        visibleItems.map((item, index) => (
          <View
            key={`${item.name}-${index}`}
            className="gap-2 border-b border-border px-5 py-4 last:border-b-0">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Text className="text-sm font-bold text-foreground">{index + 1}</Text>
              </View>
              <Text numberOfLines={1} className="flex-1 text-base font-medium text-foreground">
                {item.name}
              </Text>
              <Text className="text-sm font-semibold text-muted-foreground">
                {item.sold_quantity} sold
              </Text>
            </View>
            <View className="ml-12 h-2 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${(item.sold_quantity / maxSold) * 100}%` }}
              />
            </View>
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
                  #{order.orderNo ?? 'New'} · {order.customerName || 'Guest'}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
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
          No recent orders found.
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
  const router = useRouter();
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
  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? 'there';
  const greeting = greetingForHour(new Date().getHours());
  const todayLabel = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <ScreenScroll refreshing={isRefetching} onRefresh={() => refetch()}>
      <View
        className="gap-4 rounded-3xl border border-border bg-card p-5"
        style={{ borderCurve: 'continuous', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-2">
            <Text className="text-sm font-medium text-muted-foreground">
              {greeting}, {firstName}
            </Text>
            <Text
              className={`font-bold tracking-tight text-foreground ${
                isTablet ? 'text-3xl' : 'text-4xl'
              }`}>
              Dashboard overview
            </Text>
            <Text className="text-base leading-6 text-muted-foreground">
              Bookings, orders, and service activity for today.
            </Text>
            <View className="mt-1 self-start rounded-full bg-muted px-3 py-1.5">
              <Text className="text-sm text-muted-foreground">{todayLabel}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <ThemeToggle variant="compact" />
            <DashboardUserAction />
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.href}
              onPress={() => router.push(action.href)}
              className="flex-row items-center gap-2 rounded-full border border-border px-3 py-2 active:bg-muted">
              <Ionicons name={action.icon} size={16} color="#71717A" />
              <Text className="text-sm font-medium text-foreground">{action.label}</Text>
            </Pressable>
          ))}
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
            {kpiCards.map((card) => (
              <MetricCard key={card.key} card={card} width={metricCardWidth} />
            ))}
          </View>

          {isTablet ? (
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Section
                  title="Top selling items"
                  subtitle="Best performers from the last 30 days"
                  action={isRefetching ? 'Refreshing' : undefined}>
                  <PopularItems items={stats.popularItems} />
                </Section>
              </View>
              <View className="flex-1">
                <Section title="Revenue trend" subtitle="Completed order revenue over time">
                  <RevenueTrendCard points={stats.revenueTrend} />
                </Section>
              </View>
            </View>
          ) : (
            <>
              <Section
                title="Top selling items"
                subtitle="Best performers from the last 30 days"
                action={isRefetching ? 'Refreshing' : undefined}>
                <PopularItems items={stats.popularItems} />
              </Section>
              <Section title="Revenue trend" subtitle="Completed order revenue over time">
                <RevenueTrendCard points={stats.revenueTrend} />
              </Section>
            </>
          )}

          <Section title="Sales by category" subtitle="Share of units sold by menu category">
            <CategoryShare categories={stats.soldByCategory} />
          </Section>

          <Section
            title="Recent orders"
            subtitle="The latest five orders across dine-in, takeaway, and delivery"
            action={`${stats.recentOrders.length} recent`}>
            <RecentOrders orders={stats.recentOrders} />
          </Section>

          <Section title="Roster overview" subtitle="Staff coverage for the current week">
            <RosterCard roster={stats.rosterOverview} />
          </Section>
        </>
      )}
    </ScreenScroll>
  );
}
