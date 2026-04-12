# Kasya — Architecture Reference

> Ground-up native rebuild. Android-first, local-first, privacy-focused personal finance app.
> No backend — all data stays on-device.

---

## Tech Stack

| Layer           | Technology                                                     |
|-----------------|----------------------------------------------------------------|
| Framework       | Expo (latest stable SDK) + React Native                        |
| Language        | TypeScript (strict)                                            |
| Navigation      | Expo Router v4 (file-based)                                    |
| Database        | WatermelonDB v0.28 (SQLite, JSI disabled)                      |
| Key-Value Store | react-native-mmkv                                              |
| UI State        | Zustand (UI-only state)                                        |
| Styling         | NativeWind v4 + Tailwind CSS 3.x                               |
| UI Components   | React Native Reusables (shadcn/ui for RN)                      |
| Icons           | Lucide React Native                                            |
| Lists           | FlashList                                                      |
| Animations      | React Native Reanimated                                        |
| Gestures        | React Native Gesture Handler                                   |
| Bottom Sheets   | Gorhom Bottom Sheet                                            |
| Carousel        | React Native Reanimated Carousel                               |
| Forms           | React Hook Form + Zod                                          |
| Dates           | date-fns                                                       |
| Toasts          | Sonner Native                                                  |
| Haptics         | Expo Haptics                                                   |
| File I/O        | expo-file-system, expo-sharing, expo-document-picker (M9 only) |
| Build           | EAS Build                                                      |
| Crash Reporting | Sentry (@sentry/react-native)                                  |

### Deferred (Not in V1)

| Package                | Reason                            |
|------------------------|-----------------------------------|
| Victory Native XL      | Analytics charts — Project 2 only |
| Expo Notifications     | Reminders — Project 2 only        |
| Expo Secure Store      | No auth/backend in V1             |

---

## Architecture: Domain-Based Feature Modules

Each feature owns its own components, hooks, services, types, and validation schemas. No god files.

### Core Principles

1. **WatermelonDB observables for data reactivity** — Do NOT mirror DB data in Zustand. Use `withObservables` or custom hooks that call `.observe()`.
2. **Zustand for UI-only state** — Modal visibility, selected IDs, temporary form state. Resets on app restart.
3. **MMKV for lightweight flags** — Onboarding completed, theme preference, currency, user name. Persists across restarts.
4. **Service layer per feature** — Thin functions wrapping `database.write()`. Business logic (e.g., atomic balance updates) lives here, NOT in components.
5. **No circular dependencies** — Features never import from each other's services. Pass data as parameters or use hooks.

---

## Directory Structure

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
│   │   ├── schemas.ts            # Zod validation
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

---

## Milestone Map

| Milestone | Feature                       | Key Dependencies      |
|-----------|-------------------------------|-----------------------|
| M1        | Foundation & Infrastructure   | None                  |
| M2        | Onboarding Flow               | M1                    |
| M3        | Wallet System                 | M1, M2                |
| M4        | Category System               | M1, M2                |
| M5        | Transaction System            | M3, M4                |
| M6        | Budget System                 | M4, M5                |
| M7        | Bills & Subscriptions         | M5                    |
| M8        | Commitments (Loans & Lending) | M3, M4, M5            |
| M9        | Settings & Data Management    | All features complete |
| M10       | Polish & Release Prep         | All features complete |

---

## Data Flow

```
WatermelonDB (source of truth)
    └── feature/hooks/*.ts        (observe() reactive queries)
            └── feature/components/*.tsx  (render)

User Action
    └── feature/services/*.ts     (database.write())
            └── WatermelonDB      (auto-notifies observers)

MMKV
    └── lib/mmkv.ts               (theme, currency, onboarding flag)

Zustand (ui-store.ts)
    └── Modal open/close, selected IDs, temp UI state
```

---

> **Note:** Update this file at the end of each milestone to reflect actual structure.
