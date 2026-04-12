# Milestone 10: Polish & Release Prep

## Milestone Details (for Linear)

- **Title:** M10 — Polish & Release Prep
- **Description:** Final polish pass across the entire app — haptic feedback integration, empty states review, loading skeletons, error handling improvements, app icon and splash screen, accessibility basics, full testing pass on the physical Honor 90 device, and production EAS build. This milestone turns a feature-complete app into a release-ready product.
- **Why last:** Cannot polish what doesn't exist. All features (M1-M9) must be complete before a holistic polish and testing pass makes sense.
- **Definition of Done:**
  - Haptic feedback on key interactions (button presses, destructive actions, success toasts)
  - Every screen has a proper empty state
  - Loading states on all data-dependent screens
  - Error boundaries catch and report crashes gracefully
  - App icon and splash screen configured
  - Full manual testing pass on Honor 90 — no critical bugs
  - Production EAS build (APK) installs and runs without issues
  - No unhandled JavaScript errors in normal usage flows

---

## Parent Issue: Haptic Feedback & Micro-interactions

**Description:** Add haptic feedback throughout the app to give tactile confirmation on key interactions, improving the native feel.

### Issues:

---

**Title:** Integrate Haptic Feedback on Key Interactions

**Label:** `Feature`

**Parent Issue:** Haptic Feedback & Micro-interactions

**Dependencies:** All feature milestones (M1-M9) must be complete — this touches files across the entire app.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task adds haptic feedback throughout the app using `expo-haptics`. Haptics give a tactile confirmation that makes the app feel more native and responsive.

**What to do:**

1. Install if not present:
   ```
   npx expo install expo-haptics
   ```

2. Create a thin wrapper at `src/lib/haptics.ts`:
   ```ts
   import * as Haptics from 'expo-haptics';

   export const haptics = {
     light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
     medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
     heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
     success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
     warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
     error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
     selection: () => Haptics.selectionAsync(),
   };
   ```

3. Add haptic calls to these interactions across the app:

   | Interaction | Haptic Type | Location |
   |---|---|---|
   | Button press (primary actions) | `light` | All Save/Create/Continue buttons |
   | Destructive action confirm | `warning` | Delete confirmations, Reset confirmations |
   | Successful save/create | `success` | After toast shows on create/update |
   | Delete completed | `error` (short vibration) | After delete operations |
   | Tab switch | `selection` | Tab navigator |
   | Picker selection | `selection` | Category picker, wallet picker, currency picker |
   | Toggle switch | `selection` | Theme toggle, exclude from cashflow, trial toggle |
   | Drag reorder start | `medium` | Wallet list, category list drag handles |
   | Bottom sheet open | `light` | All bottom sheet opens |
   | Pull to refresh | `light` | Home screen |
   | Onboarding step complete | `success` | Each onboarding Continue/Get Started |
   | Pay bill/commitment | `success` | After successful payment |

4. Add haptics calls in the respective component files. For example, in a button's onPress:
   ```ts
   const handleSave = async () => {
     haptics.light();
     // ... save logic
     haptics.success();
   };
   ```

**Do NOT:**
- Add haptics to every single tap — only key interactions. Too much haptic feedback is worse than none.
- Make haptics blocking — they're fire-and-forget (no `await` needed).
- Add haptics to scroll or passive navigation — only interactive actions.

**Acceptance Criteria:**
- [ ] `expo-haptics` installed
- [ ] `src/lib/haptics.ts` wrapper created
- [ ] Haptic feedback on all interactions listed in the table
- [ ] Haptics feel natural and not excessive
- [ ] No crashes on devices that don't support haptics (graceful no-op)
- [ ] Tested on Honor 90

---

## Parent Issue: Empty States & Loading States

**Description:** Audit every screen for proper empty states and loading indicators. Every screen that depends on data should have a clear loading state and a meaningful empty state.

### Issues:

---

**Title:** Audit & Complete Empty States Across All Screens

**Label:** `UI / UX`

**Parent Issue:** Empty States & Loading States

**Dependencies:** All feature milestones (M1-M9) must be complete.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task is a comprehensive audit of every screen to ensure proper empty states exist. Empty states should use the shared `EmptyState` component from `@/components/shared/empty-state` and be specific to the context.

**What to do:**

Audit and fix empty states for every screen/section:

| Screen / Section | Icon (Lucide) | Title | Description | CTA |
|---|---|---|---|---|
| Home — wallet carousel | `Wallet` | No wallets | "Add your first wallet to get started" | "Add Wallet" |
| Home — recent transactions | `Receipt` | No transactions yet | "Your recent transactions will appear here" | "Add Transaction" |
| Home — budgets | `PieChart` | No budgets | "Set a budget to track your spending" | "Create Budget" |
| Wallet detail — transactions | `Receipt` | No transactions | "Transactions for this wallet will appear here" | — |
| Transaction history (filtered) | `Search` | No results | "No transactions match your filters" | "Clear Filters" |
| Transaction history (empty) | `Receipt` | No transactions yet | "Start by adding your first transaction" | "Add Transaction" |
| Budget detail — transactions | `Receipt` | No spending this [period] | "Expenses in this category will appear here" | — |
| Bills — due soon | `CheckCircle` | All caught up! | "No bills due this week" | — |
| Bills — all bills | `FileText` | No bills | "Add your bills and subscriptions" | "Add Bill" |
| Commitments — loans | `Banknote` | No loans | "Track your loans and debt here" | "Add Loan" |
| Commitments — lending | `HandCoins` | No lending | "Track money you've lent to others" | "Add Lending" |
| Commitment detail — payments | `Receipt` | No payments yet | "Payments will appear here as you make them" | — |
| Category management — custom | `Tag` | No custom categories | "Tap + to add a custom category" | — |
| Wallet list (edge case) | `Wallet` | No wallets | "Add your first wallet" | "Add Wallet" |

For each empty state:
- Ensure the `EmptyState` component is used consistently
- CTA button (if present) calls the appropriate action (opens form)
- Icon is relevant to the context
- Text is helpful and not generic

**Do NOT:**
- Show raw "No data" text without proper styling.
- Leave any screen with a blank white area when data is empty.
- Add empty states to screens that can never be empty (e.g., Settings).

**Acceptance Criteria:**
- [ ] Every screen/section from the table has a proper empty state
- [ ] All empty states use the shared `EmptyState` component
- [ ] CTAs trigger the correct action (add wallet, add transaction, etc.)
- [ ] Empty states display correctly in both light and dark themes
- [ ] No screen shows a blank area when data is empty

---

**Title:** Add Loading Skeletons / Indicators

**Label:** `UI / UX`

**Parent Issue:** Empty States & Loading States

**Dependencies:** KV2-1011 (Empty States Audit) should be done first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native using WatermelonDB for storage. While WatermelonDB is fast, there's still a brief moment on first render where data hasn't loaded yet. This task adds loading indicators (and optional skeleton placeholders) to prevent flash of empty content.

**What to do:**

1. Every hook that returns `isLoading` should be checked — when `isLoading` is `true`, show a loading state instead of the empty state or real content.

2. **Simple approach (recommended for V1):** Use an `ActivityIndicator` from React Native, centered on screen, with a subtle appearance:
   ```tsx
   if (isLoading) {
     return (
       <View className="flex-1 items-center justify-center">
         <ActivityIndicator color="hsl(var(--primary))" />
       </View>
     );
   }
   ```

3. **Skeleton approach (optional, for key screens):** If time permits, create a simple skeleton component at `src/components/shared/skeleton.tsx`:
   ```tsx
   interface SkeletonProps {
     width: number | string;
     height: number;
     borderRadius?: number;
   }
   ```
   - Animated pulse effect (opacity animation using Reanimated)
   - Muted background color
   - Used for: wallet cards, transaction items, budget cards

4. Apply loading states to these screens:
   - Home screen (wallet carousel, recent transactions, budgets)
   - Wallet detail
   - Transaction history
   - Budget detail
   - Commitments tab
   - Settings (if settings record hasn't loaded)

**Do NOT:**
- Show loading states that last more than ~200ms — WatermelonDB is fast. If loading is noticeable, there might be a performance issue.
- Block the entire screen — show loading only for the data sections, not the header/navigation.

**Acceptance Criteria:**
- [ ] Loading indicator shown on every data-dependent screen while `isLoading` is true
- [ ] Loading state shown instead of empty state (prevent false "no data" flash)
- [ ] Optional: skeleton components for key list items
- [ ] Loading indicators use the theme's primary color
- [ ] No screen flashes empty state before data loads

---

## Parent Issue: Error Handling & Crash Resilience

**Description:** Ensure the app handles errors gracefully — error boundaries, try/catch in service functions, meaningful error messages, and Sentry integration.

### Issues:

---

**Title:** Comprehensive Error Handling Pass

**Label:** `Chore`

**Parent Issue:** Error Handling & Crash Resilience

**Dependencies:** KV2-162 (Sentry Integration) must be completed — errors are reported to Sentry.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task is a comprehensive audit of all service functions and critical flows to ensure proper error handling — try/catch blocks, meaningful error messages, and Sentry error reporting.

**What to do:**

1. **Audit all service functions** in every `features/*/services/index.ts`:
   - Every `database.write()` call should be wrapped in try/catch
   - Caught errors should: (a) log to console in dev, (b) report to Sentry in production, (c) re-throw with a user-friendly message
   - Pattern:
     ```ts
     export async function createWallet(db: Database, data: WalletFormData): Promise<WalletModel> {
       try {
         return await db.write(async () => {
           // ... create logic
         });
       } catch (error) {
         Sentry.captureException(error);
         throw new Error('Failed to create wallet. Please try again.');
       }
     }
     ```

2. **Audit all form submissions** across all feature components:
   - Every `onSubmit` handler should catch errors from service calls
   - Show an error toast (Sonner Native) with the user-friendly message
   - Never show raw error messages to the user

3. **Audit data loading** — ensure hooks handle errors:
   - If a WatermelonDB query fails, the hook should return an error state
   - Screens should display a retry option

4. **Verify error boundary** (from KV2-162):
   - Ensure the error boundary wraps the main navigator
   - Test by temporarily throwing an error in a component
   - Verify Sentry receives the error report

5. **Audit critical flows:**
   - Transaction creation with balance update — if the batch fails, no partial state
   - Pay bill / pay commitment — same atomicity concern
   - Import data — if import fails, does the user lose their existing data? (They shouldn't — validate before clearing)
   - Reset data — if reset fails midway, is the app in a broken state?

**Do NOT:**
- Add error handling that swallows errors silently — always report to Sentry.
- Show technical error messages to users — translate to user-friendly messages.
- Add retry logic to database operations — WatermelonDB operations either succeed or fail atomically.

**Acceptance Criteria:**
- [ ] All service functions have try/catch with Sentry reporting
- [ ] All form submissions catch errors and show user-friendly toasts
- [ ] Error boundary catches render errors and shows recovery UI
- [ ] No raw error messages visible to users
- [ ] Import validates backup before clearing existing data
- [ ] Critical flows verified for atomicity (no partial state on failure)
- [ ] Sentry receives error reports (verified in dev mode)

---

## Parent Issue: App Icon, Splash Screen & Visual Polish

**Description:** Configure the app's visual identity — icon, splash screen, and final UI tweaks for a polished release.

### Issues:

---

**Title:** Configure App Icon & Splash Screen

**Label:** `Config / Build`

**Parent Issue:** App Icon, Splash Screen & Visual Polish

**Dependencies:** KV2-161 (EAS Build) must be completed — need a working build to test.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task configures the app icon and splash screen for the production release.

**What to do:**

1. **App icon:**
   - Create or obtain app icon assets:
     - `icon.png` — 1024x1024 standard icon
     - `adaptive-icon-foreground.png` — 1024x1024 foreground layer (for Android adaptive icons)
     - `adaptive-icon-background.png` — 1024x1024 solid color or pattern background
   - If no design assets are available yet, create a simple placeholder: gold/amber "K" on a dark (#0A0A0A) background
   - Place assets in `assets/images/` directory
   - Update `app.json`:
     ```json
     {
       "icon": "./assets/images/icon.png",
       "android": {
         "adaptiveIcon": {
           "foregroundImage": "./assets/images/adaptive-icon-foreground.png",
           "backgroundColor": "#0A0A0A"
         }
       }
     }
     ```

2. **Splash screen:**
   - Create `splash.png` — 1284x2778 (or let Expo resize)
   - Design: dark background (#0A0A0A) with the Kasya logo/text centered in gold/amber
   - Update `app.json`:
     ```json
     {
       "splash": {
         "image": "./assets/images/splash.png",
         "resizeMode": "contain",
         "backgroundColor": "#0A0A0A"
       }
     }
     ```

3. **Android notification icon (optional):**
   - Monochrome version for Android status bar notifications (even though notifications are deferred, the icon slot should be configured)

4. Test in an EAS dev build — verify icon appears in app launcher and splash screen shows on launch.

**Do NOT:**
- Use the default Expo icon — replace with Kasya branding.
- Create complex animated splash screens — a static image is sufficient for V1.

**Acceptance Criteria:**
- [ ] App icon shows in Android launcher (not default Expo icon)
- [ ] Adaptive icon works on Android (foreground + background layers)
- [ ] Splash screen shows on app launch (dark background with branding)
- [ ] Splash screen transitions smoothly to the app (no flash of white)
- [ ] All assets in `assets/images/`
- [ ] `app.json` updated with icon and splash config

---

## Parent Issue: Testing & Production Build

**Description:** Full manual testing pass on the physical device and production EAS build configuration.

### Issues:

---

**Title:** Full Manual Testing Pass on Honor 90

**Label:** `Chore`

**Parent Issue:** Testing & Production Build

**Dependencies:** All milestones (M1-M9) and all other M10 issues must be complete.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native, tested on a physical Honor 90 Android device. This task is a comprehensive manual test of every feature to catch bugs before the production build.

**What to do:**

Run through this test script on the physical device:

**1. Fresh Install (Onboarding):**
- [ ] App launches with splash screen
- [ ] Onboarding starts on welcome screen
- [ ] Enter name → Continue works
- [ ] Currency selection works, search filters, PHP pre-selected
- [ ] Default wallet setup — can rename, can add extra wallets
- [ ] Category selection — system locked, optionals toggleable
- [ ] "Get Started" seeds data and navigates to home
- [ ] Re-launching app skips onboarding

**2. Home Screen:**
- [ ] Greeting shows correct name
- [ ] Total balance displays correctly
- [ ] Wallet carousel shows wallets, swipeable
- [ ] Budget section shows budget cards (if budgets exist)
- [ ] Recent transactions section works
- [ ] FAB opens transaction form

**3. Wallets:**
- [ ] Create wallet (all 7 types) — each type works
- [ ] Edit wallet — name, color changes persist
- [ ] Delete wallet — confirmation, removal works
- [ ] Wallet carousel updates after changes
- [ ] Wallet detail shows correct balance
- [ ] Wallet list — drag to reorder persists
- [ ] Credit card wallet — credit limit and statement day fields work

**4. Categories:**
- [ ] System categories visible and locked
- [ ] Create custom category — emoji, name, color
- [ ] Edit custom category
- [ ] Delete custom category
- [ ] Category picker works in transaction form
- [ ] Category management accessible from settings

**5. Transactions:**
- [ ] Create income — balance increases
- [ ] Create expense — balance decreases
- [ ] Create transfer — source decreases, dest increases, fee deducted from source
- [ ] Create refund — balance increases
- [ ] Edit transaction — old balance reversed, new balance applied
- [ ] Delete transaction — balance reversed
- [ ] Transaction history — date grouping works
- [ ] Transaction history — filters work (type, date range)
- [ ] Wallet detail shows filtered transactions

**6. Budgets:**
- [ ] Create budget — tied to category, limit set
- [ ] Budget ring shows correct percentage
- [ ] Adding expense in budget category updates the ring
- [ ] Budget detail shows matching transactions
- [ ] Daily/weekly/monthly periods calculate correctly
- [ ] Over-budget visual indicator works

**7. Bills:**
- [ ] Create bill and subscription
- [ ] Pay bill — creates transaction, updates wallet balance
- [ ] Trial period fields work for subscriptions
- [ ] Due soon indicator works
- [ ] Status changes (active/paused/cancelled)

**8. Commitments:**
- [ ] Create loan and lending
- [ ] Pay loan — creates expense, debits wallet
- [ ] Record lending payment — creates income, credits wallet
- [ ] Progress bar updates after payment
- [ ] Partial payments work
- [ ] Payment history shows on detail screen

**9. Settings:**
- [ ] Edit name — updates greeting on home
- [ ] Change currency — updates across app
- [ ] Theme toggle — system/light/dark all work
- [ ] Category management link works
- [ ] Wallet management link works
- [ ] Export JSON — share sheet opens with file
- [ ] Import JSON — file picker works, data restored
- [ ] Reset — double confirmation, returns to onboarding

**10. General:**
- [ ] Dark theme consistent across all screens
- [ ] Light theme consistent across all screens
- [ ] No JavaScript errors in console during normal usage
- [ ] Haptic feedback on key interactions
- [ ] All empty states render correctly
- [ ] Back navigation works on all push screens
- [ ] App survives backgrounding and foregrounding
- [ ] App survives device rotation (or is locked to portrait)

Log any bugs found as new Linear issues with label `Bug`.

**Do NOT:**
- Ship if any critical bugs remain (data loss, crashes, balance calculation errors).
- Test only in Expo Go — must test on EAS dev build on physical device.

**Acceptance Criteria:**
- [ ] All test cases above pass on Honor 90
- [ ] No critical bugs (crashes, data loss, incorrect balances)
- [ ] Any non-critical bugs logged as separate Bug issues in Linear
- [ ] Test results documented

---

**Title:** Production EAS Build

**Label:** `Config / Build`

**Parent Issue:** Testing & Production Build

**Dependencies:** KV2-1051 (Manual Testing Pass) must be complete with no critical bugs.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the production APK using EAS Build for distribution/sideloading.

**What to do:**

1. **Pre-build checklist:**
   - Verify `app.json` has correct values:
     - `name`: "Kasya"
     - `version`: "2.0.0" (or appropriate version)
     - `android.versionCode`: 1
     - `android.package`: "com.r3stack.kasya"
     - `owner`: "r3stack"
   - Verify app icon and splash screen configured
   - Verify Sentry DSN is set (via environment variable or EAS secrets)
   - Remove any debug/test code

2. **Configure EAS secrets** (if using Sentry or other services):
   ```
   eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "your-dsn-here" --scope project
   ```

3. **Build production APK:**
   ```
   eas build --profile production --platform android
   ```

4. **Install and verify:**
   - Download the production APK from EAS
   - Install on Honor 90
   - Run through a quick smoke test:
     - App launches (splash → home or onboarding)
     - Create a wallet and transaction
     - Check balance updates
     - Toggle theme
     - Export data
   - Verify no dev menu, no debug logs, no yellow box warnings

5. **Archive the APK** — save the production APK for distribution.

**Do NOT:**
- Build AAB (Android App Bundle) — APK is needed for direct sideloading since there's no Play Store distribution yet.
- Include dev dependencies or debug tools in the production build.
- Skip the smoke test on the production build — it may behave differently from dev builds.

**Acceptance Criteria:**
- [ ] `app.json` has correct production values (version, package, owner)
- [ ] `eas build --profile production --platform android` succeeds
- [ ] Production APK installs on Honor 90
- [ ] Smoke test passes (launch, create data, verify, export)
- [ ] No dev menu accessible in production build
- [ ] No console warnings/errors visible
- [ ] Sentry reports errors correctly in production mode
- [ ] APK archived for distribution
