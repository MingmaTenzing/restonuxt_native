// Types mirror the RestoQuick API contract (see API_REFERENCE.md → Orders / Enums).
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type OrderType = 'TAKEAWAY' | 'DINING' | 'UBER';
export type PaymentStatus = 'UNPAID' | 'PAID';
export type PaymentMethod = 'CASH' | 'CARD_TERMINAL' | 'STRIPE_QR';

export interface OrderItemOption {
  id: string;
  quantity: number;
  name: string;
  priceCents: number;
  orderItemId: string;
  menuOptionId: string | null;
}

export interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPriceCents: number; // snapshot
  specialInstructions: string | null;
  orderId: string;
  menuItemId: string | null;
  orderItemOptions?: OrderItemOption[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderTable {
  id: string;
  number: string;
  capacity?: number;
}

export interface Order {
  id: string;
  orderNo: number; // auto-increment, unique
  checkoutSessionId: string;
  status: OrderStatus;
  totalAmountCents: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  orderType: OrderType;
  customerName: string;
  tableId: string | null;
  tableSessionId: string | null;
  table?: OrderTable | null;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type OrderRange = 'all' | 'day' | 'week' | 'month';
