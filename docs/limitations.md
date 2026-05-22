# Known Limitations

This file tracks known limitations and deliberate constraints. Update it when an
implementation PR confirms or changes a limitation.

## Intentional Constraints

- `@tanstack/form-core` owns form state and validation behavior.
- This package owns the MobX adapter and public API.
- React and UI components are out of scope.
- TanStack store details are internal.
- Public field errors are normalized to simple strings for the first version.

## Initial Limitations To Validate During Implementation

- Deep path typing may be limited. Prefer a clean public API with internal casts
  over leaking heavy TanStack generics.
- Array server-error reindexing is implemented for `arrayField` wrappers with
  stable ids. Future low-level array path APIs without `getItemId` would need a
  separate path-index policy.
- Patch diffing may fall back to `set` patches when a complex array edit cannot
  be represented safely.
- `displayValue` initially equals `value` unless a documented formatter is
  introduced.
- Disposed command methods are no-op. Getters expose the last observed wrapper
  values or raw form values after disposal.

## Why Not @tanstack/react-form

`@tanstack/react-form` is a React adapter. `forms-core` must work outside React
component lifecycle and expose MobX-observable public getters. Using the React
adapter as the main API would make React a hidden architectural dependency and
would not satisfy the MobX-native contract.
