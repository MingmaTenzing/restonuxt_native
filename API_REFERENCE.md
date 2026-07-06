# RestoQuick API Reference

This document describes every HTTP API route exposed by the Nuxt/Nitro backend under `server/api/`. It is intended as a contract for building a **native mobile client** (or any external client). Enum values below are taken from the authoritative Prisma schema (`prisma/schema.prisma`).

- Base URL: `<host>`
- Hosted (production) base URL: `https://restoquicknuxt-production.up.railway.app`
- Content type: `application/json` unless noted
- All routes are protected by Clerk auth middleware unless explicitly marked public (see [Authentication](#authentication)).

---

## Table of contents

- [Authentication](#authentication)
- [Conventions & data types](#conventions--data-types)
- [Enums](#enums)
- [Core models](#core-models)
- [WebSocket (real-time kitchen)](#websocket-real-time-kitchen)
- [Bookings](#bookings)
- [Dashboard stats](#dashboard-stats)
- [Leave requests](#leave-requests)
- [Menu](#menu)
- [Orders](#orders)
- [Order items](#order-items)
- [Order checkout](#order-checkout)
- [POS orders](#pos-orders)
- [Receipt printing](#receipt-printing)
- [Shifts](#shifts)
- [Staff](#staff)
- [Stock](#stock)
- [Stripe checkout](#stripe-checkout)
- [Table sessions](#table-sessions)
- [Tables](#tables)
- [Vapi booking tool](#vapi-booking-tool)
- [AI agents](#ai-agents)
- [Error codes](#error-codes)

---

## Authentication

- A global server middleware (`server/middleware/auth.ts`) enforces **Clerk authentication** on `/api/*` routes.
- Unauthenticated requests to protected routes return **401 Unauthorized**.
- The native client must send a valid Clerk session token (via the Clerk mobile SDK / `Authorization` header as configured by Clerk).
- Some routes are designed for external callers (Vapi voice tool, Stripe webhooks/returns). Treat `vapi-booking-tool` as machine-to-machine.

---

## Conventions & data types

- **Money is always in integer cents.** Fields: `totalAmountCents`, `unitPriceCents`, `priceCents`. Example: `$10.50` → `1050`. Divide by 100 for display; never store dollars.
- **Dates** are ISO 8601 strings in requests and JSON responses (`DateTime` in Prisma).
- **IDs** are UUID strings unless noted (`orderNo` is an auto-increment integer).
- **File-based routing** maps to URLs: `index.get.ts` → `GET /resource`; `[id].put.ts` → `PUT /resource/{id}`.
- Prices `unitPriceCents`/`priceCents` are **snapshots** taken at order time.

---

## Enums

```ts
// Staff
type Role =
  | "Chef"
  | "Waiter"
  | "Bartender"
  | "Manager"
  | "Cook"
  | "Kitchen_Hand";
type EmploymentType = "PartTime" | "FullTime" | "Casual";
type WeekDay = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

// Leave
type LeaveStatus = "pending" | "approved" | "rejected";

// Booking
type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SEATED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

// Table sessions
type TableSessionStatus = "ACTIVE" | "CHECKOUT_PENDING" | "CLOSED";

// Orders
type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";
type OrderType = "TAKEAWAY" | "DINING" | "UBER";
type PaymentStatus = "UNPAID" | "PAID";
type PaymentMethod = "CASH" | "CARD_TERMINAL" | "STRIPE_QR";

// Stock
type StockCategory = "INGREDIENTS" | "BEVERAGES" | "SUPPLIES" | "OTHER";
```

---

## Core models

```ts
interface Staff {
  id: string;
  firstname: string;
  lastName: string;
  role: Role;
  email: string; // unique
  phone: string;
  employmentType: EmploymentType;
  perHourRate: number; // Prisma Decimal (serialized as string/number)
  availability: WeekDay[];
  joined_date: string; // ISO
  profile_photo_url: string | null;
}

interface Shift {
  id: string;
  staffId: string;
  date: string; // ISO
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "17:00"
  position: string;
}

interface LeaveRequest {
  id: string;
  staffId: string;
  startDate: string; // ISO
  endDate: string; // ISO
  reason: string;
  status: LeaveStatus; // default "pending"
  submittedAt: string; // ISO
}

interface Table {
  id: string;
  number: string; // unique, e.g. "A1", "12"
  capacity: number;
}

interface TableSession {
  id: string;
  status: TableSessionStatus; // default "ACTIVE"
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tableId: string;
}

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  bookingTime: string; // ISO (date + time combined)
  guestCount: number;
  specialRequest: string | null;
  status: BookingStatus; // default "PENDING"
  tableId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MenuCategory {
  id: string;
  name: string; // unique
  createdAt: string;
  updatedAt: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  category: string; // FK -> MenuCategory.name
  imageUrl: string | null;
  isAvailable: boolean; // default true
  options?: MenuOption[];
}

interface MenuOption {
  id: string;
  name: string;
  priceCents: number; // default 0
  menuItemId: string;
}

interface Order {
  id: string;
  orderNo: number; // auto-increment, unique
  checkoutSessionId: string; // unique (prevents duplicate orders)
  status: OrderStatus; // default "PENDING"
  totalAmountCents: number; // default 0
  paymentStatus: PaymentStatus; // default "UNPAID"
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  orderType: OrderType; // default "DINING"
  customerName: string;
  tableId: string | null;
  tableSessionId: string | null;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  itemName: string;
  quantity: number; // default 1
  unitPriceCents: number; // snapshot
  specialInstructions: string | null;
  orderId: string;
  menuItemId: string | null;
  orderItemOptions?: OrderItemOption[];
  createdAt: string;
  updatedAt: string;
}

interface OrderItemOption {
  id: string;
  quantity: number; // default 1
  name: string;
  priceCents: number;
  orderItemId: string;
  menuOptionId: string | null;
}

interface StockItem {
  id: string;
  name: string;
  category: StockCategory; // default "INGREDIENTS"
  currentStock: number; // default 0
  unit: string; // "kg", "liters", "pieces"
  reorderLevel: number;
  reorderQuantity: number;
  supplier: string | null;
  lastRestocked: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## WebSocket (real-time kitchen)

`WS /api/websocket`

- Clients join the **"KITCHEN"** room on connect.
- Heartbeat: send `"ping"`, server replies `"pong"`.
- The server broadcasts JSON messages of shape:

```ts
interface WebSocketPayload {
  type: "ORDER_CREATED" | "ORDER_MARKED_COMPLETED";
  payload: unknown; // order data relevant to the event
}
```

Broadcasts are emitted when orders are created (`ORDER_CREATED`) and when orders are marked paid/completed (`ORDER_MARKED_COMPLETED`). Kitchen/display clients should subscribe here to update in real time.

---

## Bookings

### `GET /api/bookings`

List all bookings (includes related `table`).

- **Response:** `Booking[]` (each with `table: Table | null`)

### `POST /api/bookings`

Create a booking.

- **Body:**
  ```ts
  { booking: { customerName: string; customerPhone: string; guestCount: number; bookingTime: string; specialRequest?: string } }
  ```
- **Response:** `Booking`

### `PUT /api/bookings/{booking-id}`

Update a booking's status.

- **Path:** `booking-id: string`
- **Body:** `{ status: BookingStatus }`
- **Response:** `Booking`

---

## Dashboard stats

All require auth. Aggregations are over the last 30 days or the current week/day depending on the endpoint.

### `GET /api/dashboard/stats/popular-items`

- **Response:** `{ name: string; sold_quantity: number }[]`

### `GET /api/dashboard/stats/recent-order`

- **Response:**
  ```ts
  {
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
  [];
  ```

### `GET /api/dashboard/stats/revenue-trend`

- **Response:** revenue series for charting (daily/weekly aggregation).

### `GET /api/dashboard/stats/roster-overview`

- **Query:** `startDate?`, `endDate?` (ISO; default current week)
- **Response:**
  ```ts
  {
    totalStaff: number;
    weeklyShiftCount: number;
    pendingLeaveRequests: number;
    startDate: string;
    endDate: string;
  }
  ```

### `GET /api/dashboard/stats/soldbycategory`

- **Response:** `{ category: string; percentage: number }[]` (sorted desc)

### `GET /api/dashboard/stats/weekly-kpi`

- **Response:**
  ```ts
  {
    revenueCents: number;
    weeklyOrderCount: number;
    todayBookingsCount: number;
    weeklyShiftCostCents: number;
    startofWeek: string;
    endOfWeek: string;
  }
  ```

---

## Leave requests

### `GET /api/leave-requests`

- **Response:** `LeaveRequest[]` (includes `staff`), ordered by `submittedAt` desc

### `POST /api/leave-requests`

- **Body:** `{ staffId: string; startDate: string; endDate: string; reason: string; status?: LeaveStatus }`
- **Response:** `LeaveRequest`

### `PUT /api/leave-requests/{request_id}`

- **Path:** `request_id: string`
- **Body:** `{ status: LeaveStatus }`
- **Response:** `LeaveRequest`

### `DELETE /api/leave-requests/{request_id}`

- **Path:** `request_id: string`
- **Response:** deleted `LeaveRequest`

---

## Menu

### `GET /api/menu`

- **Response:** `MenuItem[]` (includes `options`), ordered by category then name

### `POST /api/menu`

- **Body:**
  ```ts
  { name: string; category: string; priceCents: number; description?: string; imageUrl?: string; isAvailable?: boolean; options?: MenuOption[] }
  ```
- **Side effect:** upserts `MenuCategory` if missing
- **Response:** `{ options: MenuOption[] }`
- **Errors:** `400` if `name`, `category`, or `priceCents` missing

### `PUT /api/menu/{menu_id}`

- **Path:** `menu_id: string`
- **Body:** same as POST (`name`, `category`, `priceCents` required)
- **Response:** updated `MenuItem`

### `DELETE /api/menu/{menu_id}`

- **Path:** `menu_id: string`
- **Response:** deleted `MenuItem`

### `GET /api/menu/category`

- **Response:** `string[]` (category names, asc)

### `POST /api/menu/category`

- **Body:** `{ name: string }`
- **Response:** `{ name: string }`
- **Errors:** `400` if name empty

### `POST /api/menu/menu_item_options`

- **Body:** `{ create_menu_option: { menuItemId: string; name: string; priceCents: number } }`
- **Response:** `MenuOption`

### `PUT /api/menu/menu_item_options/{option_id}`

- **Path:** `option_id: string`
- **Body:** `{ update_menu_option: { name: string; priceCents: number } }`
- **Response:** updated `MenuOption`
- **Errors:** `400` if `name` or `priceCents` missing

### `PATCH /api/menu/update_availability/{menu_item_id}`

- **Path:** `menu_item_id: string`
- **Body:** `{ isAvailable: boolean }`
- **Response:** updated `MenuItem`
- **Errors:** `400` if `isAvailable` not boolean

---

## Orders

Order responses include `table`, `items` (with `menuItem` and `orderItemOptions` → `menuOption`).

### `GET /api/orders`

- **Query:**
  - `range?`: `"all" | "day" | "week" | "month"` (default `all`)
  - `customer?` / `customerName?`: case-insensitive search
- **Response:** `Order[]` ordered by `createdAt` desc

### `GET /api/orders/{order_id}`

- **Path:** `order_id: string`
- **Response:** `Order` (full detail)
- **Errors:** `404` if not found

### `PATCH /api/orders/{order_id}/status`

- **Path:** `order_id: string`
- **Body:** `{ status?: OrderStatus }`
- **Response:** `{ success: true }`

### `GET /api/orders/pending`

- **Response:** `Order[]` where `status = "PENDING"`

### `GET /api/orders/completed`

- **Response:** `Order[]` where `status = "COMPLETED"` in the last 24 hours

### `GET /api/orders/takeaway-unpaid`

- **Response:** `Order[]` where `orderType = "TAKEAWAY"` and `paymentStatus = "UNPAID"`

---

## Order items

All mutations below recompute the parent order's `totalAmountCents`.

### `DELETE /api/orders/items/{item_id}`

- **Response:** `{ success: true }`

### `PATCH /api/orders/items/{item_id}/quantity`

- **Body:** `{ quantity: number }` (integer ≥ 1)
- **Response:** `{ success: true }`

### `PATCH /api/orders/items/{item_id}/special-instructions`

- **Body:** `{ specialInstructions?: string | null }` (trimmed; empty → null)
- **Response:** `{ success: true }`

### `DELETE /api/orders/items/{item_id}/options/{option_id}`

- **Response:** `{ success: true }`

### `PATCH /api/orders/items/{item_id}/options/{option_id}/quantity`

- **Body:** `{ quantity: number }` (integer ≥ 1)
- **Response:** `{ success: true }`

---

## Order checkout

### `GET /api/orders/checkout/table/{session_id}`

Checkout summary for a table session.

- **Path:** `session_id: string`
- **Response:**
  ```ts
  TableSession & {
    orders: Order[];
    summary: {
      orderCount: number;
      payableOrderCount: number;
      paidOrderCount: number;
      payableOrderIds: string[];
      sessionTotalCents: number;
      payableTotalCents: number;
      paidTotalCents: number;
      hasOutstandingBalance: boolean;
    };
  }
  ```

### `GET /api/orders/checkout/table/{table_id}`

Unpaid completed orders for a table.

- **Path:** `table_id: string`
- **Response:** `{ tableId: string; orderCount: number; totalDueCents: number; orders: Order[] }`

### `POST /api/orders/checkout/table/mark-paid`

Mark selected orders as paid and close the session.

- **Body:** `{ tableSessionId: string; orderIds: string[]; paymentMethod: PaymentMethod }`
- **Response:** `{ updatedCount: number; paidAt: string; paymentMethod: PaymentMethod; orderIds: string[] }`
- **Side effects:** sets `paymentStatus="PAID"`, `status="COMPLETED"`, `paidAt`; closes the table session; broadcasts `ORDER_MARKED_COMPLETED`
- **Errors:** `400` if no `orderIds` or no unpaid orders found

### `POST /api/orders/checkout/takeaway/closesales`

Close a takeaway order.

- **Body:** `{ orderId: string; paymentMethod?: PaymentMethod }` (defaults `CASH`)
- **Response:** updated `Order` (full detail)
- **Constraints:** only `TAKEAWAY` orders; cannot re-pay a paid order
- **Side effects:** sets paid/completed; broadcasts `ORDER_MARKED_COMPLETED`

---

## POS orders

### `POST /api/orders/pos/dining`

Create a dining order from the POS.

- **Body:**
  ```ts
  { data: { tableId: string; customerName: string; items: { create: OrderItemCreateInput[] } /* + other order fields */ } }
  ```
- **Response:** `Order` (with items, menuItem, options, table)
- **Side effects:** requires an ACTIVE session for the table; sets `orderType="DINING"`, `paymentStatus="UNPAID"`; generates `checkoutSessionId = "pos_<uuid>"`; broadcasts `ORDER_CREATED`
- **Errors:** `403` if no active table session

### `POST /api/orders/pos/takeaway`

Create a takeaway order from the POS.

- **Body:** same as dining but without `tableId`
- **Response:** `Order`
- **Side effects:** sets `orderType="TAKEAWAY"`, `tableId=null`; broadcasts `ORDER_CREATED`
- **Errors:** `400` if `customerName` or `items` missing

---

## Receipt printing

### `POST /api/print-receipt/{session_id}`

Print a table-session receipt to an ESC/POS thermal printer over TCP.

- **Path:** `session_id: string`
- **Body:** `{ printerIp: string }` (IPv4, optional port, e.g. `"192.168.1.100"` or `"192.168.1.100:9100"`)
- **Response:** `{ ok: boolean; sessionId: string; printerTarget: string; itemCount: number; totalCents: number }`
- **Errors:** `400` missing params · `404` session not found · `503` printer not connected · `500` print failure

---

## Shifts

### `GET /api/shift`

- **Query:** `startDate` (required, ISO), `endDate` (required, ISO)
- **Response:** `Shift[]` (includes `staff`), ordered by date asc

### `POST /api/shift`

- **Body:** `{ staffId: string; date: string; startTime: string; endTime: string; position?: string }`
- **Response:** `{ response: Shift }`

### `POST /api/shift/createmany`

- **Body:** `{ data: Shift[] }`
- **Response:** `{ response: { count: number } }`

### `GET /api/shift/{shiftId}`

- **Response:** `Shift` (includes `staff`)

### `PUT /api/shift/{shiftId}`

- **Body:** partial shift fields (`date`, `startTime`, `endTime`, `position`)
- **Response:** updated `Shift`

### `DELETE /api/shift/{shiftId}`

- **Response:** deleted `Shift`

---

## Staff

### `GET /api/staff`

- **Query:** `staff_name?` (case-insensitive match on firstname/lastName)
- **Response:** `Staff[]` ordered by firstname asc

### `POST /api/staff`

- **Body:** `{ staff: { firstname: string; lastName: string; email: string; phone: string; role: Role; perHourRate: number; employmentType?: EmploymentType; availability?: WeekDay[] } }`
- **Response:** `Staff`

### `GET /api/staff/{staffId}`

- **Path:** `staffId: string`
- **Query:** `startDate?`, `endDate?` (ISO — filter shifts)
- **Response:**
  ```ts
  Staff & { shifts: Shift[]; leaveRequests: LeaveRequest[] /* pending only */ }
  ```

### `PATCH /api/staff/{staffId}`

- **Body:** partial `Staff` fields
- **Response:** updated `Staff`
- **Errors:** `400` on failure

### `DELETE /api/staff/{staffId}`

- **Response:** deleted `Staff`
- **Errors:** `400` if `staffId` missing

### `DELETE /api/staff`

Bulk/alt delete by body.

- **Body:** `{ id?: string; staffId?: string }`
- **Response:** deleted `Staff`
- **Errors:** `400` if no id provided

### `POST /api/staff/upload-profile-picture`

- Stub / not implemented. Profile images are typically uploaded to Cloudinary from the client and the resulting URL saved via `PATCH /api/staff/{staffId}` (`profile_photo_url`).

---

## Stock

### `GET /api/stock`

- **Response:** `StockItem[]` ordered by `createdAt` desc

### `POST /api/stock`

- **Body:** `{ name: string; category?: StockCategory; currentStock?: number; unit: string; reorderLevel: number; reorderQuantity: number; supplier?: string }`
- **Response:** `StockItem`

### `GET /api/stock/{id}`

- **Response:** `StockItem`
- **Errors:** `400` missing id · `404` not found

### `PUT /api/stock/{id}`

- **Body:** `{ currentStock: number }`
- **Response:** updated `StockItem`
- **Errors:** `400` missing id

### `DELETE /api/stock/{id}`

- **Response:** deleted `StockItem`
- **Errors:** `400` missing id

---

## Stripe checkout

Used for QR self-order flow (customer pays via Stripe embedded checkout).

### `POST /api/stripe-checkout`

- **Body:**
  ```ts
  {
    cart_items: {
      itemName: string;
      menuItemId: string;
      unitPrice: number;      // cents
      quantity: number;
      specialInstructions?: string;
    }[];
    table_id: string;
  }
  ```
- **Response:** `{ clientSecret: string }` (Stripe embedded checkout client secret)
- Currency: AUD. `table_id` stored in session metadata.

### `GET /api/stripe-checkout/session-status`

- **Query:** `session_id: string`
- **Response (complete):** `{ order: Order; customerDetails: { email: string | null; name: string } }`
- **Response (open):** `{ status: string; checkoutUrl: string }`
- **Side effects (on completion):** creates `Order` (paid/completed, `paymentMethod="STRIPE_QR"`), broadcasts `ORDER_CREATED`, dedupes by `checkoutSessionId`
- **Errors:** `409` order already created · `410` session expired · `500` order creation failure

---

## Table sessions

Session responses include `table` and `orders` (with items and options).

### `GET /api/table-sessions`

- **Query:** `status?`: `"ACTIVE" | "CLOSED"` · `table?`: case-insensitive table number search
- **Response:** `TableSessionWithOrders[]` ordered by `openedAt` desc

### `POST /api/table-sessions/create`

Get-or-create the active session for a table.

- **Body:** `{ tableId: string }`
- **Response:** `{ id: string; tableId: string; status: "ACTIVE" }`
- **Errors:** `400` if `tableId` missing

### `GET /api/table-sessions/{session_id}`

- **Response:** `TableSessionWithOrders`
- **Errors:** `400` missing id · `404` not found

### `GET /api/table-sessions/active/{table_id}`

- **Response:** `TableSessionWithOrders` (most recent active)
- **Errors:** `400` missing id · `404` no active session

---

## Tables

### `GET /api/tables`

- **Response:** `(Table & { sessions: { id: string; openedAt: string }[] })[]` (ACTIVE sessions only), ordered by number asc

### `POST /api/tables`

- **Body:** `{ table_number: string; capacity: number }`
- **Response:** `Table`
- **Errors:** `409` if table number already exists

### `PUT /api/tables`

- **Body:** `{ table_id: string; capacity?: number; layoutX?: number; layoutY?: number }` (at least one updatable field required)
- **Response:** updated `Table`
- **Errors:** `400` missing id / no fields · `500` table not found

### `GET /api/tables/{table_id}`

- **Response:** `Table`
- **Errors:** `400` missing id · `404` not found

### `DELETE /api/tables/{table_id}`

- **Response:** deleted `Table`

---

## Vapi booking tool

Machine-to-machine endpoints used by the Vapi voice assistant.

### `GET /api/vapi-booking-tool`

- **Response:** `Booking[]` (includes `table`) — context for the assistant

### `POST /api/vapi-booking-tool`

- **Body:**
  ```ts
  {
    message: {
      toolCallList: {
        id: string;
        function: {
          arguments: {
            guestCount: number;
            bookingTime: string;      // ISO
            customerName: string;
            customerPhone: string;
            specialRequest?: string;
          };
        };
      }[];
    };
  }
  ```
- **Response:** `{ results: { toolCallId: string; result: string }[] }`
- **Side effect:** creates a `Booking`. Errors are returned in the body rather than thrown.

---

## AI agents

### `POST /api/restoquick-agent`

Streaming chat agent (OpenAI Agents framework with image-generation and web-search tools).

- **Body:** `{ messages: { id: string; role: "user" | "assistant"; content: string }[] }`
- **Response:** server-sent text stream (`text/plain`)
- **Errors:** `400` if `messages` missing/empty

### `POST /api/roster-agent`

AI roster generation.

- **Body:** `{ message?: string }`
- **Response:**
  ```ts
  {
    shifts: {
      staffId: string;
      date: string;
      startTime: string;
      endTime: string;
      position: string;
    }
    [];
    assistantMessage: {
      content: string;
      caution: string;
    }
  }
  ```
- The returned `shifts` array can be fed directly into `POST /api/shift/createmany`.

---

## Error codes

| Code | Meaning                                                   |
| ---- | --------------------------------------------------------- |
| 400  | Bad request — invalid/missing params                      |
| 401  | Unauthorized — auth required                              |
| 403  | Forbidden — e.g. no active table session                  |
| 404  | Not found                                                 |
| 409  | Conflict — duplicate table number / order already created |
| 410  | Gone — checkout session expired                           |
| 500  | Internal server error                                     |
| 503  | Service unavailable — printer not connected               |

Errors are returned via Nitro's `createError`, typically as:

```json
{ "statusCode": 400, "statusMessage": "Reason", "message": "Details" }
```
