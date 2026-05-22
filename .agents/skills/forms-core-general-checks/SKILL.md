---
name: forms-core-general-checks
description: >-
  Run forms-core baseline verification before handoff, PR creation, readiness
  replies, or after addressing review feedback, and report branch, docs,
  commands, package, and remaining-risk evidence.
metadata:
  short-description: Run forms-core checks
---

# forms-core General Checks Skill

Use this skill before handoff, before opening a PR, before replying that a PR is
ready, and after addressing review feedback.

## Preflight

1. Confirm branch and worktree:

   ```bash
   git status --short --branch
   git diff --check
   ```

2. Identify the change type:
   - docs/agent contract only;
   - package scaffold;
   - bridge implementation;
   - form/control API;
   - validation/server errors;
   - arrays/nested paths;
   - patches/disposal;
   - release readiness.

3. Read the right contract:
   - `REVIEW.md`;
   - `docs/architecture.md`;
   - `docs/quality-gates.md`;
   - `docs/review/forms-core-checklist.md`;
   - affected step in `docs/steps.md`.

## Required Commands

For docs-only bootstrap changes:

```bash
git diff --check
rg -n "[ \t]+$" README.md AGENTS.md REVIEW.md docs .agents
node scripts/lint-skills.mjs
```

After package scaffold exists:

```bash
npm run verify
```

Before release readiness:

```bash
npm pack --dry-run
```

For PR updates, inspect required PR checks and Sonar/quality-gate status when
configured. Sonar `PASSED` is not enough: inspect unresolved Sonar issues with
`npm run sonar:issues:local` or the linked Sonar issue list, and require `0`
remaining valid issues. Do not call a branch ready while required checks are
failed, pending, or hiding unresolved valid Sonar issues.

## Output Format

```text
General checks:
- Branch/worktree:
- Change type:
- Docs/source-of-truth:
- Commands:
- Package contents:
- Remaining risks:
```

If a required command cannot run, say exactly why and name the remaining risk.
