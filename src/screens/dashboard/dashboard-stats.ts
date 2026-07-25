import { formatMoney } from '@/utils/format-money';

import type { RevenuePoint, RosterOverview, SoldByCategory, WeeklyKpi } from './types';

export type RevenueTrendRow = {
  createdAt: string;
  _sum: { totalAmountCents: number | null };
};

export type DashboardKpiCard = {
  key: string;
  label: string;
  value: string;
  change: string;
  headline: string;
  description: string;
  iconName: 'cash-outline' | 'receipt-outline' | 'calendar-outline' | 'people-outline';
};

const CATEGORY_LABELS: Record<string, string> = {
  APPETIZER: 'Appetizer',
  MAIN_COURSE: 'Main Course',
  DESSERT: 'Dessert',
  BEVERAGE: 'Beverage',
  SIDE: 'Side',
  SALAD: 'Salad',
  OTHER: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  APPETIZER: '#F59E0B',
  MAIN_COURSE: '#10B981',
  DESSERT: '#EC4899',
  BEVERAGE: '#0EA5E9',
  SIDE: '#A855F7',
  SALAD: '#84CC16',
  OTHER: '#A3A3A3',
};

export const emptyRoster: RosterOverview = {
  totalStaff: 0,
  weeklyShiftCount: 0,
  pendingLeaveRequests: 0,
  startDate: '',
  endDate: '',
};

export const emptyKpi: WeeklyKpi = {
  revenueCents: 0,
  weeklyOrderCount: 0,
  todayBookingsCount: 0,
  weeklyShiftCostCents: 0,
  startofWeek: '',
  endOfWeek: '',
};

/** Map revenue-trend API rows into chart points (same date format as web Monthly_Revenue). */
export function toRevenuePoints(rows: RevenueTrendRow[]): RevenuePoint[] {
  return rows.map((row) => ({
    label: new Intl.DateTimeFormat('en-AU', { month: 'short', day: 'numeric' }).format(
      new Date(row.createdAt)
    ),
    revenueCents: row._sum.totalAmountCents ?? 0,
  }));
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category;
}

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.OTHER;
}

/** KPI cards — copy matches Nuxt Dashboard/index.vue `stats` computed. */
export function buildWeeklyKpiCards(kpi: WeeklyKpi): DashboardKpiCard[] {
  return [
    {
      key: 'revenue',
      label: 'Weekly revenue',
      value: formatMoney(kpi.revenueCents),
      change: 'This week',
      headline: 'Completed orders captured',
      description: 'Revenue from completed orders during the current week',
      iconName: 'cash-outline',
    },
    {
      key: 'orders',
      label: 'Weekly orders',
      value: compactNumber(kpi.weeklyOrderCount),
      change: 'This week',
      headline: 'Orders placed so far',
      description: 'All order statuses counted for the current week',
      iconName: 'receipt-outline',
    },
    {
      key: 'bookings',
      label: "Today's bookings",
      value: compactNumber(kpi.todayBookingsCount),
      change: 'Today',
      headline: 'Bookings on the floor',
      description: "Reservations scheduled between today's opening and close",
      iconName: 'calendar-outline',
    },
    {
      key: 'shift-cost',
      label: 'Weekly shift cost',
      value: formatMoney(kpi.weeklyShiftCostCents),
      change: 'Labour',
      headline: 'Rostered payroll estimate',
      description: 'Calculated from shift duration and each staff hourly rate',
      iconName: 'people-outline',
    },
  ];
}

export function formatCategoryShare(categories: SoldByCategory[]) {
  return categories.map((item) => ({
    ...item,
    label: categoryLabel(item.category),
    color: categoryColor(item.category),
    percentage: Math.min(Math.max(item.percentage, 0), 100),
  }));
}

export function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
