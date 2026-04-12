# Milestone 4: Category System

## Milestone Details (for Linear)

- **Title:** M4 — Category System
- **Description:** Implement the full category domain — service functions, reactive hooks, category picker (used by Transaction and Budget forms), category management screen with custom CRUD, and emoji/color customization. System categories (Income, Expense) are non-editable and non-deletable. Custom categories support full CRUD with emoji icons and color assignment.
- **Why fourth:** Both Transactions (M5) and Budgets (M6) require categories. The category picker is a reusable component shared across multiple forms. Without categories, you can't categorize transactions or create budgets.
- **Definition of Done:**
  - System categories (Income, Expense) exist and cannot be edited or deleted
  - Custom categories can be created, edited, and deleted
  - Category picker bottom sheet works and can be opened from any form
  - Category management screen shows all categories with add/edit/delete
  - Each category has a name, emoji icon, and color

---

## Parent Issue: Category CRUD & Service Layer

**Description:** Implement the category feature's data layer — Zod schemas, service functions, and reactive hooks. Categories are one of the simpler domains but are critical because they're referenced by transactions, budgets, and commitments.

### Issues:

---

**Title:** Category Types, Schemas & Validation

**Label:** `Feature`

**Parent Issue:** Category CRUD & Service Layer

**Dependencies:** KV2-132 (WatermelonDB Model Classes) — the CategoryModel must exist.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the type definitions and Zod validation schema for category forms.

Note: `SYSTEM_CATEGORIES` and `DEFAULT_OPTIONAL_CATEGORIES` should already exist in `src/features/category/constants.ts` from KV2-205 (Onboarding Categories). If they don't exist, create them as described there.

**What to do:**

1. Create `src/features/category/types.ts` if it doesn't exist:
   ```ts
   export interface CategoryData {
     name: string;
     icon: string;  // emoji
     color: string;  // hex
     isSystem: boolean;
   }
   ```

2. Create `src/features/category/schemas.ts`:
   ```ts
   import { z } from 'zod';

   export const categoryFormSchema = z.object({
     name: z.string().min(1, 'Category name is required').max(30, 'Name is too long'),
     icon: z.string().min(1, 'Icon is required'),
     color: z.string().min(1, 'Color is required'),
   });

   export type CategoryFormData = z.infer<typeof categoryFormSchema>;
   ```

   Note: `isSystem` is NOT in the form schema — system categories are never created via the form. It's set internally.

**Do NOT:**
- Add `isSystem` to the form schema — users never choose this; it's set programmatically.
- Add category type (income/expense) to the schema — all custom categories are general-purpose. System categories handle the income/expense distinction.

**Acceptance Criteria:**
- [ ] `src/features/category/types.ts` exists with `CategoryData` interface
- [ ] `src/features/category/schemas.ts` exists with `categoryFormSchema`
- [ ] Schema requires name (1-30 chars), icon (non-empty), color (non-empty)
- [ ] `CategoryFormData` type exported
- [ ] Validation passes for valid category data
- [ ] Validation fails for empty name, missing icon, or missing color

---

**Title:** Category Service Functions (CRUD)

**Label:** `Database`

**Parent Issue:** Category CRUD & Service Layer

**Dependencies:** KV2-401 (Category Schemas) must be completed first.

---

**Description:**

Kasya is a local-first finance app using WatermelonDB for storage. This task creates the category CRUD service functions.

System categories (where `is_system === true`) cannot be edited or deleted through these services. The `updateCategory` and `deleteCategory` functions must enforce this.

**What to do:**

Create `src/features/category/services/index.ts`:

1. **`createCategory(db: Database, data: CategoryFormData): Promise<CategoryModel>`**
   - Inside `database.write()`, create a new category record
   - Set `is_system` to `false` (all user-created categories are non-system)
   - Set `sort_order` to the count of existing categories (append to end)
   - Return the created category

2. **`updateCategory(db: Database, categoryId: string, data: Partial<CategoryFormData>): Promise<void>`**
   - Find the category by ID
   - **Guard:** If `category.isSystem === true`, throw an error: `'System categories cannot be edited'`
   - Inside `database.write()`, update the provided fields

3. **`deleteCategory(db: Database, categoryId: string): Promise<void>`**
   - Find the category by ID
   - **Guard:** If `category.isSystem === true`, throw an error: `'System categories cannot be deleted'`
   - Inside `database.write()`, call `category.destroyPermanently()`
   - Note: This does NOT update transactions that reference this category. The UI should warn the user before deletion. For V1, orphaned category references are acceptable.

4. **`reorderCategories(db: Database, categoryIds: string[]): Promise<void>`**
   - Same pattern as `reorderWallets`: batch update `sort_order` for all categories

**Do NOT:**
- Allow editing/deleting system categories — enforce the guard in every mutation.
- Cascade delete transactions when a category is deleted — orphaned references are acceptable for V1.
- Add category seeding here — seeding happens in onboarding (M2).

**Acceptance Criteria:**
- [ ] All 4 service functions created and exported
- [ ] `createCategory` sets `is_system: false` and appends to end
- [ ] `updateCategory` throws error for system categories
- [ ] `deleteCategory` throws error for system categories
- [ ] `deleteCategory` permanently removes the record for non-system categories
- [ ] `reorderCategories` atomically updates sort_order via `db.batch()`
- [ ] All operations wrapped in `database.write()`

---

**Title:** Category Reactive Hooks

**Label:** `Feature`

**Parent Issue:** Category CRUD & Service Layer

**Dependencies:** KV2-402 (Category Services) and KV2-133 (DatabaseProvider) must be completed first.

---

**Description:**

Kasya uses WatermelonDB observables for reactive data. This task creates hooks for reading category data. These hooks are used by the category management screen, the category picker, and anywhere categories need to be displayed.

**What to do:**

Create `src/features/category/hooks/index.ts`:

1. **`useCategories(): { categories: CategoryModel[], isLoading: boolean }`**
   - Query `categories` table ordered by `sort_order` ascending
   - Subscribe to `.observe()` for reactivity
   - Returns all categories (system + custom)

2. **`useSystemCategories(): { categories: CategoryModel[], isLoading: boolean }`**
   - Same as above but filtered: `Q.where('is_system', true)`
   - Returns only system categories (Income, Expense)

3. **`useCustomCategories(): { categories: CategoryModel[], isLoading: boolean }`**
   - Filtered: `Q.where('is_system', false)`
   - Returns only user-created categories

4. **`useCategoryById(id: string): { category: CategoryModel | null, isLoading: boolean }`**
   - Find and observe a single category by ID

Follow the same observable subscription pattern established in the wallet hooks (KV2-303).

**Do NOT:**
- Cache categories in Zustand — use WatermelonDB observables.
- Create a hook that fetches non-reactively — always use `.observe()`.

**Acceptance Criteria:**
- [ ] `useCategories()` returns all categories sorted by sort_order
- [ ] `useSystemCategories()` returns only system categories
- [ ] `useCustomCategories()` returns only custom categories
- [ ] `useCategoryById()` returns a single category or null
- [ ] All hooks update reactively when categories change in the database
- [ ] All subscriptions cleaned up on unmount

---

## Parent Issue: Category UI Components

**Description:** Build the category UI — a reusable picker component (used in Transaction and Budget forms), a category management screen for CRUD operations, and a category form in a bottom sheet.

### Issues:

---

**Title:** Category Picker (Bottom Sheet)

**Label:** `UI / UX`

**Parent Issue:** Category UI Components

**Dependencies:**
- KV2-403 (Category Hooks) — picker reads category data
- KV2-152 (Bottom Sheet Component) — picker renders in a bottom sheet
- KV2-153 (Shared Components) — uses emoji picker for icon selection

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the category picker — a bottom sheet component that lets users select a category from the existing list. This picker is reused in the Transaction Form (M5), Budget Form (M6), and anywhere a category needs to be selected.

**What to do:**

Create `src/features/category/components/category-picker.tsx`:

```tsx
interface CategoryPickerProps {
  isOpen: boolean;
  onSelect: (category: CategoryModel) => void;
  onClose: () => void;
  selectedId?: string;  // highlight the currently selected category
}
```

1. **Bottom sheet:** Render inside the shared `<BottomSheet>` component with snap points `['60%', '85%']` and title "Select Category".

2. **Category grid/list:**
   - Display all categories (from `useCategories()` hook) in a grid layout (3-4 columns)
   - Each item shows:
     - Emoji icon (large, centered)
     - Category name (small text below icon)
     - Background tinted with the category's color (low opacity)
   - Currently selected category (matching `selectedId`) has a primary color border/ring
   - Tapping a category calls `onSelect(category)` and closes the sheet

3. **No categories edge case:** If somehow no categories exist, show a message: "No categories available. Add categories in Settings."

4. **"Manage Categories" link:** At the bottom of the sheet, a text link "Manage Categories" that navigates to the category management screen (from KV2-412). For now, if that screen doesn't exist yet, just log a console message.

**Do NOT:**
- Add create/edit functionality inside the picker — that's the management screen's job.
- Filter by system vs custom — show all categories together.
- Allow multi-select — only one category at a time.

**Acceptance Criteria:**
- [ ] Picker renders in a bottom sheet with category grid
- [ ] Each category shows emoji icon, name, and color tint
- [ ] Tapping a category selects it, calls `onSelect`, and closes the sheet
- [ ] Currently selected category visually highlighted
- [ ] Grid layout with 3-4 columns
- [ ] "Manage Categories" link at bottom
- [ ] Works with both system and custom categories

---

**Title:** Category Form (Bottom Sheet)

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Category UI Components

**Dependencies:**
- KV2-402 (Category Services) — form calls create/update services
- KV2-152 (Bottom Sheet) — form renders in a bottom sheet
- KV2-153 (Shared Components) — uses emoji picker and color picker

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the category form for creating and editing custom categories. It uses React Hook Form + Zod for validation and renders in a bottom sheet.

System categories cannot be edited — the form should not be openable with a system category.

**What to do:**

Create `src/features/category/components/category-form.tsx`:

```tsx
interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryModel; // If provided, edit mode (must NOT be system)
}
```

1. **Form setup:** Use `useForm<CategoryFormData>()` with `zodResolver(categoryFormSchema)`.

2. **Form fields:**

   a. **Icon selector** — Large emoji display (current icon or placeholder). Tappable — opens the shared `EmojiPicker` from `@/components/shared/emoji-picker`. After selection, the emoji updates inline.

   b. **Name** — `Input` component. Label: "Category Name". Placeholder: "e.g., Groceries". Max 30 characters.

   c. **Color picker** — Use the shared `ColorPicker` from `@/components/shared/color-picker` with `CATEGORY_COLORS` from `@/constants/colors`.

3. **Preview:** Above the form fields, show a live preview of the category as it would appear in the picker — emoji + name on a color-tinted background. Updates as the user types/selects.

4. **Actions:**
   - **Save button:** "Create Category" or "Save Changes"
     - Validate, call `createCategory()` or `updateCategory()` from services
     - Toast + close
   - **Delete button (edit mode only):** Red destructive style
     - Confirmation: "Delete [name]? Transactions using this category won't be affected."
     - Call `deleteCategory()`
     - Toast + close

5. **Bottom sheet config:** Snap points `['70%']`, title "New Category" or "Edit Category".

**Do NOT:**
- Allow opening the form with a system category — the calling code should prevent this, but add a guard:
  ```ts
  if (category?.isSystem) { onClose(); return null; }
  ```
- Allow editing the `isSystem` flag — it's always `false` for form-created categories.

**Acceptance Criteria:**
- [ ] Form renders in a bottom sheet
- [ ] Emoji picker opens when icon area tapped, selected emoji shows inline
- [ ] Name input with validation (required, max 30)
- [ ] Color picker with CATEGORY_COLORS palette
- [ ] Live preview updates as user types/selects
- [ ] Create mode: saves new category via service
- [ ] Edit mode: pre-fills fields, saves changes via service
- [ ] Delete button (edit only) with confirmation
- [ ] Guard prevents opening form with system category
- [ ] Toast + close after save/delete

---

**Title:** Category Management Screen

**Label:** `Feature`, `UI / UX`

**Parent Issue:** Category UI Components

**Dependencies:**
- KV2-412 (Category Form) — editing opens the form
- KV2-411 (Category Picker) — this screen is linked from the picker

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the category management screen — accessible from Settings (M9) and from the "Manage Categories" link in the category picker. It shows all categories in a list with visual distinction between system and custom categories.

**What to do:**

1. Create a route file for the category management screen. This could be:
   - `categories.tsx` at the same level as other push screens (in the `app/` directory)
   - Register it in the root `_layout.tsx` Stack

2. **Screen layout:**

   - **Header:** Title "Categories" with a back button and an "Add" button (plus icon) that opens the category form in create mode.

   - **System categories section:**
     - Section header: "System" with a lock icon
     - List of system categories (Income, Expense)
     - Each item: emoji icon, name, color indicator
     - Non-interactive (no tap, no edit, no delete)
     - Visually muted compared to custom categories (slightly lower opacity or a lock icon)

   - **Custom categories section:**
     - Section header: "Custom"
     - List of custom categories from `useCustomCategories()` hook
     - Each item: emoji icon, name, color indicator
     - Tappable — opens the category form in edit mode
     - Drag handle for reorder (same pattern as wallet list)

   - Use `FlashList` or `SectionList` for the list

3. **Drag to reorder:** Custom categories can be reordered via drag. System categories are always at the top and cannot be reordered. On reorder complete, call `reorderCategories()` from services.

4. **Empty custom categories:** If no custom categories exist, show a subtle message in the custom section: "No custom categories yet. Tap + to add one."

**Do NOT:**
- Allow editing or deleting system categories — they should not be tappable.
- Mix system and custom categories in a single unsorted list — keep them in separate sections.
- Add search/filter — not needed for the number of categories a user typically has.

**Acceptance Criteria:**
- [ ] Screen renders with "System" and "Custom" sections
- [ ] System categories show with lock indication and are non-interactive
- [ ] Custom categories are tappable and open the edit form
- [ ] "Add" button opens category form in create mode
- [ ] Drag to reorder works for custom categories
- [ ] Reorder persists via `reorderCategories()` service
- [ ] System categories always appear at the top
- [ ] Route registered in root layout Stack
- [ ] Back navigation works
