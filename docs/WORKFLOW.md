# Kasya — Developer Workflow Reference

Everything you need to understand how the development workflow operates from issue start to GitHub push.

---

## Workflows Overview

There are 5 Windsurf workflows. Run them with a slash command in the chat.

| Command | When to use |
|---------|-------------|
| `/start` | Beginning work on a Linear parent issue |
| `/push` | Finished a Linear parent issue — commit + PR |
| `/commit` | Non-issue changes (tooling, workflows, repo config) |
| `/docs` | Update master documentation for a completed issue |
| `/test` | Generate a manual testing checklist for an issue |

---

## Typical Session Flow

```
1. /start KSY-10          → fetch issue, read architecture, generate plan
2. Implement child issues  → code, test incrementally
3. /test KSY-10           → manual testing checklist in Expo Go
4. /push KSY-10           → commit + branch + PR
5. /docs KSY-10           → update issue tracker doc
```

For non-issue work (e.g. updating a workflow file):
```
1. Make changes
2. /commit                → auto-detect type, stage, commit, push to main
```

---

## Commit Format

### Issue-linked commit (`/push`)

Used when work is tied to a Linear parent issue.

```
<type>(<scope>): <short description>

- <what child issue 1 added>
- <what child issue 2 added>
- <what child issue N added>

Closes <PARENT-ISSUE-ID>
```

**Example:**
```
feat(ksy-10): implement wallet system

- Add WalletCard, WalletCarousel, WalletForm components
- Add createWallet, updateWallet, deleteWallet services
- Implement useWallets and useWalletById hooks

Closes KSY-10
```

### Non-issue commit (`/commit`)

Used for tooling, workflow files, repo config — anything not tracked in Linear.

```
<type>(<scope>): <short description>

- <what changed>
- <what changed>
```

**Example:**
```
chore(workflows): update /push workflow with commit format spec

- Remove Scenario B from push.md
- Add /commit workflow for non-issue changes
```

---

## Commit Type Reference

**For `/push`** — type = highest priority label across child issues:

| Linear Label    | Commit type |
|----------------|-------------|
| Feature        | `feat`      |
| Bug            | `fix`       |
| Chore          | `chore`     |
| UI / UX        | `ui`        |
| Database       | `db`        |
| Config / Build | `build`     |
| Refactor       | `refactor`  |

Priority order: `feat` > `fix` > `refactor` > `ui` > `db` > `build` > `chore`

**For `/commit`** — type = inferred from files changed:

| Files changed | Type |
|---------------|------|
| `.windsurf/workflows/`, `docs/` | `chore` |
| `app.json`, `babel.config.js`, `eas.json`, `metro.config.js` | `build` |
| `package.json`, `package-lock.json` | `build` |
| `.gitignore`, `.gitattributes` | `chore` |
| `src/` restructure (no behavior change) | `refactor` |

---

## Branch Naming

| Scenario | Format | Example |
|----------|--------|---------|
| Issue-linked (`/push`) | `{type}/ksy-{parent-id}-{scope}` | `feat/ksy-10-wallet-system` |
| Non-issue (`/commit`) | push directly to `main` | — |

---

## Linear Label → Commit Type (Quick Reference)

```
Feature        → feat
Bug            → fix
Chore          → chore
UI / UX        → ui
Database       → db
Config / Build → build
Refactor       → refactor
```

---

## Workflow Details

### `/start` — Begin a Linear issue

1. Provide parent issue ID (e.g. KSY-10)
2. Fetches parent + all child issues from Linear
3. Reads `docs/ARCHITECTURE.md` for project context
4. Validates architecture compliance and installed dependencies
5. Generates a sequential implementation plan saved to `.windsurf/plans/`

### `/push` — Finish a Linear issue

1. Provide parent + child issue IDs
2. Fetches issue details from Linear
3. Validates architecture compliance and milestone completion
4. Determines commit type from highest priority label
5. Creates branch: `{type}/ksy-{parent-id}-{scope}`
6. Stages all changes (`git add -A`) → creates ONE commit → pushes branch
7. Opens PR via GitHub MCP

### `/commit` — Non-issue changes

1. Runs `git status` to see what changed
2. Auto-determines type and scope from changed files
3. Stages all changes → creates ONE commit → pushes directly to `main`
4. No PR created

### `/docs` — Document a completed issue

1. Provide parent issue ID
2. Fetches issue + child issues from Linear
3. Creates/updates `docs/issue-tracker/KSY-{id}.md` with:
   - What was built, files changed, problems solved
   - PR and commit references
   - Lessons learned

### `/test` — Generate testing checklist

1. Provide parent issue ID
2. Fetches all child issues
3. Generates a manual testing checklist covering all child issues
4. Saves test plan to `.windsurf/plans/test-plan-KSY-{id}.md`

---

> See `docs/ARCHITECTURE.md` for the full tech stack, directory structure, and data flow reference.
