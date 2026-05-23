# forms-core Review Contract

This file is the review entry point for humans, review bots, and AI coding
agents. Treat it as the short review source of truth and follow links for
detail.

Canonical review expectations start here. If an enforceable review rule changes,
update this file, [docs/review/forms-core-checklist.md](./docs/review/forms-core-checklist.md),
and repo-local `.agents` rules in the same PR.

## Required Reading

Before reviewing a PR, read:

1. [docs/architecture.md](./docs/architecture.md)
2. [docs/review/forms-core-checklist.md](./docs/review/forms-core-checklist.md)
3. [docs/reactivity-matrix.md](./docs/reactivity-matrix.md)
4. [docs/quality-gates.md](./docs/quality-gates.md)
5. [README.md](./README.md) for public package usage changes
6. [docs/release-train.md](./docs/release-train.md) for publish or version work

## Source Of Truth

`docs/` owns the implementation contract until the library is complete. A PR is
incomplete when it changes public API, validation semantics, server-error
semantics, array identity, patch shape, dependency policy, release workflow, or
review expectations without updating the matching docs.

Reviewers should block drift in either direction:

- If implementation diverges from docs, require a code fix or docs update.
- If docs become stale or less specific, restore them before implementation
  continues.
- If review expectations change, keep `REVIEW.md`, checklist docs, and
  repo-local `.agents` rules aligned.

## Review Priorities

Block a PR when any of these are true:

- The package imports React, Chakra, React Router, `mobx-react-lite`, or UI code.
- The implementation hand-rolls form engine behavior that `@tanstack/form-core`
  already owns.
- `@tanstack/react-form` becomes the main API or runtime dependency.
- Public consumers must manually subscribe to a TanStack store.
- Raw TanStack state, stores, error maps, `FormApi`, or `FieldApi` become the
  primary public API.
- Public getters are not MobX reactive under `computed`, `reaction`, or
  `autorun`.
- Selector bridge updates observable state outside `runInAction`.
- Server errors do not survive until relevant value changes or reset, or this
  lifecycle is not tested.
- Array public identity relies on indexes instead of required stable item ids.
- `onPatch()` emits ambiguous or unusable patches for scalar, nested, or array
  changes.
- Disposal leaks subscriptions, timers, async validation, or bridge resources.
- TypeScript public types leak heavy TanStack generics unnecessarily.
- Tests only check method existence instead of real behavior.
- Required validation commands are skipped without a concrete risk note.
- Failed or pending required CI, Sonar, or quality-gate checks are ignored.
- A PR treats Sonar as done after a passing Quality Gate without inspecting the
  unresolved issue list. PR Sonar issue tolerance is `0`: every valid issue must
  be fixed. Branch pushes should not block only because the branch-level total
  issue count is non-zero.
- README examples drift from tested public behavior.

## Expected Author Self-Review

Every implementation PR should include:

- changed files summary;
- source-of-truth docs updated or confirmed unchanged;
- validation evidence;
- notes for public API, MobX reactivity, TanStack adapter boundaries, validation,
  server errors, arrays, patches, and disposal when touched;
- remaining risks.

Do not create committed self-review artifacts. Put the self-review in the
assistant response, PR description when requested, or PR comment.

## Reviewer Output Format

Review comments should be concrete and actionable:

- cite the file and line;
- name the violated rule from this file or linked docs;
- explain the user-visible, maintenance, or correctness risk;
- propose the smallest fix that keeps docs, tests, and code aligned.
