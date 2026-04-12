---
description: Master issue documentation tracking and updates
---

1. **Get Parent Issue ID**: Ask user for parent issue ID (e.g., KSY-1)
2. **Check Master Doc**: Check if master doc exists at `docs/issue-tracker/KSY-{parent-issue-id}.md`
3. **Fetch Issue Details**: Get parent issue and all child issues from Linear
4. **Read Conversation History**: Analyze conversation for context and accomplishments
5. **Update Master Documentation**: Update/create master doc with:
   - Issue summary and current status
   - Changes made (files, components, features added)
   - Issues encountered and how they were resolved
   - Testing results and validation
   - Related PRs, commits, and branches
   - Child issues completion status
   - Lessons learned and notes for future reference
6. **Save Master Doc**: Save to `docs/issue-tracker/KSY-{parent-issue-id}.md` with proper markdown format
7. **Create Directory Structure**: Ensure `docs/issue-tracker/` directory exists
8. **Output Summary**: Provide documentation location and key updates
