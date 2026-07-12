// POS contracts — mirrors RESTOQUICK_DOC.md → POS orders.
import type { MenuItem, MenuOption } from '@/screens/menu/types';
import type { Order } from '@/screens/orders/types';

export type PosMode = 'DINING' | 'TAKEAWAY';

export interface PosTable {
  id: string;
  number: string;
  capacity: number;
  activeSessionId: string | null;
}

export interface CartOption {
  menuOptionId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export interface CartLine {
  id: string;
  menuItemId: string;
  itemName: string;
  unitPriceCents: number;
  quantity: number;
  specialInstructions: string | null;
  options: CartOption[];
}

/** Body for Prisma nested create on POST /api/orders/pos/* */
export interface OrderItemCreateInput {
  menuItemId: string;
  itemName: string;
  unitPriceCents: number;
  quantity: number;
  specialInstructions?: string | null;
  orderItemOptions?: {
    create: {
      menuOptionId: string;
      quantity: number;
      name: string;
      priceCents: number;
    }[];
  };
}

export interface PosDiningOrderInput {
  tableId: string;
  customerName: string;
  totalAmountCents: number;
  items: OrderItemCreateInput[];
}

export interface PosTakeawayOrderInput {
  customerName: string;
  totalAmountCents: number;
  items: OrderItemCreateInput[];
}

export type PosMenuItem = MenuItem;
export type PosMenuOption = MenuOption;
export type PosOrder = Order;
