// Types mirror the RestoQuick API contract (see API_REFERENCE.md → Bookings / Enums).
export type BookingStatus =
  'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Table {
  id: string;
  number: string;
  capacity: number;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  bookingTime: string; // ISO (date + time combined)
  guestCount: number;
  specialRequest: string | null;
  status: BookingStatus;
  tableId: string | null;
  table?: Table | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewBooking {
  customerName: string;
  customerPhone: string;
  guestCount: number;
  bookingTime: string;
  specialRequest?: string;
}
