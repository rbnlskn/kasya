---
description: Start work on parent Linear issue with automated planning and setup
---

1. **Get Parent Issue ID**: Ask user for parent issue ID (e.g., KSY-1)
2. **Fetch Parent Issue Details**: Get issue title, description, and status from Linear
3. **Get Child Issues**: Fetch all child issues of the parent issue from Linear
4. **Read Architecture**: Read docs/ARCHITECTURE.md for project context and structure
5. **Analyze Dependencies**: Understand dependencies between child issues and project structure
6. **Validate Architecture Compliance**: Check current codebase against architecture principles:
   - WatermelonDB observables usage (no DB mirroring in Zustand)
   - Zustand UI-only state compliance
   - Service layer separation validation
   - Circular dependency detection
7. **Check Dependencies**: Verify required dependencies are installed and compatible with Expo SDK
8. **Validate Milestone Prerequisites**: Ensure previous milestone dependencies are met
9. **Generate Enhanced Sequential Plan**: Create detailed step-by-step plan with:
   - Sequential order for child issues (KSY-2, then KSY-3, then KSY-4)
   - File structure changes needed
   - Dependencies to install
   - Architecture considerations per child issue
   - Code examples and snippets
   - Clear completion criteria for each child issue
10. **Save Plan File**: Save implementation plan to `/Users/user/.windsurf/plans/` with proper naming format
11. **Set Up Initial Structure**: Create any necessary directories/files if needed
12. **Output Summary**: Provide ready-to-execute plan with architecture considerations
