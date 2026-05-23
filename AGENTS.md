# AGENTS.md - forms-core

Operational notes for AI coding agents working in this repository. The parent
Revisium `AGENTS.md` also applies.

## Ground Rules

- **Docs first.** Before implementing behavior, read and update the matching
  source-of-truth doc: [docs/architecture.md](./docs/architecture.md),
  [docs/reactivity-matrix.md](./docs/reactivity-matrix.md),
  [docs/release-train.md](./docs/release-train.md),
  [docs/limitations.md](./docs/limitations.md),
  [docs/quality-gates.md](./docs/quality-gates.md), [README.md](./README.md),
  or [REVIEW.md](./REVIEW.md).
- **Headless package only.** Do not import React, Chakra, React Router,
  `mobx-react-lite`, or any UI library in package source.
- **Do not build a custom form engine.** The core engine is
  `@tanstack/form-core`. `@tanstack/react-form` is not the public API and should
  not be used as the implementation shortcut.
- **MobX is the public reactivity surface.** Public getters on form, controls,
  and arrays must be observable through `computed`, `reaction`, and `autorun`.
  Consumers must not manually subscribe to TanStack stores.
- **Keep TanStack internals private.** Do not expose raw `FormApi`, `FieldApi`,
  store state, error maps, or heavy TanStack generics as the main API.
- **Allowed runtime dependencies are constrained.** Add only
  `@tanstack/form-core` and `mobx` unless the docs and user explicitly approve
  another dependency. Add test dependencies only when the repo lacks a suitable
  test runner.
- **Use repo-local skills when available.**
  [`forms-core-general-checks`](./.agents/skills/forms-core-general-checks/SKILL.md)
  is the baseline verification workflow.
  [`forms-core-self-review`](./.agents/skills/forms-core-self-review/SKILL.md)
  is the pre-handoff review workflow.
  [`forms-core-pr-review-iteration`](./.agents/skills/forms-core-pr-review-iteration/SKILL.md)
  is for GitHub review threads.
  [`forms-core-pr-publish`](./.agents/skills/forms-core-pr-publish/SKILL.md)
  is for branch, commit, push, and PR creation when the user asks.

## Branch And PR Hygiene

- Do not commit directly to `master`.
- Start feature branches from fresh `origin/master` unless the user gives a
  different base.
- Do not push or create a PR unless the user explicitly asks.
- Stage only files that belong to the requested change.
- Do not revert unrelated user changes.
- New PRs should have an intentionally empty body unless the user asks for
  custom text.

## Quality Gates

Use the repository verification script before handoff, PR creation, or review
replies:

```bash
npm run verify
```

The `verify` script runs Markdown/skill lint, formatting, TypeScript, ESLint,
unit tests with coverage, and package build.

Sonar has zero-tolerance semantics for pull requests in this repo. A passing PR
Quality Gate is not enough by itself: always inspect unresolved Sonar issues for
the PR and fix every valid issue. CI push builds on `master` and release
branches should upload Sonar analysis without blocking on total branch issue
count; PR checks enforce the `0` unresolved-valid-issues rule. If an issue is a
false positive, document the evidence and use the narrowest allowed suppression
only when the repo permits it.

## Reusable Agent Method

Reusable bootstrap prompts, generic quality practices, and cross-project agent
workflows belong in `anton62k/agents`. Keep this repository limited to the
`forms-core` package contract, implementation notes, and release workflow.
