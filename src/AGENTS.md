# App source (`src/`)

Conventions for routes, screens, and feature code in this Expo Router app.

## Layering

| Layer     | Location                                      | Responsibility                                                    |
| --------- | --------------------------------------------- | ----------------------------------------------------------------- |
| Routes    | `src/app/`                                    | URL mapping, layouts, thin re-exports                             |
| Screens   | `src/screens/<feature>/`                      | UI, local state, feature hooks                                    |
| Shared    | `src/components/`, `src/hooks/`, `src/utils/` | Cross-feature reuse                                               |
| API types | `src/screens/<feature>/types.ts`              | Request/response shapes aligned with `RESTOQUICK_DOC.md` (Part 2) |
| API calls | `src/screens/<feature>/api.ts` or hooks       | fetch / React Query                                               |

**Anti-pattern:** putting components, types, or helpers inside `src/app/`.

## Routes

- Tab screens: `src/app/(tabs)/<name>.tsx` → usually `export { default } from '@/screens/<name>'` or similar.
- Native tabs layout: `src/app/(tabs)/_layout.tsx` uses `NativeTabs` (SDK 56).
- Web tab override: `_layout.web.tsx` when needed.
- Dynamic routes: `src/app/order/[id].tsx` for detail views.

## Screens by feature

| Folder                      | Tab / route     | Notes                             |
| --------------------------- | --------------- | --------------------------------- |
| `dashboard/`                | index           | Stats, user actions               |
| `bookings/`                 | bookings        | CRUD, stats row                   |
| `kitchen/`                  | kitchen         | WebSocket queue, real-time orders |
| `menu/`                     | menu            | Items, options, forms             |
| `orders/`                   | orders          | List, search, stats               |
| `sessions/`                 | sessions        | Table sessions                    |
| `tables/`                   | tables          | Floor plan / table CRUD           |
| `agent/`                    | agent           | Streaming chat (`POST /api/restoquick-agent`) |
| `staff.tsx`, `settings.tsx` | respective tabs | Top-level screen files            |

## Data and auth

- Base URL: `process.env.EXPO_PUBLIC_API_BASE_URL`
- Attach Clerk session token on API requests (see existing screen patterns and `native-data-fetching` skill).
- **API responses are camelCase** (Prisma/Nitro) — type them and use them directly, like the Nuxt web app in **`RestoQuick_Nuxt_Web/`** does with `useFetch<T>`. Prefer `api<Order[]>(...)` or `unwrapList<T>(payload)` over `normalize*` helpers. Map to a display shape inline only when the UI needs it (e.g. chart labels).
- When adding a feature, read the Nuxt page (`RestoQuick_Nuxt_Web/app/pages/Dashboard/`), composable (`app/composables/`), and API handler (`server/api/`) first — mirror data flow, cart/CRUD logic, and state patterns before writing native code.
- Kitchen WebSocket: `src/hooks/kitchen-websocket-client.ts` + `src/utils/websocket-url.ts` (see `RESTOQUICK_DOC.md` → Kitchen display flow)

## Testing

**Required on every change** that adds or alters behavior — see root [`AGENTS.md`](../AGENTS.md) → Testing.

- Pure logic: `*.test.ts` next to the module (`kitchen/apply-kitchen-event.test.ts`, `utils/format-date.test.ts`).
- Fixtures: `src/test/`
- Run: `bun test` (or the feature folder) before considering work done

## Styling

- NativeWind `className` on React Native components.
- Use `contentInsetAdjustmentBehavior="automatic"` on scroll views instead of wrapping everything in `SafeAreaView`.
- Semantic colors and dark mode: follow patterns in existing screens.
