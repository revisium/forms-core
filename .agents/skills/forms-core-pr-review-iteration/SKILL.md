---
name: forms-core-pr-review-iteration
description: >-
  Address forms-core GitHub review threads, Sonar feedback, or failed checks by
  fetching current PR state, triaging actionable comments against the review
  contract, fixing only valid issues, validating, replying in thread, and
  resolving after fixes.
metadata:
  short-description: Address forms-core PR review
---

# forms-core PR Review Iteration Skill

Use this skill when work is driven by GitHub review comments, unresolved review
threads, or failed PR checks.

## Goal

Resolve actionable review feedback without drifting from the forms-core
architecture or broadening the PR scope.

## Workflow

1. Confirm branch and PR:

   ```bash
   git status --short --branch
   gh pr view --json url,number,state,baseRefName,headRefName
   ```

2. Fetch unresolved review threads through the GitHub review-thread workflow
   available in the current agent environment.
3. Fetch PR check status:

   ```bash
   gh pr checks --json name,bucket,state,workflow,link,description
   ```

4. Read `REVIEW.md`, `docs/quality-gates.md`, and the affected docs.
5. Classify each comment:
   - valid and actionable;
   - invalid because it conflicts with the documented contract;
   - question needing user input.
6. Triage each failed, canceled, or pending required check:
   - GitHub Actions failure: inspect the failed job or linked run before
     editing;
   - Sonar/SonarQube/SonarCloud failure: inspect the linked quality gate or
     issue list and identify rule, file, line, and message before editing;
   - pending required check: wait or report that the PR is not ready.
7. Fix valid issues only.
8. Run required validation.
9. Reply in the original review thread with concise Markdown and evidence.
10. Resolve/minimize the thread only after the fix is verified.

## Output Format

```text
PR review iteration:
- PR:
- Threads inspected:
- Fixes:
- Validation:
- Replies/resolution:
- Remaining risks:
```
