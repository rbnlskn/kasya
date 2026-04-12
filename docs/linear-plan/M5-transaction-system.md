# Milestone 5: Transaction System

## Milestone Details (for Linear)

- **Title:** M5 — Transaction System
- **Description:** Implement the full transaction domain — the core feature of the app. Covers all 4 transaction types (income, expense, transfer, refund), atomic wallet balance updates, the transaction form (bottom sheet), transaction history with date grouping and filtering, per-wallet transaction lists, and the home screen transaction summary. This is the most complex milestone because every transaction must atomically update wallet balances.
- **Why fifth:** Transactions depend on Wallets (M3) and Categories (M4). Every other domain (Budgets, Bills, Commitments) creates transactions. This is the central nervous system of the app.
- **Definition of Done:**
  - Can create, edit, and delete all 4 transaction types
  - Wallet balances update atomically with transaction operations
  - Transfer transactions move money between two wallets (with optional fee)
  - Transaction history screen with date-grouped sections and type/date filtering
  - Wallet detail screen shows filtered transactions for that wallet
  - Home screen shows recent transactions
  - All forms validate with Zod

---

## Parent Issue: Transaction CRUD & Service Layer

**Description:** Implement the transaction data layer — types, Zod schemas, service functions with atomic balance updates, and reactive hooks. The key complexity is that every create/edit/delete must atomically update the affected wallet(s)' balance in the same database write.

### Issues:

---

**Title:** Transaction Types & Zod Schemas

**Label:** `Feature`

**Parent Issue:** Transaction CRUD & Service Layer

**Dependencies:** KV2-132 (WatermelonDB Model Classes) — the TransactionModel must exist.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the type definitions and Zod validation schema for the transaction form. Transactions are the most complex data type — the schema must handle 4 transaction types with conditional fields.

**What to do:**

1. Create `src/features/transaction/types.ts`:
   ```ts
   export enum TransactionType {
     Income = 'income',
     Expense = 'expense',
     Transfer = 'transfer',
     Refund = 'refund',
   }

   export const TRANSACTION_TYPE_CONFIG: Record<TransactionType, {
     label: string;
     color: string;       // Tailwind class name or hex
     icon: string;        // Lucide icon name
     sign: '+' | '-' | '';
   }> = {
     [TransactionType.Income]: { label: 'Income', color: 'income', icon: 'ArrowDownLeft', sign: '+' },
     [TransactionType.Expense]: { label: 'Expense', color: 'expense', icon: 'ArrowUpRight', sign: '-' },
     [TransactionType.Transfer]: { label: 'Transfer', color: 'transfer', icon: 'ArrowLeftRight', sign: '' },
     [TransactionType.Refund]: { label: 'Refund', color: 'refund', icon: 'RotateCcw', sign: '+' },
   };
   ```

2. Create `src/features/transaction/schemas.ts`:
   ```ts
   import { z } from 'zod';
   import { TransactionType } from './types';

   export const transactionFormSchema = z.object({
     type: z.nativeEnum(TransactionType),
     amount: z.number().positive('Amount must be greater than 0'),
     categoryId: z.string().min(1, 'Category is required'),
     walletId: z.string().min(1, 'Wallet is required'),
     transferToWalletId: z.string().optional(),
     fee: z.number().min(0).optional(),
     date: z.number().positive('Date is required'),  // timestamp
     title: z.string().max(100).optional(),
     note: z.string().max(500).optional(),
     excludeFromCashflow: z.boolean().optional(),
   }).refine(
     (data) => {
       if (data.type === TransactionType.Transfer) {
         return !!data.transferToWalletId && data.transferToWalletId.length > 0;
       }
       return true;
     },
     { message: 'Destination wallet is required for transfers', path: ['transferToWalletId'] }
   ).refine(
     (data) => {
       if (data.type === TransactionType.Transfer) {
         return data.transferToWalletId !== data.walletId;
       }
       return true;
     },
     { message: 'Source and destination wallets must be different', path: ['transferToWalletId'] }
   );

   export type TransactionFormData = z.infer<typeof transactionFormSchema>;
   ```

**Do NOT:**
- Add `billId` or `commitmentId` to the form schema — those are set programmatically by the Bill/Commitment pay flows (M7/M8), not by the user.
- Add `createdAt` — it's set automatically in the service layer.

**Acceptance Criteria:**
- [ ] `TransactionType` enum with 4 types
- [ ] `TRANSACTION_TYPE_CONFIG` with label, color, icon, sign for each type
- [ ] `transactionFormSchema` validates all required fields
- [ ] Schema conditionally requires `transferToWalletId` for transfer type
- [ ] Schema prevents same wallet for source and destination in transfers
- [ ] `TransactionFormData` type exported

---

**Title:** Transaction Service Functions with Atomic Balance Updates

**Label:** `Database`

**Parent Issue:** Transaction CRUD & Service Layer

**Dependencies:** KV2-501 (Transaction Schemas) must be completed first.

---

**Description:**

Kasya is a local-first finance app using WatermelonDB for storage. This task creates the transaction service functions. **The critical requirement is that every transaction create/edit/delete must atomically update wallet balances in the same `database.write()` block.** This ensures data consistency — you never have a transaction without a corresponding balance change.

**What to do:**

Create `src/features/transaction/services/index.ts`:

1. **`createTransaction(db: Database, data: TransactionFormData): Promise<TransactionModel>`**

   Inside a single `database.write()` block:

   a. Create the transaction record with all fields from `data`, plus:
      - `created_at`: `Date.now()`
      - `bill_id`: `null`
      - `commitment_id`: `null`

   b. Update wallet balance based on transaction type:
      - **Income:** `wallet.balance += amount`
      - **Expense:** `wallet.balance -= amount`
      - **Transfer:**
        - Source wallet: `sourceWallet.balance -= (amount + (fee || 0))`
        - Destination wallet: `destWallet.balance += amount`
        - The fee is absorbed by the source wallet (deducted but not added to destination)
      - **Refund:** `wallet.balance += amount`

   Use `prepareUpdate` and `db.batch()` for atomic multi-record updates:
   ```ts
   await db.write(async () => {
     const txn = await txnCollection.prepareCreate((t) => { /* set fields */ });
     const walletUpdate = wallet.prepareUpdate((w) => {
       w.balance = w.balance + amount; // or - amount, based on type
     });
     // For transfers, also prepare destination wallet update
     await db.batch(txn, walletUpdate, /* destWalletUpdate if transfer */);
   });
   ```

2. **`updateTransaction(db: Database, txnId: string, newData: TransactionFormData): Promise<void>`**

   This is the most complex operation. Inside a single `database.write()`:

   a. Find the existing transaction
   b. **Reverse the old balance effect:**
      - If old type was Income: `oldWallet.balance -= oldAmount`
      - If old type was Expense: `oldWallet.balance += oldAmount`
      - If old type was Transfer: reverse both source and dest
      - If old type was Refund: `oldWallet.balance -= oldAmount`
   c. **Apply the new balance effect:** (same logic as create, with new values)
   d. Update the transaction record with new data
   e. Batch all updates atomically

3. **`deleteTransaction(db: Database, txnId: string): Promise<void>`**

   Inside a single `database.write()`:

   a. Find the transaction
   b. Reverse the balance effect (same reversal logic as update step b)
   c. Destroy the transaction permanently
   d. Batch the wallet update + transaction deletion

4. **Helper: `getBalanceEffect(type: TransactionType, amount: number, fee?: number)`**
   - Returns an object describing how the transaction affects wallet(s)
   - Centralizes the balance calculation logic so create/update/delete all use the same math

**Do NOT:**
- Update balances outside of the `database.write()` block — atomicity is non-negotiable.
- Use separate `database.write()` calls for the transaction and the balance update — they MUST be in the same write block.
- Handle bill/commitment linking here — those services will call `createTransaction` with additional fields.

**Acceptance Criteria:**
- [ ] `createTransaction` creates a transaction AND updates wallet balance atomically
- [ ] Income adds to wallet balance
- [ ] Expense subtracts from wallet balance
- [ ] Transfer subtracts from source (amount + fee) and adds to destination (amount only)
- [ ] Refund adds to wallet balance
- [ ] `updateTransaction` reverses old balance effect and applies new one atomically
- [ ] `deleteTransaction` reverses balance effect and removes the transaction atomically
- [ ] All operations use `db.batch()` for multi-record atomic writes
- [ ] Balance math is consistent and uses a shared helper function
- [ ] No partial state possible (transaction exists but balance not updated, or vice versa)

---

**Title:** Transaction Reactive Hooks

**Label:** `Feature`

**Parent Issue:** Transaction CRUD & Service Layer

**Dependencies:** KV2-502 (Transaction Services) and KV2-133 (DatabaseProvider) must be completed first.

---

**Description:**

Kasya uses WatermelonDB observables for reactive data. This task creates hooks for reading transaction data — all transactions, per-wallet transactions, and recent transactions for the home screen.

**What to do:**

Create `src/features/transaction/hooks/index.ts`:

1. **`useTransactions(options?: { limit?: number, walletId?: string, categoryId?: string, type?: TransactionType }): { transactions: TransactionModel[], isLoading: boolean }`**
   - Query `transactions` table with optional filters
   - Sort by `date` descending (newest first), then `created_at` descending
   - If `walletId` provided: `Q.where('wallet_id', walletId)`
   - If `categoryId` provided: `Q.where('category_id', categoryId)`
   - If `type` provided: `Q.where('type', type)`
   - If `limit` provided: `Q.take(limit)`
   - Subscribe to `.observe()`

2. **`useTransactionsByDateRange(startDate: number, endDate: number, walletId?: string): { transactions: TransactionModel[], isLoading: boolean }`**
   - Query with date range filter: `Q.where('date', Q.between(startDate, endDate))`
   - Optionally filtered by wallet
   - Used by Budget spending calculations (M6) and transaction history filtering

3. **`useRecentTransactions(limit: number = 5): { transactions: TransactionModel[], isLoading: boolean }`**
   - Convenience hook: all transactions sorted by date desc, limited to `limit`
   - Used on the home screen

4. **`useTransactionById(id: string): { transaction: TransactionModel | null, isLoading: boolean }`**
   - Find and observe a single transaction

**Do NOT:**
- Group transactions by date in the hook — that's a utility/presentation concern handled in the UI layer.
- Compute spending totals in the hook — that's done by budget hooks (M6).
- Cache or duplicate data in Zustand.

**Acceptance Criteria:**
- [ ] `useTransactions()` returns filtered, sorted transactions reactively
- [ ] `useTransactionsByDateRange()` filters by date range
- [ ] `useRecentTransactions()` returns the N most recent transactions
- [ ] `useTransactionById()` returns a single transaction or null
- [ ] All hooks update reactively when transactions change
- [ ] Filters (walletId, categoryId, type) compose correctly
- [ ] All subscriptions cleaned up on unmount

---

**Title:** Transaction Date Grouping Utility

**Label:** `Chore`

**Parent Issue:** Transaction CRUD & Service Layer

**Dependencies:** KV2-503 (Transaction Hooks) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. The transaction history displays transactions grouped by date (e.g., "Today", "Yesterday", "Mon, Jan 15", etc.). This task creates the utility function that groups a flat array of transactions into date-labeled sections.

**What to do:**

Create `src/features/transaction/utils.ts`:

1. **`groupTransactionsByDate(transactions: TransactionModel[]): { title: string; data: TransactionModel[] }[]`**
   - Takes a flat array of transactions (already sorted by date descending)
   - Groups them by date (ignoring time)
   - Returns an array of sections, each with a `title` and `data` array
   - Title formatting (use `date-fns`):
     - If today: `"Today"`
     - If yesterday: `"Yesterday"`
     - If within this week: day name (e.g., `"Wednesday"`)
     - If within this year: `"Mon, Jan 15"` format
     - If previous year: `"Mon, Jan 15, 2024"` format

2. **`calculateDailySummary(transactions: TransactionModel[]): { income: number; expense: number; net: number }`**
   - Takes a group of transactions (e.g., one day's worth)
   - Sums income, expense separately, and computes net
   - Transfers and refunds are excluded from the summary (or handled specially)

**Do NOT:**
- Fetch data — this is a pure utility that transforms data passed to it.
- Use moment.js — use `date-fns` for all date operations.

**Acceptance Criteria:**
- [ ] `groupTransactionsByDate` correctly groups transactions by date
- [ ] "Today" and "Yesterday" labels used for recent dates
- [ ] Day name used for within-this-week dates
- [ ] Formatted date used for older dates
- [ ] `calculateDailySummary` correctly sums income and expense
- [ ] All date formatting uses `date-fns`
- [ ] Functions are pure (no side effects, no data fetching)

---

## Parent Issue: Transaction UI

**Description:** Build the transaction UI components — the transaction form (most complex form in the app), transaction list item, transaction history screen with filtering, per-wallet transaction list, and home screen recent transactions section.

### Issues:

---

**Title:** Transaction Form (Bottom Sheet)

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Transaction UI

**Dependencies:**
- KV2-502 (Transaction Services) — form calls create/update/delete services
- KV2-411 (Category Picker) — form opens this to select a category
- KV2-152 (Bottom Sheet Component) — form renders inside this

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the transaction form — the most-used form in the app. It's presented in a Gorhom Bottom Sheet and handles creating and editing all 4 transaction types: income, expense, transfer, and refund.

The form uses React Hook Form for state management and Zod for validation (schema from `src/features/transaction/schemas.ts`). On save, it calls the transaction service functions from `src/features/transaction/services/` which atomically create the transaction AND update wallet balances.

**What to do:**

Create `src/features/transaction/components/transaction-form.tsx`:

```tsx
interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: TransactionModel; // If provided, edit mode
  defaultWalletId?: string;       // Pre-select wallet (when opened from wallet detail)
}
```

1. **Form wrapper** — Render inside the shared `<BottomSheet>` from `@/components/ui/bottom-sheet`. Snap points: `['85%', '95%']`.

2. **Type selector** — 4 horizontal pills at the top: Income, Expense, Transfer, Refund. Each pill has a colored indicator matching `TRANSACTION_TYPE_CONFIG` colors. Selecting a type may show/hide conditional fields (transfer fields). Default to Expense.

3. **Amount input** — Large, prominent number input. Currency symbol prefix from user settings (MMKV). This should be the primary visual focus of the form. Use a custom `useCurrencyInput` hook (create it at `src/hooks/use-currency-input.ts` if it doesn't exist):
   - Accepts raw numeric input (no decimal point key needed)
   - Typing "1234" displays "12.34"
   - Typing "100" displays "1.00"
   - Always shows 2 decimal places
   - Returns the numeric value in cents or as a float

4. **Category picker** — Tappable field showing the selected category's emoji icon + name. Tapping opens the Category Picker bottom sheet from `@/features/category/components/category-picker`. Required for all types.

5. **Wallet picker** — Tappable field showing the selected wallet's name + color dot. Opens a wallet selection list (simple bottom sheet or inline dropdown). Required for all types. If `defaultWalletId` prop is provided, pre-select that wallet.

6. **Transfer destination** — Second wallet picker. Only visible when type is "transfer". Label: "To Wallet". Must prevent selecting the same wallet as source.

7. **Fee input** — Small number input. Only visible when type is "transfer". Optional. Label: "Transfer Fee". If provided, the fee is deducted from the source wallet in addition to the transfer amount.

8. **Date picker** — Defaults to now (`Date.now()`). Tappable field displaying the date in "Mon, Jan 15, 2026" format (use `date-fns` `format()`). Tapping opens a date picker.

9. **Title** — Optional text input, max 100 chars. Placeholder: "What's this for?"

10. **Note** — Optional multiline text input, max 500 chars. Placeholder: "Add a note..."

11. **Exclude from cashflow** — Toggle switch. Default off. Label: "Exclude from cashflow". Only show for Income and Expense types.

12. **Save button** — "Save Transaction" button at bottom:
    - Validate form with Zod schema via React Hook Form
    - If creating: call `createTransaction(db, formData)` from services
    - If editing: call `updateTransaction(db, txn.id, formData)` from services
    - Show success toast via Sonner Native (`sonner-native`)
    - Close the bottom sheet

13. **Edit mode** — If `transaction` prop provided, pre-fill all fields. Show a "Delete" button (destructive red text) that calls `deleteTransaction(db, txn.id)` with a confirmation dialog.

**Do NOT:**
- Put business logic (balance updates) in the component — service functions handle that.
- Create inline styles — use NativeWind classes only.
- Skip form validation — all saves must go through the Zod schema.
- Allow selecting the same wallet for source and destination in transfers.

**Acceptance Criteria:**
- [ ] Form renders in a bottom sheet with all fields listed above
- [ ] Type selector switches between 4 types and shows/hides conditional fields
- [ ] Amount input formats currency correctly (typing "1234" → "12.34")
- [ ] Category picker opens and returns selected category
- [ ] Wallet picker works; transfer prevents same source/dest
- [ ] Date picker defaults to today and allows changing
- [ ] Zod validation catches missing required fields and shows errors
- [ ] Save creates transaction and updates wallet balance atomically (via service)
- [ ] Edit mode pre-fills all fields from existing transaction
- [ ] Delete button (edit mode only) removes transaction with confirmation
- [ ] Success toast shown after save/delete
- [ ] Form closes after successful operation
- [ ] `useCurrencyInput` hook created at `src/hooks/use-currency-input.ts`

---

**Title:** Transaction List Item Component

**Label:** `UI / UX`

**Parent Issue:** Transaction UI

**Dependencies:** KV2-501 (Transaction Types) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the transaction list item — a reusable row component used in the transaction history, wallet detail, and home screen.

**What to do:**

Create `src/features/transaction/components/transaction-item.tsx`:

```tsx
interface TransactionItemProps {
  transaction: TransactionModel;
  currencySymbol: string;
  onPress: (transaction: TransactionModel) => void;
  showWalletName?: boolean;  // Show which wallet (useful in full history)
}
```

**Design:**
- Left side:
  - Category emoji icon in a circular container tinted with the category's color
  - Next to it: transaction title (or category name if no title) in bold, and below it the date/time in muted small text
- Right side:
  - Amount with sign prefix and transaction type color:
    - Income: `+₱1,234.00` in green
    - Expense: `-₱1,234.00` in red
    - Transfer: `₱1,234.00` in blue (no sign)
    - Refund: `+₱1,234.00` in orange
  - If `showWalletName`, show the wallet name in small muted text below the amount
- Entire row is tappable — calls `onPress`
- Separator line between items (or use spacing)

**Loading the related category:**
- The transaction has `category_id` — use `transaction.category.observe()` or fetch the category to get its icon and name
- Handle the case where the category might not exist (deleted category) — show a fallback icon

**Do NOT:**
- Add swipe-to-delete — deletion is via the transaction form.
- Show all fields (note, fee, etc.) — this is a compact list view. Full details are in the form.
- Hard-code the currency symbol — receive it as a prop.

**Acceptance Criteria:**
- [ ] Item displays category icon, title/category name, date, and formatted amount
- [ ] Amount colored based on transaction type (green/red/blue/orange)
- [ ] Amount shows correct sign prefix (+/-)
- [ ] Wallet name optionally displayed
- [ ] Tapping the item calls `onPress`
- [ ] Handles missing category gracefully (fallback icon)
- [ ] Clean, compact design suitable for dense lists

---

**Title:** Transaction History Screen

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Transaction UI

**Dependencies:**
- KV2-512 (Transaction List Item) must be completed first
- KV2-504 (Date Grouping Utility) must be completed first

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the full transaction history screen — a push screen accessible from the home screen that shows all transactions grouped by date with filtering options.

**What to do:**

1. Update `transactions.tsx` (replace the placeholder content):

2. **Header:** Title "Transactions" with a back button and a filter icon button.

3. **Filters (collapsible section below header):**
   - Tapping the filter icon toggles a filter bar
   - **Type filter:** Horizontal pills for All, Income, Expense, Transfer, Refund. Selecting one filters the list.
   - **Date range filter:** "This Month" / "Last Month" / "Custom Range" selector. Custom range opens a date range picker (two date inputs: from/to).
   - Active filters shown as small badges/chips above the list

4. **Transaction list:**
   - Use `SectionList` (not FlashList — SectionList supports grouped headers natively)
   - Data from `useTransactions()` hook (with applied filters), passed through `groupTransactionsByDate()`
   - Section headers show the date title (from utility) and a daily summary (income / expense totals for that day)
   - Each item is a `TransactionItem` with `showWalletName={true}` (since this shows transactions across all wallets)
   - Tapping a transaction opens the transaction form in edit mode

5. **Empty state:** If no transactions match the filters: `EmptyState` with icon `Receipt`, title "No transactions", description varies based on active filters.

6. **Summary header (optional but nice):** At the very top, a card showing total income, total expense, and net for the current filter period.

**Do NOT:**
- Implement infinite scroll/pagination — for V1, load all matching transactions. Optimization can come later if needed.
- Add search by text — type and date filters are sufficient for V1.

**Acceptance Criteria:**
- [ ] Screen shows all transactions grouped by date
- [ ] Section headers display date title and daily summary
- [ ] Type filter (All/Income/Expense/Transfer/Refund) works
- [ ] Date range filter (This Month/Last Month/Custom) works
- [ ] Active filters shown as chips
- [ ] Tapping a transaction opens the form in edit mode
- [ ] Empty state when no transactions match filters
- [ ] Back navigation works
- [ ] `SectionList` renders grouped data correctly

---

**Title:** Wire Transactions into Wallet Detail Screen

**Label:** `Feature`

**Parent Issue:** Transaction UI

**Dependencies:**
- KV2-512 (Transaction List Item) must be completed first
- KV2-314 (Wallet Detail Screen) must be completed first

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task wires up real transaction data into the wallet detail screen that was created as a placeholder in M3 (KV2-314). Replace the empty state with a filtered transaction list showing only transactions for that wallet.

**What to do:**

1. In `wallet/[id].tsx`, replace the transaction placeholder section:

2. **Use `useTransactions({ walletId: id })`** to get transactions for this wallet

3. **Transaction list:**
   - Group by date using `groupTransactionsByDate()`
   - Use `SectionList` with section headers (date title + daily summary)
   - Each item is a `TransactionItem` with `showWalletName={false}` (we're already on the wallet's screen)
   - Tapping a transaction opens the transaction form in edit mode

4. **Empty state:** Keep the empty state from KV2-314 for when the wallet has no transactions

5. **FAB (Floating Action Button):** Add a "+" FAB at the bottom-right corner that opens the transaction form in create mode with `defaultWalletId` set to the current wallet's ID. This way, the wallet is pre-selected.
   - FAB: circular button, primary color, Lucide `Plus` icon
   - Position: absolute, bottom-right with safe area margins

**Do NOT:**
- Rebuild the wallet header — it should already be working from KV2-314.
- Add filtering on the wallet detail screen — the full history screen handles that.

**Acceptance Criteria:**
- [ ] Wallet detail shows real transactions filtered by wallet ID
- [ ] Transactions grouped by date with section headers
- [ ] Tapping a transaction opens edit form
- [ ] Empty state shown when wallet has no transactions
- [ ] FAB opens transaction form with wallet pre-selected
- [ ] Balance in the header updates reactively when transactions change

---

**Title:** Home Screen Recent Transactions & Quick Add

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Transaction UI

**Dependencies:**
- KV2-512 (Transaction List Item) must be completed first
- KV2-312 (Wallet Carousel) must be completed first

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task builds the home screen content — integrating the wallet carousel (already built), a recent transactions section, and a quick-add FAB for creating new transactions.

**What to do:**

1. Update `(tabs)/index.tsx` (replace the placeholder content):

2. **Screen structure (top to bottom in a ScrollView):**

   a. **Greeting header:**
      - "Hi, [name]!" — read name from MMKV (`MMKV_KEYS.USER_NAME`)
      - Total balance below: "₱12,345.67" using `useTotalBalance()` hook and `CurrencyDisplay`

   b. **Wallet carousel:**
      - Render `WalletCarousel` component from M3
      - `onWalletPress` → navigate to `wallet/[id]`
      - `onAddPress` → open wallet form in create mode
      - `onViewAll` → navigate to `/wallets`

   c. **Recent Transactions section:**
      - `SectionHeader` with title "RECENT TRANSACTIONS" and `onViewAll` → navigate to `/transactions`
      - Use `useRecentTransactions(10)` hook
      - Render `TransactionItem` components in a vertical list (NOT inside a SectionList since this is a simple flat list of recent items)
      - `showWalletName={true}`
      - Tapping a transaction opens the form in edit mode
      - If no transactions, show a compact empty state: "No transactions yet"

3. **FAB (Floating Action Button):**
   - "+" button, absolute positioned at bottom-right
   - Primary color, circular, shadow
   - Lucide `Plus` icon
   - Tapping opens the transaction form in create mode (no wallet pre-selected)

4. **Pull to refresh (optional but nice):** `RefreshControl` on the ScrollView — though with WatermelonDB observables, data is always live. Can be a no-op or a visual-only refresh.

**Do NOT:**
- Build the full transaction history on the home screen — just show recent 10.
- Add analytics/charts — deferred to Project 2.
- Add budget ring or bill summary to the home screen in this issue — those come in M6 and M7 respectively.

**Acceptance Criteria:**
- [ ] Home screen displays greeting with user name
- [ ] Total balance displayed from all wallets
- [ ] Wallet carousel renders and is interactive
- [ ] Recent transactions section shows last 10 transactions
- [ ] "View All" navigates to full transaction history
- [ ] FAB opens transaction form in create mode
- [ ] Tapping a transaction opens form in edit mode
- [ ] Empty state if no transactions
- [ ] Screen scrolls if content overflows
