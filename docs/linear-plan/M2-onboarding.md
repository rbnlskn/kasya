# Milestone 2: Onboarding

## Milestone Details (for Linear)

- **Title:** M2 — Onboarding
- **Description:** Build the multi-step first-run onboarding flow that guides new users through initial setup: entering a display name, selecting a currency, confirming/creating their default wallet, and choosing which optional categories to enable. Completing onboarding seeds the WatermelonDB database with the user's choices and sets the MMKV flag so subsequent launches skip straight to the main app.
- **Why second:** The onboarding flow seeds the foundational data (Settings record, default Wallet, Categories) that every subsequent feature depends on. Without this data, there's nothing to transact against.
- **Definition of Done:**
  - Fresh install shows onboarding flow (4 screens)
  - User can enter display name, select currency, set up wallet(s), choose categories
  - Completing onboarding creates Settings, Wallet, and Category records in WatermelonDB
  - MMKV `onboarding_completed` flag is set to `true`
  - Subsequent app launches skip onboarding and go directly to Home tab
  - Entire flow completable in under 60 seconds

---

## Parent Issue: Onboarding Flow

**Description:** Build the complete first-run onboarding experience — a linear 4-step flow (Welcome → Currency → Wallet → Categories) that seeds the database and transitions the user to the main app. This is the first thing every new user sees.

### Issues:

---

**Title:** Onboarding Layout & Step Navigation

**Label:** `Feature`

**Parent Issue:** Onboarding Flow

**Dependencies:**
- KV2-111 (Root Layout with Conditional Routing) — the root layout redirects to onboarding when the flag is not set
- KV2-134 (MMKV Setup) — needed to read/write the onboarding completion flag

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the onboarding route group and its navigation layout — the container that holds all onboarding screens and manages forward-only step progression.

The onboarding is a linear flow of 4 screens. Users cannot go back to previous steps (forward-only). A progress indicator shows which step the user is on.

**What to do:**

1. Create the `(onboarding)/_layout.tsx` route group layout file (inside the Expo Router `app/` directory).

2. Use a `<Stack>` navigator configured for forward-only navigation:
   - Set `gestureEnabled: false` to prevent swipe-back
   - Set `headerShown: false` to hide the default header (we'll build our own)
   - Set `animation: 'slide_from_right'` for step transitions

3. Register 4 screens in order:
   - `welcome` — Step 1
   - `currency` — Step 2
   - `wallet` — Step 3
   - `categories` — Step 4

4. Create a shared `StepIndicator` component at `src/features/onboarding/components/step-indicator.tsx`:
   ```tsx
   interface StepIndicatorProps {
     currentStep: number;  // 1-4
     totalSteps: number;   // 4
   }
   ```
   - Renders 4 horizontal dots/bars
   - Current step highlighted with primary color
   - Completed steps filled, upcoming steps muted
   - Positioned at the top of each onboarding screen

5. Create a shared `OnboardingScreen` wrapper component at `src/features/onboarding/components/onboarding-screen.tsx`:
   ```tsx
   interface OnboardingScreenProps {
     step: number;
     title: string;
     subtitle?: string;
     children: React.ReactNode;
     footer: React.ReactNode;  // Continue/Get Started button
   }
   ```
   - Renders: StepIndicator at top, title, optional subtitle, children (screen content), footer pinned at bottom
   - SafeAreaView with proper padding
   - Consistent layout across all 4 screens

6. Navigation between screens uses `router.replace()` (not `router.push()`) to prevent back stack accumulation. After the final step, navigate to `/(tabs)` using `router.replace('/(tabs)')`.

**Do NOT:**
- Create the actual screen content (name input, currency picker, etc.) — those are separate issues.
- Allow backward navigation — this is a forward-only setup flow.
- Use `router.push()` — use `router.replace()` to prevent users from using the hardware back button to return to previous steps.

**Acceptance Criteria:**
- [ ] `(onboarding)/_layout.tsx` exists with Stack navigator
- [ ] Back gesture disabled
- [ ] 4 screens registered in the layout
- [ ] `StepIndicator` component renders dots for all 4 steps with current step highlighted
- [ ] `OnboardingScreen` wrapper provides consistent layout (step indicator, title, content, footer)
- [ ] Navigation between steps uses `router.replace()`
- [ ] Hardware back button does not go to previous onboarding step

---

**Title:** Welcome Screen (Name Input)

**Label:** `UI / UX`

**Parent Issue:** Onboarding Flow

**Dependencies:** KV2-201 (Onboarding Layout) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This is the first screen users see on a fresh install. It introduces the app and captures the user's display name.

**What to do:**

Create `(onboarding)/welcome.tsx`:

1. Use the `OnboardingScreen` wrapper from KV2-201 with `step={1}`.

2. **Visual layout** (top to bottom):
   - App brand element — this can be a simple styled text "Kasya" in the primary (gold/amber) color with a large font, or a placeholder for a future logo. Keep it simple but impactful.
   - Welcome message — "Welcome to Kasya" as the title
   - Subtitle — "Let's set up your personal finance tracker" or similar

3. **Name input:**
   - Use the shared `Input` component from `@/components/ui/input`
   - Label: "What should we call you?"
   - Placeholder: "Enter your name"
   - Auto-focus on mount so the keyboard opens immediately
   - Trim whitespace on blur

4. **Continue button:**
   - Rendered in the `footer` prop of `OnboardingScreen`
   - Text: "Continue"
   - Disabled state: button is disabled and visually muted when the name input is empty
   - On press: save the trimmed name to MMKV using `mmkv.setString(MMKV_KEYS.USER_NAME, name)`, then navigate to `/(onboarding)/currency` via `router.replace()`

5. **Keyboard handling:**
   - The screen should scroll or adjust when the keyboard opens so the input and button remain visible
   - Pressing "Done" on the keyboard should trigger the Continue action (if name is not empty)

**Do NOT:**
- Validate the name beyond "not empty" — any non-empty string is valid.
- Create an account or send any data anywhere — this is purely local.
- Add animations beyond the step transition — keep it simple.

**Acceptance Criteria:**
- [ ] Screen renders with brand element, welcome message, and name input
- [ ] Input auto-focuses and keyboard opens on mount
- [ ] Continue button disabled when name is empty
- [ ] Continue button enabled when name has at least 1 non-whitespace character
- [ ] Pressing Continue saves name to MMKV and navigates to currency screen
- [ ] Keyboard "Done" action triggers Continue
- [ ] StepIndicator shows step 1 of 4

---

**Title:** Currency Selection Screen

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Onboarding Flow

**Dependencies:** KV2-202 (Welcome Screen) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This screen lets users choose their default currency. The currency affects how amounts are displayed throughout the entire app (symbol prefix, formatting).

This issue also requires creating the currencies constant file that will be reused across the app (in Settings currency picker too).

**What to do:**

1. Create `src/constants/currencies.ts` — export an array of currency objects:
   ```ts
   export interface Currency {
     code: string;    // ISO 4217, e.g., 'PHP'
     name: string;    // 'Philippine Peso'
     symbol: string;  // '₱'
     flag: string;    // '🇵🇭'
   }

   export const CURRENCIES: Currency[] = [
     { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
     { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
     { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
     { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
     { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
     // ... include at least 50 major world currencies
     // Sort alphabetically by code
   ];
   ```

2. Create `(onboarding)/currency.tsx`:

3. Use the `OnboardingScreen` wrapper with `step={2}`.

4. **Visual layout:**
   - Title: "Choose your currency"
   - Subtitle: "This will be used across the app"
   - Search input at the top — filters the currency list by code, name, or symbol
   - Currency list below the search input

5. **Currency list:**
   - Use `FlashList` from `@shopify/flash-list` for performance (~50-150 items)
   - Install FlashList if not present: `npm install @shopify/flash-list`
   - Each item shows: flag emoji, currency code (bold), currency name, symbol
   - Tapping an item selects it (highlighted with primary color background or checkmark)
   - Default selection: PHP (pre-selected on mount)
   - Only one currency can be selected at a time

6. **Search:**
   - Text input at top with search icon
   - Filters list in real-time as user types
   - Case-insensitive matching against code, name, and symbol
   - If no results, show a "No currencies found" message

7. **Continue button (footer):**
   - Always enabled (PHP is pre-selected)
   - On press: save the selected currency code to MMKV using `mmkv.setString(MMKV_KEYS.CURRENCY, selectedCode)`, then navigate to `/(onboarding)/wallet` via `router.replace()`

**Do NOT:**
- Support multiple currency selection — only one default currency.
- Build a custom currency formatting system here — that's handled by the `currency-display` shared component.
- Include obscure or defunct currencies — stick to major, actively used currencies.

**Acceptance Criteria:**
- [ ] `src/constants/currencies.ts` created with at least 50 currencies
- [ ] Screen renders with search input and currency list
- [ ] PHP pre-selected by default
- [ ] Search filters by code, name, and symbol (case-insensitive)
- [ ] Tapping a currency selects it with visual highlight
- [ ] Only one currency selected at a time
- [ ] Continue saves currency to MMKV and navigates to wallet screen
- [ ] FlashList renders the list performantly
- [ ] StepIndicator shows step 2 of 4

---

**Title:** Default Wallet Setup Screen

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Onboarding Flow

**Dependencies:**
- KV2-203 (Currency Selection) must be completed first
- KV2-132 (WatermelonDB Model Classes) — wallets are created in the database

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native using WatermelonDB for storage. This screen lets users confirm their default wallet and optionally add more wallets during onboarding.

Every user starts with a Cash wallet. They can rename it and optionally create additional wallets (e.g., a bank account, e-wallet). Wallets are created in WatermelonDB at this step.

**What to do:**

1. Create `(onboarding)/wallet.tsx`:

2. Use the `OnboardingScreen` wrapper with `step={3}`.

3. **Visual layout:**
   - Title: "Set up your wallets"
   - Subtitle: "Start with your main wallet. You can add more later."

4. **Default wallet card:**
   - Pre-populated with: name "Cash", type Cash, balance 0, currency from MMKV (saved in previous step)
   - Shown as a card component with the wallet color and an edit icon
   - The name field is editable (inline or via a tappable field that opens an input)
   - The user can change the name but not the type of the default wallet (always Cash)

5. **Add another wallet (optional):**
   - Below the default wallet, show an "Add Wallet" button (dashed border card or text button with + icon)
   - Tapping it shows an inline form or bottom sheet with:
     - Name input (required)
     - Type selector — horizontal scrollable pills showing all 7 `WalletType` values with labels and icons from `WALLET_TYPE_CONFIG`
     - Color picker — using the shared `ColorPicker` component with `WALLET_COLORS` from `@/constants/colors`
   - Added wallets appear as cards below the default wallet
   - Users can remove added wallets (but not the default Cash wallet)
   - No limit on how many wallets can be added during onboarding

6. **Continue button (footer):**
   - Text: "Continue"
   - On press:
     - Get the database instance via `useDatabase()` hook
     - In a single `database.write()` block, create all wallets (default + any additional):
       ```ts
       await database.write(async () => {
         const walletsCollection = database.get<WalletModel>('wallets');
         for (let i = 0; i < walletDataArray.length; i++) {
           await walletsCollection.create((wallet) => {
             wallet.name = walletDataArray[i].name;
             wallet.type = walletDataArray[i].type;
             wallet.balance = 0;
             wallet.color = walletDataArray[i].color;
             wallet.textColor = '#FFFFFF'; // or derive from color
             wallet.currency = selectedCurrency;
             wallet.sortOrder = i;
           });
         }
       });
       ```
     - Navigate to `/(onboarding)/categories` via `router.replace()`

7. Import `WalletType` enum and `WALLET_TYPE_CONFIG` from `@/features/wallet/types`. If these files don't exist yet, create them as part of this task:
   ```ts
   // src/features/wallet/types.ts
   export enum WalletType {
     Cash = 'cash',
     EWallet = 'e_wallet',
     Bank = 'bank',
     DigitalBank = 'digital_bank',
     CreditCard = 'credit_card',
     Investment = 'investment',
     Crypto = 'crypto',
   }

   export const WALLET_TYPE_CONFIG: Record<WalletType, { label: string; icon: string }> = {
     [WalletType.Cash]: { label: 'Cash', icon: '💵' },
     [WalletType.EWallet]: { label: 'E-Wallet', icon: '📱' },
     [WalletType.Bank]: { label: 'Bank', icon: '🏦' },
     [WalletType.DigitalBank]: { label: 'Digital Bank', icon: '💳' },
     [WalletType.CreditCard]: { label: 'Credit Card', icon: '💳' },
     [WalletType.Investment]: { label: 'Investment', icon: '📈' },
     [WalletType.Crypto]: { label: 'Crypto', icon: '₿' },
   };
   ```

**Do NOT:**
- Allow changing the type of the default wallet — it's always Cash.
- Set any balance other than 0 — users add transactions to build balances.
- Allow proceeding without at least one wallet.
- Create credit card-specific fields (credit_limit, statement_day) during onboarding — those can be set later when editing the wallet.

**Acceptance Criteria:**
- [ ] Default Cash wallet shown as a pre-populated, editable card
- [ ] User can change the default wallet's name
- [ ] "Add Wallet" button opens form with name, type picker, and color picker
- [ ] Additional wallets appear as cards and can be removed
- [ ] Default Cash wallet cannot be removed
- [ ] Continue creates all wallets in WatermelonDB with correct fields
- [ ] All wallets have balance 0 and the user's selected currency
- [ ] `WalletType` enum and `WALLET_TYPE_CONFIG` created in `src/features/wallet/types.ts`
- [ ] StepIndicator shows step 3 of 4

---

**Title:** Category Selection Screen & Onboarding Completion

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Onboarding Flow

**Dependencies:**
- KV2-204 (Wallet Setup) must be completed first
- KV2-132 (WatermelonDB Model Classes) — categories and settings are created in the database
- KV2-134 (MMKV Setup) — onboarding completion flag

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native using WatermelonDB for storage. This is the final onboarding screen. It lets users choose which optional expense categories to enable. System categories (Income, Expense) are always included and cannot be deselected. Completing this step seeds the database with categories and settings, sets the MMKV onboarding flag, and navigates to the main app.

**What to do:**

1. Create `(onboarding)/categories.tsx`:

2. Use the `OnboardingScreen` wrapper with `step={4}`.

3. **Visual layout:**
   - Title: "Choose your categories"
   - Subtitle: "Essential categories are included automatically. Pick the ones you need."

4. **System categories section:**
   - Header: "Always Included" (or "Essentials")
   - Show these as locked/non-interactive items with a lock icon or checkbox that's always checked and disabled:
     - Income 🟢 (green)
     - Expense 🔴 (red)
   - These are always created regardless of user selection

5. **Optional categories section:**
   - Header: "Optional"
   - Each item is a toggleable card/checkbox with emoji icon and name:
     - Food 🍎
     - Commute 🚘
     - Shopping 🛍️
     - Salary 💰
     - Eat Out 🍽️
     - Bills ⚡
     - Entertainment 🎮
     - Loans 💷
     - Lending 💴
     - Subscriptions 💬
   - **All optional categories are selected by default** — user deselects what they don't want
   - Each category has a color from the `CATEGORY_COLORS` palette in `@/constants/colors`
   - Tapping toggles selection on/off

6. If `src/features/category/constants.ts` doesn't exist yet, create it:
   ```ts
   export const SYSTEM_CATEGORIES = [
     { name: 'Income', icon: '🟢', color: '#86EFAC', isSystem: true },
     { name: 'Expense', icon: '🔴', color: '#FDA4AF', isSystem: true },
   ];

   export const DEFAULT_OPTIONAL_CATEGORIES = [
     { name: 'Food', icon: '🍎', color: '#FDA4AF' },
     { name: 'Commute', icon: '🚘', color: '#93C5FD' },
     { name: 'Shopping', icon: '🛍️', color: '#C4B5FD' },
     { name: 'Salary', icon: '💰', color: '#86EFAC' },
     { name: 'Eat Out', icon: '🍽️', color: '#FDBA74' },
     { name: 'Bills', icon: '⚡', color: '#FDE047' },
     { name: 'Entertainment', icon: '🎮', color: '#F9A8D4' },
     { name: 'Loans', icon: '💷', color: '#C4B5FD' },
     { name: 'Lending', icon: '💴', color: '#86EFAC' },
     { name: 'Subscriptions', icon: '💬', color: '#93C5FD' },
   ];
   ```

7. **"Get Started" button (footer):**
   - Text: "Get Started" (different from "Continue" on previous screens to signal finality)
   - On press, execute the following in a single `database.write()` block:

     a. **Create system categories** (always):
        ```ts
        for (const cat of SYSTEM_CATEGORIES) {
          await categoriesCollection.create((c) => {
            c.name = cat.name;
            c.icon = cat.icon;
            c.color = cat.color;
            c.isSystem = true;
            c.sortOrder = index;
          });
        }
        ```

     b. **Create selected optional categories** (only the ones the user left toggled on):
        ```ts
        for (const cat of selectedOptionalCategories) {
          await categoriesCollection.create((c) => {
            c.name = cat.name;
            c.icon = cat.icon;
            c.color = cat.color;
            c.isSystem = false;
            c.sortOrder = index;
          });
        }
        ```

     c. **Create Settings record:**
        ```ts
        await settingsCollection.create((s) => {
          s.name = mmkv.getString(MMKV_KEYS.USER_NAME) || 'User';
          s.currency = mmkv.getString(MMKV_KEYS.CURRENCY) || 'PHP';
          s.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          s.onboardingCompleted = true;
        });
        ```

     d. **Set MMKV flag:**
        ```ts
        mmkv.setBoolean(MMKV_KEYS.ONBOARDING_COMPLETED, true);
        ```

     e. **Navigate to main app:**
        ```ts
        router.replace('/(tabs)');
        ```

**Do NOT:**
- Allow deselecting system categories — they are always included.
- Create categories with `is_system: true` for optional categories — only Income and Expense are system categories.
- Skip the Settings record creation — the app relies on it existing.
- Use `router.push()` — use `router.replace()` so the user can't back-navigate to onboarding.

**Acceptance Criteria:**
- [ ] System categories (Income, Expense) shown as locked/always-included
- [ ] 10 optional categories shown as toggleable items
- [ ] All optional categories selected by default
- [ ] User can deselect optional categories they don't want
- [ ] "Get Started" creates system categories in WatermelonDB with `is_system: true`
- [ ] Selected optional categories created with `is_system: false`
- [ ] Settings record created with user name, currency, timezone
- [ ] MMKV `onboarding_completed` flag set to `true`
- [ ] App navigates to `/(tabs)` Home screen
- [ ] Subsequent app launches skip onboarding (root layout reads MMKV flag)
- [ ] `src/features/category/constants.ts` created with SYSTEM_CATEGORIES and DEFAULT_OPTIONAL_CATEGORIES
- [ ] StepIndicator shows step 4 of 4
