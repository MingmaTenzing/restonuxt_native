# RestoQuick Native

Expo client for **RestoQuick** — the restaurant operations app for floor staff, kitchen, and front desk.

It talks to the same Nuxt/Nitro API as the web dashboard: POS dining & takeaway, live kitchen queue, cashier checkout with thermal receipts, bookings, roster, stock, and more.

| | |
| --- | --- |
| **Platform** | iOS · Android · Web (Expo Router) |
| **SDK** | Expo 57 |
| **Auth** | Clerk (`@clerk/expo`) |
| **Data** | TanStack React Query + typed `api()` client |
| **UI** | NativeWind · `@expo/ui` Native Tabs |
| **Package manager** | Bun |

---

## Features

| Area | What it does |
| --- | --- |
| **Dashboard** | Day overview and quick actions |
| **POS** | Table sessions, dining & takeaway carts, modifiers, submit to kitchen |
| **Kitchen** | Real-time pending queue over WebSocket; complete / recall |
| **Cashier** | Active tables & unpaid takeaway; Closed + Paid takeaway history; collect payment; thermal print; undo mistaken payments |
| **Orders** | Search and inspect order detail |
| **Menu / Tables / Sessions** | CRUD and floor session management |
| **Bookings** | Reservations pipeline |
| **Staff / Roster** | Team directory and weekly shifts / leave |
| **Stock** | Inventory, restock, QR labels, camera scan |
| **Agent** | Streaming RestoQuick assistant chat |
| **Settings** | Account + default thermal printer IP |

Receipt printing sends ESC/POS over Wi‑Fi TCP from the device (default port `9100`). Print and undo live on **Cashier** checkout — not on session detail.

---

## Quick start

### Requirements

- [Bun](https://bun.sh)
- Node-compatible Expo toolchain (`npx expo`)
- Xcode (iOS) and/or Android Studio for native builds
- A RestoQuick API base URL and Clerk publishable key

### Install

```bash
bun install
```

### Environment

Create a `.env` in the repo root:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_BASE_URL=https://your-restoquick-api.example.com

# Optional — menu / staff image uploads
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=...
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

Only `EXPO_PUBLIC_*` values are available in the client bundle. Never put server secrets here.

### Run

```bash
bun start          # Expo dev server (Expo Go or dev client)
bun run ios        # native iOS (needs ios/ from prebuild)
bun run android    # native Android
bun run web        # web
```

Prefer **Expo Go** first. Use a **dev client** (`expo-dev-client`) when you need native modules that Go doesn’t include (e.g. TCP thermal printing).

After changing native deps or the Expo SDK:

```bash
npx expo install --fix
rm -rf ios/Pods ios/Podfile.lock ios/build && npx pod-install   # iOS
```

---

## Scripts

| Command | Purpose |
| --- | --- |
| `bun start` | Start Expo |
| `bun run ios` / `bun run android` | Native run |
| `bun test` | Unit tests (Bun) |
| `bun run lint` | ESLint + Prettier check |
| `bun run format` | Auto-fix |
| `npx expo-doctor` | SDK / dependency health |

---

## Project layout

```
src/
  app/           # Expo Router routes only (tabs, stacks, modals)
  screens/       # Feature UI + logic (cashier, pos, kitchen, …)
  components/    # Shared UI
  hooks/         # Shared hooks (API, kitchen WebSocket, layout)
  utils/         # Pure helpers (api client, money, layout)
  test/          # Fixtures and test setup
```

- Path alias: `@/*` → `src/*`
- Files: **kebab-case** (`checkout-balance-bar.tsx`)
- Routes re-export screens; keep business logic out of `src/app/`

Agent / contributor conventions: [`AGENTS.md`](./AGENTS.md) and [`src/AGENTS.md`](./src/AGENTS.md).

---

## Architecture notes

**API** — All HTTP goes through `api<T>()` with the Clerk session token. Responses are used as typed camelCase shapes (same contracts as the Nuxt app). React Query owns server state; screens use `useQuery` / `useMutation` / `invalidateQueries`.

**Kitchen** — Initial load from `GET /api/orders/pending`, then live updates on `WS /api/websocket`. See `src/hooks/use-kitchen-websocket.ts` and `RESTOQUICK_DOC.md`.

**Cashier** — Table checkout is keyed by **table session id**. Undoing a paid table sale marks that session’s orders unpaid and **does not reopen** the session, so a new ACTIVE session can still take orders on the same table.

**POS** — Dining requires an ACTIVE table session (`POST /api/table-sessions/create` / active lookup) before submit.

**Platform truth** — [`RESTOQUICK_DOC.md`](./RESTOQUICK_DOC.md) is the API / flow reference. Optionally clone the web app locally as `RestoQuick_Nuxt_Web/` (gitignored) when porting behavior:

```bash
git clone https://github.com/MingmaTenzing/RestoQuick_Nuxt.git RestoQuick_Nuxt_Web
# or: ln -s ../RestoQuick_Nuxt RestoQuick_Nuxt_Web
```

---

## Testing

Tests are colocated next to the code they cover (`*.test.ts`) and run with Bun:

```bash
bun test
bun test src/screens/cashier/
```

Logic that gates checkout, cart merge, session guards, receipt payloads, and undo rules should have unit coverage. Pure layout/className tweaks don’t need new tests.

---

## Related repos

| Repo | Role |
| --- | --- |
| [RestoQuick_Nuxt](https://github.com/MingmaTenzing/RestoQuick_Nuxt) | Web dashboard + Nitro API |
| This repo | Native Expo client |

---

## License

Private — all rights reserved.
