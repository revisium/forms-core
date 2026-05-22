# forms-core Implementation Steps

This is the temporary implementation tracker. Each agent must update it in the
same PR that completes or changes a step.

Final cleanup rule: after the library is implemented, tested, documented, and
ready for release, remove this file or replace it with a short implementation
history. Durable facts must live in `README.md`, `docs/architecture.md`,
`docs/review/forms-core-checklist.md`, tests, and source comments where needed.

## Status Legend

- `[ ]` not started
- `[~]` in progress
- `[x]` complete and validated

## PR 1 - Agent Contract And Architecture Docs

- [x] Create `AGENTS.md`.
- [x] Create `CLAUDE.md -> AGENTS.md` symlink.
- [x] Create `.agents` skills and rules.
- [x] Create `.claude/skills -> ../.agents/skills` symlink.
- [x] Create `REVIEW.md`.
- [x] Create architecture, review, handoff, PR plan, release train, and
  bootstrap-pattern docs.
- [x] Create README guidelines and quality-gate docs.
- [x] Add repo-local `scripts/lint-skills.mjs`.
- [x] Validate docs-only change with `git diff --check`.

Exit criteria:

- no package implementation;
- no dependencies added;
- future agents can start from `AGENTS.md` and `docs/handoff/README.md`.

## PR 2 - Package Scaffold

- [ ] Add `package.json` for `@revisium/forms-core`.
- [ ] Add TypeScript config.
- [ ] Add build config.
- [ ] Add test runner config.
- [ ] Add lint and format config.
- [ ] Add package entrypoint with placeholder exports only if needed.
- [ ] Add `npm run verify` that runs typecheck, lint, test, build, and docs or
  skill validation.
- [ ] Wire existing local skill lint into `npm run skills:lint`.
- [ ] Add Markdown lint and Prettier check for docs.
- [ ] Add coverage output suitable for Sonar.
- [ ] Add initial CI workflow once `npm run verify` exists.
- [ ] Add package publish metadata without publishing.

Allowed dependencies:

- runtime: `@tanstack/form-core`, `mobx`;
- test/dev dependencies only when needed for local scripts.

Exit criteria:

- `npm run verify` passes;
- package can build without implementation shortcuts;
- no React dependencies.

## PR 3 - Private MobX Selector Bridge

- [ ] Implement internal bridge over `{ get, subscribe }`.
- [ ] Use `observable.box(..., { deep: false })`.
- [ ] Update selected value inside `runInAction`.
- [ ] Support custom equality comparator.
- [ ] Support unsubscribe object and unsubscribe function shapes.
- [ ] Expose `value` and `dispose()` internally.
- [ ] Keep bridge out of public exports.
- [ ] Add unit tests for reaction updates and disposal unsubscribe.

Exit criteria:

- MobX `reaction` fires when selected TanStack-like state changes;
- no consumer-facing subscription API.

## PR 4 - Form And Control Wrappers

- [ ] Implement `createForm`.
- [ ] Implement `field`.
- [ ] Own `FormApi` and mount/dispose lifecycle.
- [ ] Expose form getters: `isValid`, `isDirty`, `isTouched`, `isSubmitting`,
  `errors`.
- [ ] Expose form commands: `getRawValue`, `reset`, `submit`, `validate`,
  `dispose`.
- [ ] Expose control getters: `value`, `displayValue`, `error`, `visibleError`,
  `isDirty`, `isTouched`, `isValidating`.
- [ ] Expose control commands: `setValue`, `blur`, `reset`.
- [ ] Normalize TanStack error maps.
- [ ] Add tests for scalar value reactivity, validity reactivity, reset, dirty,
  touched, and no manual subscribe usage.

Exit criteria:

- target scalar public API works;
- React is not imported.

## PR 5 - Validation And Server Errors

- [ ] Support sync field validators.
- [ ] Support async field validators.
- [ ] Support async debounce.
- [ ] Support linked/dependent field validation where TanStack supports it.
- [ ] Support form-level validation.
- [ ] Support submit validation.
- [ ] Implement `applyServerErrors`.
- [ ] Clear server errors on relevant value changes and reset.
- [ ] Add tests for validation, debounce, linked validation, form validation,
  submit validation, server error visibility, and server error clearing.

Exit criteria:

- server-error lifecycle is explicit and tested;
- no parallel validation engine.

## PR 6 - Nested Paths And Arrays

- [ ] Add nested object path helpers.
- [ ] Support nested control paths.
- [ ] Implement `arrayField`.
- [ ] Implement array item model with `{ id, index, controls, value }`.
- [ ] Implement `push`, `insert`, `removeById`, `removeAt`, `move`, `swap`,
  `clear`.
- [ ] Preserve stable public ids through index changes.
- [ ] Add tests for nested object path and stable array item ids.

Exit criteria:

- public item identity never uses array index;
- nested paths work in values, errors, and patches where applicable.

## PR 7 - Patches, Disposal, And Hardening

- [ ] Implement `onPatch`.
- [ ] Diff scalar, nested object, and array changes.
- [ ] Emit useful patches for autosave.
- [ ] Dispose patch listeners.
- [ ] Harden disposed-object behavior.
- [ ] Add tests for scalar patches, nested patches, array patches, listener
  disposal, bridge disposal, and form disposal.

Exit criteria:

- autosave listener can consume emitted patches without reading raw TanStack
  state.

## PR 8 - README, API Polish, And Release Readiness

- [ ] Replace placeholder README with real usage examples.
- [ ] Bring README to the structure in `docs/readme-guidelines.md`.
- [ ] Document known limitations.
- [ ] Document why `@tanstack/react-form` is intentionally not used.
- [ ] Confirm public exports.
- [ ] Run full verify.
- [ ] Run `npm pack` and inspect package contents.
- [ ] Add release train and npm publish workflows using `revisium-actions`.
- [ ] Inspect CI and Sonar/quality gate status when configured.
- [ ] Remove or replace this temporary `docs/steps.md`.

Exit criteria:

- package is ready for an npm publish PR or release workflow;
- no temporary implementation-only artifacts remain.
