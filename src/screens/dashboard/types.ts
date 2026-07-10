import type { OrderStatus, OrderType } from '@/screens/orders/types';

export interface PopularItem {
  name: string;
  sold_quantity: number;
}

export interface RecentOrder {
  id: string;
  orderNo: number | null;
  customerName: string;
  status: OrderStatus;
  orderType: OrderType;
  totalAmountCents: number;
  createdAt: string;
  tableNumber: string | null;
  itemCount: number;
}

export interface RevenuePoint {
  label: string;
  revenueCents: number;
}

export interface RosterOverview {
  totalStaff: number;
  weeklyShiftCount: number;
  pendingLeaveRequests: number;
  startDate: string;
  endDate: string;
}

export interface SoldByCategory {
  category: string;
  percentage: number;
}

export interface WeeklyKpi {
  revenueCents: number;
  weeklyOrderCount: number;
  todayBookingsCount: number;
  weeklyShiftCostCents: number;
  startofWeek: string;
  endOfWeek: string;
}

export interface DashboardStats {
  popularItems: PopularItem[];
  recentOrders: RecentOrder[];
  revenueTrend: RevenuePoint[];
  rosterOverview: RosterOverview;
  soldByCategory: SoldByCategory[];
  weeklyKpi: WeeklyKpi;
}
