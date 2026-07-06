# Folder Structure

Always follow this structure. **Before creating any screen, component, hook, or utility, look here first** and place the file in the correct location.

```
├── assets/
├── scripts/
├── src/
│   ├── app/                        # Expo Router routes ONLY (thin files)
│   │   ├── api/                    # API routes in a separate folder
│   │   │   ├── event+api.ts
│   │   │   └── user+api.ts
│   │   ├── _layout.tsx
│   │   ├── _layout.web.tsx         # separate layout file for web
│   │   ├── index.tsx
│   │   ├── events.tsx
│   │   └── settings.tsx
│   ├── components/                 # REUSABLE components (used by 2+ screens)
│   │   ├── table/
│   │   │   ├── cell.tsx
│   │   │   └── index.tsx
│   │   ├── bar-chart.tsx
│   │   ├── bar-chart.web.tsx        # separate components for web and native
│   │   └── button.tsx
│   ├── screens/                    # Screen implementations (rendered from app/)
│   │   ├── home/
│   │   │   ├── card.tsx            # component only used in the home page
│   │   │   └── index.tsx           # returned from /src/app/index.tsx
│   │   ├── events.tsx              # returned from /src/app/events.tsx
│   │   └── settings.tsx            # returned from /src/app/settings.tsx
│   ├── server/                     # code used in /api
│   │   ├── auth.ts
│   │   └── db.ts
│   ├── utils/                      # reusable utilities
│   │   ├── format-date.ts
│   │   ├── format-date.test.ts      # unit test next to the file being tested
│   │   └── pluralize.ts
│   ├── hooks/
│   │   ├── use-app-state.ts
│   │   └── use-theme.ts
├── app.json
├── eas.json
└── package.json
```

## Rules

- **Routes (`src/app/`)** are thin: a route file should only re-export a screen,
  e.g. `export { default } from '@/screens/bookings';`. No business logic here.
- **Screens (`src/screens/`)** hold the page implementation. If a screen has private
  components used ONLY by that screen, put them in a folder named after the screen
  with an `index.tsx` entry (see `screens/home/`). Example:
  ```
  screens/bookings/
    index.tsx              # the screen
    booking-card.tsx       # private, only used by bookings
    add-booking-modal.tsx  # private, only used by bookings
    types.ts               # shared types for the feature
  ```
- **Components (`src/components/`)** are for REUSABLE UI shared across 2+ screens
  (e.g. `button`, `text-field`, `date-time-field`). If a component is only used by
  one screen, keep it under that screen's folder instead.
- **Platform splits**: use `.web.tsx` / `.ios.tsx` / `.android.tsx` extensions for
  components and layouts. Never use platform extensions on route files in `src/app/`.
- **Utilities (`src/utils/`)** are pure, reusable helpers. Co-locate tests as `*.test.ts`.
- **Hooks (`src/hooks/`)** are reusable hooks. Screen-specific hooks live with the screen.
- **Naming**: files are kebab-case (`add-booking-modal.tsx`, `use-theme.ts`).
- **Imports**: use the `@/` alias (maps to `src/`), e.g. `@/components/button`.
