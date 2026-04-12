---
description: Commit non-issue changes (tooling, workflows, repo config) without a Linear issue
---

> This workflow is for changes **not linked to any Linear issue** — e.g. workflow updates, repo config, tooling, documentation. For Linear-linked work, use `/push` instead.

## Commit Message Format

```
<type>(<scope>): <short description>

- <what changed>
- <what changed>
```

No `Closes` line. No issue ID.

**Type** is auto-determined from the files changed:

| Files changed                        | Type       |
|--------------------------------------|------------|
| `.windsurf/workflows/`, `docs/`      | `chore`    |
| `app.json`, `babel.config.js`, `eas.json`, `metro.config.js` | `build` |
| `package.json`, `package-lock.json`  | `build`    |
| `.gitignore`, `.gitattributes`       | `chore`    |
| `src/` restructure, no behavior change | `refactor` |
| Any other non-feature change         | `chore`    |

**Scope** = kebab-case name of the area changed (e.g., `workflows`, `repo-config`, `docs`)

**Example:**
```
chore(workflows): add /commit workflow for non-issue changes

- Add commit.md with auto-type detection and format spec
- Update push.md to reference /commit for non-issue work
```

---

## Steps

1. **Analyze changed files**: Run `git status` to see what's modified
2. **Determine type**: Map changed files → commit type using table above
3. **Determine scope**: Identify the area of change as a kebab-case scope
4. **Stage ALL changes**: Run `git add -A` — single stage, no partial staging
5. **Create ONE commit**: Single `git commit` using the format above. Do NOT make multiple commits.
6. **Push directly to main**: `git push origin main` — no branch, no PR needed for non-issue changes
