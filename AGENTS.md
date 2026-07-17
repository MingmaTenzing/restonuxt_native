# AGENTS.md

Native mobile client for **RestoQuick** — a restaurant management app backed by a Nuxt/Nitro API. Built with **Expo SDK 56**, **Expo Router**, **NativeWind**, **Clerk**, and **TanStack React Query**. Package manager: **Bun**.

## Commands

```bash
bun install              # install dependencies
bun start                # expo start (Expo Go or dev client)
bun run ios              # native iOS build (requires ios/ from prebuild)
bun run android          # native Android build
bun test                 # run unit tests (Bun test runner)
bun run lint             # eslint + prettier check
bun run format           # eslint fix + prettier write
npx expo-doctor          # verify SDK / dependency health
npx expo install --fix   # align deps to installed Expo SDK
```

After changing native dependencies or Expo SDK version:

```bash
rm -rf ios/Pods ios/Podfile.lock ios/build && npx pod-install   # iOS only
```

## Project structure

```
src/
  app/           # Expo Router routes only — no components, types, or utils here
  screens/       # Screen UI and feature logic (bookings, kitchen, menu, orders, …)
  components/    # Shared UI components
  hooks/         # Shared React hooks (e.g. kitchen WebSocket)
  utils/         # Pure helpers (formatting, URLs, …)
  server/        # Server-side helpers used by API routes (auth, db)
  test/          # Test fixtures and setup
```

- Routes live under `src/app/(tabs)/` for the main tab shell and `src/app/` for stacks/modals.
- Use `@/*` path aliases (`@/screens/...`, `@/components/...`).
- File names: **kebab-case** (`kitchen-order-card.tsx`).
- Platform overrides: `*.web.tsx` when web behavior differs.

## Before implementing

Follow `.cursor/rules/expo-first.mdc` on every task:

1. Read the relevant skill from `.agents/skills/` — see [`.agents/skills/README.md`](.agents/skills/README.md) for the catalog.
2. Use **Expo MCP** (`user-expo`): `GetMcpTools` → `CallMcpTool` for docs, `add_library`, builds.
3. Read **`RESTOQUICK_DOC.md`** for architecture, data flows, HTTP API, WebSocket, enums, and auth — it is the single source of truth for RestoQuick.
4. Read **`RestoQuick_Nuxt_Web/`** when implementing or porting a feature — local gitignored clone of the Nuxt web app. Mirror its **logic** (data flow, cart, CRUD, state), API usage, types, and screen behavior. Port behavior to React Native; do not copy Vue/Nuxt internals.

## Web app reference (`RestoQuick_Nuxt_Web/`)

The Nuxt dashboard is the **behavioral and logic reference** for this native client. It lives in **`RestoQuick_Nuxt_Web/`** at the repo root, is **gitignored**, and is not shipped with the app.

Set it up once (pick one):

```bash
# Clone into the project root (preferred name)
git clone https://github.com/MingmaTenzing/RestoQuick_Nuxt.git RestoQuick_Nuxt_Web

# Or symlink if you already have the repo elsewhere
ln -s ../RestoQuick_Nuxt RestoQuick_Nuxt_Web
```

### What to read before writing native code

Use the web app to understand **how a feature works end-to-end**, not just which endpoints exist. Check these locations in order:

| Concern | Where in `RestoQuick_Nuxt_Web/` |
| -------- | -------------------------------- |
| Screen flow & UI actions | `app/pages/Dashboard/<feature>/` |
| Business logic & local state | `app/composables/` (e.g. `useOrderCart.ts`, `useKitchenWebSocket.ts`) |
| Feature-specific components | `app/components/<feature>_components/` |
| API contracts & response shapes | `server/api/` |
| Shared client helpers | `app/client_utils/`, `app/lib/` |

### Logic to mirror (not Vue patterns)

- **Data flow** — follow how a page loads data, reacts to user actions, and refreshes after mutations. Map Nuxt `useFetch` / `$fetch` to native `api<T>()` + React Query (`useQuery`, `useMutation`, `invalidateQueries`).
- **Cart & POS** — `app/composables/useOrderCart.ts`, `app/pages/Dashboard/pos/`, `app/components/pos_components/` for add/remove items, totals, modifiers, and checkout flow.
- **CRUD** — match create/update/delete sequences in the matching Dashboard page and its composable before writing native forms or list actions (bookings, menu, tables, staff, etc.).
- **State management** — Nuxt composables (`ref`, `computed`, shared composable state) → React Query for server state + `useState` / module-level helpers / small hooks for UI-only state (e.g. cart lines, filters, modals). Do not introduce Redux or other global stores unless the web app does.
- **Real-time** — `useKitchenWebSocket.ts` and related composables for WebSocket event handling; align with `src/hooks/use-kitchen-websocket.ts`.
- **Auth & org context** — how the web app attaches Clerk tokens and scopes requests to the current restaurant.

Port UI to React Native; copy API contracts and business rules as-is (`useFetch<T>` → `api<T>`). Keep native code simple — no normalization layers.

## Code conventions

### Simpler is better (all logic)

This applies to **everything you write** — screens, flows, cart/CRUD, session guards, helpers, hooks, UI state — not just networking.

1. **Do the easy thing first.** If the Nuxt web app or an existing native screen does it in a few lines, match that. Do not design a framework for a one-screen problem.
2. **Inline before abstracting.** Prefer a clear `if` / early return in the screen over new `resolveX` / `applyY` / state-machine helpers unless the same rule is reused or unit-tested in multiple places.
3. **No speculative architecture.** No extra layers, adapters, sync engines, or “future-proof” indirection. Add a helper only when duplication or a test genuinely needs it.
4. **Mirror the web app’s shape.** Port the same steps and API calls; do not invent a more complex native lifecycle around them.
5. **Follow Expo skills / MCP patterns** for Router, React Query, Clerk, and UI — official simple patterns beat custom machinery.

When choosing between two correct approaches, pick the shorter, more obvious one.

### Practical rules

- **API data** — use typed responses directly (`api<TableSession[]>(...)`), `unwrapList` only when an endpoint may wrap an array, small inline maps for UI-only shapes. No normalization layers or case adapters unless the API is inconsistent.
- **Data fetching** — React Query (`useQuery` / `useMutation` / `invalidateQueries`). Screen refresh: `useFocusEffect` + `refetch()` with **stable deps** (`isReady`, `refetch`) — do not put changing UI state in those deps.
- **Minimize scope** — smallest correct diff; no drive-by refactors.
- **Match existing patterns** in the feature folder and **`RestoQuick_Nuxt_Web/`** (see simple screens like `orders/`, `cashier/api.ts`).
- **Routes vs screens** — `src/app/*.tsx` re-exports `src/screens/*`; keep business logic out of `app/`.
- **UI** — NativeWind (`className`); `building-native-ui` for navigation / tabs / scroll.
- **Auth** — Clerk via `@clerk/expo`; token cache in `expo-secure-store`.
- **Env** — `EXPO_PUBLIC_*` for client config. Never commit secrets.

## Testing (required on every change)

**Write and run tests for everything you implement, fix, or change.** Do not consider a task done until tests cover the new behavior and `bun test` passes.

- **Always** — for new modules, helpers, API mappers, cart/CRUD logic, flow guards, hooks with pure logic, and bug fixes: add or update colocated `*.test.ts` next to the module (e.g. `cart.test.ts`, `pos-flow.test.ts`, `api.test.ts`).
- **What to cover** — happy path, edge cases, and regressions that match the web app’s rules (merge keys, totals, submit blockers, session/table guards, payload shapes).
- **Fixtures** — put shared fixtures under `src/test/`; keep feature-specific samples in the feature’s test file when small.
- **Run** — after every logic change, run at least the affected suite (`bun test src/screens/<feature>/`) and prefer `bun test` before finishing.
- **UI-only tweaks** — pure layout/className changes need no new tests; if behavior or data flow changes, tests are required.
- **Do not skip** — do not ship untested business logic, API contracts, or state mutations. Prefer extracting pure functions so they are easy to unit test.

## Key files

| File | Purpose |
|------|---------|
| `RESTOQUICK_DOC.md` | Platform docs: architecture, data flows, API reference, native app guide |
| `RestoQuick_Nuxt_Web/` | Local gitignored Nuxt web app — reference for data flow, cart/CRUD logic, state, API usage, and feature parity |
| `app.json` | Expo config and plugins |
| `src/app/(tabs)/_layout.tsx` | Native tab navigation (`NativeTabs`) |
| `src/hooks/use-kitchen-websocket.ts` | Kitchen real-time updates |
| `src/screens/kitchen/` | Kitchen queue, WebSocket event handling |

## Runtime targets

- **SDK 56** — requires matching Expo Go or a dev build (`expo-dev-client`).
- **iOS** — `ios/` exists (prebuild); use dev client for full native feature set.
- **Web** — supported via Expo Router; some screens have `.web.tsx` overrides.

## Boundaries

- Do **not** create git commits or PRs unless the user asks.
- Do **not** downgrade SDK or remove `NativeTabs` / `@expo/ui` without explicit request.
- Do **not** edit `RESTOQUICK_DOC.md` from this repo unless syncing platform docs is requested.
- Prefer official Expo / Clerk patterns from skills and MCP over general web React habits.

## More context

- Skill catalog: [`.agents/skills/README.md`](.agents/skills/README.md)
- App code conventions: [`src/AGENTS.md`](src/AGENTS.md)
