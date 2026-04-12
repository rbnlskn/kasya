# Milestone 9: Settings & Data Management

## Milestone Details (for Linear)

- **Title:** M9 — Settings & Data Management
- **Description:** Implement the Settings screen with user preferences (currency change, theme toggle, app info), category management access, JSON backup export (via share sheet), JSON import (via file picker), and full data reset with double confirmation. This milestone also creates the settings hooks and wires up the Settings tab.
- **Why ninth:** All core features must exist before backup/restore can serialize them. Settings is a polish layer on top of a working app — changing currency or theme while features don't exist would be premature.
- **Definition of Done:**
  - Settings screen in the Settings tab with all options listed below
  - Can change currency (updates MMKV + Settings record)
  - Can toggle theme (system/light/dark)
  - Can access category management from settings
  - JSON export produces a complete backup file shared via the OS share sheet
  - JSON import reads a backup file and restores all data
  - Full data reset clears WatermelonDB + MMKV and returns to onboarding
  - App version and "About" info displayed

---

## Parent Issue: Settings Screen & Preferences

**Description:** Build the Settings tab content — preferences, links to management screens, and app information.

### Issues:

---

**Title:** Settings Hooks & Data Access

**Label:** `Feature`

**Parent Issue:** Settings Screen & Preferences

**Dependencies:**
- KV2-132 (WatermelonDB Model Classes) — SettingsModel must exist
- KV2-134 (MMKV Setup) — settings read from MMKV
- KV2-123 (Theme Hook) — theme management already built in M1

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task creates the hooks for reading and updating user settings. Settings are split between MMKV (lightweight prefs) and WatermelonDB (the Settings table record created during onboarding).

**What to do:**

Create `src/features/settings/hooks/index.ts`:

1. **`useSettings(): { name: string, currency: string, currencySymbol: string, timezone: string, isLoading: boolean }`**
   - Query the `settings` table (there should be exactly 1 record, created during onboarding)
   - Subscribe to `.observe()` for reactivity
   - Also read `MMKV_KEYS.USER_NAME` and `MMKV_KEYS.CURRENCY` for the lightweight values
   - Look up the currency symbol from the `CURRENCIES` array in `@/constants/currencies`
   - Return all values

2. **`useUpdateSettings()`**
   - Returns functions for updating settings:
     - `updateName(name: string)` — writes to MMKV + updates Settings DB record
     - `updateCurrency(code: string)` — writes to MMKV + updates Settings DB record
   - Both use `database.write()` for the DB update and `mmkv.setString()` for MMKV
   - Both operations should happen together (MMKV is synchronous, DB write is async)

3. Re-export `useTheme` from `@/features/settings/hooks/use-theme` (already created in M1 KV2-123) so all settings hooks are accessible from one import path.

**Do NOT:**
- Create a separate settings store in Zustand — use MMKV + WatermelonDB.
- Allow multiple Settings records — enforce a single record. If somehow 0 records exist, throw a clear error directing back to onboarding.

**Acceptance Criteria:**
- [ ] `useSettings()` returns user name, currency, currency symbol, timezone
- [ ] Data reads from both MMKV and WatermelonDB Settings record
- [ ] Currency symbol resolved from the CURRENCIES constant
- [ ] `useUpdateSettings()` returns `updateName` and `updateCurrency` functions
- [ ] Name update writes to both MMKV and DB
- [ ] Currency update writes to both MMKV and DB
- [ ] All reactive via WatermelonDB observables

---

**Title:** Settings Screen UI

**Label:** `UI / UX`

**Parent Issue:** Settings Screen & Preferences

**Dependencies:**
- KV2-901 (Settings Hooks) must be completed first
- KV2-413 (Category Management Screen) — linked from settings

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task builds the Settings tab screen — a scrollable list of preference options, management links, and app info.

**What to do:**

1. Update `(tabs)/settings.tsx` (replace placeholder):

2. **Screen structure (top to bottom in a ScrollView):**

   a. **Profile section:**
      - User's display name (large, bold)
      - "Edit" tappable text → opens a bottom sheet or inline input to change the name (calls `updateName()`)

   b. **Preferences section:**
      - **Currency** — `SettingItem` showing current currency code + symbol. Tapping opens a currency picker bottom sheet (reuse the currency list pattern from onboarding KV2-203, but in a bottom sheet). Selecting a new currency calls `updateCurrency()`.
      - **Theme** — `SettingItem` showing current theme mode. Tapping cycles through: System → Light → Dark (or opens a 3-option selector). Uses `setTheme()` from `useTheme()`.

   c. **Management section:**
      - **Categories** — `SettingItem` with right arrow. Tapping navigates to the category management screen (`/categories`).
      - **Wallets** — `SettingItem` with right arrow. Tapping navigates to the wallet list screen (`/wallets`).

   d. **Data section:**
      - **Export Data** — `SettingItem` with share icon. Tapping triggers the JSON export flow (KV2-911).
      - **Import Data** — `SettingItem` with download icon. Tapping triggers the JSON import flow (KV2-912).
      - **Reset All Data** — `SettingItem` in destructive red. Tapping triggers the reset flow (KV2-913).

   e. **About section:**
      - App name: "Kasya"
      - Version: read from app constants or `expo-constants`
      - "Made by r3stack" or similar branding
      - Optional: changelog or "What's New" link

3. Create a `SettingItem` component at `src/features/settings/components/setting-item.tsx` if not already existing:
   ```tsx
   interface SettingItemProps {
     label: string;
     value?: string;
     icon?: React.ComponentType<any>; // Lucide icon
     onPress: () => void;
     destructive?: boolean;
     showArrow?: boolean;
   }
   ```
   - Renders as a tappable row: icon (optional), label, value (right-aligned), chevron arrow (optional)
   - Destructive variant: red text
   - Separator between items

**Do NOT:**
- Build the export/import/reset logic in this issue — those are separate issues (KV2-911, 912, 913). Just wire the `onPress` to call the appropriate function.
- Add notification settings — deferred to Project 2.
- Add account/login settings — no backend in V1.

**Acceptance Criteria:**
- [ ] Settings tab renders all sections listed above
- [ ] Name editable via bottom sheet/inline input
- [ ] Currency picker opens and updates currency app-wide
- [ ] Theme toggle works (system/light/dark)
- [ ] "Categories" navigates to category management
- [ ] "Wallets" navigates to wallet list
- [ ] Export/Import/Reset items present and tappable (logic wired in later issues)
- [ ] App version displayed
- [ ] `SettingItem` component reusable with all props
- [ ] Destructive items (Reset) styled in red

---

## Parent Issue: Backup, Import & Reset

**Description:** Implement JSON backup export (share sheet), JSON import (file picker), and full data reset. These are critical data management features for a local-first app with no cloud sync.

### Issues:

---

**Title:** JSON Backup Export (Share Sheet)

**Label:** `Feature`

**Parent Issue:** Backup, Import & Reset

**Dependencies:**
- All model classes and data must exist (M1-M8 completed)
- KV2-901 (Settings Hooks) — reads user settings for export

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native using WatermelonDB for storage. This task implements the JSON backup export. It reads all data from WatermelonDB, serializes it to a JSON file, and shares it via the OS share sheet (so the user can save to Files, send via email, etc.).

**What to do:**

1. Install dependencies:
   ```
   npx expo install expo-file-system expo-sharing
   ```

2. Create `src/features/backup/services/index.ts`:

3. **`exportToJSON(db: Database): Promise<string>`**

   a. Read ALL records from ALL tables:
      ```ts
      const wallets = await db.get<WalletModel>('wallets').query().fetch();
      const categories = await db.get<CategoryModel>('categories').query().fetch();
      const transactions = await db.get<TransactionModel>('transactions').query().fetch();
      const budgets = await db.get<BudgetModel>('budgets').query().fetch();
      const bills = await db.get<BillModel>('bills').query().fetch();
      const commitments = await db.get<CommitmentModel>('commitments').query().fetch();
      const settings = await db.get<SettingsModel>('settings').query().fetch();
      ```

   b. Serialize each record to a plain object (WatermelonDB models have internal properties that shouldn't be exported). Create a `serializeModel` helper:
      ```ts
      function serializeWallet(w: WalletModel) {
        return {
          id: w.id, name: w.name, type: w.type, balance: w.balance,
          color: w.color, textColor: w.textColor, currency: w.currency,
          creditLimit: w.creditLimit, statementDay: w.statementDay, sortOrder: w.sortOrder,
        };
      }
      // Similar for each model...
      ```

   c. Build the backup object:
      ```ts
      const backup = {
        version: 1,                        // Schema version for future compatibility
        exportedAt: new Date().toISOString(),
        app: 'kasya',
        data: {
          wallets: wallets.map(serializeWallet),
          categories: categories.map(serializeCategory),
          transactions: transactions.map(serializeTransaction),
          budgets: budgets.map(serializeBudget),
          bills: bills.map(serializeBill),
          commitments: commitments.map(serializeCommitment),
          settings: settings.map(serializeSettings),
        },
      };
      ```

   d. Write to a temp file:
      ```ts
      const json = JSON.stringify(backup, null, 2);
      const fileName = `kasya-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, json);
      return filePath;
      ```

4. **`shareBackup(filePath: string): Promise<void>`**
   ```ts
   import * as Sharing from 'expo-sharing';
   await Sharing.shareAsync(filePath, {
     mimeType: 'application/json',
     dialogTitle: 'Export Kasya Backup',
   });
   ```

5. Wire into Settings: "Export Data" `onPress` calls `exportToJSON()` then `shareBackup()`. Show a loading indicator during export and a success toast after sharing.

**Do NOT:**
- Export to a fixed file path — use the cache directory and share via OS.
- Include WatermelonDB internal fields (`_status`, `_changed`) in the export.
- Compress the JSON — keep it human-readable for V1.

**Acceptance Criteria:**
- [ ] `expo-file-system` and `expo-sharing` installed
- [ ] `exportToJSON()` reads all 7 tables and serializes to JSON
- [ ] Backup includes a version number and export timestamp
- [ ] Each record serialized as a plain object (no WatermelonDB internals)
- [ ] JSON file written to cache directory with timestamped filename
- [ ] Share sheet opens with the JSON file
- [ ] Loading indicator during export
- [ ] Success toast after sharing

---

**Title:** JSON Backup Import (File Picker)

**Label:** `Feature`

**Parent Issue:** Backup, Import & Reset

**Dependencies:** KV2-911 (JSON Export) must be completed first — import uses the same data format.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native using WatermelonDB for storage. This task implements the JSON backup import. It lets the user pick a JSON file, validates it, and restores all data by clearing existing data and inserting the imported records.

**What to do:**

1. Install dependency:
   ```
   npx expo install expo-document-picker
   ```

2. Add to `src/features/backup/services/index.ts`:

3. **`importFromJSON(db: Database, fileUri: string): Promise<void>`**

   a. Read the file:
      ```ts
      const content = await FileSystem.readAsStringAsync(fileUri);
      const backup = JSON.parse(content);
      ```

   b. Validate the backup structure:
      - Must have `version` (number)
      - Must have `app` equal to `'kasya'`
      - Must have `data` object with all 7 table arrays
      - If validation fails, throw a descriptive error

   c. **Clear all existing data** (inside a single `database.write()`):
      ```ts
      await db.write(async () => {
        await db.unsafeResetDatabase();
      });
      ```
      Note: `unsafeResetDatabase()` drops all data and recreates tables from schema. This is the cleanest approach for a full restore.

   d. **Insert all imported records** (inside a single `database.write()`):
      ```ts
      await db.write(async () => {
        // For each table, batch-create all records
        const walletOps = backup.data.wallets.map((w: any) =>
          db.get<WalletModel>('wallets').prepareCreate((record) => {
            record._raw.id = w.id; // preserve original IDs for foreign key integrity
            record.name = w.name;
            record.type = w.type;
            // ... all fields
          })
        );
        // Similar for all other tables...
        await db.batch(...walletOps, ...categoryOps, ...transactionOps, ...budgetOps, ...billOps, ...commitmentOps, ...settingsOps);
      });
      ```

   e. Update MMKV to match imported settings:
      ```ts
      const importedSettings = backup.data.settings[0];
      if (importedSettings) {
        mmkv.setString(MMKV_KEYS.USER_NAME, importedSettings.name);
        mmkv.setString(MMKV_KEYS.CURRENCY, importedSettings.currency);
        mmkv.setBoolean(MMKV_KEYS.ONBOARDING_COMPLETED, true);
      }
      ```

4. **`pickAndImport(db: Database): Promise<boolean>`**
   ```ts
   import * as DocumentPicker from 'expo-document-picker';

   const result = await DocumentPicker.getDocumentAsync({
     type: 'application/json',
     copyToCacheDirectory: true,
   });

   if (result.canceled) return false;

   await importFromJSON(db, result.assets[0].uri);
   return true;
   ```

5. Wire into Settings: "Import Data" `onPress`:
   - Show a confirmation dialog FIRST: "Import will replace ALL current data. This cannot be undone. Continue?"
   - If confirmed, call `pickAndImport()`
   - Show loading indicator during import
   - On success: toast "Data restored successfully" and reload the app (or navigate to home)
   - On error: toast "Import failed: [error message]"

**Do NOT:**
- Merge imported data with existing data — it's a full replace (clear + insert).
- Import without confirmation — the user must confirm because it's destructive.
- Skip ID preservation — imported records must keep their original IDs so foreign keys (wallet_id, category_id, etc.) remain valid.

**Acceptance Criteria:**
- [ ] `expo-document-picker` installed
- [ ] File picker opens and accepts JSON files
- [ ] Backup file validated (version, app name, data structure)
- [ ] Clear error message if file is not a valid Kasya backup
- [ ] Existing data cleared before import (full replace)
- [ ] All 7 tables imported with preserved IDs
- [ ] Foreign key relationships intact after import
- [ ] MMKV updated to match imported settings
- [ ] Confirmation dialog before import
- [ ] Loading indicator during import
- [ ] Success/error toast after import

---

**Title:** Full Data Reset with Double Confirmation

**Label:** `Feature`

**Parent Issue:** Backup, Import & Reset

**Dependencies:** KV2-911 (JSON Export) — user should be prompted to export before reset.

---

**Description:**

Kasya is a local-first finance app built with Expo + React Native. This task implements the full data reset — clearing ALL data from WatermelonDB and MMKV, returning the user to the onboarding flow as if they just installed the app.

This is a destructive operation and requires a double confirmation to prevent accidental data loss.

**What to do:**

1. Add to `src/features/backup/services/index.ts`:

2. **`resetAllData(db: Database): Promise<void>`**

   a. Clear WatermelonDB:
      ```ts
      await db.write(async () => {
        await db.unsafeResetDatabase();
      });
      ```

   b. Clear all MMKV data:
      ```ts
      mmkv.clearAll();
      ```

3. Wire into Settings: "Reset All Data" `onPress`:

   **Step 1 — Suggest export first:**
   - Show a dialog: "Would you like to export your data before resetting?"
   - Options: "Export First" (runs export flow, then continues) / "Skip" (continues to step 2) / "Cancel"

   **Step 2 — First confirmation:**
   - Alert: "Reset All Data?"
   - Message: "This will permanently delete all your wallets, transactions, budgets, bills, and commitments. This cannot be undone."
   - Options: "Reset Everything" (destructive) / "Cancel"

   **Step 3 — Second confirmation (type to confirm):**
   - Alert or bottom sheet: "Type DELETE to confirm"
   - Text input where user must type "DELETE" (case-insensitive)
   - "Reset" button enabled only when input matches
   - This prevents accidental taps

   **Step 4 — Execute:**
   - Call `resetAllData(db)`
   - Navigate to onboarding: `router.replace('/(onboarding)/welcome')`
   - Toast: "All data has been reset"

**Do NOT:**
- Skip the double confirmation — this is the most destructive action in the app.
- Keep any MMKV data after reset — clear everything including theme preference.
- Leave the user on the Settings screen after reset — navigate to onboarding.

**Acceptance Criteria:**
- [ ] "Export first?" prompt shown before reset
- [ ] First confirmation dialog with destructive styling
- [ ] Second confirmation requires typing "DELETE"
- [ ] Reset button disabled until "DELETE" is typed
- [ ] `resetAllData()` clears all WatermelonDB tables
- [ ] `resetAllData()` clears all MMKV storage
- [ ] App navigates to onboarding after reset
- [ ] Onboarding flow works correctly after reset (as if fresh install)
- [ ] Toast confirmation shown
