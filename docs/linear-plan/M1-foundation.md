# Milestone 1: Foundation & Infrastructure

## Milestone Details (for Linear)

- **Title:** M1 — Foundation & Infrastructure
- **Description:** Set up the Expo project from scratch, configure all core tooling (Expo Router, NativeWind, WatermelonDB, MMKV, Zustand, Sentry), establish the modular directory structure, build the shared UI component library, and configure EAS Build for dev builds on physical device. This milestone produces the app shell that every subsequent feature builds on.
- **Why first:** Every feature depends on the app shell, database, navigation, and UI primitives existing.
- **Definition of Done:**
  - App boots on physical Honor 90 via EAS dev build
  - Expo Router navigation works (tabs + push screens)
  - NativeWind theme system works (light/dark toggle)
  - WatermelonDB initializes with the full schema (7 tables)
  - MMKV reads/writes key-value pairs
  - Zustand UI store exists with basic state
  - Sentry captures errors
  - Shared UI primitives exist (Button, Card, Input, Text, BottomSheet)
  - Directory structure matches the architecture spec

---

## Parent Issue: Expo Project Init & Core Configuration

**Description:** Initialize a fresh Expo project, configure TypeScript strict mode, establish the modular directory structure per the architecture spec, and set up path aliases for clean imports.

### Issues:

---

**Title:** Initialize Expo Project with Latest Stable SDK

**Label:** `Config / Build`

**Parent Issue:** Expo Project Init & Core Configuration

**Dependencies:** None — this is the first task in the project.

---

**Description:**

This is the first task for the Kasya native rebuild. Kasya is a local-first personal finance tracking app being rebuilt from scratch with Expo + React Native, targeting Android first. The app is owned by r3stack.

Create a new Expo project using `create-expo-app` with the **latest stable Expo SDK**. The project must use TypeScript in strict mode.

**What to do:**

1. Run `npx create-expo-app@latest kasya --template blank-typescript` (or the equivalent command for the latest SDK). If the `kasya` directory already exists, initialize inside it.
2. Configure `tsconfig.json` with `"strict": true`
3. Configure `app.json` with these exact values:
   - `name`: `"Kasya"`
   - `slug`: `"kasya"`
   - `scheme`: `"kasya"`
   - `orientation`: `"portrait"`
   - `newArchEnabled`: `true`
   - `userInterfaceStyle`: `"automatic"`
   - `android.package`: `"com.r3stack.kasya"`
   - `android.edgeToEdgeEnabled`: `true`
   - `android.adaptiveIcon`: leave placeholder slots for foreground/background/monochrome images
   - `owner`: `"r3stack"`
4. **Delete all starter/template code** — remove example screens, example components, any default tab navigator, any placeholder content. The app should render a single blank screen with a `<Text>Hello Kasya</Text>` placeholder.
5. Verify the project runs: `npx expo start` should launch without errors

**Do NOT:**
- Pin to Expo SDK 52 — it's outdated. Use whatever the latest stable SDK is at the time of execution.
- Add any dependencies beyond what `create-expo-app` provides. Dependencies are added in subsequent issues.
- Create any directory structure beyond what Expo generates. That's a separate issue (KV2-102).

**Acceptance Criteria:**
- [ ] Project created with latest stable Expo SDK
- [ ] `tsconfig.json` has `strict: true`
- [ ] `app.json` has all config values listed above, including `com.r3stack.kasya` as Android package and `r3stack` as owner
- [ ] All starter/template code removed — only a blank placeholder screen remains
- [ ] `npx expo start` runs without errors

---

**Title:** Establish Modular Directory Structure

**Label:** `Chore`

**Parent Issue:** Expo Project Init & Core Configuration

**Dependencies:** KV2-101 (Initialize Expo Project) must be completed first.

---

**Description:**

Kasya uses a modular domain-based architecture. This task creates the full directory structure inside `src/` so all subsequent tasks have a clear place to put their code. Every folder should exist with a placeholder `index.ts` barrel file where appropriate.

**What to do:**

Create the following directories and files inside the project root:

```
src/
├── components/
│   ├── ui/
│   │   └── index.ts              # barrel: export all UI primitives
│   └── shared/
│       └── index.ts              # barrel: export all shared components
├── database/
│   └── models/
├── features/
│   ├── wallet/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── transaction/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── category/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── budget/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── bill/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── commitment/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── onboarding/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── settings/
│   │   ├── components/
│   │   └── hooks/
│   └── backup/
│       └── services/
├── stores/
├── hooks/
├── lib/
├── constants/
├── types/
│   └── index.ts                  # barrel: export all global types
└── utils/
```

Each barrel `index.ts` should be an empty file with a comment like `// barrel file — exports will be added as components are created`.

Also move the Expo Router `app/` directory into `src/app/` if it isn't there already. Update `package.json` main entry and any Expo Router config to point to the new location. If Expo Router requires `app/` at the project root, leave it there and document that `app/` is the only code directory outside `src/`.

**Do NOT:**
- Create any actual component, hook, or service files — those are created in their respective issues.
- Add any dependencies.
- Change the Expo Router file structure beyond moving it if needed.

**Acceptance Criteria:**
- [ ] All directories listed above exist
- [ ] Barrel `index.ts` files exist in: `components/ui/`, `components/shared/`, `types/`
- [ ] Project still compiles without errors after directory creation
- [ ] Directory structure matches the architecture spec from `00-project-overview.md`

---

**Title:** Configure Path Aliases

**Label:** `Config / Build`

**Parent Issue:** Expo Project Init & Core Configuration

**Dependencies:** KV2-102 (Modular Directory Structure) must be completed first.

---

**Description:**

Kasya uses path aliases so imports are clean (`@/features/wallet/...` instead of `../../../features/wallet/...`). This task configures both TypeScript and the Metro bundler to resolve these aliases.

**What to do:**

1. In `tsconfig.json`, add `paths` under `compilerOptions`:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["src/*"]
       }
     }
   }
   ```

2. Install `babel-plugin-module-resolver` as a dev dependency (or use whatever the current Expo SDK recommends for path alias resolution — some SDK versions handle this natively via `tsconfig.json` paths).

3. If using `babel-plugin-module-resolver`, configure `babel.config.js`:
   ```js
   plugins: [
     ['module-resolver', {
       root: ['./src'],
       alias: { '@': './src' }
     }]
   ]
   ```

4. Verify aliases work by creating a temporary test: import something from `@/types/index` in a screen file and confirm it resolves at both TypeScript level and runtime.

5. If the Expo SDK version natively supports `tsconfig.json` paths without a babel plugin, skip the babel plugin and document that the SDK handles it natively.

**Do NOT:**
- Create more granular aliases (like `@components/`, `@features/`). A single `@/*` → `src/*` alias is sufficient and simpler to maintain.
- Install any dependencies unrelated to path resolution.

**Acceptance Criteria:**
- [ ] `@/` alias resolves to `src/` in TypeScript (no red squiggles in IDE)
- [ ] `@/` alias resolves at runtime via Metro bundler
- [ ] At least one verified test import works end-to-end
- [ ] Configuration approach documented in a comment in `babel.config.js` or `tsconfig.json`

---

## Parent Issue: Expo Router Navigation Setup

**Description:** Configure file-based navigation using Expo Router v4 with a root layout, a 3-tab navigator (Home, Commitments, Settings), an onboarding route group, and push screen routes for detail views and lists.

### Issues:

---

**Title:** Root Layout with Conditional Routing

**Label:** `Feature`

**Parent Issue:** Expo Router Navigation Setup

**Dependencies:** KV2-103 (Path Aliases) must be completed first.

---

**Description:**

Kasya uses Expo Router for file-based navigation. The root layout is the app's entry point — it loads fonts, manages the splash screen, and decides whether to show the onboarding flow or the main tab navigator based on a flag.

This task creates the root `_layout.tsx` for the Expo Router app.

**What to do:**

Create (or update) the root layout file (either `app/_layout.tsx` or `src/app/_layout.tsx` depending on where Expo Router lives):

1. **Splash screen** — Use `expo-splash-screen` to keep the splash visible until the app is ready (fonts loaded, initial check complete). Call `SplashScreen.preventAutoHideAsync()` at module level and `SplashScreen.hideAsync()` once ready.

2. **Font loading** — Use `expo-font` and `useFonts` hook to load any custom fonts. For now, no custom fonts are needed — but the loading pattern should be in place for future use.

3. **Conditional routing** — Read a boolean flag to determine if onboarding is complete:
   - For now, use a hardcoded `const isOnboardingComplete = false;` placeholder. This will be replaced with MMKV reading in KV2-134.
   - If onboarding NOT complete → render `<Redirect href="/(onboarding)/welcome" />`
   - If onboarding complete → render the default `<Stack>` which shows `(tabs)`

4. **Stack navigator** — The root navigator is a `<Stack>` with these screen configs:
   - `(tabs)` — main tab navigator (no header)
   - `(onboarding)` — onboarding flow (no header)
   - `wallet/[id]` — push screen (with back button)
   - `budget/[id]` — push screen (with back button)
   - `transactions` — push screen
   - `wallets` — push screen
   - Modal screens as needed (presentation: 'modal')

5. **Provider wrappers** — Wrap the `<Stack>` in placeholder comments for providers that will be added later:
   ```tsx
   // TODO: Wrap with <DatabaseProvider> (KV2-133)
   // TODO: Wrap with <ThemeProvider> (KV2-123)
   ```

**Do NOT:**
- Set up the actual MMKV reading — that's KV2-134.
- Create the actual tab screens or onboarding screens — those are separate issues.
- Add any database or theme providers yet — just leave TODO comments.

**Acceptance Criteria:**
- [ ] Root layout loads without errors
- [ ] Splash screen shows until app is ready
- [ ] Conditional routing logic exists (hardcoded boolean for now)
- [ ] Stack navigator configured with all screen routes listed above
- [ ] TODO comments mark where providers will be added
- [ ] When `isOnboardingComplete = false`, app redirects to onboarding route
- [ ] When `isOnboardingComplete = true`, app shows tabs

---

**Title:** Tab Navigator with 3 Tabs

**Label:** `UI / UX`

**Parent Issue:** Expo Router Navigation Setup

**Dependencies:** KV2-111 (Root Layout) must be completed first.

---

**Description:**

Kasya has a bottom tab navigator with 3 tabs. This task creates the tab layout and placeholder screens.

**What to do:**

1. Create `(tabs)/_layout.tsx` with Expo Router's `<Tabs>` component configured with 3 tabs:

   | Tab | Route File | Icon (Lucide) | Label |
   |---|---|---|---|
   | Home | `index.tsx` | `Home` | Home |
   | Commitments | `commitments.tsx` | `FileText` | Commitments |
   | Settings | `settings.tsx` | `Settings` | Settings |

2. Install `lucide-react-native` and its peer dependency `react-native-svg` if not already installed.

3. Style the tab bar:
   - Active tab: accent color (gold/amber — use a placeholder hex value like `#F59E0B` for now, will be replaced by theme tokens in KV2-122)
   - Inactive tab: muted gray
   - Tab bar background: dark surface color (e.g., `#0A0A0A` for dark, `#FFFFFF` for light — placeholder)
   - Hide the header for all tab screens (`headerShown: false`)

4. Create placeholder tab screens:
   - `(tabs)/index.tsx` — renders `<View><Text>Home</Text></View>`
   - `(tabs)/commitments.tsx` — renders `<View><Text>Commitments</Text></View>`
   - `(tabs)/settings.tsx` — renders `<View><Text>Settings</Text></View>`

**Do NOT:**
- Build any actual tab content — these are placeholders. Real content is built in later milestones.
- Set up NativeWind styling yet — use inline `style` props or basic StyleSheet for now. NativeWind is configured in KV2-121.

**Acceptance Criteria:**
- [ ] Bottom tab bar renders with 3 tabs
- [ ] Each tab has a Lucide icon and label
- [ ] Tapping each tab navigates to the correct placeholder screen
- [ ] Active tab has visual distinction (different color)
- [ ] Tab bar is visible on all 3 screens
- [ ] Headers are hidden for tab screens

---

**Title:** Push Screen Routes (Placeholders)

**Label:** `Chore`

**Parent Issue:** Expo Router Navigation Setup

**Dependencies:** KV2-112 (Tab Navigator) must be completed first.

---

**Description:**

Kasya has several push screens that navigate on top of the tab navigator — wallet detail, budget detail, transaction history, wallet list. This task creates placeholder route files for all of them so navigation can be tested end-to-end.

**What to do:**

Create these route files (all at the same level as `(tabs)/` in the `app/` directory):

1. `wallet/[id].tsx` — Placeholder screen that reads the `id` param from the route and displays it: `<Text>Wallet Detail: {id}</Text>`. Use `useLocalSearchParams()` from Expo Router.

2. `budget/[id].tsx` — Same pattern: `<Text>Budget Detail: {id}</Text>`

3. `transactions.tsx` — Placeholder: `<Text>Transaction History</Text>`

4. `wallets.tsx` — Placeholder: `<Text>Wallet List</Text>`

For each push screen:
- Add a back button or rely on the default Stack header back button
- Register the screen in the root `_layout.tsx` Stack if not already auto-discovered by Expo Router

Test navigation by temporarily adding a button in the Home tab placeholder that calls `router.push('/wallet/test-123')` and verify the push screen renders with the param.

**Do NOT:**
- Build any actual content for these screens — they are pure placeholders.
- Create modal routes — those will be added when forms are built.

**Acceptance Criteria:**
- [ ] All 4 route files exist and render placeholder content
- [ ] `wallet/[id].tsx` and `budget/[id].tsx` read and display the dynamic `id` param
- [ ] Navigation from Home tab to any push screen works
- [ ] Back navigation returns to the previous screen
- [ ] No navigation errors in the console

---

## Parent Issue: NativeWind Theme System

**Description:** Set up NativeWind v4 with Tailwind CSS, define the Kasya color palette with light/dark mode support, and create a theme toggle hook with persistence.

### Issues:

---

**Title:** Install & Configure NativeWind v4

**Label:** `Config / Build`

**Parent Issue:** NativeWind Theme System

**Dependencies:** KV2-103 (Path Aliases) must be completed first.

---

**Description:**

Kasya uses NativeWind v4 (Tailwind CSS for React Native) for all styling. This task installs and configures NativeWind so Tailwind classes work on React Native components.

**What to do:**

1. Install dependencies:
   ```
   npm install nativewind
   npm install -D tailwindcss@3
   ```

2. Create `tailwind.config.js` at the project root:
   ```js
   module.exports = {
     content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
     presets: [require('nativewind/preset')],
     theme: {
       extend: {},
     },
     plugins: [],
   };
   ```

3. Create `global.css` at the project root (or `src/global.css`):
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

4. Update `babel.config.js` to include the NativeWind babel preset: `presets: ['nativewind/babel']` (or however the current NativeWind v4 docs recommend — check the NativeWind v4 installation guide for the exact config).

5. Update `metro.config.js` to support CSS (NativeWind v4 requires this):
   ```js
   const { getDefaultConfig } = require('expo/metro-config');
   const { withNativeWind } = require('nativewind/metro');
   const config = getDefaultConfig(__dirname);
   module.exports = withNativeWind(config, { input: './global.css' });
   ```

6. Create `nativewind-env.d.ts` at the project root:
   ```ts
   /// <reference types="nativewind/types" />
   ```

7. Import `global.css` in the root layout (`_layout.tsx`):
   ```ts
   import '../global.css'; // adjust path based on where the CSS file lives
   ```

8. Verify by applying `className="bg-blue-500 p-4"` to a `<View>` in a placeholder screen and confirming the blue background renders.

**Do NOT:**
- Define custom theme colors yet — that's KV2-122.
- Migrate any existing inline styles — there shouldn't be any real styles yet.

**Acceptance Criteria:**
- [ ] NativeWind v4 installed and configured
- [ ] Tailwind classes apply correctly to React Native components (`className` prop works)
- [ ] `global.css` imported in root layout
- [ ] Metro config updated with `withNativeWind`
- [ ] `nativewind-env.d.ts` exists (no TypeScript errors on `className`)
- [ ] Visual verification: a `bg-blue-500` View renders blue on device

---

**Title:** Define Color Palette & Theme Tokens

**Label:** `UI / UX`

**Parent Issue:** NativeWind Theme System

**Dependencies:** KV2-121 (NativeWind Installation) must be completed first.

---

**Description:**

Kasya has a dark-first design inspired by the legacy "Kasya Volt" theme (onyx black with gold/amber accents). This task defines the complete color system using CSS variables, configures Tailwind to reference them, and exports color constants for JavaScript usage.

**What to do:**

1. Update `global.css` to define CSS variables for light and dark themes:

   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   @layer base {
     :root {
       --background: 0 0% 100%;
       --foreground: 0 0% 3.9%;
       --card: 0 0% 100%;
       --card-foreground: 0 0% 3.9%;
       --popover: 0 0% 100%;
       --popover-foreground: 0 0% 3.9%;
       --primary: 43 96% 56%;
       --primary-foreground: 0 0% 3.9%;
       --secondary: 0 0% 96.1%;
       --secondary-foreground: 0 0% 9%;
       --muted: 0 0% 96.1%;
       --muted-foreground: 0 0% 45.1%;
       --accent: 0 0% 96.1%;
       --accent-foreground: 0 0% 9%;
       --destructive: 0 84.2% 60.2%;
       --destructive-foreground: 0 0% 98%;
       --border: 0 0% 89.8%;
       --input: 0 0% 89.8%;
       --ring: 43 96% 56%;

       --income: 142 71% 45%;
       --expense: 0 84% 60%;
       --transfer: 217 91% 60%;
       --refund: 32 95% 55%;
     }

     .dark {
       --background: 0 0% 3.9%;
       --foreground: 0 0% 98%;
       --card: 0 0% 7%;
       --card-foreground: 0 0% 98%;
       --popover: 0 0% 7%;
       --popover-foreground: 0 0% 98%;
       --primary: 43 96% 56%;
       --primary-foreground: 0 0% 3.9%;
       --secondary: 0 0% 14.9%;
       --secondary-foreground: 0 0% 98%;
       --muted: 0 0% 14.9%;
       --muted-foreground: 0 0% 63.9%;
       --accent: 0 0% 14.9%;
       --accent-foreground: 0 0% 98%;
       --destructive: 0 62.8% 30.6%;
       --destructive-foreground: 0 0% 98%;
       --border: 0 0% 14.9%;
       --input: 0 0% 14.9%;
       --ring: 43 96% 56%;

       --income: 142 71% 45%;
       --expense: 0 84% 60%;
       --transfer: 217 91% 60%;
       --refund: 32 95% 55%;
     }
   }
   ```

   Adjust exact HSL values as needed to get a visually appealing dark theme with gold/amber primary accent.

2. Update `tailwind.config.js` to reference these CSS variables:
   ```js
   theme: {
     extend: {
       colors: {
         background: 'hsl(var(--background))',
         foreground: 'hsl(var(--foreground))',
         card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
         popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
         primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
         secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
         muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
         accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
         destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
         border: 'hsl(var(--border))',
         input: 'hsl(var(--input))',
         ring: 'hsl(var(--ring))',
         income: 'hsl(var(--income))',
         expense: 'hsl(var(--expense))',
         transfer: 'hsl(var(--transfer))',
         refund: 'hsl(var(--refund))',
       },
     },
   }
   ```

3. Create `src/constants/colors.ts` — export color palettes for JavaScript use:
   ```ts
   export const WALLET_COLORS = [
     '#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6',
     '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
     '#E11D48', '#0EA5E9',
   ];

   export const CATEGORY_COLORS = [
     '#FDA4AF', '#FDBA74', '#FDE047', '#86EFAC', '#5EEAD4',
     '#93C5FD', '#C4B5FD', '#F9A8D4', '#A5B4FC', '#99F6E4',
   ];
   ```

**Do NOT:**
- Install any additional theming libraries — NativeWind's CSS variable approach handles light/dark.
- Define component-specific styles here — those go in the components themselves.

**Acceptance Criteria:**
- [ ] CSS variables defined for both `:root` (light) and `.dark` (dark) themes
- [ ] Tailwind config references CSS variables correctly
- [ ] `bg-background`, `text-foreground`, `bg-primary`, `text-income`, `text-expense` etc. all work in components
- [ ] `src/constants/colors.ts` exports WALLET_COLORS and CATEGORY_COLORS arrays
- [ ] Visual check: dark theme has a dark background with gold/amber accents
- [ ] Visual check: light theme has a light background with same accent colors

---

**Title:** Theme Toggle Hook & Persistence

**Label:** `Feature`

**Parent Issue:** NativeWind Theme System

**Dependencies:**
- KV2-122 (Color Palette) must be completed first
- KV2-134 (MMKV Setup) must be completed first — theme preference is stored in MMKV

---

**Description:**

Kasya supports 3 theme modes: system (follow device), light, and dark. The user's preference persists across app restarts via MMKV. This task creates the theme hook and provider.

**What to do:**

1. Create `src/features/settings/hooks/use-theme.ts`:

   ```ts
   // Hook that manages the app theme
   // Returns: { theme: 'system' | 'light' | 'dark', resolvedTheme: 'light' | 'dark', setTheme: (theme) => void }
   ```

   The hook should:
   - Read the saved theme from MMKV using the `MMKV_KEYS.THEME` key (from `@/lib/mmkv`)
   - Default to `'system'` if no preference saved
   - Use React Native's `useColorScheme()` to determine the system theme
   - Compute `resolvedTheme`: if theme is `'system'`, use the system color scheme; otherwise use the explicit choice
   - Provide a `setTheme(mode)` function that writes to MMKV

2. Create `src/lib/theme-provider.tsx`:

   The provider component should:
   - Use the `useTheme` hook internally
   - Apply the resolved theme to NativeWind by setting the `colorScheme` on the root view or using NativeWind's `useColorScheme` configuration
   - Provide theme context to children (so any component can read/set the theme)

3. Wire up the provider in the root `_layout.tsx`:
   - Wrap the `<Stack>` with `<ThemeProvider>`
   - Remove the TODO comment that was left in KV2-111

**Do NOT:**
- Create a settings UI for toggling the theme — that's in M9.
- Add any visual theme toggle button yet — just ensure the hook and provider work.

**Acceptance Criteria:**
- [ ] `useTheme()` returns `{ theme, resolvedTheme, setTheme }`
- [ ] Default theme is `'system'`
- [ ] Calling `setTheme('dark')` switches the app to dark mode visually
- [ ] Calling `setTheme('light')` switches to light mode
- [ ] Calling `setTheme('system')` follows the device setting
- [ ] Theme preference persists after app restart (read from MMKV)
- [ ] ThemeProvider wraps the app in root layout

---

## Parent Issue: Database & Storage Setup

**Description:** Set up WatermelonDB with the full schema (7 tables), all model classes, a React context provider, and MMKV for key-value storage. This is the data foundation for the entire app.

### Issues:

---

**Title:** Define WatermelonDB Schema & Database Instance

**Label:** `Database`

**Parent Issue:** Database & Storage Setup

**Dependencies:** KV2-103 (Path Aliases) must be completed first.

---

**Description:**

Kasya uses WatermelonDB v0.28 as its local-first database, backed by SQLite. This task sets up the schema, adapter, database instance, and the Expo plugin configuration.

The app has 7 data tables: `wallets`, `categories`, `transactions`, `budgets`, `bills`, `commitments`, and `settings`. All dates are stored as numbers (timestamps). All foreign keys are indexed for query performance.

**What to do:**

1. Install dependencies:
   ```
   npm install @nozbe/watermelondb@0.28
   npm install -D @babel/plugin-proposal-decorators
   ```
   Install the WatermelonDB Expo plugin appropriate for the current SDK (e.g., `@morrowdigital/watermelondb-expo-plugin` or equivalent). Check npm for the latest compatible version.

2. Configure `babel.config.js` — add `['@babel/plugin-proposal-decorators', { legacy: true }]` BEFORE any other plugins (must come before NativeWind preset if present).

3. Configure `app.json` — add the WatermelonDB Expo plugin to the `plugins` array:
   ```json
   ["@morrowdigital/watermelondb-expo-plugin", { "disableJsi": true }]
   ```

4. Create `src/database/schema.ts` with `appSchema({ version: 1, tables: [...] })` containing all 7 tables:

   **wallets:**
   | Column | Type | Optional | Indexed |
   |---|---|---|---|
   | name | string | no | no |
   | type | string | no | no |
   | balance | number | no | no |
   | color | string | no | no |
   | text_color | string | no | no |
   | currency | string | no | no |
   | credit_limit | number | yes | no |
   | statement_day | number | yes | no |
   | sort_order | number | no | no |

   **categories:**
   | Column | Type | Optional | Indexed |
   |---|---|---|---|
   | name | string | no | no |
   | icon | string | no | no |
   | color | string | no | no |
   | sort_order | number | no | no |
   | is_system | boolean | no | no |

   **transactions:**
   | Column | Type | Optional | Indexed |
   |---|---|---|---|
   | amount | number | no | no |
   | fee | number | yes | no |
   | type | string | no | no |
   | category_id | string | no | yes |
   | wallet_id | string | no | yes |
   | transfer_to_wallet_id | string | yes | yes |
   | date | number | no | yes |
   | created_at | number | no | no |
   | title | string | yes | no |
   | description | string | yes | no |
   | bill_id | string | yes | yes |
   | commitment_id | string | yes | yes |
   | note | string | yes | no |
   | exclude_from_cashflow | boolean | yes | no |

   **budgets:**
   | Column | Type | Optional | Indexed |
   |---|---|---|---|
   | category_id | string | no | yes |
   | name | string | no | no |
   | limit | number | no | no |
   | icon | string | no | no |
   | color | string | no | no |
   | period | string | no | no |
   | description | string | yes | no |

   **bills:**
   | Column | Type | Optional | Indexed |
   |---|---|---|---|
   | name | string | no | no |
   | amount | number | no | no |
   | due_day | number | no | no |
   | recurrence | string | no | no |
   | icon | string | no | no |
   | type | string | no | no |
   | start_date | number | no | no |
   | first_payment_date | number | yes | no |
   | last_paid_date | number | yes | no |
   | end_date | number | yes | no |
   | status | string | no | no |
   | is_trial_active | boolean | yes | no |
   | trial_end_date | number | yes | no |
   | billing_start_date | number | yes | no |
   | remind_trial_end | boolean | yes | no |
   | note | string | yes | no |

   **commitments:**
   | Column | Type | Optional | Indexed |
   |---|---|---|---|
   | type | string | no | no |
   | name | string | no | no |
   | principal | number | no | no |
   | interest | number | no | no |
   | fee | number | no | no |
   | category_id | string | no | yes |
   | due_day | number | no | no |
   | recurrence | string | no | no |
   | icon | string | no | no |
   | start_date | number | no | no |
   | duration | number | no | no |
   | duration_unit | string | yes | no |
   | note | string | yes | no |

   **settings:**
   | Column | Type | Optional | Indexed |
   |---|---|---|---|
   | name | string | no | no |
   | currency | string | no | no |
   | timezone | string | no | no |
   | onboarding_completed | boolean | no | no |

5. Create `src/database/migrations.ts`:
   ```ts
   import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';
   export default schemaMigrations({ migrations: [] });
   ```

6. Create `src/database/index.ts`:
   - Import schema and migrations
   - Create `SQLiteAdapter` with `{ schema, migrations, dbName: 'kasya', jsi: false }`
   - Create and export `Database` instance with the adapter and an empty `modelClasses` array (models are added in KV2-132)

**Do NOT:**
- Enable JSI — disabled for stability in V1.
- Create model classes — that's KV2-132.
- Add seed data — seeding happens during onboarding (M2).

**Acceptance Criteria:**
- [ ] WatermelonDB v0.28 installed
- [ ] Babel decorators plugin configured with `legacy: true`
- [ ] Expo plugin in `app.json` with `disableJsi: true`
- [ ] Schema at `src/database/schema.ts` defines all 7 tables with correct columns, types, optionality, and indexes
- [ ] Migrations file exists (empty, version 1)
- [ ] Database instance exported from `src/database/index.ts`
- [ ] EAS dev build runs on Android without native crashes

---

**Title:** Create WatermelonDB Model Classes

**Label:** `Database`

**Parent Issue:** Database & Storage Setup

**Dependencies:** KV2-131 (Schema & Database Instance) must be completed first.

---

**Description:**

WatermelonDB uses decorator-based model classes that map to the database schema. This task creates all 7 model classes and registers them with the database instance.

Each model extends `Model` from WatermelonDB and uses decorators to map columns. The models must match the schema exactly — same table names, same column names, same types.

**What to do:**

Create model files in `src/database/models/`:

1. **`wallet.model.ts`** — `WalletModel`
   - `@table('wallets')`
   - Fields: `@text('name')`, `@text('type')`, `@field('balance')`, `@text('color')`, `@text('text_color')`, `@text('currency')`, `@field('credit_limit')`, `@field('statement_day')`, `@field('sort_order')`
   - `@children('transactions')` — lazy relation to transactions with `wallet_id`

2. **`category.model.ts`** — `CategoryModel`
   - `@table('categories')`
   - Fields: `@text('name')`, `@text('icon')`, `@text('color')`, `@field('sort_order')`, `@field('is_system')`

3. **`transaction.model.ts`** — `TransactionModel`
   - `@table('transactions')`
   - Fields: `@field('amount')`, `@field('fee')`, `@text('type')`, `@text('category_id')`, `@text('wallet_id')`, `@text('transfer_to_wallet_id')`, `@field('date')`, `@field('created_at')`, `@text('title')`, `@text('description')`, `@text('bill_id')`, `@text('commitment_id')`, `@text('note')`, `@field('exclude_from_cashflow')`
   - Relations: `@relation('wallets', 'wallet_id')` as `wallet`, `@relation('categories', 'category_id')` as `category`

4. **`budget.model.ts`** — `BudgetModel`
   - `@table('budgets')`
   - Fields: `@text('category_id')`, `@text('name')`, `@field('limit')`, `@text('icon')`, `@text('color')`, `@text('period')`, `@text('description')`
   - Relations: `@relation('categories', 'category_id')` as `category`

5. **`bill.model.ts`** — `BillModel`
   - `@table('bills')`
   - Fields matching the bills schema columns

6. **`commitment.model.ts`** — `CommitmentModel`
   - `@table('commitments')`
   - Fields matching the commitments schema columns
   - Relations: `@relation('categories', 'category_id')` as `category`

7. **`settings.model.ts`** — `SettingsModel`
   - `@table('settings')`
   - Fields: `@text('name')`, `@text('currency')`, `@text('timezone')`, `@field('onboarding_completed')`

After creating all models, update `src/database/index.ts` to import all models and add them to the `modelClasses` array:
```ts
modelClasses: [
  WalletModel, CategoryModel, TransactionModel,
  BudgetModel, BillModel, CommitmentModel, SettingsModel,
],
```

**Do NOT:**
- Add any instance methods to models beyond what WatermelonDB requires. Business logic goes in service functions.
- Use `@json` decorator — all our data fits standard column types.
- Create any indexes beyond what's in the schema (indexes are defined in schema, not models).

**Acceptance Criteria:**
- [ ] All 7 model files created in `src/database/models/`
- [ ] Each model uses `@table` decorator matching its schema table name
- [ ] All columns mapped with correct decorators (`@text`, `@field`, `@date`, etc.)
- [ ] Relations defined where foreign keys exist (transaction→wallet, transaction→category, budget→category, commitment→category)
- [ ] All models imported and registered in `database/index.ts` `modelClasses`
- [ ] Database initializes without errors after adding models
- [ ] No TypeScript errors

---

**Title:** Create DatabaseProvider & useDatabase Hook

**Label:** `Feature`

**Parent Issue:** Database & Storage Setup

**Dependencies:** KV2-132 (Model Classes) must be completed first.

---

**Description:**

React components need access to the WatermelonDB instance. This task creates a React context provider and a custom hook so any component can access the database.

**What to do:**

1. Create `src/lib/database-provider.tsx`:
   ```tsx
   import React, { createContext, useContext } from 'react';
   import { Database } from '@nozbe/watermelondb';
   import { database } from '@/database';

   const DatabaseContext = createContext<Database | null>(null);

   export function DatabaseProvider({ children }: { children: React.ReactNode }) {
     return (
       <DatabaseContext.Provider value={database}>
         {children}
       </DatabaseContext.Provider>
     );
   }

   export function useDatabase(): Database {
     const db = useContext(DatabaseContext);
     if (!db) throw new Error('useDatabase must be used within DatabaseProvider');
     return db;
   }
   ```

2. Wire up the provider in the root `_layout.tsx`:
   - Import `DatabaseProvider` from `@/lib/database-provider`
   - Wrap the `<Stack>` navigator (and any other providers) with `<DatabaseProvider>`
   - Remove the TODO comment left in KV2-111

3. Verify by adding a temporary test in any screen:
   ```tsx
   const db = useDatabase();
   console.log('DB tables:', Object.keys(db.collections.map));
   ```
   This should log the 7 table names without errors.

**Do NOT:**
- Use WatermelonDB's built-in `DatabaseProvider` from `@nozbe/watermelondb/DatabaseProvider` — create a custom one for more control and cleaner typing.
- Add any data operations — this is just the provider/hook.

**Acceptance Criteria:**
- [ ] `DatabaseProvider` component created and exported
- [ ] `useDatabase()` hook returns the database instance
- [ ] Hook throws clear error if used outside provider
- [ ] Provider added to root layout wrapping the Stack
- [ ] Verified: calling `useDatabase()` in a screen returns a valid database with 7 collections

---

**Title:** Set Up MMKV Key-Value Store

**Label:** `Config / Build`

**Parent Issue:** Database & Storage Setup

**Dependencies:** KV2-101 (Initialize Expo Project) must be completed first.

---

**Description:**

Kasya uses MMKV for lightweight, synchronous key-value storage — things like onboarding completion flag, theme preference, selected currency, and user display name. MMKV is faster than AsyncStorage and works synchronously.

**What to do:**

1. Install:
   ```
   npm install react-native-mmkv
   ```

2. Create `src/lib/mmkv.ts`:

   ```ts
   import { MMKV } from 'react-native-mmkv';

   export const storage = new MMKV({ id: 'kasya-storage' });

   // Known keys — add new keys here as needed
   export const MMKV_KEYS = {
     ONBOARDING_COMPLETED: 'onboarding_completed',
     THEME: 'theme',
     CURRENCY: 'currency',
     USER_NAME: 'user_name',
   } as const;

   // Typed helpers
   export const mmkv = {
     getBoolean: (key: string): boolean => storage.getBoolean(key) ?? false,
     setBoolean: (key: string, value: boolean): void => storage.set(key, value),
     getString: (key: string): string | undefined => storage.getString(key),
     setString: (key: string, value: string): void => storage.set(key, value),
     delete: (key: string): void => storage.delete(key),
     clearAll: (): void => storage.clearAll(),
   };
   ```

3. Verify by writing and reading a test value in a screen:
   ```ts
   mmkv.setString(MMKV_KEYS.USER_NAME, 'Test');
   console.log(mmkv.getString(MMKV_KEYS.USER_NAME)); // → 'Test'
   ```

Note: MMKV requires a native module, so this will only work in an EAS dev build (not Expo Go).

**Do NOT:**
- Store complex objects in MMKV — use WatermelonDB for structured data.
- Create any Zustand middleware for MMKV persistence — keep it simple with direct reads/writes.

**Acceptance Criteria:**
- [ ] `react-native-mmkv` installed
- [ ] MMKV instance created at `src/lib/mmkv.ts`
- [ ] `MMKV_KEYS` constant defines all 4 keys
- [ ] Typed helper functions exported and working
- [ ] Read/write verified on Android (EAS dev build)

---

## Parent Issue: Zustand UI Store

**Description:** Set up Zustand for ephemeral UI state management — modals, selections, and other transient UI concerns.

### Issues:

---

**Title:** Create Zustand UI Store

**Label:** `Feature`

**Parent Issue:** Zustand UI Store

**Dependencies:** KV2-103 (Path Aliases) must be completed first.

---

**Description:**

Kasya uses Zustand for UI-only state — things like which modal is open, which entity is selected for editing, etc. This state is NOT persisted and resets on app restart. All actual data lives in WatermelonDB.

**What to do:**

1. Install:
   ```
   npm install zustand
   ```

2. Create `src/stores/ui-store.ts`:

   ```ts
   import { create } from 'zustand';

   interface UIState {
     // Modal state
     activeModal: string | null;
     // Selected entity IDs (for editing)
     selectedWalletId: string | null;
     selectedBudgetId: string | null;
     selectedTransactionId: string | null;
     selectedBillId: string | null;
     selectedCommitmentId: string | null;

     // Actions
     openModal: (modal: string, entityId?: string) => void;
     closeModal: () => void;
     selectWallet: (id: string | null) => void;
     selectBudget: (id: string | null) => void;
     selectTransaction: (id: string | null) => void;
     selectBill: (id: string | null) => void;
     selectCommitment: (id: string | null) => void;
     clearSelection: () => void;
   }

   export const useUIStore = create<UIState>((set) => ({
     activeModal: null,
     selectedWalletId: null,
     selectedBudgetId: null,
     selectedTransactionId: null,
     selectedBillId: null,
     selectedCommitmentId: null,

     openModal: (modal, entityId) => set({ activeModal: modal }),
     closeModal: () => set({ activeModal: null }),
     selectWallet: (id) => set({ selectedWalletId: id }),
     selectBudget: (id) => set({ selectedBudgetId: id }),
     selectTransaction: (id) => set({ selectedTransactionId: id }),
     selectBill: (id) => set({ selectedBillId: id }),
     selectCommitment: (id) => set({ selectedCommitmentId: id }),
     clearSelection: () => set({
       selectedWalletId: null,
       selectedBudgetId: null,
       selectedTransactionId: null,
       selectedBillId: null,
       selectedCommitmentId: null,
     }),
   }));
   ```

**Do NOT:**
- Store any WatermelonDB data in Zustand — data reactivity comes from DB observables.
- Add persistence middleware — this state intentionally resets on restart.
- Create separate stores per feature — one UI store is sufficient for V1.

**Acceptance Criteria:**
- [ ] Zustand installed
- [ ] `useUIStore` created and exported from `src/stores/ui-store.ts`
- [ ] All state fields and actions typed with TypeScript
- [ ] Can import and use in a component: `const { openModal, closeModal } = useUIStore()`
- [ ] State updates trigger re-renders correctly

---

## Parent Issue: Shared UI Component Library

**Description:** Build the shared, reusable UI component library using React Native Reusables as a base. These are the visual building blocks used across all features.

### Issues:

---

**Title:** Install React Native Reusables & Create Base Components

**Label:** `UI / UX`

**Parent Issue:** Shared UI Component Library

**Dependencies:** KV2-121 (NativeWind Installation) must be completed first.

---

**Description:**

Kasya uses React Native Reusables (the shadcn/ui port for React Native) as the base component library. This task installs it and creates the foundational UI primitives.

**What to do:**

1. Follow the React Native Reusables installation guide for Expo. This typically involves:
   - Installing the CLI or manually adding components
   - The library works by copying component source files into your project (like shadcn/ui)

2. Create these components in `src/components/ui/`:

   **`button.tsx`** — Button with variants:
   - Variants: `default` (primary/gold), `secondary`, `outline`, `destructive` (red), `ghost`
   - Sizes: `default`, `sm`, `lg`, `icon`
   - Accepts `className` for NativeWind overrides
   - Disabled state with reduced opacity

   **`text.tsx`** — Themed text component:
   - Variants: `h1`, `h2`, `h3`, `body`, `caption`, `label`
   - Auto-applies correct font size, weight, and color from theme
   - Accepts `className` for overrides

   **`card.tsx`** — Card container:
   - Background: `bg-card`, border: `border-border`, rounded corners
   - Sub-components: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

   **`input.tsx`** — Text input:
   - Label text above input
   - Error message below input (red)
   - Themed border, background, text colors
   - Focused state with ring color

   **`separator.tsx`** — Horizontal/vertical divider line

   **`badge.tsx`** — Small status badge:
   - Variants: `default`, `secondary`, `destructive`, `outline`
   - Used for: bill status (active/paused), transaction type, etc.

3. Export all from `src/components/ui/index.ts`

If React Native Reusables provides pre-built versions of these components, use those and customize the styling to match the Kasya theme. If not, build them from scratch following the shadcn/ui API pattern.

**Do NOT:**
- Build feature-specific components (like WalletCard) — those go in feature folders.
- Over-engineer with complex abstractions — these should be simple, composable primitives.

**Acceptance Criteria:**
- [ ] All 6 components created in `src/components/ui/`
- [ ] All exported from barrel `index.ts`
- [ ] Each component renders correctly in light and dark themes
- [ ] Button variants all visually distinct
- [ ] Text variants have correct sizes/weights
- [ ] Input shows label and error states
- [ ] All accept `className` prop for NativeWind overrides
- [ ] TypeScript props fully typed

---

**Title:** Create Bottom Sheet Component

**Label:** `UI / UX`

**Parent Issue:** Shared UI Component Library

**Dependencies:** KV2-151 (Base Components) must be completed first.

---

**Description:**

Kasya uses Gorhom Bottom Sheet extensively — for forms, pickers, confirmations, and more. This task creates a reusable bottom sheet wrapper component.

**What to do:**

1. Install dependencies:
   ```
   npm install @gorhom/bottom-sheet
   ```
   Note: `react-native-reanimated` and `react-native-gesture-handler` should already be installed (they're Expo defaults). If not, install them too.

2. Ensure `react-native-gesture-handler` is imported at the top of the root layout (or entry file):
   ```ts
   import 'react-native-gesture-handler';
   ```

3. Wrap the root layout with `<GestureHandlerRootView style={{ flex: 1 }}>` if not already done.

4. Create `src/components/ui/bottom-sheet.tsx`:

   The component should use `BottomSheetModal` (not `BottomSheet`) pattern for better integration with navigation:

   ```tsx
   interface AppBottomSheetProps {
     isOpen: boolean;
     onClose: () => void;
     snapPoints?: string[];  // e.g., ['50%', '85%']
     title?: string;
     children: React.ReactNode;
   }
   ```

   Features:
   - Uses `BottomSheetModal` with `BottomSheetModalProvider` in root layout
   - Drag handle indicator at top
   - Optional title header (styled with theme)
   - `BottomSheetBackdrop` with `disappearsOnIndex={-1}` for tap-to-close
   - `BottomSheetScrollView` as the default content wrapper (for scrollable content)
   - Keyboard-aware: sheet adjusts when keyboard opens (use `android_keyboardInputMode: 'adjustResize'` or Gorhom's built-in keyboard handling)

5. Add `<BottomSheetModalProvider>` to the root layout, wrapping the Stack navigator.

6. Export from `src/components/ui/index.ts`.

**Do NOT:**
- Create specific bottom sheets (wallet form, category picker) — those are built in feature issues.
- Use the non-modal `BottomSheet` component — `BottomSheetModal` is better for overlay behavior.

**Acceptance Criteria:**
- [ ] `@gorhom/bottom-sheet` installed
- [ ] `GestureHandlerRootView` wraps root layout
- [ ] `BottomSheetModalProvider` wraps Stack navigator in root layout
- [ ] Bottom sheet component slides up from bottom
- [ ] Drag to dismiss works
- [ ] Backdrop tap to close works
- [ ] Title renders when provided
- [ ] Children render inside scrollable area
- [ ] Keyboard avoidance works when sheet contains inputs

---

**Title:** Create App-Specific Shared Components

**Label:** `UI / UX`

**Parent Issue:** Shared UI Component Library

**Dependencies:** KV2-152 (Bottom Sheet) must be completed first.

---

**Description:**

These are app-level shared components used across multiple features — not generic UI primitives, but Kasya-specific building blocks.

**What to do:**

Create these components in `src/components/shared/`:

1. **`currency-display.tsx`** — Formats and displays a monetary amount.
   ```tsx
   interface CurrencyDisplayProps {
     amount: number;
     currencySymbol?: string;  // defaults to user's currency
     showSign?: boolean;       // +/- prefix
     size?: 'sm' | 'md' | 'lg';
     className?: string;
   }
   ```
   - Formats number to 2 decimal places with thousands separator
   - Negative amounts shown in red (expense color)
   - Positive amounts with `showSign` shown in green (income color)
   - Size variants affect font size

2. **`section-header.tsx`** — Section title with optional action.
   ```tsx
   interface SectionHeaderProps {
     title: string;
     onViewAll?: () => void;
   }
   ```
   - Title in uppercase, small, bold, muted color, tracking-wide
   - "View All" text button on the right (only if `onViewAll` provided)

3. **`empty-state.tsx`** — Centered empty state placeholder.
   ```tsx
   interface EmptyStateProps {
     icon: React.ComponentType<any>;  // Lucide icon
     title: string;
     description?: string;
     actionLabel?: string;
     onAction?: () => void;
   }
   ```
   - Icon centered, large, muted opacity
   - Title bold, below icon
   - Description muted, below title
   - Optional CTA button at bottom

4. **`emoji-picker.tsx`** — Emoji grid in a bottom sheet.
   ```tsx
   interface EmojiPickerProps {
     isOpen: boolean;
     onSelect: (emoji: string) => void;
     onClose: () => void;
   }
   ```
   - Opens as a bottom sheet (use the shared BottomSheet component)
   - Grid of common emojis (curate a list of ~100 relevant emojis: money, food, transport, shopping, home, entertainment, health, etc.)
   - Tapping an emoji calls `onSelect` and closes
   - Scrollable grid layout, 6-8 columns

5. **`color-picker.tsx`** — Color swatch selector.
   ```tsx
   interface ColorPickerProps {
     colors: string[];
     selected: string;
     onSelect: (color: string) => void;
   }
   ```
   - Grid of circular color swatches
   - Selected swatch has a check mark or ring
   - 5-6 columns

Export all from `src/components/shared/index.ts`.

**Do NOT:**
- Make these components overly complex — they should be simple and composable.
- Hard-code currency symbols — `currency-display` should use the provided symbol or fall back to user settings.
- Include ALL possible emojis — curate a focused list relevant to finance categories.

**Acceptance Criteria:**
- [ ] All 5 components created in `src/components/shared/`
- [ ] All exported from barrel `index.ts`
- [ ] `currency-display` formats `1234.5` as `₱1,234.50` (with appropriate symbol)
- [ ] `currency-display` shows negative amounts in red
- [ ] `section-header` renders title and optional View All button
- [ ] `empty-state` renders centered with icon, title, optional desc and CTA
- [ ] `emoji-picker` opens bottom sheet with scrollable emoji grid
- [ ] `color-picker` renders swatches with selected state indicator
- [ ] All themed for light/dark mode

---

## Parent Issue: EAS Build & Sentry Integration

**Description:** Configure EAS Build for development builds on physical device and integrate Sentry for crash reporting.

### Issues:

---

**Title:** Configure EAS Build

**Label:** `Config / Build`

**Parent Issue:** EAS Build & Sentry Integration

**Dependencies:** KV2-101 (Initialize Expo Project) must be completed first.

---

**Description:**

Kasya is tested on a physical Honor 90 Android device — no emulator. EAS Build generates the dev builds. This task configures EAS for the project.

**What to do:**

1. Install EAS CLI globally if not present: `npm install -g eas-cli`
2. Run `eas init` to link the project to an EAS account under the `r3stack` owner
3. Create `eas.json` at the project root:
   ```json
   {
     "cli": { "version": ">= 3.0.0" },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         }
       },
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         }
       },
       "production": {
         "android": {
           "buildType": "apk"
         }
       }
     }
   }
   ```
   Note: Using APK (not AAB) because there's no Play Store distribution yet — APKs can be sideloaded directly.

4. Run a test dev build: `eas build --profile development --platform android`
5. Install the resulting APK on the Honor 90 and verify the app launches

**Do NOT:**
- Configure iOS builds — Android-first.
- Set up EAS Submit or Play Store — not needed for V1.
- Configure EAS Update — not needed for V1.

**Acceptance Criteria:**
- [ ] `eas.json` created with development, preview, and production profiles
- [ ] All profiles use APK buildType for Android
- [ ] `eas build --profile development --platform android` completes successfully
- [ ] Dev build APK installs on Honor 90
- [ ] App launches and shows the placeholder screen
- [ ] Dev menu accessible in development build

---

**Title:** Integrate Sentry for Crash Reporting

**Label:** `Config / Build`

**Parent Issue:** EAS Build & Sentry Integration

**Dependencies:** KV2-161 (EAS Build) must be completed first — Sentry needs a working build to verify.

---

**Description:**

Sentry captures unhandled JavaScript errors and native crashes. This task integrates it into the Expo project.

**What to do:**

1. Install:
   ```
   npx expo install @sentry/react-native
   ```

2. Add the Sentry Expo plugin to `app.json`:
   ```json
   ["@sentry/react-native/expo", {
     "organization": "r3stack",
     "project": "kasya"
   }]
   ```
   Note: The actual org and project values should match the Sentry account. If the user hasn't set up a Sentry project yet, use placeholder values and document that they need to be updated.

3. Create `src/lib/sentry.ts`:
   ```ts
   import * as Sentry from '@sentry/react-native';

   export function initSentry() {
     Sentry.init({
       dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '__SENTRY_DSN__',
       debug: __DEV__,
       tracesSampleRate: __DEV__ ? 1.0 : 0.2,
     });
   }
   ```

4. Call `initSentry()` in the root `_layout.tsx` before any rendering.

5. Wrap the root layout component with `Sentry.wrap()`:
   ```tsx
   export default Sentry.wrap(RootLayout);
   ```

6. Create a simple error boundary component at `src/components/shared/error-boundary.tsx`:
   - Catches React render errors
   - Reports to Sentry via `Sentry.captureException()`
   - Shows a fallback UI: "Something went wrong" with a "Try Again" button

**Do NOT:**
- Hardcode the Sentry DSN — use an environment variable (`EXPO_PUBLIC_SENTRY_DSN`).
- Add performance monitoring beyond basic traces — keep it minimal for V1.

**Acceptance Criteria:**
- [ ] `@sentry/react-native` installed
- [ ] Sentry Expo plugin configured in `app.json`
- [ ] `initSentry()` called in root layout
- [ ] Root layout wrapped with `Sentry.wrap()`
- [ ] Sentry DSN read from environment variable (not hardcoded)
- [ ] Error boundary component catches render errors and reports to Sentry
- [ ] Verified: throwing a test error shows up in Sentry dashboard (or logs in dev mode if DSN not configured yet)
