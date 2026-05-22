# Reactivity Matrix

This package exposes MobX-reactive public getters. Consumers should be able to
use `computed`, `reaction`, and `autorun` without knowing that TanStack stores
exist underneath.

## Contract

| Area                | Change                                          | Expected reaction behavior                                                                                                                       |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Scalar control      | `email.setValue(next)`                          | Reactions reading `email.value` or `email.displayValue` rerun. Reactions reading sibling controls do not rerun.                                  |
| Scalar meta         | `email.blur()` or validation state change       | Reactions reading `email.isTouched`, `email.error`, `email.visibleError`, or `email.isValidating` rerun only when that selected value changes.   |
| Form aggregate      | Validity, dirty, touched, or submitting changes | Reactions reading `form.isValid`, `form.isDirty`, `form.isTouched`, or `form.isSubmitting` rerun only when the aggregate selected value changes. |
| Nested path         | `profile.name` changes                          | Reactions reading `profile.name` rerun. Reactions reading `profile.title` or unrelated paths do not rerun.                                       |
| Arrays              | push, insert, remove, move, swap, or clear      | Reactions reading `array.items` rerun with stable item ids and current indexes.                                                                  |
| Array item controls | An item moves                                   | A previously held item control remains bound to the same public item id and writes to the item's new index.                                      |
| Array item removal  | An item is removed                              | Held controls for the removed item become disposed no-ops and must not write into a reused index.                                                |
| Server errors       | `applyServerErrors()`                           | Reactions reading matching control `error` or `visibleError` rerun. Unrelated controls do not rerun.                                             |
| Patches             | Values change                                   | `onPatch()` emits useful scalar, nested, and array patches without exposing TanStack state.                                                      |
| Disposal            | `form.dispose()` or listener disposal           | Store bridges unsubscribe. Later TanStack notifications or public no-op commands must not notify consumers.                                      |

## Test Coverage

The public reactivity contract is covered by focused tests:

- `test/form-control.spec.ts` covers scalar value, form validity, validation,
  server errors, and bridge disposal.
- `test/nested-array.spec.ts` covers nested paths, stable array ids, nested
  arrays, and array server-error remapping.
- `test/form-patches.spec.ts` covers scalar, nested, and array patch emission
  plus listener disposal.
- `test/form-reactivity.spec.ts` covers reaction isolation, computed consumers,
  aggregate no-extra-rerun behavior, stable array item controls after reorder,
  and removed item-control disposal.

When adding public getters or array behaviors, update this matrix and add a
test that proves both the positive reaction and the no-extra-reaction case when
that distinction matters.
