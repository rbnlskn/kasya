---
description: Push completed parent Linear issue to GitHub with automatic PR creation
---

> This workflow is for **Linear-linked work only**. For non-issue commits (tooling, workflows, repo config), use `/commit` instead.

## Commit Message Format

Every parent issue produces **exactly ONE commit**:

```
<type>(<scope>): <short description>

- <what child issue 1 added>
- <what child issue 2 added>
- <what child issue N added>

Closes <PARENT-ISSUE-ID>
```

**Type** = highest priority label across all child issues (priority order: Feature > Bug > Refactor > UI/UX > Database > Config/Build > Chore):

| Linear Label    | Commit type |
|----------------|-------------|
| Feature        | `feat`      |
| Bug            | `fix`       |
| Chore          | `chore`     |
| UI / UX        | `ui`        |
| Database       | `db`        |
| Config / Build | `build`     |
| Refactor       | `refactor`  |

**Scope** = kebab-case slug of the parent issue title (e.g., `wallet-system`, `onboarding-flow`)

**Example:**
```
feat(ksy-10): implement wallet system

- Add WalletCard, WalletCarousel, WalletForm components
- Add createWallet, updateWallet, deleteWallet services
- Implement useWallets and useWalletById hooks

Closes KSY-10
```

---

## Steps

1. **Get Issue IDs**: Ask user for parent issue ID (e.g., KSY-10) and child issue IDs (comma-separated)
2. **Fetch Issue Details**: Get parent title, description, and labels from Linear
3. **Analyze Conversation**: Extract what was built, problems solved, and files changed
4. **Validate Architecture**: Check compliance with:
   - WatermelonDB observables usage (no DB mirroring in Zustand)
   - Zustand UI-only state compliance
   - Service layer separation
   - No circular dependencies between features
   - TypeScript strict mode
5. **Check Milestone Completion**: Verify all child issues are complete and meet acceptance criteria
6. **Validate Dependencies**: Ensure no breaking changes and Expo SDK compatibility
7. **Determine commit type**: Map highest priority label across all child issues → commit type using table above
8. **Create branch**: `{type}/ksy-{parent-id}-{scope}` (e.g. `feat/ksy-10-wallet-system`). Switch to existing branch if it already exists.
9. **Stage ALL changes**: Run `git add -A` — single stage, no partial staging
10. **Create ONE commit**: Single `git commit` using the format above. Do NOT make multiple commits.
11. **Push branch**: `git push origin <branch>`
12. **Create PR**: Use GitHub MCP with:
    - Title: `<type>(<scope>): <short description>` (same as commit subject)
    - Body: summary of changes, validation results, and `Closes #<linear-issue-number>`
