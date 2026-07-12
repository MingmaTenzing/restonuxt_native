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
4. Read **`web-app-reference/`** when implementing or porting a feature — local gitignored clone of the Nuxt web app; mirror its API usage, types, and screen behavior (keep native code simple; no normalization layers).

## Web app reference (`web-app-reference/`)

The Nuxt dashboard is the behavioral reference for this native client. It lives in **`web-app-reference/`** at the repo root, is **gitignored**, and is not shipped with the app.

Set it up once (pick one):

```bash
# Symlink if you already have the repo as a sibling folder
ln -s ../RestoQuick_Nuxt web-app-reference

# Or clone into the project root
git clone https://github.com/MingmaTenzing/RestoQuick_Nuxt.git web-app-reference
```

When building a native screen, check the matching Nuxt page/composable first — e.g. `web-app-reference/app/pages/Dashboard/orders/` for orders, `web-app-reference/server/api/` for exact response shapes, `web-app-reference/app/composables/` for data-fetch patterns. Port UI to React Native; copy API contracts as-is (`useFetch<T>` → `api<T>`).

## Code conventions

- **Keep it simple** — match the RestoQuick Nuxt app and API: use typed responses directly (`api<TableSession[]>(...)`), `unwrapList` only when an endpoint may wrap an array, and small inline maps for UI-only shapes. Do not add normalization layers, snake_case/camelCase adapters, or defensive reshaping unless the API contract is genuinely inconsistent. Simpler is better; never overcomplicate straightforward data fetching.
- **Minimize scope** — smallest correct diff; no drive-by refactors.
- **Match existing patterns** in the file and feature folder before inventing new abstractions. When in doubt, read the equivalent feature in **`web-app-reference/`** and existing simple screens like `orders/` and `cashier/api.ts`.
- **Routes vs screens** — `src/app/*.tsx` should re-export or thinly compose `src/screens/*`; keep business logic out of `app/`.
- **Data fetching** — React Query for server state; read `native-data-fetching` skill for fetch/auth/error patterns.
- **UI** — NativeWind (`className`); read `building-native-ui` for navigation, tabs, scroll views, and platform patterns.
- **Auth** — Clerk via `@clerk/expo`; token cache in `expo-secure-store`.
- **Tests** — Bun test runner; colocate `*.test.ts` next to the module. Run `bun test` after logic changes.
- **Env** — `EXPO_PUBLIC_*` for client config (Clerk key, API base URL). Never commit secrets.

## Key files

| File | Purpose |
|------|---------|
| `RESTOQUICK_DOC.md` | Platform docs: architecture, data flows, API reference, native app guide |
| `web-app-reference/` | Local gitignored Nuxt web app — reference for API usage, types, and feature parity |
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
