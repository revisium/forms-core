# forms-core

Headless TypeScript form library for Revisium projects.

`@revisium/forms-core` will wrap `@tanstack/form-core` with a MobX-native public
API. It is intentionally not a React package: forms must live outside component
lifecycle, and consumers should observe public getters with MobX `computed`,
`reaction`, and `autorun` without subscribing to TanStack stores directly.

## Current Status

This repository is in active implementation. The package scaffold, local
toolchain, CI/Sonar wiring, private MobX selector bridge, scalar form/control
wrappers, validation adapter, and explicit server-error lifecycle are in place.
Nested paths, arrays, patch emission, and final README/API polish are tracked in
the implementation steps.

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

## Development

Use Node.js 20.16 or newer. The CI target currently uses Node.js 24.11.1.

```bash
npm ci
npm run verify
```

Useful local commands:

- `npm run tsc` - TypeScript typecheck.
- `npm run lint:ci` - ESLint with zero warnings.
- `npm run test:cov` - Jest coverage output for Sonar.
- `npm run sonar:local` - run Sonar locally from existing coverage.
- `npm run sonar:issues:local` - fail on unresolved Sonar issues.
- `npm run ci:local:sonar` - run local verify and then Sonar quality gate.
- `npm run build` - package build and declaration output.
- `npm run markdown:lint` - Markdown and agent-rule lint.
- `npm run skills:lint` - repo-local agent skill structure lint.

For local Sonar, either export `SONAR_TOKEN` in the shell or create an
untracked `.env.sonar` from `.env.sonar.example`. Do not commit real Sonar
tokens. Prefer running local Sonar after the branch has a GitHub PR: the script
auto-detects the PR and runs PR analysis. Before a PR exists, Sonar falls back
to branch analysis, which may be blocked by the organization plan.

For PRs, do not treat Sonar `PASSED` as complete by itself. Inspect unresolved
issues and fix every valid issue; this repo uses zero tolerance for PR Sonar
issues. Pushes to `master` upload Sonar analysis but do not enforce total branch
issue count.

## Bootstrap Pattern

This repo intentionally starts with docs and local agent workflows before source
code. See
[docs/handoff/bootstrap-new-library-project.md](./docs/handoff/bootstrap-new-library-project.md)
for the reusable pattern.
