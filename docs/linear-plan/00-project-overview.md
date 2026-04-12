# Kasya — Native Rebuild: Project Overview

## Project Details (for Linear)

- **Project Name:** Kasya — Native Rebuild
- **Description:** Ground-up native rebuild of Kasya, a local-first, privacy-focused personal finance tracking app. Built with Expo (React Native) for Android-first, using WatermelonDB for offline-first structured storage, NativeWind for styling, and Expo Router for file-based navigation. This project covers the full V1 feature set: wallets, transactions, categories, budgets, bills/subscriptions, loans/lending, onboarding, settings, and backup/restore. No backend required — all data stays on-device.
- **Goal:** Deliver a polished, production-ready Android app that replaces the legacy Capacitor prototype with a truly native experience. V1 achieves full core feature parity with the legacy app (minus analytics), plus adds a proper onboarding flow and a modular architecture designed for future extensibility.
- **Current Phase:** Planning — no code written yet.
- **Owner:** r3stack

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo (latest stable SDK) + React Native |
| Language | TypeScript (strict) |
| Navigation | Expo Router v4 (file-based) |
| Database | WatermelonDB v0.28 (SQLite, JSI disabled) |
| Key-Value Store | react-native-mmkv |
| UI State | Zustand (UI-only state) |
| Styling | NativeWind v4 + Tailwind CSS 3.x |
| UI Components | React Native Reusables (shadcn/ui for RN) |
| Icons | Lucide React Native |
| Lists | FlashList |
| Animations | React Native Reanimated |
| Gestures | React Native Gesture Handler |
| Bottom Sheets | Gorhom Bottom Sheet |
| Carousel | React Native Reanimated Carousel |
| Forms | React Hook Form + Zod |
| Dates | date-fns |
| Toasts | Sonner Native |
| Haptics | Expo Haptics |
| File I/O | expo-file-system, expo-sharing, expo-document-picker |
| Build | EAS Build |
| Crash Reporting | Sentry (@sentry/react-native) |

### Tech Stack Notes

- **Expo SDK:** Use the latest stable SDK at project start. Do NOT pin to SDK 52 — it's outdated.
- **Victory Native XL:** Excluded from V1. Only install when Analytics project (Project 2) begins.
- **Expo Notifications:** Excluded from V1. Deferred to Project 2 (reminders phase).
- **Expo Secure Store:** No V1 use case (no auth/backend). Defer unless needed.
- **WatermelonDB JSI:** Disabled for stability. Can be enabled later for performance.
- **expo-document-picker / expo-file-system / expo-sharing:** Add in Milestone 9 (backup/restore), not at project init.

---

## Architecture: Modular Domain Systems

### Why This Architecture

The legacy Kasya app was a single `App.tsx` (~800 lines) managing all state, modals, overlays, and business logic ("god file" pattern). This doesn't scale for AI-assisted development, solo maintenance, or future features.

The new architecture uses **domain-based feature modules**. Each feature owns its components, hooks, services, types, and validation schemas. Benefits:
- Each AI prompt targets one isolated module
- Changes are isolated — editing Budget doesn't touch Transaction
- New features plug in without touching existing code
- Testing is easier per module

### Directory Structure

```
src/
├── app/                          # Expo Router — file-based routing
│   ├── _layout.tsx               # Root layout (providers, theme, fonts)
│   ├── (onboarding)/             # Onboarding route group
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── currency.tsx
│   │   ├── wallet.tsx
│   │   └── categories.tsx
│   ├── (tabs)/                   # Main tab navigator
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home
│   │   ├── commitments.tsx       # Bills + Loans tab
│   │   └── settings.tsx          # Settings tab
│   ├── wallet/[id].tsx           # Wallet detail (push screen)
│   ├── budget/[id].tsx           # Budget detail (push screen)
│   ├── transactions.tsx          # Full transaction history
│   └── wallets.tsx               # Wallet list management
│
├── components/
│   ├── ui/                       # React Native Reusables primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── text.tsx
│   │   ├── bottom-sheet.tsx
│   │   └── ...
│   └── shared/                   # App-level shared components
│       ├── currency-display.tsx
│       ├── emoji-picker.tsx
│       ├── color-picker.tsx
│       ├── date-picker.tsx
│       ├── empty-state.tsx
│       └── section-header.tsx
│
├── database/
│   ├── index.ts                  # Database instance
│   ├── schema.ts                 # Full WatermelonDB appSchema
│   ├── migrations.ts             # Schema migrations
│   └── models/                   # WatermelonDB Model classes
│       ├── wallet.model.ts
│       ├── category.model.ts
│       ├── transaction.model.ts
│       ├── budget.model.ts
│       ├── bill.model.ts
│       ├── commitment.model.ts
│       └── settings.model.ts
│
├── features/                     # Domain modules
│   ├── wallet/
│   │   ├── components/           # WalletCard, WalletCarousel, WalletForm
│   │   ├── hooks/                # useWallets, useWalletById, useWalletBalance
│   │   ├── services/             # createWallet, updateWallet, deleteWallet
│   │   ├── schemas.ts            # Zod validation for wallet forms
│   │   ├── types.ts              # WalletType enum, config map
│   │   └── utils.ts              # Balance calculations
│   ├── transaction/
│   │   ├── components/           # TransactionForm, TransactionItem, TransactionList
│   │   ├── hooks/                # useTransactions, useTransactionsByWallet
│   │   ├── services/             # createTransaction (+ atomic balance update)
│   │   ├── schemas.ts
│   │   ├── types.ts              # TransactionType enum
│   │   └── utils.ts              # Sorting, date grouping
│   ├── category/
│   │   ├── components/           # CategoryPicker, CategoryManager, CategoryForm
│   │   ├── hooks/                # useCategories
│   │   ├── services/             # CRUD + default seeding
│   │   ├── schemas.ts
│   │   ├── types.ts
│   │   └── constants.ts          # SYSTEM_CATEGORIES, DEFAULT_OPTIONAL_CATEGORIES
│   ├── budget/
│   │   ├── components/           # BudgetRing, BudgetForm, BudgetCard
│   │   ├── hooks/                # useBudgets, useBudgetSpending
│   │   ├── services/
│   │   ├── schemas.ts
│   │   ├── types.ts              # BudgetPeriod enum
│   │   └── utils.ts              # Spending calculations per period
│   ├── bill/
│   │   ├── components/           # BillForm, BillCard, BillList
│   │   ├── hooks/                # useBills, useBillsDue
│   │   ├── services/             # CRUD + payBill (creates transaction)
│   │   ├── schemas.ts
│   │   ├── types.ts              # RecurrenceFrequency, BillType, BillStatus
│   │   └── utils.ts              # Due date calculations
│   ├── commitment/
│   │   ├── components/           # CommitmentForm, CommitmentCard, CommitmentList
│   │   ├── hooks/                # useCommitments
│   │   ├── services/             # CRUD + payCommitment (creates transaction)
│   │   ├── schemas.ts
│   │   ├── types.ts              # CommitmentType, DurationUnit
│   │   └── utils.ts              # Remaining balance, payment schedule
│   ├── onboarding/
│   │   ├── components/           # Step indicators, selection cards
│   │   ├── hooks/                # useOnboardingStatus
│   │   └── services/             # completeOnboarding (seed data)
│   ├── settings/
│   │   ├── components/           # SettingItem, CurrencyPicker, ThemeToggle
│   │   └── hooks/                # useSettings, useTheme
│   └── backup/
│       ├── services/             # exportToJSON, importFromJSON
│       └── utils.ts              # Serialization / deserialization
│
├── stores/
│   └── ui-store.ts               # Zustand — UI state only (modals, selections)
│
├── hooks/                        # Global shared hooks
│   ├── use-currency-input.ts
│   └── use-database.ts           # DB context hook
│
├── lib/                          # Third-party setup
│   ├── mmkv.ts                   # MMKV instance + typed helpers
│   ├── sentry.ts                 # Sentry init
│   └── database-provider.tsx     # WatermelonDB DatabaseProvider
│
├── constants/                    # App-wide constants
│   ├── currencies.ts             # Currency list (code, name, symbol, flag)
│   ├── colors.ts                 # Theme palette, wallet colors, category pastels
│   └── app.ts                    # App name, version
│
├── types/                        # Global shared types
│   └── index.ts                  # ThemeMode, shared interfaces
│
└── utils/                        # Global utilities
    ├── number.ts                 # Currency formatting, math helpers
    ├── date.ts                   # date-fns wrappers
    └── color.ts                  # Color utilities
```

### Key Architecture Principles

1. **WatermelonDB observables for data reactivity** — Do NOT mirror DB data in Zustand. Use `withObservables` or custom hooks that call `.observe()` to react to DB changes automatically.
2. **Zustand for UI-only state** — Modal visibility, selected entity IDs, active tab, temporary form state. Resets on app restart.
3. **MMKV for lightweight flags** — Onboarding completed, theme preference, currency, user name. Persists across restarts.
4. **Service layer per feature** — Thin functions that wrap `database.write()` calls. Business logic (e.g., atomic balance updates on transaction create) lives here, NOT in components.
5. **No circular dependencies** — Features never import from each other's services directly. If Transaction needs Wallet data, it uses the Wallet hook or receives it as a parameter.

---

## Labels

All issues use one or more of these labels:

| Label | When to Use |
|---|---|
| **Bug** | Fixing broken functionality |
| **Chore** | Directory structure, barrel files, constants, type definitions, cleanup |
| **Config / Build** | Project init, tooling setup, EAS, babel/metro config, path aliases, plugins |
| **Database** | Schema, models, migrations, DB instance, service functions (CRUD) |
| **Feature** | New functionality — hooks, services with business logic, complete flows |
| **Refactor** | Restructuring existing code without changing behavior |
| **UI / UX** | Components, screens, forms, pickers, visual design, styling |

Issues may have multiple labels (e.g., `Feature` + `UI / UX` for a form that includes both logic and visual design).

---

## Feature Phasing

### V1 — This Project

| Feature | Milestone |
|---|---|
| Foundation & Infrastructure | M1 |
| Onboarding Flow | M2 |
| Wallets (all 7 types + basic CC fields) | M3 |
| Categories (system defaults + custom CRUD) | M4 |
| Transactions (income / expense / transfer / refund) | M5 |
| Budgets (daily / weekly / monthly) | M6 |
| Bills & Subscriptions | M7 |
| Commitments (Loans & Lending) | M8 |
| Settings & Data Management | M9 |
| Polish & Release | M10 |

### Deferred — Project 2 ("Kasya Completion")

| Feature | Reason |
|---|---|
| Analytics & Charts | Separate project scope; requires Victory Native XL |
| Notifications & Reminders | Not critical for V1; requires notification permissions UX |
| CSV Import/Export | Complex template system; JSON backup sufficient for V1 |
| Advanced Credit Card Cycles | Statement period calc, per-cycle tracking, min payment — complex |
| iOS Support | Android-first |
| Web Support | Future phase |

---

## Milestones

### M1: Foundation & Infrastructure
Set up Expo project, Expo Router navigation, NativeWind theming, WatermelonDB, MMKV, Zustand, shared UI component library, EAS Build, Sentry.
**Why first:** Everything else depends on the app shell, database, navigation, and UI primitives.
**Done when:** App boots on physical device, navigation works, DB initializes, theme toggles, shared components exist, EAS dev build works.

### M2: Onboarding
Multi-step first-run flow: welcome (name input) → currency selection → default wallet setup → category selection. Seeds database with user's choices.
**Why second:** Seeds the foundational data (settings, wallet, categories) that all features depend on.
**Done when:** Fresh install shows onboarding, completing it creates data in DB, subsequent launches skip it.

### M3: Wallet System
All 7 wallet types (Cash, E-Wallet, Bank, Digital Bank, Credit Card, Investment, Crypto), CRUD, carousel, detail view, list with reorder, basic credit card fields.
**Why third:** Wallets are the foundational entity — transactions, budgets, bills all reference wallets.
**Done when:** Can create/edit/delete/reorder wallets of all types, carousel on home, detail screen works.

### M4: Category System
System default categories (auto-seeded, non-deletable), custom category CRUD, category picker component, management screen.
**Why fourth:** Transactions and Budgets both require categories. The picker is used across multiple forms.
**Done when:** System categories exist and are locked, custom CRUD works, picker works in forms.

### M5: Transaction System
Income, Expense, Transfer, Refund — full CRUD with atomic wallet balance updates, transaction form, history with date grouping and filtering.
**Why fifth:** Core feature. Depends on Wallets (M3) and Categories (M4). Every other domain creates transactions.
**Done when:** All 4 types work, balances update atomically, history with date grouping works.

### M6: Budget System
Budget CRUD, spending calculation from transactions per period (daily/weekly/monthly), ring visualization, detail view.
**Why sixth:** Depends on Categories (M4) and Transactions (M5) for spending calculation.
**Done when:** Budgets track spending, rings visualize progress, detail view shows filtered transactions.

### M7: Bills & Subscriptions
Bill/subscription CRUD, recurrence types, payment tracking (creates transaction), trial period management, status management.
**Why seventh:** Depends on Transactions (M5) since paying a bill creates a transaction.
**Done when:** Bills manageable, payments create transactions, trial tracking works, due dates display correctly.

### M8: Commitments (Loans & Lending)
Commitment CRUD, loan vs lending types, payment tracking with principal/interest/fee, remaining balance calculation, payment history.
**Why eighth:** Same dependency pattern as Bills — depends on Wallets + Categories + Transactions.
**Done when:** Loans/lending manageable, payments create transactions, remaining balance tracks correctly.

### M9: Settings & Data Management
Settings screen (currency, theme, app info), JSON backup export via share sheet, JSON import from file picker, full data reset with double confirmation.
**Why ninth:** Polish phase — all core features should work before settings and backup. Backup needs all models to exist.
**Done when:** Settings work, export/import JSON successfully, reset returns to onboarding.

### M10: Polish & Release Prep
Haptic feedback integration, empty states, loading skeletons, error handling, app icon/splash screen, full testing pass on physical device, production EAS build.
**Why last:** Cannot polish what doesn't exist. All features must be complete first.
**Done when:** All features tested on Honor 90, production APK builds and installs successfully, no critical bugs.
