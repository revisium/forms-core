# forms-core Review Checklist

Use this checklist for implementation PRs. Docs-only PRs should apply the
sections that match their scope.

## Architecture

- [ ] `@tanstack/form-core` remains the engine.
- [ ] No custom form engine is introduced.
- [ ] No `@tanstack/react-form` public API or runtime dependency is introduced.
- [ ] No React, Chakra, or UI dependency is imported by package source.
- [ ] TanStack stores, `FormApi`, `FieldApi`, and error maps stay private.

## MobX Reactivity

- [ ] Public getters are MobX reactive.
- [ ] Consumers do not need manual `subscribe`.
- [ ] Selector bridge uses `observable.box(..., { deep: false })`.
- [ ] Selector bridge updates happen inside `runInAction`.
- [ ] Selector bridge supports disposal and custom equality.

## Form And Controls

- [ ] `createForm` owns mount and dispose lifecycle.
- [ ] `field` config maps cleanly to TanStack field config.
- [ ] Control getters expose simple values and errors.
- [ ] Dirty/touched/submitting/validating state is tested.
- [ ] `reset(values?)` restores values and meta state.

## Validation And Errors

- [ ] Sync validation is tested.
- [ ] Async validation is tested.
- [ ] Debounced async validation is tested.
- [ ] Linked/dependent validation is tested or explicitly limited.
- [ ] Form-level validation is tested.
- [ ] Submit validation is tested.
- [ ] Server errors survive until relevant value change or reset.
- [ ] `visibleError` behavior is documented and tested.

## Arrays And Paths

- [ ] Nested object paths work.
- [ ] Array public identity uses `getItemId`.
- [ ] Array item ids remain stable after insert/remove/move/swap.
- [ ] Public item indexes update after reorder.
- [ ] Array server errors and patches are covered where relevant.

## Patches And Autosave

- [ ] `onPatch` emits scalar patches.
- [ ] `onPatch` emits nested patches.
- [ ] `onPatch` emits useful array patches.
- [ ] Patch listeners can unsubscribe.
- [ ] Patches do not require consumers to read raw TanStack state.

## Types

- [ ] `defaultValues` inference is preserved where practical.
- [ ] Field and array item value types are preserved.
- [ ] Deep path casts are isolated internally.
- [ ] Public API does not expose heavy TanStack generics unnecessarily.

## Verification

- [ ] Unit tests exercise real behavior, not method existence.
- [ ] `npm run verify` passes after scaffold exists.
- [ ] `git diff --check` passes.
- [ ] Markdown and skill checks pass after scaffold exists.
- [ ] Sonar or quality-gate failures are inspected from the actual check when
  configured.
- [ ] Package contents are checked before release.

## README

- [ ] README follows `docs/readme-guidelines.md` for release-ready changes.
- [ ] README examples match tested public behavior.
- [ ] README badges only claim checks that exist.
