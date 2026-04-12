# Milestone 6: Budget System

## Milestone Details (for Linear)

- **Title:** M6 — Budget System
- **Description:** Implement the full budget domain — budget CRUD, spending calculation from transactions per period (daily/weekly/monthly), ring/progress visualization, budget detail screen with filtered transaction list, and integration into the home screen. Budgets are tied to categories and track how much the user spends against a set limit within a time period.
- **Why sixth:** Budgets depend on Categories (M4) for category assignment and Transactions (M5) for spending calculation. Without real transaction data, budgets can't compute spending.
- **Definition of Done:**
  - Can create budgets tied to categories with a spending limit and period
  - Budget cards show a progress ring (spent vs limit)
  - Budget detail screen shows filtered transactions contributing to the budget
  - Spending auto-calculates from transactions in the current period
  - Budgets section visible on the home screen
  - All forms validate with Zod

---

## Parent Issue: Budget CRUD & Service Layer

**Description:** Implement the budget data layer — types, Zod schemas, service functions, reactive hooks with spending calculation, and period utilities.

### Issues:

---

**Title:** Budget Types, Schemas & Period Utilities

**Label:** `Feature`

**Parent Issue:** Budget CRUD & Service Layer

**Dependencies:** KV2-132 (WatermelonDB Model Classes) — the BudgetModel must exist.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the type definitions, Zod validation schema, and date period utilities for budgets.

Budgets operate on a period basis — daily, weekly, or monthly. The utility functions calculate the start/end dates of the current period for each budget.

**What to do:**

1. Create `src/features/budget/types.ts`:
   ```ts
   export enum BudgetPeriod {
     Daily = 'daily',
     Weekly = 'weekly',
     Monthly = 'monthly',
   }

   export const BUDGET_PERIOD_CONFIG: Record<BudgetPeriod, { label: string; shortLabel: string }> = {
     [BudgetPeriod.Daily]: { label: 'Daily', shortLabel: '/day' },
     [BudgetPeriod.Weekly]: { label: 'Weekly', shortLabel: '/week' },
     [BudgetPeriod.Monthly]: { label: 'Monthly', shortLabel: '/month' },
   };
   ```

2. Create `src/features/budget/schemas.ts`:
   ```ts
   import { z } from 'zod';
   import { BudgetPeriod } from './types';

   export const budgetFormSchema = z.object({
     name: z.string().min(1, 'Budget name is required').max(50),
     categoryId: z.string().min(1, 'Category is required'),
     limit: z.number().positive('Limit must be greater than 0'),
     period: z.nativeEnum(BudgetPeriod),
     icon: z.string().min(1, 'Icon is required'),
     color: z.string().min(1, 'Color is required'),
     description: z.string().max(200).optional(),
   });

   export type BudgetFormData = z.infer<typeof budgetFormSchema>;
   ```

3. Create `src/features/budget/utils.ts` — period date range utilities:

   ```ts
   import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
   import { BudgetPeriod } from './types';

   /**
    * Get the start and end timestamps for the current period of a budget.
    * Returns { start: number, end: number } as Unix timestamps.
    */
   export function getCurrentPeriodRange(period: BudgetPeriod, referenceDate: Date = new Date()): {
     start: number;
     end: number;
   } {
     switch (period) {
       case BudgetPeriod.Daily:
         return { start: startOfDay(referenceDate).getTime(), end: endOfDay(referenceDate).getTime() };
       case BudgetPeriod.Weekly:
         return { start: startOfWeek(referenceDate, { weekStartsOn: 1 }).getTime(), end: endOfWeek(referenceDate, { weekStartsOn: 1 }).getTime() };
       case BudgetPeriod.Monthly:
         return { start: startOfMonth(referenceDate).getTime(), end: endOfMonth(referenceDate).getTime() };
     }
   }

   /**
    * Calculate the percentage spent (0-100+). Can exceed 100 if over budget.
    */
   export function getSpendingPercentage(spent: number, limit: number): number {
     if (limit <= 0) return 0;
     return Math.round((spent / limit) * 100);
   }

   /**
    * Get a color for the spending progress:
    * - Green: 0-60%
    * - Yellow/Amber: 61-85%
    * - Red: 86%+
    */
   export function getSpendingColor(percentage: number): string {
     if (percentage <= 60) return 'income';    // green Tailwind class
     if (percentage <= 85) return 'refund';    // amber Tailwind class
     return 'expense';                          // red Tailwind class
   }
   ```

**Do NOT:**
- Compute spending here — that's the hook's job. This file only provides date ranges and formatting.
- Add week starting day as a setting — hardcode Monday (`weekStartsOn: 1`) for V1.

**Acceptance Criteria:**
- [ ] `BudgetPeriod` enum with 3 values
- [ ] `BUDGET_PERIOD_CONFIG` with labels
- [ ] `budgetFormSchema` validates name, categoryId, limit, period, icon, color
- [ ] `getCurrentPeriodRange()` returns correct start/end for daily, weekly, monthly
- [ ] `getSpendingPercentage()` calculates correctly (including >100%)
- [ ] `getSpendingColor()` returns appropriate color class
- [ ] All date calculations use `date-fns`

---

**Title:** Budget Service Functions (CRUD)

**Label:** `Database`

**Parent Issue:** Budget CRUD & Service Layer

**Dependencies:** KV2-601 (Budget Schemas) must be completed first.

---

**Description:**

Kasya is a local-first finance app using WatermelonDB for storage. This task creates the budget CRUD service functions.

**What to do:**

Create `src/features/budget/services/index.ts`:

1. **`createBudget(db: Database, data: BudgetFormData): Promise<BudgetModel>`**
   - Inside `database.write()`, create a new budget record
   - Set all fields from `data`
   - Return the created budget

2. **`updateBudget(db: Database, budgetId: string, data: Partial<BudgetFormData>): Promise<void>`**
   - Find the budget by ID
   - Inside `database.write()`, update provided fields

3. **`deleteBudget(db: Database, budgetId: string): Promise<void>`**
   - Find the budget by ID
   - Inside `database.write()`, call `budget.destroyPermanently()`
   - Note: Deleting a budget does NOT delete any transactions. Budgets are just a tracking overlay.

**Do NOT:**
- Add spending calculation here — that's computed in hooks by querying transactions.
- Delete related transactions when deleting a budget — budgets don't own transactions.

**Acceptance Criteria:**
- [ ] All 3 service functions created and exported
- [ ] `createBudget` creates a budget with all fields
- [ ] `updateBudget` modifies only provided fields
- [ ] `deleteBudget` permanently removes the budget
- [ ] All operations wrapped in `database.write()`

---

**Title:** Budget Reactive Hooks with Spending Calculation

**Label:** `Feature`

**Parent Issue:** Budget CRUD & Service Layer

**Dependencies:**
- KV2-602 (Budget Services) must be completed first
- KV2-503 (Transaction Hooks) — spending is calculated from transaction data

---

**Description:**

Kasya uses WatermelonDB observables for reactive data. This task creates hooks for reading budget data and computing spending in real-time. The spending calculation queries transactions for the budget's category within the current period and sums the expense amounts.

**What to do:**

Create `src/features/budget/hooks/index.ts`:

1. **`useBudgets(): { budgets: BudgetModel[], isLoading: boolean }`**
   - Query `budgets` table
   - Subscribe to `.observe()`

2. **`useBudgetById(id: string): { budget: BudgetModel | null, isLoading: boolean }`**
   - Find and observe a single budget

3. **`useBudgetSpending(budget: BudgetModel): { spent: number, percentage: number, remaining: number, isLoading: boolean }`**
   - This is the key hook. It:
     a. Computes the current period date range using `getCurrentPeriodRange(budget.period)`
     b. Queries `transactions` where:
        - `category_id` matches `budget.categoryId`
        - `type` is `'expense'` (only expenses count toward budget spending)
        - `date` is between `start` and `end` of the current period
        - `exclude_from_cashflow` is not `true`
     c. Subscribes to the query's `.observe()` so spending updates live as transactions change
     d. Sums the `amount` field of all matching transactions
     e. Returns:
        - `spent`: total spent amount
        - `percentage`: from `getSpendingPercentage(spent, budget.limit)`
        - `remaining`: `budget.limit - spent` (can be negative if over budget)

   Implementation approach:
   ```ts
   export function useBudgetSpending(budget: BudgetModel) {
     const db = useDatabase();
     const [spent, setSpent] = useState(0);
     const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
       const { start, end } = getCurrentPeriodRange(budget.period as BudgetPeriod);
       const subscription = db
         .get<TransactionModel>('transactions')
         .query(
           Q.where('category_id', budget.categoryId),
           Q.where('type', 'expense'),
           Q.where('date', Q.between(start, end)),
         )
         .observe()
         .subscribe((transactions) => {
           const total = transactions.reduce((sum, t) => sum + t.amount, 0);
           setSpent(total);
           setIsLoading(false);
         });

       return () => subscription.unsubscribe();
     }, [db, budget.id, budget.period, budget.categoryId]);

     return {
       spent,
       percentage: getSpendingPercentage(spent, budget.limit),
       remaining: budget.limit - spent,
       isLoading,
     };
   }
   ```

4. **`useBudgetTransactions(budget: BudgetModel): { transactions: TransactionModel[], isLoading: boolean }`**
   - Same query as `useBudgetSpending` but returns the actual transactions
   - Used in the budget detail screen to show which transactions contributed to spending

**Do NOT:**
- Include income, transfers, or refund transactions in spending — only expense transactions count.
- Cache spending in Zustand — WatermelonDB observables handle reactivity.
- Include transactions where `exclude_from_cashflow` is true.

**Acceptance Criteria:**
- [ ] `useBudgets()` returns all budgets reactively
- [ ] `useBudgetById()` returns a single budget
- [ ] `useBudgetSpending()` calculates spent amount from expense transactions in the current period
- [ ] Spending updates live when a new matching transaction is created
- [ ] `percentage` correctly computes (can exceed 100%)
- [ ] `remaining` can be negative (over budget)
- [ ] `useBudgetTransactions()` returns matching transactions
- [ ] Only expense transactions counted (not income/transfer/refund)
- [ ] Excluded-from-cashflow transactions not counted

---

## Parent Issue: Budget UI Components

**Description:** Build the budget UI — progress ring component, budget card, budget form (bottom sheet), budget detail screen, and home screen budget section.

### Issues:

---

**Title:** Budget Progress Ring Component

**Label:** `UI / UX`

**Parent Issue:** Budget UI Components

**Dependencies:** KV2-601 (Budget Types & Utilities) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native using React Native Reanimated for animations. This task creates a circular progress ring component used to visualize budget spending. The ring fills from 0% to the current spending percentage, changing color as it approaches the limit.

**What to do:**

Create `src/features/budget/components/budget-ring.tsx`:

```tsx
interface BudgetRingProps {
  percentage: number;   // 0-100+ (can exceed 100 if over budget)
  size?: number;        // diameter in pixels, default 80
  strokeWidth?: number; // ring thickness, default 8
  color?: string;       // override color (otherwise auto from percentage)
  children?: React.ReactNode; // content inside the ring (e.g., percentage text)
}
```

**Implementation:**
- Use `react-native-svg` (`Circle` components) for the ring:
  - Background circle: muted/gray color, full circle
  - Foreground circle: colored arc representing the percentage
  - Use `strokeDasharray` and `strokeDashoffset` to create the partial arc effect
  - Cap at visual 100% for the arc (even if percentage > 100%, the ring doesn't overflow)
- Color auto-determined by `getSpendingColor(percentage)` from budget utils (green → amber → red)
- Animate the fill on mount using React Native Reanimated (`useAnimatedProps` or `useSharedValue` + `withTiming`)
- Center `children` inside the ring (absolute positioned)

**Usage example:**
```tsx
<BudgetRing percentage={75} size={80}>
  <Text className="text-sm font-bold">75%</Text>
</BudgetRing>
```

**Do NOT:**
- Use a third-party chart library for this — SVG circles are simpler and lighter.
- Make the ring interactive (tappable) — it's a display-only component.

**Acceptance Criteria:**
- [ ] Ring renders with correct fill percentage
- [ ] Color changes: green (0-60%), amber (61-85%), red (86%+)
- [ ] Ring caps at visual 100% (no overflow)
- [ ] Children render centered inside the ring
- [ ] Smooth animation on mount
- [ ] Configurable size and strokeWidth
- [ ] Uses react-native-svg and react-native-reanimated

---

**Title:** Budget Card & Budget Form (Bottom Sheet)

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Budget UI Components

**Dependencies:**
- KV2-611 (Budget Ring) must be completed first
- KV2-603 (Budget Hooks) must be completed first
- KV2-411 (Category Picker) — form uses category picker
- KV2-152 (Bottom Sheet) — form renders in bottom sheet

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the budget card (summary component) and the budget form (create/edit in bottom sheet).

**What to do:**

**Part 1: Budget Card**

Create `src/features/budget/components/budget-card.tsx`:

```tsx
interface BudgetCardProps {
  budget: BudgetModel;
  currencySymbol: string;
  onPress: (budget: BudgetModel) => void;
}
```

- Uses `useBudgetSpending(budget)` hook internally to get live spending data
- Layout:
  - Left side: `BudgetRing` showing spending percentage, with percentage text inside
  - Right side:
    - Budget name (bold)
    - Category emoji + name (from budget's linked category)
    - "₱750 / ₱1,000" format (spent / limit) with `CurrencyDisplay`
    - Period label from `BUDGET_PERIOD_CONFIG`
  - If over budget: show a small red "Over budget" badge
- Card background: `bg-card` with subtle border
- Tappable: calls `onPress`

**Part 2: Budget Form**

Create `src/features/budget/components/budget-form.tsx`:

```tsx
interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  budget?: BudgetModel; // If provided, edit mode
}
```

- Uses `useForm<BudgetFormData>()` with `zodResolver(budgetFormSchema)`
- Renders in shared `<BottomSheet>` with snap points `['80%']`

Form fields:
1. **Name** — Input. Label: "Budget Name". Placeholder: "e.g., Food Budget"
2. **Category picker** — Tappable field opening the Category Picker. Shows selected category emoji + name.
3. **Limit** — Currency input. Label: "Spending Limit". Currency symbol prefix.
4. **Period selector** — 3 horizontal pills: Daily, Weekly, Monthly. Default: Monthly.
5. **Icon** — Emoji picker (tappable, opens shared EmojiPicker)
6. **Color** — Color picker (shared `ColorPicker` with `CATEGORY_COLORS`)
7. **Description** — Optional multiline input. Placeholder: "What's this budget for?"

Actions:
- **Save:** Validate → `createBudget()` or `updateBudget()` → toast → close
- **Delete (edit only):** Confirmation → `deleteBudget()` → toast → close

**Do NOT:**
- Allow multiple budgets for the same category and period — add a check in the form: if a budget already exists for the selected category + period, show a warning.
- Compute spending in the card component — use the `useBudgetSpending` hook.

**Acceptance Criteria:**
- [ ] Budget card shows ring, name, category, spent/limit, and period
- [ ] Card's spending data updates reactively
- [ ] "Over budget" indicator shown when spending exceeds limit
- [ ] Budget form renders all fields in a bottom sheet
- [ ] Category picker opens and works
- [ ] Period selector works with 3 options
- [ ] Zod validation on save
- [ ] Create/edit/delete work via service functions
- [ ] Toast + close after operations

---

**Title:** Budget Detail Screen

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Budget UI Components

**Dependencies:**
- KV2-612 (Budget Card & Form) must be completed first
- KV2-113 (Push Screen Routes) — the `budget/[id]` route must exist

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task builds the budget detail screen — a push screen showing a budget's full info, spending breakdown, and the list of transactions contributing to the budget in the current period.

**What to do:**

1. Update `budget/[id].tsx` (replace placeholder):

2. Read route param: `useLocalSearchParams<{ id: string }>()`

3. Fetch data: `useBudgetById(id)`, `useBudgetSpending(budget)`, `useBudgetTransactions(budget)`

4. **Header section:**
   - Large `BudgetRing` centered (size 120-140)
   - Percentage text inside the ring
   - Below ring: budget name, category, period label
   - Spent / Limit: "₱750 / ₱1,000 monthly"
   - Remaining: "₱250 remaining" (green) or "₱50 over budget" (red)
   - Edit button (pencil icon) → opens budget form in edit mode

5. **Transaction list:**
   - Title: "Transactions this [period]"
   - Use `useBudgetTransactions(budget)` to get matching transactions
   - Group by date using `groupTransactionsByDate()`
   - Render with `SectionList` and `TransactionItem` components
   - Tapping a transaction opens the transaction form in edit mode

6. **Empty state:** If no transactions this period: "No spending this [period] yet"

7. **Loading/error states:** Handle loading and invalid budget ID.

**Do NOT:**
- Allow editing the budget inline — use the budget form bottom sheet.
- Show transactions from other periods — only the current period.

**Acceptance Criteria:**
- [ ] Screen shows large budget ring with spending stats
- [ ] Budget name, category, period, and remaining/over displayed
- [ ] Edit button opens budget form in edit mode
- [ ] Transaction list shows only transactions for this budget's category in the current period
- [ ] Transactions grouped by date
- [ ] Empty state when no matching transactions
- [ ] Back navigation works
- [ ] Data updates reactively (adding a transaction updates the ring)

---

**Title:** Home Screen Budget Section

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Budget UI Components

**Dependencies:** KV2-612 (Budget Card & Form) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task adds a budget section to the home screen, below the wallet carousel and above the recent transactions. It shows budget cards in a horizontal scrollable list.

**What to do:**

1. In `(tabs)/index.tsx`, add a budget section between the wallet carousel and recent transactions:

2. **Section header:** `SectionHeader` with title "BUDGETS" and `onViewAll` (for now, `onViewAll` can be undefined — a dedicated budget list screen is optional for V1).

3. **Budget cards list:**
   - Use `useBudgets()` hook to get all budgets
   - Render `BudgetCard` components in a horizontal `FlatList` (or `ScrollView` with horizontal)
   - Each card is compact (width ~180px)
   - Tapping a card navigates to `budget/[id]`
   - If no budgets exist: show a compact card "Set a budget" with a plus icon, tapping opens the budget form in create mode

4. **"Add Budget" card:** At the end of the list, an "Add Budget" card (same style as wallet carousel's add card — dashed border, plus icon). Opens budget form.

**Do NOT:**
- Build a separate budget list screen — the home section and budget detail are sufficient for V1.
- Show spending details in the horizontal list — the card already shows the ring and key info. Full details are on the detail screen.

**Acceptance Criteria:**
- [ ] Budget section appears on home screen between wallets and transactions
- [ ] Horizontal scrollable list of budget cards
- [ ] Each card shows ring, name, spent/limit
- [ ] Tapping a card navigates to budget detail
- [ ] "Add Budget" card at the end
- [ ] Empty state card when no budgets exist
- [ ] Section header with "BUDGETS" title
