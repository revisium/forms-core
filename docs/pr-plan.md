# forms-core PR Plan

The repository was built in small PRs. Future maintenance PRs should keep the
branch reviewable and update durable source-of-truth docs when behavior,
release workflow, or review policy changes.

## PR 1 - Docs And Agent Contract

Scope:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md` symlink
- `.agents/**`
- `.claude/skills` symlink
- `REVIEW.md`
- `docs/**`
- `scripts/lint-skills.mjs`

No package source code, package scaffold, dependencies, or npm scripts. PR 1 may
include repo-local helper scripts that validate the agent contract, such as
`scripts/lint-skills.mjs`.

Validation:

```bash
git status --short --branch
git diff --check
node scripts/lint-skills.mjs
```

## PR 2 - Package Scaffold

Scope:

- package metadata;
- TypeScript/build/test/lint config;
- empty or minimal public entrypoint;
- validation scripts;
- Markdown, skill, coverage, and package-check scripts described in
  [quality-gates.md](./quality-gates.md).
- initial CI workflow if validation scripts are ready.

Validation:

```bash
npm run verify
```

No form behavior beyond compile-ready placeholders.

The repo already contains `scripts/lint-skills.mjs` from PR 1. PR 2 should wire
that script into `npm run skills:lint` instead of referencing another repo.

## PR 3 - MobX Selector Bridge

Scope:

- private bridge;
- internal tests;
- no public form API beyond what tests need internally.

Validation:

```bash
npm run verify
```

## PR 4 - Scalar Form And Control API

Scope:

- `createForm`;
- `field`;
- scalar controls;
- reset/dirty/touched/basic validity;
- public exports.

Validation:

```bash
npm run verify
```

## PR 5 - Validation And Server Errors

Scope:

- sync/async/debounced validators;
- form-level and submit validation;
- linked validation where TanStack supports it;
- `applyServerErrors`;
- public error normalization.

Validation:

```bash
npm run verify
```

## PR 6 - Nested Paths And Arrays

Scope:

- nested path helpers;
- nested controls;
- `arrayField`;
- stable-id array item API;
- array commands.

Validation:

```bash
npm run verify
```

## PR 7 - Patches And Disposal

Scope:

- `onPatch`;
- scalar/nested/array patch diffing;
- listener disposal;
- bridge/form/control/array disposal hardening.

Validation:

```bash
npm run verify
```

## PR 8 - Release Readiness

Scope:

- README examples;
- README structure aligned with
  [readme-guidelines.md](./readme-guidelines.md);
- limitations;
- package export review;
- npm package content audit;
- release train and npm publish workflows delegated to `revisium-actions`;
- CI and Sonar/quality gate inspection when configured;
- cleanup of temporary tracker docs.

Validation:

```bash
npm run verify
npm pack --dry-run
```

Publishing happens only after explicit user approval.
