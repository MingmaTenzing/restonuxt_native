// Cashier contracts — mirrors RESTOQUICK_DOC.md → Order checkout.
import type { Order, PaymentMethod } from '@/screens/orders/types';
import type { SessionCheckout, TableSession } from '@/screens/sessions/types';

export type CashierMode = 'TABLES' | 'TAKEAWAY';

export interface CashierTableSession extends TableSession {
  outstandingCents: number;
  unpaidOrderCount: number;
}

export interface CashierCheckoutTarget {
  mode: 'TABLE';
  session: TableSession;
  checkout: SessionCheckout;
}

export interface CashierTakeawayTarget {
  mode: 'TAKEAWAY';
  order: Order;
}

export type CashierTarget = CashierCheckoutTarget | CashierTakeawayTarget;

export interface MarkTablePaidInput {
  tableSessionId: string;
  orderIds: string[];
  paymentMethod: PaymentMethod;
}

export interface CloseTakeawayInput {
  orderId: string;
  paymentMethod: PaymentMethod;
}
