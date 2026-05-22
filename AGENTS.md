# AGENTS.md - forms-core

Operational notes for AI coding agents working in this repository. The parent
Revisium `AGENTS.md` also applies: do not use local memory files; use Revisium
MCP memory when project context must be read or written.

## Ground Rules

- **Docs first.** Before implementing behavior, read and update the matching
  source-of-truth doc: [docs/architecture.md](./docs/architecture.md),
  [docs/steps.md](./docs/steps.md), [docs/pr-plan.md](./docs/pr-plan.md),
  [docs/release-train.md](./docs/release-train.md),
  [docs/readme-guidelines.md](./docs/readme-guidelines.md),
  [docs/quality-gates.md](./docs/quality-gates.md), or [REVIEW.md](./REVIEW.md).
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
- **Update the step tracker.** Every implementation PR must update
  [docs/steps.md](./docs/steps.md) with completed checks and remaining work.
  The final cleanup PR removes or replaces this temporary tracker after durable
  docs, tests, and README cover the result.
- **Use repo-local skills when available.**
  [`forms-core-implementation-step`](./.agents/skills/forms-core-implementation-step/SKILL.md)
  is the normal iterative workflow.
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

For this docs-only bootstrap phase:

```bash
git status --short --branch
git diff --check
```

After the package scaffold lands, update this section and
[docs/quality-gates.md](./docs/quality-gates.md), then use the repository
scripts. The intended full gate is:

```bash
npm run verify
```

The planned `verify` script should run TypeScript, lint, unit tests, build, and
Markdown/skill checks.

Sonar has zero-tolerance semantics for pull requests in this repo. A passing PR
Quality Gate is not enough by itself: always inspect unresolved Sonar issues for
the PR and fix every valid issue. CI push builds on `master` and release
branches should upload Sonar analysis without blocking on total branch issue
count; PR checks enforce the `0` unresolved-valid-issues rule. If an issue is a
false positive, document the evidence and use the narrowest allowed suppression
only when the repo permits it.

## Handoff

Start from [docs/handoff/README.md](./docs/handoff/README.md). It links the
implementation steps, review contract, architecture, and reusable bootstrap
pattern for other libraries.
