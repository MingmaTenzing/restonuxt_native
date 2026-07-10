// Types mirror the RestoQuick API contract (see API_REFERENCE.md → Table sessions).
import type { Order, PaymentMethod } from '@/screens/orders/types';

export type TableSessionStatus = 'ACTIVE' | 'CHECKOUT_PENDING' | 'CLOSED';

export interface SessionTable {
  id: string;
  number: string;
  capacity: number;
}

export interface TableSession {
  id: string;
  status: TableSessionStatus;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tableId: string;
  table?: SessionTable | null;
  orders?: Order[];
}

export interface SessionCheckoutSummary {
  orderCount: number;
  payableOrderCount: number;
  paidOrderCount: number;
  payableOrderIds: string[];
  sessionTotalCents: number;
  payableTotalCents: number;
  paidTotalCents: number;
  hasOutstandingBalance: boolean;
}

export interface SessionCheckout extends TableSession {
  orders: Order[];
  summary: SessionCheckoutSummary;
}

export type SessionStatusFilter = 'ALL' | 'ACTIVE' | 'CLOSED';

export interface SessionCreateInput {
  tableId: string;
}

export interface SessionCloseInput {
  tableSessionId: string;
  orderIds: string[];
  paymentMethod: PaymentMethod;
}

export interface TableOption {
  id: string;
  number: string;
  capacity: number;
  hasActiveSession: boolean;
}
