---
name: forms-core-self-review
description: >-
  Run the forms-core pre-handoff self-review against the architecture, MobX
  reactivity, TanStack adapter boundary, validation, arrays, patches, disposal,
  tests, and package constraints.
metadata:
  short-description: Self-review forms-core work
---

# forms-core Self-Review Skill

Use this skill before handing off work or opening/updating a PR.

## Goal

Produce a concise self-review against the repo contracts. Do not create or
commit separate review artifacts. Put the result in the assistant response, PR
description when requested, or PR comment.

## Required Inputs

- Current branch diff against target branch.
- `REVIEW.md`.
- `docs/architecture.md`.
- `docs/quality-gates.md`.
- `docs/readme-guidelines.md` when README changes.
- `docs/review/forms-core-checklist.md`.
- Affected step in `docs/steps.md`.

## Review Steps

1. Identify changed docs, source files, tests, configs, and package metadata.
2. Check docs/source-of-truth alignment.
3. Check dependency policy and headless boundary.
4. Check TanStack adapter boundary:
   - no custom form engine;
   - no React adapter dependency;
   - raw TanStack internals stay private.
5. Check MobX reactivity:
   - public getters are observable;
   - bridge updates use `runInAction`;
   - consumers do not manually subscribe.
6. Check behavior touched by the PR: validation, server errors, arrays, patches,
   reset, submit, disposal, or typing.
7. Confirm required validation ran.
8. Confirm Sonar Quality Gate and unresolved issue inspection when Sonar is
   configured. Passing gate alone is not sufficient; valid unresolved issues
   must be `0`.
9. Confirm README structure and examples when README changed.

## Output Format

```text
Self-review:
- Docs/source-of-truth:
- Headless/dependencies:
- TanStack adapter boundary:
- MobX reactivity:
- Behavior/tests:
- Verification:
- Remaining risks:
```
