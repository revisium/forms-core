---
name: forms-core-implementation-step
description: >-
  Implement the next scoped forms-core step by reading the architecture,
  current step tracker, PR plan, and review contract; make only the intended
  change, validate it, update docs/steps.md, and prepare concise handoff notes.
metadata:
  short-description: Implement next forms-core step
---

# forms-core Implementation Step Skill

Use this skill for normal implementation work in `forms-core`.

## Goal

Advance exactly one scoped step from `docs/steps.md` without drifting from the
architecture contract.

## Required Reading

1. `AGENTS.md`
2. `REVIEW.md`
3. `docs/architecture.md`
4. `docs/steps.md`
5. `docs/pr-plan.md`
6. `docs/review/forms-core-checklist.md`

## Workflow

1. Confirm branch and worktree:

   ```bash
   git status --short --branch
   ```

2. Identify the next unchecked step in `docs/steps.md`.
3. Confirm the expected PR scope in `docs/pr-plan.md`.
4. Implement only that scope.
5. Add focused tests for real behavior.
6. Run required validation.
7. Update `docs/steps.md` in the same change.
8. Run self-review before handoff.

## Stop Conditions

Stop and report the blocker when:

- the requested step would require React/UI code;
- a dependency outside the allowed list is needed;
- TanStack form-core lacks a required behavior and the architecture needs a
  decision;
- validation cannot run.

## Output Format

```text
Implementation step:
- Step:
- Files changed:
- Validation:
- docs/steps.md update:
- Remaining risks:
```
