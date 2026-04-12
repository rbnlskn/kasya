# Milestone 3: Wallet System

## Milestone Details (for Linear)

- **Title:** M3 — Wallet System
- **Description:** Implement the full wallet domain — data layer (types, Zod schemas, service functions, reactive hooks) and UI layer (wallet card, carousel, form, detail screen, list with reorder). Supports all 7 wallet types: Cash, E-Wallet, Bank, Digital Bank, Credit Card, Investment, Crypto. Credit Card wallets include basic fields (credit limit, statement day). Wallets display their current balance and can be reordered via drag.
- **Why third:** Wallets are the foundational entity. Transactions debit/credit wallets, bills and commitments are paid from wallets, and the home screen centers on wallet cards. Without wallets, no other feature can function.
- **Definition of Done:**
  - Can create wallets of all 7 types with name, color, currency, and type-specific fields
  - Can edit and delete wallets (with confirmation for delete)
  - Wallet carousel on home screen shows wallet cards with balance
  - Wallet detail screen shows wallet info (transactions wired later in M5)
  - Wallet list screen with drag-to-reorder
  - Credit Card wallet includes credit_limit and statement_day fields
  - All forms validate with Zod

---

## Parent Issue: Wallet CRUD & Service Layer

**Description:** Implement the wallet feature's data layer — Zod validation schemas, WatermelonDB service functions (create, update, delete, reorder), and reactive hooks for reading wallet data. This is the backbone that all wallet UI depends on.

### Issues:

---

**Title:** Wallet Zod Schemas & Validation

**Label:** `Feature`

**Parent Issue:** Wallet CRUD & Service Layer

**Dependencies:** KV2-132 (WatermelonDB Model Classes) — the WalletModel must exist.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the Zod validation schema for the wallet form. The schema enforces required fields and includes conditional validation — credit card wallets require additional fields (credit_limit, statement_day) that other wallet types don't.

Note: `WalletType` enum and `WALLET_TYPE_CONFIG` should already exist in `src/features/wallet/types.ts` from KV2-204 (Onboarding Wallet Setup). If they don't exist, create them as described there.

**What to do:**

1. Create `src/features/wallet/schemas.ts`:

   ```ts
   import { z } from 'zod';
   import { WalletType } from './types';

   export const walletFormSchema = z.object({
     name: z.string().min(1, 'Wallet name is required').max(50),
     type: z.nativeEnum(WalletType),
     color: z.string().min(1, 'Color is required'),
     currency: z.string().min(1, 'Currency is required'),
     creditLimit: z.number().positive('Credit limit must be positive').optional(),
     statementDay: z.number().int().min(1).max(31).optional(),
   }).refine(
     (data) => {
       if (data.type === WalletType.CreditCard) {
         return data.creditLimit !== undefined && data.creditLimit > 0;
       }
       return true;
     },
     { message: 'Credit limit is required for credit cards', path: ['creditLimit'] }
   ).refine(
     (data) => {
       if (data.type === WalletType.CreditCard) {
         return data.statementDay !== undefined;
       }
       return true;
     },
     { message: 'Statement day is required for credit cards', path: ['statementDay'] }
   );

   export type WalletFormData = z.infer<typeof walletFormSchema>;
   ```

2. Install Zod if not already installed: `npm install zod`

**Do NOT:**
- Add balance to the form schema — balance starts at 0 and is updated by transactions, never edited directly.
- Add text_color to the form schema — derive it from the wallet color automatically.

**Acceptance Criteria:**
- [ ] Zod installed
- [ ] `walletFormSchema` created in `src/features/wallet/schemas.ts`
- [ ] Schema requires name, type, color, currency
- [ ] Schema conditionally requires creditLimit and statementDay when type is CreditCard
- [ ] `WalletFormData` type exported
- [ ] Validation passes for valid non-CC wallet data
- [ ] Validation fails for CC wallet without creditLimit or statementDay

---

**Title:** Wallet Service Functions (CRUD)

**Label:** `Database`

**Parent Issue:** Wallet CRUD & Service Layer

**Dependencies:** KV2-301 (Wallet Schemas) must be completed first.

---

**Description:**

Kasya is a local-first finance app using WatermelonDB for storage. This task creates the wallet CRUD service functions — thin wrappers around `database.write()` that handle creating, updating, deleting, and reordering wallets.

All database mutations MUST happen inside `database.write()` blocks. The service functions receive the database instance as a parameter (from the `useDatabase()` hook in the calling component).

**What to do:**

Create `src/features/wallet/services/index.ts`:

1. **`createWallet(db: Database, data: WalletFormData): Promise<WalletModel>`**
   - Inside `database.write()`, create a new wallet record
   - Set `sort_order` to the count of existing wallets (appends to end)
   - Set `balance` to 0
   - Set `text_color` to white (`'#FFFFFF'`) or derive from the wallet color's luminance
   - Return the created wallet

2. **`updateWallet(db: Database, walletId: string, data: Partial<WalletFormData>): Promise<void>`**
   - Find the wallet by ID: `db.get<WalletModel>('wallets').find(walletId)`
   - Inside `database.write()`, call `wallet.update()` with the provided fields
   - Only update fields that are present in `data`

3. **`deleteWallet(db: Database, walletId: string): Promise<void>`**
   - Find the wallet by ID
   - Inside `database.write()`, call `wallet.markAsDeleted()` (soft delete) or `wallet.destroyPermanently()` (hard delete — use this for V1 since there's no sync)
   - Note: This does NOT check for related transactions. The UI should warn the user before calling this.

4. **`reorderWallets(db: Database, walletIds: string[]): Promise<void>`**
   - Inside a single `database.write()`, update the `sort_order` of each wallet to match its index in the `walletIds` array
   - Use `database.batch()` for atomic multi-record updates:
     ```ts
     await db.write(async () => {
       const walletsCollection = db.get<WalletModel>('wallets');
       const updates = walletIds.map((id, index) =>
         walletsCollection.find(id).then(wallet =>
           wallet.prepareUpdate((w) => { w.sortOrder = index; })
         )
       );
       const prepared = await Promise.all(updates);
       await db.batch(...prepared);
     });
     ```

**Do NOT:**
- Add balance update logic here — that's handled by Transaction services (M5).
- Add cascade delete (deleting related transactions) — for V1, wallets can be deleted independently.
- Validate data — validation happens at the form level via Zod before calling these functions.

**Acceptance Criteria:**
- [ ] All 4 service functions created and exported
- [ ] `createWallet` creates a wallet with correct default values (balance 0, sort_order at end)
- [ ] `updateWallet` modifies only provided fields
- [ ] `deleteWallet` permanently removes the wallet record
- [ ] `reorderWallets` atomically updates all sort_order values using `db.batch()`
- [ ] All operations wrapped in `database.write()`
- [ ] Functions typed with WalletModel

---

**Title:** Wallet Reactive Hooks

**Label:** `Feature`

**Parent Issue:** Wallet CRUD & Service Layer

**Dependencies:** KV2-302 (Wallet Services) and KV2-133 (DatabaseProvider) must be completed first.

---

**Description:**

Kasya uses WatermelonDB observables for reactive data — when the database changes, the UI automatically updates. This task creates the hooks that components use to read wallet data.

The hooks use WatermelonDB's `.observe()` method which returns an RxJS Observable. We need to convert these into React-friendly hooks. There are two approaches:
- Use `@nozbe/with-observables` HOC pattern
- Use a custom hook that subscribes to the observable and returns state

For Kasya, use a **custom hook approach** for cleaner integration with functional components.

**What to do:**

Create `src/features/wallet/hooks/index.ts` (or separate files per hook):

1. **`useWallets(): { wallets: WalletModel[], isLoading: boolean }`**
   - Get database via `useDatabase()`
   - Query `wallets` table ordered by `sort_order` ascending
   - Subscribe to the query's `.observe()` observable
   - Return the current value and a loading state
   - Clean up subscription on unmount

   Implementation pattern:
   ```ts
   import { useEffect, useState } from 'react';
   import { useDatabase } from '@/hooks/use-database';
   import { WalletModel } from '@/database/models/wallet.model';
   import { Q } from '@nozbe/watermelondb';

   export function useWallets() {
     const db = useDatabase();
     const [wallets, setWallets] = useState<WalletModel[]>([]);
     const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
       const subscription = db
         .get<WalletModel>('wallets')
         .query(Q.sortBy('sort_order', Q.asc))
         .observe()
         .subscribe((result) => {
           setWallets(result);
           setIsLoading(false);
         });

       return () => subscription.unsubscribe();
     }, [db]);

     return { wallets, isLoading };
   }
   ```

2. **`useWalletById(id: string): { wallet: WalletModel | null, isLoading: boolean }`**
   - Find wallet by ID and observe it
   - Use `db.get<WalletModel>('wallets').findAndObserve(id)`
   - Handle the case where the wallet doesn't exist (return null)

3. **`useTotalBalance(): { totalBalance: number, isLoading: boolean }`**
   - Observe all wallets, sum their balances
   - Recomputes whenever any wallet's balance changes

**Do NOT:**
- Store wallet data in Zustand — the observable pattern handles reactivity.
- Use `withObservables` HOC — use the custom hook pattern for consistency.
- Fetch data imperatively (non-reactive) — always use `.observe()` for automatic updates.

**Acceptance Criteria:**
- [ ] `useWallets()` returns wallets sorted by sort_order, updates reactively when wallets change
- [ ] `useWalletById(id)` returns a single wallet, updates when that wallet is modified
- [ ] `useTotalBalance()` returns the sum of all wallet balances
- [ ] All hooks handle loading state correctly
- [ ] All subscriptions cleaned up on component unmount (no memory leaks)
- [ ] Adding/editing/deleting a wallet causes all active hooks to update automatically

---

## Parent Issue: Wallet UI Components

**Description:** Build all wallet-related UI components: wallet card, carousel for the home screen, wallet form (in a bottom sheet), wallet detail screen, and wallet list with reorder support.

### Issues:

---

**Title:** Wallet Card Component

**Label:** `UI / UX`

**Parent Issue:** Wallet UI Components

**Dependencies:** KV2-303 (Wallet Hooks) and KV2-151 (Base UI Components) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native using NativeWind for styling. This task creates the wallet card — the primary visual representation of a wallet, displayed in the home screen carousel and wallet list.

**What to do:**

Create `src/features/wallet/components/wallet-card.tsx`:

```tsx
interface WalletCardProps {
  wallet: WalletModel;
  currencySymbol: string;
  onPress: (wallet: WalletModel) => void;
}
```

**Design:**
- Card background: the wallet's `color` field (each wallet has a unique color chosen by the user)
- Layout:
  - Top-left: wallet type label (from `WALLET_TYPE_CONFIG[wallet.type].label`) in small text
  - Top-right: wallet type icon (from `WALLET_TYPE_CONFIG[wallet.type].icon`)
  - Center/bottom-left: wallet name (bold, larger text)
  - Bottom-right: balance formatted with currency symbol (use `CurrencyDisplay` component from `@/components/shared`)
- For credit card wallets, also show:
  - Credit limit below the balance
  - Available credit (credit_limit - abs(balance)) — only if balance is negative
- Card should have:
  - Rounded corners (16-20px border radius)
  - Subtle shadow
  - Aspect ratio roughly 16:9 or 2:1 (like a physical card)
- Tappable: entire card is a Pressable, calls `onPress` with the wallet
- Text color: use `text_color` from the wallet model (white by default), ensure sufficient contrast

**Do NOT:**
- Add edit/delete buttons on the card — those are in the detail screen and form.
- Make the card draggable — drag-to-reorder is handled in the wallet list screen.
- Hard-code colors — read from the wallet model's color field.

**Acceptance Criteria:**
- [ ] Card renders with wallet color as background
- [ ] Wallet name, type label, type icon, and balance displayed
- [ ] Credit card variant shows credit limit and available credit
- [ ] Text has sufficient contrast against wallet color background
- [ ] Tapping the card calls `onPress` with the wallet
- [ ] Card has rounded corners and shadow
- [ ] Card aspect ratio is roughly card-shaped (wider than tall)
- [ ] NativeWind classes used for all styling

---

**Title:** Wallet Carousel (Home Screen)

**Label:** `UI / UX`

**Parent Issue:** Wallet UI Components

**Dependencies:** KV2-311 (Wallet Card) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. The home screen features a horizontal wallet carousel at the top, showing the user's wallets as swipeable cards. This task creates that carousel.

**What to do:**

1. Install React Native Reanimated Carousel if not present:
   ```
   npm install react-native-reanimated-carousel
   ```

2. Create `src/features/wallet/components/wallet-carousel.tsx`:

   ```tsx
   interface WalletCarouselProps {
     wallets: WalletModel[];
     currencySymbol: string;
     onWalletPress: (wallet: WalletModel) => void;
     onAddPress: () => void;
     onViewAll: () => void;
   }
   ```

3. **Layout:**
   - Use `Carousel` from `react-native-reanimated-carousel` for horizontal scrolling
   - Each item in the carousel is a `WalletCard` component
   - After the last wallet card, show an "Add Wallet" card:
     - Dashed border, muted background
     - Plus icon centered
     - Text: "Add Wallet"
     - Tapping calls `onAddPress`
   - Carousel config:
     - `mode: 'parallax'` or default horizontal mode — choose whichever looks best
     - `width`: slightly less than screen width (show a peek of the next card)
     - `loop: false`
     - Snap to each card

4. **Pagination indicator:**
   - Below the carousel, show dots indicating the current position
   - Active dot is primary color, inactive dots are muted
   - Number of dots = number of wallets + 1 (for add card)

5. **Section header:**
   - Above the carousel, render a `SectionHeader` with title "WALLETS" and `onViewAll` pointing to the wallets list screen

6. **Single wallet handling:**
   - If only 1 wallet exists, the carousel should still work (show the wallet card + Add card)
   - Don't show a carousel-like UI for a single card — just center it

**Do NOT:**
- Implement wallet reordering in the carousel — reorder is in the wallet list screen.
- Make the carousel infinite loop — `loop: false`.
- Auto-scroll or auto-play — this is static until the user swipes.

**Acceptance Criteria:**
- [ ] Carousel renders wallet cards horizontally
- [ ] Swiping scrolls to the next card with snap behavior
- [ ] "Add Wallet" card appears at the end with dashed border and plus icon
- [ ] Pagination dots show current position
- [ ] Section header with "WALLETS" title and "View All" button
- [ ] Works correctly with 1 wallet (no empty space or broken layout)
- [ ] Smooth performance on Honor 90
- [ ] Tapping a wallet card calls `onWalletPress`
- [ ] Tapping "Add Wallet" card calls `onAddPress`
- [ ] Tapping "View All" calls `onViewAll`

---

**Title:** Wallet Form (Bottom Sheet)

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Wallet UI Components

**Dependencies:**
- KV2-302 (Wallet Services) — form calls create/update/delete services
- KV2-152 (Bottom Sheet Component) — form renders inside the bottom sheet
- KV2-153 (Shared Components) — form uses color picker

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the wallet form — used for both creating new wallets and editing existing ones. It's presented in a Gorhom Bottom Sheet.

The form uses React Hook Form for state management and the Zod schema from `src/features/wallet/schemas.ts` for validation.

**What to do:**

1. Install React Hook Form and its Zod resolver if not present:
   ```
   npm install react-hook-form @hookform/resolvers
   ```

2. Create `src/features/wallet/components/wallet-form.tsx`:

   ```tsx
   interface WalletFormProps {
     isOpen: boolean;
     onClose: () => void;
     wallet?: WalletModel; // If provided, edit mode
   }
   ```

3. **Form setup:**
   - Use `useForm<WalletFormData>()` from React Hook Form with `zodResolver(walletFormSchema)`
   - In edit mode, call `reset()` with the existing wallet's values when the sheet opens

4. **Form fields (top to bottom):**

   a. **Name** — `Input` component from `@/components/ui/input`. Label: "Wallet Name". Placeholder: "e.g., Main Bank"

   b. **Type selector** — Horizontal scrollable row of pills/chips. Each pill shows the wallet type icon (emoji) and label from `WALLET_TYPE_CONFIG`. Tapping a pill selects that type. Selected pill has primary color background. In edit mode, type selector is disabled (cannot change wallet type after creation).

   c. **Color picker** — Use the shared `ColorPicker` component from `@/components/shared/color-picker` with `WALLET_COLORS` from `@/constants/colors`. Shows a grid of color swatches. Selected swatch has a checkmark.

   d. **Currency** — Pre-filled with the user's default currency (from MMKV). Shown as a read-only field for now (changing currency per-wallet is an edge case — can be added later).

   e. **Credit Limit** — Number input. Only visible when type is `CreditCard`. Label: "Credit Limit". Placeholder: "0.00". Formats as currency.

   f. **Statement Day** — Number input (1-31). Only visible when type is `CreditCard`. Label: "Statement Day". Placeholder: "1".

5. **Actions:**
   - **Save button** at the bottom: "Create Wallet" (create mode) or "Save Changes" (edit mode)
     - On press: validate with RHF, if valid call `createWallet()` or `updateWallet()` from wallet services
     - Show success toast via Sonner Native
     - Close the bottom sheet
   - **Delete button** (edit mode only): red destructive text button "Delete Wallet"
     - On press: show confirmation dialog ("Delete [wallet name]? This cannot be undone.")
     - On confirm: call `deleteWallet()` from wallet services
     - Show toast and close sheet

6. **Bottom sheet config:**
   - Snap points: `['75%', '90%']`
   - Title: "New Wallet" (create) or "Edit Wallet" (edit)

**Do NOT:**
- Allow editing the balance — balances are changed by transactions only.
- Allow changing wallet type in edit mode — this would require migrating related data.
- Put business logic in the component — service functions handle the database operations.
- Skip Zod validation — every save must validate first.

**Acceptance Criteria:**
- [ ] Form renders in a bottom sheet
- [ ] All fields listed above are present and functional
- [ ] Type selector shows all 7 wallet types with icons
- [ ] Type selector disabled in edit mode
- [ ] Credit card fields (limit, statement day) only visible when type is CreditCard
- [ ] Color picker works with WALLET_COLORS palette
- [ ] React Hook Form + Zod validation works — errors shown on invalid fields
- [ ] Create mode: saves new wallet via `createWallet()` service
- [ ] Edit mode: pre-fills fields, saves via `updateWallet()` service
- [ ] Delete button (edit only) with confirmation dialog
- [ ] Toast shown after save/delete
- [ ] Sheet closes after successful operation

---

**Title:** Wallet Detail Screen

**Label:** `UI / UX`

**Parent Issue:** Wallet UI Components

**Dependencies:**
- KV2-313 (Wallet Form) — edit button opens the form
- KV2-113 (Push Screen Routes) — the route file must exist

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task builds the wallet detail screen — a push screen that shows a wallet's full information and will eventually display its filtered transactions (wired in M5).

**What to do:**

1. Update `wallet/[id].tsx` (replace the placeholder content):

2. **Read route param:** Use `useLocalSearchParams<{ id: string }>()` to get the wallet ID.

3. **Fetch wallet data:** Use `useWalletById(id)` hook from `@/features/wallet/hooks`.

4. **Header section:**
   - Background color: wallet's `color`
   - Content:
     - Wallet name (large, bold)
     - Wallet type label and icon
     - Balance (large, prominent, using `CurrencyDisplay`)
     - For credit cards: credit limit, available credit, statement day
   - Edit button (pencil icon or "Edit" text) in the top-right — opens the wallet form in edit mode

5. **Transaction list section (placeholder for now):**
   - Below the header
   - Title: "Transactions"
   - Show an `EmptyState` component with: icon `Receipt`, title "No transactions yet", description "Transactions for this wallet will appear here"
   - This section will be wired up to real transaction data in M5 (issue KV2-515)

6. **Loading state:** Show a loading indicator while `useWalletById` is loading.

7. **Error state:** If the wallet ID is invalid or wallet not found, show an error message with a back button.

8. **Back navigation:** Standard stack header back button.

**Do NOT:**
- Build the transaction list — that's M5 (KV2-515).
- Add delete functionality on this screen — delete is in the wallet form.
- Add any FAB or quick-add buttons — those come later.

**Acceptance Criteria:**
- [ ] Screen loads wallet data from route param ID
- [ ] Header displays wallet info with wallet color background
- [ ] Balance formatted with currency symbol
- [ ] Credit card wallet shows additional CC-specific info
- [ ] Edit button opens wallet form in edit mode (as bottom sheet)
- [ ] Transaction list placeholder with empty state
- [ ] Loading state while data loads
- [ ] Error state if wallet not found
- [ ] Back navigation works

---

**Title:** Wallet List Screen with Reorder

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Wallet UI Components

**Dependencies:** KV2-314 (Wallet Detail Screen) must be completed first.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the wallet list screen — a push screen accessible from the home screen's "View All" button. It shows all wallets in a vertical list with drag-to-reorder support.

**What to do:**

1. Update `wallets.tsx` (replace the placeholder content):

2. **Header:** Screen title "Wallets" with a back button and an "Add" button (plus icon) that opens the wallet form in create mode.

3. **Wallet list:**
   - Use `FlashList` (install `@shopify/flash-list` if not already present)
   - Data from `useWallets()` hook
   - Each list item shows:
     - Color dot (circular, wallet's color)
     - Wallet name (bold)
     - Wallet type label (muted text)
     - Balance (right-aligned, formatted with `CurrencyDisplay`)
     - Drag handle icon on the left (hamburger/grip icon from Lucide)
   - Tapping a list item navigates to wallet detail: `router.push(\`/wallet/\${wallet.id}\`)`

4. **Drag to reorder:**
   - Use a drag-to-reorder library compatible with FlashList, or use `react-native-draggable-flatlist` (install if needed)
   - When a reorder completes, call `reorderWallets(db, newOrderIds)` from wallet services
   - The new order persists immediately to the database

5. **Empty state:** If no wallets exist (shouldn't happen after onboarding, but handle it), show `EmptyState` with icon `Wallet`, title "No wallets", description "Add your first wallet to get started", CTA "Add Wallet".

6. **Add wallet:** "Add" button in header opens the wallet form bottom sheet in create mode.

**Do NOT:**
- Add inline editing — editing is done via the wallet form.
- Add swipe-to-delete — deletion is in the wallet form.
- Implement search/filter — not needed for wallets (users won't have hundreds).

**Acceptance Criteria:**
- [ ] Screen shows all wallets in a vertical list
- [ ] Each item displays color dot, name, type, and balance
- [ ] Tapping an item navigates to wallet detail
- [ ] Drag-to-reorder works and persists new order via `reorderWallets()` service
- [ ] "Add" button opens wallet form in create mode
- [ ] Back navigation returns to the previous screen
- [ ] Empty state rendered if no wallets (edge case)
- [ ] Smooth scrolling performance with FlashList
