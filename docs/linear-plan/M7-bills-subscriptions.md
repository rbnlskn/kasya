# Milestone 7: Bills & Subscriptions

## Milestone Details (for Linear)

- **Title:** M7 — Bills & Subscriptions
- **Description:** Implement the full bills/subscriptions domain — CRUD, recurrence tracking, payment flow (creates a transaction), trial period management, status management (active/paused/cancelled), due date display, and integration into the Commitments tab. Bills represent recurring financial obligations like utilities, rent, and subscription services.
- **Why seventh:** Bills create transactions when paid, so they depend on the Transaction system (M5). They also reference categories (M4) for categorization.
- **Definition of Done:**
  - Can create/edit/delete bills with all fields (name, amount, due day, recurrence, type, trial info)
  - "Pay Bill" flow creates a transaction and updates last_paid_date
  - Trial period tracking shows trial end date and optional reminder flag
  - Bill status management (active/paused/cancelled)
  - Bills appear in the Commitments tab with due date indicators
  - Upcoming bills section visible with due-soon highlights

---

## Parent Issue: Bill CRUD & Service Layer

**Description:** Implement the bill data layer — types, Zod schemas, service functions (CRUD + pay), reactive hooks, and due date utilities.

### Issues:

---

**Title:** Bill Types, Schemas & Due Date Utilities

**Label:** `Feature`

**Parent Issue:** Bill CRUD & Service Layer

**Dependencies:** KV2-132 (WatermelonDB Model Classes) — the BillModel must exist.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the type definitions, Zod validation schema, and utility functions for bills/subscriptions.

Bills have several type-specific concerns: recurrence frequency determines when they're due, bill type distinguishes utilities from subscriptions, and trial periods add complexity for subscription-type bills.

**What to do:**

1. Create `src/features/bill/types.ts`:
   ```ts
   export enum RecurrenceFrequency {
     Monthly = 'monthly',
     Quarterly = 'quarterly',
     SemiAnnual = 'semi_annual',
     Annual = 'annual',
   }

   export enum BillType {
     Bill = 'bill',
     Subscription = 'subscription',
   }

   export enum BillStatus {
     Active = 'active',
     Paused = 'paused',
     Cancelled = 'cancelled',
   }

   export const RECURRENCE_CONFIG: Record<RecurrenceFrequency, { label: string; months: number }> = {
     [RecurrenceFrequency.Monthly]: { label: 'Monthly', months: 1 },
     [RecurrenceFrequency.Quarterly]: { label: 'Quarterly', months: 3 },
     [RecurrenceFrequency.SemiAnnual]: { label: 'Every 6 Months', months: 6 },
     [RecurrenceFrequency.Annual]: { label: 'Yearly', months: 12 },
   };

   export const BILL_TYPE_CONFIG: Record<BillType, { label: string; icon: string }> = {
     [BillType.Bill]: { label: 'Bill', icon: '📄' },
     [BillType.Subscription]: { label: 'Subscription', icon: '🔄' },
   };

   export const BILL_STATUS_CONFIG: Record<BillStatus, { label: string; color: string }> = {
     [BillStatus.Active]: { label: 'Active', color: 'income' },
     [BillStatus.Paused]: { label: 'Paused', color: 'refund' },
     [BillStatus.Cancelled]: { label: 'Cancelled', color: 'expense' },
   };
   ```

2. Create `src/features/bill/schemas.ts`:
   ```ts
   import { z } from 'zod';
   import { RecurrenceFrequency, BillType, BillStatus } from './types';

   export const billFormSchema = z.object({
     name: z.string().min(1, 'Bill name is required').max(50),
     amount: z.number().positive('Amount must be greater than 0'),
     dueDay: z.number().int().min(1).max(31, 'Due day must be 1-31'),
     recurrence: z.nativeEnum(RecurrenceFrequency),
     type: z.nativeEnum(BillType),
     icon: z.string().min(1, 'Icon is required'),
     startDate: z.number().positive('Start date is required'),
     endDate: z.number().optional(),
     status: z.nativeEnum(BillStatus),
     // Trial fields (for subscriptions)
     isTrialActive: z.boolean().optional(),
     trialEndDate: z.number().optional(),
     billingStartDate: z.number().optional(),
     remindTrialEnd: z.boolean().optional(),
     note: z.string().max(500).optional(),
   });

   export type BillFormData = z.infer<typeof billFormSchema>;
   ```

3. Create `src/features/bill/utils.ts`:

   ```ts
   import { addMonths, setDate, isBefore, isAfter, differenceInDays } from 'date-fns';

   /**
    * Calculate the next due date for a bill based on its due_day and recurrence.
    */
   export function getNextDueDate(
     dueDay: number,
     recurrence: RecurrenceFrequency,
     lastPaidDate: number | null,
     referenceDate: Date = new Date()
   ): Date {
     // Logic: find the next occurrence of dueDay that's after lastPaidDate (or today if never paid)
     // Account for recurrence frequency (monthly, quarterly, etc.)
   }

   /**
    * Check if a bill is due soon (within N days).
    */
   export function isDueSoon(nextDueDate: Date, withinDays: number = 7): boolean {
     const daysUntilDue = differenceInDays(nextDueDate, new Date());
     return daysUntilDue >= 0 && daysUntilDue <= withinDays;
   }

   /**
    * Check if a bill is overdue.
    */
   export function isOverdue(nextDueDate: Date): boolean {
     return isBefore(nextDueDate, new Date());
   }

   /**
    * Get days remaining until trial ends.
    */
   export function getTrialDaysRemaining(trialEndDate: number): number {
     return Math.max(0, differenceInDays(new Date(trialEndDate), new Date()));
   }
   ```

**Do NOT:**
- Implement complex recurring date algorithms — keep it simple: due_day in the month, advance by recurrence months.
- Add notification scheduling — that's deferred to Project 2.

**Acceptance Criteria:**
- [ ] All enums created: `RecurrenceFrequency`, `BillType`, `BillStatus`
- [ ] Config maps with labels and visual properties
- [ ] `billFormSchema` validates all required and optional fields
- [ ] `getNextDueDate()` calculates the correct next due date
- [ ] `isDueSoon()` and `isOverdue()` return correct boolean values
- [ ] `getTrialDaysRemaining()` computes days correctly
- [ ] All date calculations use `date-fns`

---

**Title:** Bill Service Functions (CRUD + Pay)

**Label:** `Database`

**Parent Issue:** Bill CRUD & Service Layer

**Dependencies:**
- KV2-701 (Bill Schemas) must be completed first
- KV2-502 (Transaction Services) — paying a bill creates a transaction

---

**Description:**

Kasya is a local-first finance app using WatermelonDB for storage. This task creates the bill CRUD service functions plus the key "pay bill" flow that creates a transaction and updates the bill's payment tracking.

**What to do:**

Create `src/features/bill/services/index.ts`:

1. **`createBill(db: Database, data: BillFormData): Promise<BillModel>`**
   - Inside `database.write()`, create a new bill record
   - Set `last_paid_date` to `null` (never paid)
   - Set `first_payment_date` to `null`
   - Return the created bill

2. **`updateBill(db: Database, billId: string, data: Partial<BillFormData>): Promise<void>`**
   - Find bill, update provided fields inside `database.write()`

3. **`deleteBill(db: Database, billId: string): Promise<void>`**
   - Permanently destroy the bill record

4. **`payBill(db: Database, bill: BillModel, walletId: string, categoryId: string): Promise<void>`**

   This is the critical flow. Inside a single `database.write()` block:

   a. Create an expense transaction:
      - `amount`: `bill.amount`
      - `type`: `'expense'`
      - `wallet_id`: the provided `walletId`
      - `category_id`: the provided `categoryId`
      - `bill_id`: `bill.id` (links the transaction to this bill)
      - `date`: `Date.now()`
      - `title`: `bill.name` (auto-filled)
      - `created_at`: `Date.now()`

   b. Update the wallet balance: `wallet.balance -= bill.amount`

   c. Update the bill:
      - `last_paid_date`: `Date.now()`
      - If `first_payment_date` is null, set it to `Date.now()`

   d. Batch all operations atomically using `db.batch()`

5. **`updateBillStatus(db: Database, billId: string, status: BillStatus): Promise<void>`**
   - Find bill, update `status` field inside `database.write()`

**Do NOT:**
- Auto-create transactions on schedule — bills are paid manually by the user tapping "Pay".
- Delete related transactions when deleting a bill — they should remain in history.
- Handle recurring auto-pay — that's a Project 2 feature.

**Acceptance Criteria:**
- [ ] All 5 service functions created and exported
- [ ] `createBill` creates a bill with null payment dates
- [ ] `payBill` atomically creates an expense transaction AND updates wallet balance AND updates bill's last_paid_date
- [ ] The created transaction has `bill_id` linking it to the bill
- [ ] `first_payment_date` set only on the first payment
- [ ] `updateBillStatus` changes status (active/paused/cancelled)
- [ ] All operations use `database.write()` and `db.batch()` where multi-record

---

**Title:** Bill Reactive Hooks

**Label:** `Feature`

**Parent Issue:** Bill CRUD & Service Layer

**Dependencies:** KV2-702 (Bill Services) and KV2-133 (DatabaseProvider) must be completed first.

---

**Description:**

Kasya uses WatermelonDB observables for reactive data. This task creates hooks for reading bill data — all bills, upcoming/due-soon bills, and individual bill lookup.

**What to do:**

Create `src/features/bill/hooks/index.ts`:

1. **`useBills(): { bills: BillModel[], isLoading: boolean }`**
   - Query all bills, subscribe to `.observe()`
   - Sorted by `due_day` ascending

2. **`useBillById(id: string): { bill: BillModel | null, isLoading: boolean }`**
   - Find and observe a single bill

3. **`useActiveBills(): { bills: BillModel[], isLoading: boolean }`**
   - Filtered: `Q.where('status', 'active')`
   - Returns only active bills (excludes paused and cancelled)

4. **`useDueSoonBills(withinDays: number = 7): { bills: BillModel[], isLoading: boolean }`**
   - Returns active bills where the next due date is within `withinDays` days
   - Since due date is computed (not stored), this hook:
     a. Gets all active bills via `useActiveBills()`
     b. Filters client-side using `isDueSoon(getNextDueDate(bill.dueDay, bill.recurrence, bill.lastPaidDate), withinDays)`
   - Note: This is a derived hook that processes the results of `useActiveBills()`

**Do NOT:**
- Compute next due date in the hook — use the utility functions from `bill/utils.ts`.
- Store computed values in the database — next due date is always calculated on the fly.

**Acceptance Criteria:**
- [ ] `useBills()` returns all bills sorted by due day
- [ ] `useBillById()` returns a single bill
- [ ] `useActiveBills()` filters to active bills only
- [ ] `useDueSoonBills()` returns bills due within the specified window
- [ ] All hooks update reactively
- [ ] Subscriptions cleaned up on unmount

---

## Parent Issue: Bill UI Components

**Description:** Build the bill UI — bill card, bill form (bottom sheet), bill list, pay bill flow, and integration into the Commitments tab.

### Issues:

---

**Title:** Bill Card & Bill Form (Bottom Sheet)

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Bill UI Components

**Dependencies:**
- KV2-703 (Bill Hooks) must be completed first
- KV2-152 (Bottom Sheet) — form renders in bottom sheet
- KV2-153 (Shared Components) — emoji picker

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the bill card component and the bill form for create/edit operations.

**What to do:**

**Part 1: Bill Card**

Create `src/features/bill/components/bill-card.tsx`:

```tsx
interface BillCardProps {
  bill: BillModel;
  currencySymbol: string;
  onPress: (bill: BillModel) => void;
  onPay: (bill: BillModel) => void;
}
```

- Layout:
  - Left: icon emoji in a circular container
  - Center:
    - Bill name (bold)
    - Type badge (Bill/Subscription) using `Badge` component
    - Next due: "Due in 5 days" or "Due today" or "Overdue by 3 days" (use utility functions)
  - Right:
    - Amount with currency symbol
    - Recurrence label (e.g., "/month")
  - Bottom row (or overlay):
    - Status badge: colored based on `BILL_STATUS_CONFIG`
    - "Pay" button (small, primary) — only visible if status is Active. Calls `onPay`
  - If trial is active:
    - Trial indicator: "Trial: 15 days left" in amber text
- Card is tappable (calls `onPress` for viewing/editing)
- Due-soon highlight: if due within 3 days, subtle amber/red left border or background tint

**Part 2: Bill Form**

Create `src/features/bill/components/bill-form.tsx`:

```tsx
interface BillFormProps {
  isOpen: boolean;
  onClose: () => void;
  bill?: BillModel; // If provided, edit mode
}
```

- Uses `useForm<BillFormData>()` with `zodResolver(billFormSchema)`
- Renders in `<BottomSheet>` with snap points `['85%', '95%']`

Form fields:
1. **Name** — Input. Placeholder: "e.g., Netflix"
2. **Amount** — Currency input. Label: "Amount"
3. **Type selector** — 2 pills: Bill, Subscription
4. **Due Day** — Number input (1-31). Label: "Due Day of Month"
5. **Recurrence** — 4 pills: Monthly, Quarterly, Semi-Annual, Annual
6. **Start Date** — Date picker. Label: "Start Date"
7. **End Date** — Optional date picker. Label: "End Date (optional)"
8. **Icon** — Emoji picker
9. **Status** — 3 pills: Active, Paused, Cancelled (only in edit mode; new bills default to Active)

**Trial fields (visible when type is Subscription):**
10. **Is Trial Active** — Toggle. Label: "Currently in trial?"
11. **Trial End Date** — Date picker. Only visible when trial toggle is on.
12. **Billing Start Date** — Date picker. Only visible when trial toggle is on. Label: "Billing starts on"
13. **Remind Trial End** — Toggle. Label: "Remind before trial ends". Only visible when trial toggle is on.

14. **Note** — Optional multiline input

Actions:
- **Save:** Validate → `createBill()` or `updateBill()` → toast → close
- **Delete (edit only):** Confirmation → `deleteBill()` → toast → close

**Do NOT:**
- Implement reminder notifications — just save the `remind_trial_end` flag for future use.
- Auto-pay bills — the user manually taps "Pay".

**Acceptance Criteria:**
- [ ] Bill card shows icon, name, type badge, due info, amount, recurrence, and status
- [ ] "Pay" button visible on active bills
- [ ] Due-soon visual indicator (amber/red)
- [ ] Trial days remaining shown for subscription-type bills with active trial
- [ ] Form renders all fields in bottom sheet
- [ ] Trial fields only visible when type is Subscription and trial toggle is on
- [ ] Status selector only in edit mode
- [ ] Zod validation on save
- [ ] Create/edit/delete via service functions
- [ ] Toast + close after operations

---

**Title:** Pay Bill Flow

**Label:** `Feature`

**Parent Issue:** Bill UI Components

**Dependencies:** KV2-711 (Bill Card & Form) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task implements the "pay bill" user flow — when a user taps "Pay" on a bill card, they select a wallet and category, and the system creates a transaction and updates the bill's payment tracking.

**What to do:**

Create `src/features/bill/components/pay-bill-sheet.tsx`:

```tsx
interface PayBillSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bill: BillModel;
}
```

1. **Bottom sheet content:**
   - Title: "Pay [bill name]"
   - Bill summary: icon, name, amount (read-only, shown for confirmation)
   - **Wallet picker:** Tappable field to select which wallet to pay from. Shows wallet name + balance. The wallet must have sufficient balance (show a warning if balance < bill amount, but don't block payment).
   - **Category picker:** Pre-select the "Bills" category if it exists, otherwise let the user choose. Uses the shared Category Picker.
   - **"Pay Now" button:** Primary, full width
     - Calls `payBill(db, bill, selectedWalletId, selectedCategoryId)` from bill services
     - Shows success toast: "Paid [bill name] — ₱[amount]"
     - Closes the sheet

2. **Validation:**
   - Wallet must be selected
   - Category must be selected
   - Amount is read-only (comes from the bill)

3. **Integration:** Wire the `onPay` callback in the bill card to open this sheet.

**Do NOT:**
- Allow editing the payment amount — it's always the bill's set amount. Custom amounts can be added later.
- Auto-select a wallet — the user must explicitly choose.
- Create the transaction manually in this component — use the `payBill()` service which handles it atomically.

**Acceptance Criteria:**
- [ ] Pay sheet opens showing bill summary
- [ ] Wallet picker shows available wallets with balances
- [ ] Low balance warning shown (but doesn't block)
- [ ] Category picker with "Bills" category pre-selected if available
- [ ] "Pay Now" creates an expense transaction linked to the bill
- [ ] Wallet balance decremented atomically
- [ ] Bill's `last_paid_date` updated
- [ ] Success toast shown
- [ ] Sheet closes after payment

---

**Title:** Commitments Tab — Bills Section

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Bill UI Components

**Dependencies:** KV2-712 (Pay Bill Flow) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task builds the Bills section of the Commitments tab. The Commitments tab (middle tab in the tab bar) shows both Bills and Loans/Lending (the Loans section will be added in M8).

**What to do:**

1. Update `(tabs)/commitments.tsx` (replace placeholder):

2. **Screen structure:**
   - **Tab/segment control at top:** Two segments: "Bills" and "Loans" (Loans section built in M8, show a placeholder for now)
   - Default to "Bills" segment

3. **Bills segment content:**

   a. **Due Soon section:**
      - `SectionHeader` with title "DUE SOON"
      - Use `useDueSoonBills(7)` hook
      - Render bill cards horizontally or vertically
      - If no bills due soon: "All caught up! No bills due this week."

   b. **All Bills section:**
      - `SectionHeader` with title "ALL BILLS"
      - Use `useBills()` hook
      - Render bill cards in a vertical list using FlashList
      - Tapping a card opens the bill form in edit mode
      - "Pay" on each card opens the pay bill sheet

   c. **Add button:** FAB or header "Add" button → opens bill form in create mode

4. **Loans placeholder:**
   - When "Loans" segment is tapped, show: "Loans & Lending — Coming in the next milestone"
   - This will be replaced in M8

**Do NOT:**
- Build the Loans section — that's M8.
- Add search/filter for bills — not needed for V1.
- Sort by anything other than due day — keep it simple.

**Acceptance Criteria:**
- [ ] Commitments tab shows two segments: Bills and Loans
- [ ] Bills segment shows "Due Soon" and "All Bills" sections
- [ ] Due soon bills highlighted (from `useDueSoonBills()`)
- [ ] Bill cards rendered with all info (name, amount, due, status, pay button)
- [ ] Tapping a card opens bill form in edit mode
- [ ] "Pay" button opens pay bill sheet
- [ ] "Add" button opens bill form in create mode
- [ ] Loans segment shows placeholder
- [ ] "All caught up" message when no bills due soon
