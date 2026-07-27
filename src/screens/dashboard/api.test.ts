import { describe, expect, test } from 'bun:test';

import { apiUrl } from '@/utils/api';

import { DASHBOARD_ENDPOINTS, fetchDashboardStats } from './api';

describe('fetchDashboardStats', () => {
  test('loads all six dashboard endpoints in parallel', async () => {
    const called: string[] = [];

    const api = async <T>(path: string): Promise<T> => {
      called.push(path);

      switch (path) {
        case DASHBOARD_ENDPOINTS.popularItems:
          return [
            {
              id: 'm1',
              name: 'Burger',
              description: 'Classic beef burger',
              priceCents: 1800,
              category: 'MAIN_COURSE',
              imageUrl: 'https://example.com/burger.jpg',
              isAvailable: true,
              sold_quantity: 12,
            },
          ] as T;
        case DASHBOARD_ENDPOINTS.recentOrders:
          return [
            {
              id: 'o1',
              orderNo: 101,
              customerName: 'Ada',
              status: 'PENDING',
              orderType: 'DINING',
              totalAmountCents: 2500,
              createdAt: '2026-07-24T10:00:00.000Z',
              tableNumber: '5',
              itemCount: 2,
            },
          ] as T;
        case DASHBOARD_ENDPOINTS.revenueTrend:
          return [
            {
              createdAt: new Date().toISOString(),
              _sum: { totalAmountCents: 9000 },
            },
          ] as T;
        case DASHBOARD_ENDPOINTS.rosterOverview:
          return {
            totalStaff: 8,
            weeklyShiftCount: 20,
            pendingLeaveRequests: 1,
            startDate: '2026-07-20',
            endDate: '2026-07-26',
          } as T;
        case DASHBOARD_ENDPOINTS.soldByCategory:
          return [{ category: 'MAIN_COURSE', percentage: 55 }] as T;
        case DASHBOARD_ENDPOINTS.weeklyKpi:
          return {
            revenueCents: 10000,
            weeklyOrderCount: 5,
            todayBookingsCount: 2,
            weeklyShiftCostCents: 30000,
            startofWeek: '2026-07-20',
            endOfWeek: '2026-07-26',
          } as T;
        default:
          throw new Error(`Unexpected path: ${path}`);
      }
    };

    const stats = await fetchDashboardStats(api);

    expect(called.sort()).toEqual(Object.values(DASHBOARD_ENDPOINTS).sort());
    expect(stats.popularItems[0]?.name).toBe('Burger');
    expect(stats.popularItems[0]?.imageUrl).toBe('https://example.com/burger.jpg');
    expect(stats.popularItems[0]?.sold_quantity).toBe(12);
    expect(stats.recentOrders[0]?.orderNo).toBe(101);
    expect(stats.revenueTrend).toHaveLength(7);
    expect(stats.revenueTrend.at(-1)?.revenueCents).toBe(9000);
    expect(stats.rosterOverview.totalStaff).toBe(8);
    expect(stats.soldByCategory[0]?.percentage).toBe(55);
    expect(stats.weeklyKpi.weeklyOrderCount).toBe(5);
    expect(apiUrl(DASHBOARD_ENDPOINTS.weeklyKpi)).toContain('/api/dashboard/stats/weekly-kpi');
  });
});
