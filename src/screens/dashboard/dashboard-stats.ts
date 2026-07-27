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
  detail: string;
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

function localDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric' }).format(date);
}

/** Compact $ label for narrow chart columns (e.g. $45, $12.5). */
export function formatChartMoney(cents: number) {
  const amount = (cents ?? 0) / 100;
  if (amount === 0) return '$0';
  if (Math.abs(amount) >= 100) return `$${Math.round(amount)}`;
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${amount.toFixed(1)}`;
}

/**
 * Aggregate API rows (grouped by full timestamp) into one point per local calendar day.
 * Fills the last `days` days so every bar has a real date — matches how the trend is read.
 */
export function toRevenuePoints(
  rows: RevenueTrendRow[],
  options?: { days?: number; now?: Date }
): RevenuePoint[] {
  const days = options?.days ?? 7;
  const now = options?.now ?? new Date();
  const totals = new Map<string, number>();

  for (const row of rows) {
    const created = new Date(row.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const key = localDayKey(created);
    totals.set(key, (totals.get(key) ?? 0) + (row._sum.totalAmountCents ?? 0));
  }

  const today = startOfLocalDay(now);
  const points: RevenuePoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = localDayKey(date);
    points.push({
      label: formatDayLabel(date),
      revenueCents: totals.get(key) ?? 0,
    });
  }

  return points;
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

/** Compact KPI cards — same four weekly stats as the web dashboard. */
export function buildWeeklyKpiCards(kpi: WeeklyKpi): DashboardKpiCard[] {
  return [
    {
      key: 'revenue',
      label: 'Revenue',
      value: formatMoney(kpi.revenueCents),
      detail: 'This week',
      iconName: 'cash-outline',
    },
    {
      key: 'orders',
      label: 'Orders',
      value: compactNumber(kpi.weeklyOrderCount),
      detail: 'This week',
      iconName: 'receipt-outline',
    },
    {
      key: 'bookings',
      label: 'Bookings',
      value: compactNumber(kpi.todayBookingsCount),
      detail: 'Today',
      iconName: 'calendar-outline',
    },
    {
      key: 'shift-cost',
      label: 'Shift cost',
      value: formatMoney(kpi.weeklyShiftCostCents),
      detail: 'Scheduled week',
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

export function welcomeName(firstName?: string | null, fullName?: string | null) {
  return firstName?.trim() || fullName?.trim()?.split(/\s+/)[0] || 'there';
}
