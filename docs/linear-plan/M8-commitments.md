# Milestone 8: Commitments (Loans & Lending)

## Milestone Details (for Linear)

- **Title:** M8 — Commitments (Loans & Lending)
- **Description:** Implement the commitments domain — loans the user owes (borrowing) and money the user has lent to others. Commitments track principal, interest, fees, recurring payment schedules, remaining balance, and payment history. Paying a commitment creates a transaction. Commitments integrate into the Commitments tab alongside Bills (M7).
- **Why eighth:** Same dependency pattern as Bills — commitments create transactions (M5), reference categories (M4), and are paid from wallets (M3). Bills (M7) should be done first since they share the Commitments tab.
- **Definition of Done:**
  - Can create/edit/delete commitments of type Loan (user owes) and Lending (user is owed)
  - Payment flow creates a transaction and tracks remaining balance
  - Remaining balance auto-calculates from principal + interest + fees minus payments
  - Payment history visible on commitment detail
  - Commitments appear in the Loans segment of the Commitments tab
  - Progress indicator shows how much has been paid off

---

## Parent Issue: Commitment CRUD & Service Layer

**Description:** Implement the commitment data layer — types, Zod schemas, service functions (CRUD + pay), reactive hooks, and balance calculation utilities.

### Issues:

---

**Title:** Commitment Types, Schemas & Balance Utilities

**Label:** `Feature`

**Parent Issue:** Commitment CRUD & Service Layer

**Dependencies:** KV2-132 (WatermelonDB Model Classes) — the CommitmentModel must exist.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the type definitions, Zod validation schema, and utility functions for commitments (loans and lending).

A commitment represents a financial obligation over time. The total obligation is `principal + interest + fee`. The remaining balance decreases as payments are made (tracked via linked transactions).

**What to do:**

1. Create `src/features/commitment/types.ts`:
   ```ts
   export enum CommitmentType {
     Loan = 'loan',       // User owes money (borrowing)
     Lending = 'lending',  // User is owed money (lent to someone)
   }

   export enum DurationUnit {
     Months = 'months',
     Years = 'years',
   }

   export const COMMITMENT_TYPE_CONFIG: Record<CommitmentType, {
     label: string;
     description: string;
     icon: string;
     paymentLabel: string;    // "Make Payment" vs "Record Payment"
     transactionType: string; // 'expense' for loan, 'income' for lending
   }> = {
     [CommitmentType.Loan]: {
       label: 'Loan',
       description: 'Money you owe',
       icon: '💷',
       paymentLabel: 'Make Payment',
       transactionType: 'expense',
     },
     [CommitmentType.Lending]: {
       label: 'Lending',
       description: 'Money owed to you',
       icon: '💴',
       paymentLabel: 'Record Payment',
       transactionType: 'income',
     },
   };

   export const DURATION_UNIT_CONFIG: Record<DurationUnit, { label: string; toMonths: number }> = {
     [DurationUnit.Months]: { label: 'Months', toMonths: 1 },
     [DurationUnit.Years]: { label: 'Years', toMonths: 12 },
   };
   ```

2. Create `src/features/commitment/schemas.ts`:
   ```ts
   import { z } from 'zod';
   import { CommitmentType, DurationUnit } from './types';

   export const commitmentFormSchema = z.object({
     type: z.nativeEnum(CommitmentType),
     name: z.string().min(1, 'Name is required').max(50),
     principal: z.number().positive('Principal must be greater than 0'),
     interest: z.number().min(0, 'Interest cannot be negative'),
     fee: z.number().min(0, 'Fee cannot be negative'),
     categoryId: z.string().min(1, 'Category is required'),
     dueDay: z.number().int().min(1).max(31, 'Due day must be 1-31'),
     recurrence: z.string().min(1, 'Recurrence is required'),  // uses same RecurrenceFrequency from bills
     icon: z.string().min(1, 'Icon is required'),
     startDate: z.number().positive('Start date is required'),
     duration: z.number().int().positive('Duration must be at least 1'),
     durationUnit: z.nativeEnum(DurationUnit).optional(),
     note: z.string().max(500).optional(),
   });

   export type CommitmentFormData = z.infer<typeof commitmentFormSchema>;
   ```

3. Create `src/features/commitment/utils.ts`:

   ```ts
   /**
    * Calculate the total obligation: principal + interest + fee
    */
   export function getTotalObligation(principal: number, interest: number, fee: number): number {
     return principal + interest + fee;
   }

   /**
    * Calculate remaining balance from total obligation minus sum of payments.
    * @param totalObligation - principal + interest + fee
    * @param totalPaid - sum of all payment transactions linked to this commitment
    */
   export function getRemainingBalance(totalObligation: number, totalPaid: number): number {
     return Math.max(0, totalObligation - totalPaid);
   }

   /**
    * Calculate the percentage paid off (0-100).
    */
   export function getPayoffPercentage(totalObligation: number, totalPaid: number): number {
     if (totalObligation <= 0) return 100;
     return Math.min(100, Math.round((totalPaid / totalObligation) * 100));
   }

   /**
    * Calculate the monthly payment amount (simple division).
    * total / (duration in months)
    */
   export function getMonthlyPayment(
     totalObligation: number,
     duration: number,
     durationUnit: DurationUnit = DurationUnit.Months
   ): number {
     const months = durationUnit === DurationUnit.Years ? duration * 12 : duration;
     if (months <= 0) return 0;
     return totalObligation / months;
   }

   /**
    * Get the expected end date based on start date and duration.
    */
   export function getExpectedEndDate(
     startDate: number,
     duration: number,
     durationUnit: DurationUnit = DurationUnit.Months
   ): Date {
     const months = durationUnit === DurationUnit.Years ? duration * 12 : duration;
     return addMonths(new Date(startDate), months);
   }
   ```

**Do NOT:**
- Implement amortization schedules — use simple division for monthly payments.
- Add compound interest calculations — interest is a flat total set by the user.
- Import from the bill module — commitment recurrence reuses the same enum values but should be self-contained.

**Acceptance Criteria:**
- [ ] `CommitmentType` and `DurationUnit` enums created
- [ ] Config maps with labels, descriptions, icons
- [ ] `commitmentFormSchema` validates all fields
- [ ] `getTotalObligation()` sums principal + interest + fee
- [ ] `getRemainingBalance()` calculates correctly (never goes below 0)
- [ ] `getPayoffPercentage()` returns 0-100
- [ ] `getMonthlyPayment()` divides total by duration in months
- [ ] `getExpectedEndDate()` returns the correct date

---

**Title:** Commitment Service Functions (CRUD + Pay)

**Label:** `Database`

**Parent Issue:** Commitment CRUD & Service Layer

**Dependencies:**
- KV2-801 (Commitment Schemas) must be completed first
- KV2-502 (Transaction Services) — paying a commitment creates a transaction

---

**Description:**

Kasya is a local-first finance app using WatermelonDB for storage. This task creates the commitment CRUD service functions plus the "pay commitment" flow.

The key difference from bills: commitment payments are **income** transactions for Lending type (money coming back to you) and **expense** transactions for Loan type (money going out to pay debt).

**What to do:**

Create `src/features/commitment/services/index.ts`:

1. **`createCommitment(db: Database, data: CommitmentFormData): Promise<CommitmentModel>`**
   - Inside `database.write()`, create a new commitment record
   - Set all fields from `data`
   - Return the created commitment

2. **`updateCommitment(db: Database, commitmentId: string, data: Partial<CommitmentFormData>): Promise<void>`**
   - Find commitment, update provided fields

3. **`deleteCommitment(db: Database, commitmentId: string): Promise<void>`**
   - Permanently destroy the commitment record

4. **`payCommitment(db: Database, commitment: CommitmentModel, walletId: string, amount: number): Promise<void>`**

   Inside a single `database.write()` block:

   a. Determine transaction type based on commitment type:
      - `CommitmentType.Loan` → transaction type is `'expense'` (money going out)
      - `CommitmentType.Lending` → transaction type is `'income'` (money coming back)

   b. Create a transaction:
      - `amount`: the provided `amount` (user can pay partial or full)
      - `type`: determined above
      - `wallet_id`: the provided `walletId`
      - `category_id`: `commitment.categoryId`
      - `commitment_id`: `commitment.id` (links the transaction to this commitment)
      - `date`: `Date.now()`
      - `title`: `commitment.name` (auto-filled)
      - `created_at`: `Date.now()`

   c. Update wallet balance:
      - Loan payment: `wallet.balance -= amount`
      - Lending payment received: `wallet.balance += amount`

   d. Batch all atomically

**Do NOT:**
- Fix the payment amount — allow partial payments (user specifies the amount each time).
- Auto-close commitments when fully paid — the user manages status manually for V1.
- Delete related transactions when deleting a commitment.

**Acceptance Criteria:**
- [ ] All 4 service functions created and exported
- [ ] `payCommitment` creates an expense for Loan type (money out)
- [ ] `payCommitment` creates an income for Lending type (money in)
- [ ] Transaction `commitment_id` links it to the commitment
- [ ] Wallet balance updated correctly (decreased for Loan, increased for Lending)
- [ ] Partial payments supported (amount is user-specified, not fixed)
- [ ] All operations atomic via `db.batch()`

---

**Title:** Commitment Reactive Hooks

**Label:** `Feature`

**Parent Issue:** Commitment CRUD & Service Layer

**Dependencies:** KV2-802 (Commitment Services) and KV2-133 (DatabaseProvider) must be completed first.

---

**Description:**

Kasya uses WatermelonDB observables for reactive data. This task creates hooks for reading commitment data and computing payment progress (remaining balance, payoff percentage).

**What to do:**

Create `src/features/commitment/hooks/index.ts`:

1. **`useCommitments(): { commitments: CommitmentModel[], isLoading: boolean }`**
   - Query all commitments, subscribe to `.observe()`

2. **`useCommitmentById(id: string): { commitment: CommitmentModel | null, isLoading: boolean }`**
   - Find and observe a single commitment

3. **`useCommitmentsByType(type: CommitmentType): { commitments: CommitmentModel[], isLoading: boolean }`**
   - Filtered by type: `Q.where('type', type)`
   - Returns only Loan or only Lending commitments

4. **`useCommitmentProgress(commitment: CommitmentModel): { totalObligation: number, totalPaid: number, remaining: number, percentage: number, isLoading: boolean }`**
   - This is the key hook. It:
     a. Computes `totalObligation` from `getTotalObligation(commitment.principal, commitment.interest, commitment.fee)`
     b. Queries `transactions` where `commitment_id` matches `commitment.id`
     c. Subscribes to the query's `.observe()`
     d. Sums the `amount` of all linked transactions → `totalPaid`
     e. Returns remaining and percentage using utility functions

5. **`useCommitmentPayments(commitmentId: string): { transactions: TransactionModel[], isLoading: boolean }`**
   - Query transactions where `commitment_id` matches
   - Sorted by date descending
   - Used in the commitment detail screen to show payment history

**Do NOT:**
- Cache computed values — always derive from live DB data.
- Mix loan and lending computations — the hooks are type-agnostic; the utilities handle the math.

**Acceptance Criteria:**
- [ ] `useCommitments()` returns all commitments reactively
- [ ] `useCommitmentsByType()` filters by Loan or Lending
- [ ] `useCommitmentProgress()` calculates total paid from linked transactions
- [ ] Progress updates live when a payment transaction is created
- [ ] `useCommitmentPayments()` returns linked transactions sorted by date
- [ ] All subscriptions cleaned up on unmount

---

## Parent Issue: Commitment UI Components

**Description:** Build the commitment UI — commitment card, form (bottom sheet), pay flow, detail screen with payment history, and integration into the Commitments tab's Loans segment.

### Issues:

---

**Title:** Commitment Card & Commitment Form (Bottom Sheet)

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Commitment UI Components

**Dependencies:**
- KV2-803 (Commitment Hooks) must be completed first
- KV2-152 (Bottom Sheet) — form renders in bottom sheet
- KV2-153 (Shared Components) — emoji picker, color picker
- KV2-411 (Category Picker) — form uses category picker

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the commitment card component and the commitment form for create/edit.

**What to do:**

**Part 1: Commitment Card**

Create `src/features/commitment/components/commitment-card.tsx`:

```tsx
interface CommitmentCardProps {
  commitment: CommitmentModel;
  currencySymbol: string;
  onPress: (commitment: CommitmentModel) => void;
  onPay: (commitment: CommitmentModel) => void;
}
```

- Uses `useCommitmentProgress(commitment)` hook internally
- Layout:
  - Left: icon emoji in circular container
  - Center:
    - Commitment name (bold)
    - Type badge: "Loan" (red tint) or "Lending" (green tint)
    - Progress bar: horizontal bar showing payoff percentage (0-100%)
    - "₱5,000 / ₱10,000 paid" — totalPaid / totalObligation
  - Right:
    - Monthly payment amount (calculated from `getMonthlyPayment()`)
    - Recurrence label
  - Bottom:
    - "Pay" button — calls `onPay`. Label: "Make Payment" (Loan) or "Record Payment" (Lending) from config
    - Due day indicator: "Due on the 15th"
- Tappable: calls `onPress` for detail view

**Part 2: Commitment Form**

Create `src/features/commitment/components/commitment-form.tsx`:

```tsx
interface CommitmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  commitment?: CommitmentModel; // If provided, edit mode
}
```

- Uses `useForm<CommitmentFormData>()` with `zodResolver(commitmentFormSchema)`
- Renders in `<BottomSheet>` with snap points `['85%', '95%']`

Form fields:
1. **Type selector** — 2 pills: Loan ("Money you owe"), Lending ("Money owed to you")
2. **Name** — Input. Placeholder: "e.g., Car Loan" or "e.g., Lent to John"
3. **Principal** — Currency input. Label: "Principal Amount"
4. **Interest** — Currency input. Label: "Total Interest". Default 0.
5. **Fee** — Currency input. Label: "Total Fees". Default 0.
6. **Total preview** — Read-only display: "Total: ₱[principal + interest + fee]" (live calculation)
7. **Category picker** — Pre-select "Loans" or "Lending" category if available
8. **Due Day** — Number input (1-31). Label: "Payment Due Day"
9. **Recurrence** — 4 pills (same as bills: Monthly, Quarterly, Semi-Annual, Annual). Default: Monthly.
10. **Start Date** — Date picker
11. **Duration** — Number input + unit selector (Months/Years). Label: "Loan Duration"
12. **Icon** — Emoji picker
13. **Note** — Optional multiline input
14. **Monthly payment preview** — Read-only: "Est. Monthly: ₱[total / months]"

Actions:
- **Save:** Validate → `createCommitment()` or `updateCommitment()` → toast → close
- **Delete (edit only):** Confirmation → `deleteCommitment()` → toast → close

**Do NOT:**
- Allow editing principal/interest/fee after payments have been made — this could cause inconsistency. Show a warning if the user tries to edit a commitment with existing payments.
- Build an amortization table — simple total / months is sufficient.

**Acceptance Criteria:**
- [ ] Commitment card shows name, type, progress bar, paid/total, monthly payment
- [ ] Progress bar fills based on payoff percentage
- [ ] "Pay" button uses correct label per type
- [ ] Form renders all fields in bottom sheet
- [ ] Type selector switches between Loan and Lending
- [ ] Total preview updates live as user enters principal/interest/fee
- [ ] Monthly payment preview calculates correctly
- [ ] Category picker works
- [ ] Duration input with unit selector (months/years)
- [ ] Zod validation on save
- [ ] Create/edit/delete via service functions

---

**Title:** Pay Commitment Flow

**Label:** `Feature`

**Parent Issue:** Commitment UI Components

**Dependencies:** KV2-811 (Commitment Card & Form) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task implements the "pay commitment" user flow — allowing the user to make a payment (full or partial) toward a loan or record a payment received for a lending.

**What to do:**

Create `src/features/commitment/components/pay-commitment-sheet.tsx`:

```tsx
interface PayCommitmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  commitment: CommitmentModel;
}
```

1. **Bottom sheet content:**
   - Title: "Make Payment" (Loan) or "Record Payment" (Lending)
   - Commitment summary: name, type badge, remaining balance

2. **Amount input:**
   - Editable currency input (unlike bills where amount is fixed)
   - Pre-filled with the monthly payment amount from `getMonthlyPayment()`
   - User can change to any amount (partial or full payoff)
   - Show remaining balance: "Remaining: ₱X,XXX"
   - If amount > remaining, show warning: "This exceeds the remaining balance"

3. **Wallet picker:**
   - For Loan: "Pay from" — select wallet to debit
   - For Lending: "Receive to" — select wallet to credit

4. **"Pay" / "Record" button:**
   - Calls `payCommitment(db, commitment, walletId, amount)`
   - Toast: "Payment of ₱X,XXX recorded for [name]"
   - Close sheet

5. **Quick actions:**
   - "Pay Monthly" button — fills the monthly payment amount
   - "Pay Remaining" button — fills the remaining balance amount

**Do NOT:**
- Auto-close or archive the commitment when fully paid — let the user manage that.
- Prevent overpayment — show a warning but allow it (user might have miscalculated interest).

**Acceptance Criteria:**
- [ ] Sheet opens with commitment summary and pre-filled monthly amount
- [ ] Amount input is editable for partial/full payments
- [ ] Wallet picker shows available wallets
- [ ] "Pay Monthly" and "Pay Remaining" quick actions work
- [ ] Overpayment warning shown but not blocked
- [ ] For Loan: creates expense transaction, debits wallet
- [ ] For Lending: creates income transaction, credits wallet
- [ ] Transaction linked to commitment via `commitment_id`
- [ ] Toast + close after payment

---

**Title:** Commitment Detail Screen

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Commitment UI Components

**Dependencies:** KV2-812 (Pay Commitment Flow) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task builds the commitment detail screen — showing full commitment info, progress visualization, and payment history.

**What to do:**

1. Create a route file: `commitment/[id].tsx` in the `app/` directory. Register it in the root `_layout.tsx` Stack.

2. Read route param: `useLocalSearchParams<{ id: string }>()`

3. Fetch data: `useCommitmentById(id)`, `useCommitmentProgress(commitment)`, `useCommitmentPayments(commitment.id)`

4. **Header section:**
   - Commitment name (large, bold)
   - Type badge: Loan or Lending
   - Large circular progress indicator (reuse the `BudgetRing` from M6 or create a similar `ProgressRing` — percentage = payoff percentage)
   - Inside the ring: "X% paid"
   - Below ring:
     - "₱5,000 of ₱10,000 paid"
     - "₱5,000 remaining"
     - "Est. monthly: ₱833"
     - "Expected end: Dec 2026"
   - Edit button → opens commitment form in edit mode

5. **Commitment details card:**
   - Principal: ₱X
   - Interest: ₱X
   - Fees: ₱X
   - Total: ₱X (bold)
   - Duration: X months/years
   - Due day: Xth of every month
   - Start date: formatted date
   - Note: if present

6. **Payment history section:**
   - Title: "Payment History"
   - Use `useCommitmentPayments(commitment.id)` hook
   - List of transactions grouped by date (reuse `groupTransactionsByDate()` and `TransactionItem`)
   - Each item shows: date, amount paid, wallet used
   - Empty state: "No payments yet"

7. **Pay button:** Sticky at the bottom — "Make Payment" / "Record Payment". Opens the pay commitment sheet.

**Do NOT:**
- Build an amortization schedule view — simple payment history is sufficient.
- Show projected future payments — just historical actuals.

**Acceptance Criteria:**
- [ ] Route created and registered
- [ ] Header shows progress ring, paid/remaining amounts, estimates
- [ ] Details card shows all commitment fields
- [ ] Payment history lists all linked transactions
- [ ] Edit button opens commitment form
- [ ] Pay button opens pay commitment sheet
- [ ] Data updates reactively (making a payment updates the ring and history)
- [ ] Back navigation works

---

**Title:** Commitments Tab — Loans Segment

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Commitment UI Components

**Dependencies:**
- KV2-813 (Commitment Detail Screen) must be completed first
- KV2-713 (Commitments Tab — Bills Section) — the tab already exists with a Bills segment

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task replaces the "Loans" placeholder in the Commitments tab with the actual Loans & Lending content.

**What to do:**

1. In `(tabs)/commitments.tsx`, replace the Loans segment placeholder:

2. **Loans segment content:**

   a. **Loans section:**
      - `SectionHeader` with title "LOANS" (subtitle: "Money you owe")
      - Use `useCommitmentsByType(CommitmentType.Loan)` hook
      - Render commitment cards in a vertical list
      - Each card: name, progress bar, paid/total, monthly payment, pay button
      - Tapping a card navigates to `commitment/[id]`
      - "Pay" opens the pay commitment sheet
      - If no loans: "No active loans"

   b. **Lending section:**
      - `SectionHeader` with title "LENDING" (subtitle: "Money owed to you")
      - Use `useCommitmentsByType(CommitmentType.Lending)` hook
      - Same card pattern as loans but with different visual treatment (green tint)
      - "Record Payment" instead of "Make Payment"
      - If no lending: "No active lending"

   c. **Add button:** FAB or header "Add" button → opens commitment form in create mode

3. **Summary at top (optional but nice):**
   - Total owed (sum of remaining balance for all loans)
   - Total receivable (sum of remaining balance for all lending)
   - Net position

**Do NOT:**
- Mix loans and lending in a single list — keep them in separate sections.
- Add tabs within the segment — use scrollable sections instead.

**Acceptance Criteria:**
- [ ] Loans segment replaced with real content (no more placeholder)
- [ ] "LOANS" section shows loan-type commitments
- [ ] "LENDING" section shows lending-type commitments
- [ ] Commitment cards rendered with progress and pay button
- [ ] Tapping a card navigates to commitment detail
- [ ] "Pay" / "Record Payment" opens pay commitment sheet
- [ ] "Add" button opens commitment form
- [ ] Empty states for no loans / no lending
- [ ] Segment switching between Bills and Loans works correctly
