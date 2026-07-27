import type { ApiClient } from '@/utils/api';

import { toRevenuePoints, type RevenueTrendRow } from './dashboard-stats';
import type {
  DashboardStats,
  PopularItem,
  RecentOrder,
  RosterOverview,
  SoldByCategory,
  WeeklyKpi,
} from './types';

export const DASHBOARD_ENDPOINTS = {
  popularItems: '/api/dashboard/stats/popular-items',
  recentOrders: '/api/dashboard/stats/recent-order',
  revenueTrend: '/api/dashboard/stats/revenue-trend',
  rosterOverview: '/api/dashboard/stats/roster-overview',
  soldByCategory: '/api/dashboard/stats/soldbycategory',
  weeklyKpi: '/api/dashboard/stats/weekly-kpi',
} as const;

/** Fetch all dashboard aggregations in parallel — mirrors Nuxt Dashboard/index.vue. */
export async function fetchDashboardStats(api: ApiClient): Promise<DashboardStats> {
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
