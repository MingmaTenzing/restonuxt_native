# Agent skills catalog

Read the **`SKILL.md`** inside a folder before working in that area. Paths are relative to `.agents/skills/`.

## Daily development (this app)

| Skill | Use when |
|-------|----------|
| [building-native-ui](./building-native-ui/SKILL.md) | Routes, navigation, NativeTabs, styling, scroll views, animations, headers |
| [native-data-fetching](./native-data-fetching/SKILL.md) | fetch, React Query, API errors, caching, loaders |
| [frontend-design](./frontend-design/SKILL.md) | Visual polish, typography, intentional UI direction |
| [expo-ui](./expo-ui/SKILL.md) | `@expo/ui` SwiftUI / Jetpack Compose / community components |
| [expo-tailwind-setup](./expo-tailwind-setup/SKILL.md) | NativeWind / Tailwind configuration |

## Authentication (Clerk)

| Skill | Use when |
|-------|----------|
| [clerk](./clerk/SKILL.md) | Router skill — pick the right Clerk sub-skill |
| [clerk-setup](./clerk-setup/SKILL.md) | Initial Clerk + Expo setup |
| [clerk-custom-ui](./clerk-custom-ui/SKILL.md) | Custom sign-in/up, appearance, themes |
| [clerk-cli](./clerk-cli/SKILL.md) | Clerk CLI, env keys, deploy verification |
| [clerk-backend-api](./clerk-backend-api/SKILL.md) | Clerk Backend REST API exploration |

## Build, deploy, and CI

| Skill | Use when |
|-------|----------|
| [expo-dev-client](./expo-dev-client/SKILL.md) | Local dev builds, custom native code |
| [expo-deployment](./expo-deployment/SKILL.md) | EAS Build, App Store, Play Store, TestFlight |
| [expo-cicd-workflows](./expo-cicd-workflows/SKILL.md) | `.eas/workflows/` YAML, CI pipelines |
| [eas-simulator](./eas-simulator/SKILL.md) | Cloud iOS/Android simulators via EAS |
| [eas-update-insights](./eas-update-insights/SKILL.md) | OTA update health and rollout metrics |
| [expo-observe](./expo-observe/SKILL.md) | EAS Observe metrics, TTR/TTI, route events |

## SDK and platform

| Skill | Use when |
|-------|----------|
| [upgrading-expo](./upgrading-expo/SKILL.md) | SDK upgrades/downgrades, dependency fixes, breaking changes |
| [expo-examples](./expo-examples/SKILL.md) | Official `expo/examples` patterns for integrations |
| [expo-module](./expo-module/SKILL.md) | Custom Expo native modules |
| [expo-brownfield](./expo-brownfield/SKILL.md) | Embedding Expo in existing native apps |
| [web-to-native](./web-to-native/SKILL.md) | Migrating web React apps to native |
| [use-dom](./use-dom/SKILL.md) | Expo DOM components (webview on native) |
| [add-app-clip](./add-app-clip/SKILL.md) | iOS App Clip target |

## Specialized

| Skill | Use when |
|-------|----------|
| [expo-api-routes](./expo-api-routes/SKILL.md) | Expo Router API routes + EAS Hosting |
| [expo-skill-eval](./expo-skill-eval/SKILL.md) | Evaluating skill quality with device screenshots |

## Platform documentation (this repo)

Not a skill — use root **`RESTOQUICK_DOC.md`** for:

- **Part 1** — architecture, data flows, order lifecycle, feature flows, native app guide
- **Part 2** — HTTP routes, request/response shapes, enums, WebSocket events

Pair with **native-data-fetching** for client implementation.

## Expo MCP (always available)

Discover via `GetMcpTools` on server `user-expo`:

| Tool | Purpose |
|------|---------|
| `read_documentation` | Official Expo docs |
| `add_library` | Install Expo-compatible packages |
| `build_*`, `workflow_*` | EAS builds and workflows |

## Adding or updating skills

- One folder per skill, entry point **`SKILL.md`** with YAML frontmatter (`name`, `description`).
- Put long reference material in `references/`, not in `SKILL.md`.
- After adding a skill, update this catalog and mention it in root `AGENTS.md` if it is commonly used.
