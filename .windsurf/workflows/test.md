---
description: Manual testing guidance for parent Linear issues in Expo Go
---

1. **Get Parent Issue ID**: Ask user for parent issue ID (e.g., KSY-1)
2. **Fetch Parent Issue Details**: Get parent issue title, description, and labels from Linear
3. **Get Child Issues**: Fetch all child issues of the parent issue from Linear
4. **Generate Comprehensive Testing Checklist**: Create checklist for entire parent issue:
   - Test all child issue implementations in sequence
   - Verify integration between child issues
   - Test end-to-end user flows across all features
   - Validate data flow between components
   - Test edge cases and error scenarios
5. **Create Test Report Template**: Generate structured test report for parent issue
6. **Provide Testing Instructions**: Guide through Expo Go manual testing process for parent issue
7. **Save Test Plan**: Save test plan to `test-plan-{parent-issue-id}.md` with all child issues
8. **Output Summary**: Provide comprehensive testing checklist and next steps
