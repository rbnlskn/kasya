---
description: Push completed parent Linear issue to GitHub with automatic PR creation
---

## Commit Message Format

Every issue produces **exactly ONE commit**. Use this format:

```
<type>(<scope>): <short description>

<body — bullet list of what changed>

Closes <ISSUE-ID>
```

**Type** maps from the issue's primary Linear label (priority order: Feature > Bug > Refactor > UI/UX > Database > Config/Build > Chore):

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
feat(wallet-system): implement wallet CRUD and carousel

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
7. **Determine commit type**: Map primary label → commit type using table above
8. **Create branch**: `{type}/ksy-{parent-id}-{scope}` (e.g. `feat/ksy-10-wallet-system`). Switch to existing branch if already created.
9. **Stage ALL changes**: Run `git add -A` — single stage, no partial staging
10. **Create ONE commit**: Single `git commit` using the format above. Do NOT make multiple commits.
11. **Push branch**: `git push origin <branch>`
12. **Create PR**: Use GitHub MCP with:
    - Title: `<type>(<scope>): <short description>` (same as commit subject)
    - Body: summary of changes, validation results, and `Closes #<linear-issue-number>`
