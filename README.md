# forms-core

Headless TypeScript form library for Revisium projects.

`@revisium/forms-core` will wrap `@tanstack/form-core` with a MobX-native public
API. It is intentionally not a React package: forms must live outside component
lifecycle, and consumers should observe public getters with MobX `computed`,
`reaction`, and `autorun` without subscribing to TanStack stores directly.

## Current Status

This repository is in the planning/bootstrap phase. The first change establishes
the agent contract, review contract, architecture notes, implementation steps,
and release plan before adding package code.

## Start Here

- [AGENTS.md](./AGENTS.md) - coding-agent boot rules.
- [REVIEW.md](./REVIEW.md) - review contract for humans, bots, and agents.
- [docs/architecture.md](./docs/architecture.md) - target architecture.
- [docs/steps.md](./docs/steps.md) - temporary implementation tracker.
- [docs/pr-plan.md](./docs/pr-plan.md) - intended PR sequence.
- [docs/release-train.md](./docs/release-train.md) - npm release plan.
- [docs/readme-guidelines.md](./docs/readme-guidelines.md) - README standard
  for the public package.
- [docs/quality-gates.md](./docs/quality-gates.md) - local, CI, Sonar, and
  package checks.
- [docs/handoff/README.md](./docs/handoff/README.md) - handoff entry point.

## Package Goals

- Use `@tanstack/form-core` as the form engine.
- Provide a headless MobX-reactive API.
- Keep React, Chakra, and UI components out of scope.
- Keep TanStack store and error-map details private.
- Support scalar controls, nested paths, stable-id arrays, validation, server
  errors, patches for autosave, reset, submit, and disposal.

## Bootstrap Pattern

This repo intentionally starts with docs and local agent workflows before source
code. See
[docs/handoff/bootstrap-new-library-project.md](./docs/handoff/bootstrap-new-library-project.md)
for the reusable pattern.
