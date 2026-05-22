# forms-core

Headless TypeScript forms over `@tanstack/form-core` with a MobX-native public
API.

[![CI](https://github.com/revisium/forms-core/actions/workflows/ci.yml/badge.svg)](https://github.com/revisium/forms-core/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=revisium_forms-core&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_forms-core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## Why

`@revisium/forms-core` is for application state layers that need forms outside
React component lifecycle. TanStack Form Core owns the form engine; this package
adapts its stores into MobX-observable public getters so consumers can use
`computed`, `reaction`, and `autorun` without subscribing to TanStack stores.

The package is headless. It does not export React components, Chakra wrappers,
or UI-specific hooks.

## Install

```bash
npm install @revisium/forms-core @tanstack/form-core mobx
```

## Quick Start

```ts
import { reaction } from 'mobx';
import { createForm, field } from '@revisium/forms-core';

const form = createForm({
  defaultValues: {
    email: '',
    password: '',
  },
  fields: {
    email: field<string>({
      validators: {
        onChange: ({ value }) =>
          value.includes('@') ? undefined : 'Invalid email',
      },
    }),
    password: field<string>(),
  },
});

const disposeReaction = reaction(
  () => form.controls.email.value,
  (email) => {
    console.log('email changed', email);
  },
);

form.controls.email.setValue('user@example.com');
form.controls.email.blur();

console.log(form.isValid);
console.log(form.getRawValue());

disposeReaction();
form.dispose();
```

## Public API

Create forms with `createForm({ defaultValues, fields, arrays, validators })`.

Field controls are available under `form.controls`:

```ts
form.controls.email.value;
form.controls.email.displayValue;
form.controls.email.error;
form.controls.email.visibleError;
form.controls.email.isDirty;
form.controls.email.isTouched;
form.controls.email.isValidating;
form.controls.email.setValue('user@example.com');
form.controls.email.blur();
form.controls.email.reset();
```

Form state is exposed through MobX-reactive getters:

```ts
form.isValid;
form.isDirty;
form.isTouched;
form.isSubmitting;
form.errors;
form.getRawValue();
await form.validate();
await form.submit();
form.reset();
form.reset(nextValues);
form.dispose();
```

Exports include `createForm`, `field`, `arrayField`, and public types for form
options, controls, arrays, validators, patches, and listeners.

## Validation

Field validators support sync, async, debounce, submit, blur, and linked-field
validation where TanStack Form Core supports the underlying behavior.

```ts
const form = createForm({
  defaultValues: {
    email: '',
    confirmEmail: '',
  },
  fields: {
    email: field<string>({
      validators: {
        onChange: ({ value }) =>
          value.includes('@') ? undefined : 'Invalid email',
        onChangeAsync: async ({ value, signal }) => {
          await checkEmailAvailability(value, { signal });
        },
        onChangeAsyncDebounceMs: 300,
      },
    }),
    confirmEmail: field<string>({
      validators: {
        onChangeListenTo: ['email'],
        onChange: ({ value, values }) =>
          value === values.email ? undefined : 'Emails must match',
      },
    }),
  },
});
```

Form-level validators can return a form error string or field errors:

```ts
declare function checkEmailAvailability(
  value: string,
  options: { signal: AbortSignal },
): Promise<void>;

const form = createForm({
  defaultValues: {
    password: '',
  },
  fields: {
    password: field<string>(),
  },
  validators: {
    onSubmit: ({ value }) => ({
      fields: {
        password: value.password ? undefined : 'Required',
      },
    }),
  },
});
```

## Server Errors

`applyServerErrors()` accepts dot/bracket paths and exposes simple string errors
on controls.

```ts
form.applyServerErrors({
  email: 'Email already exists',
  'members[0].name': 'Required',
});

form.controls.email.error;
form.controls.email.visibleError;
```

Server errors are explicit external errors. They survive validation cycles, are
visible immediately, clear when the relevant field value changes, and clear on
`reset()`.

## Arrays

Use `arrayField({ getItemId })` for public array identity. `getItemId` must
return a unique stable id for every item; public identity never relies on array
indexes.

```ts
import { arrayField, createForm, field } from '@revisium/forms-core';

const form = createForm({
  defaultValues: {
    members: [{ id: '1', name: '' }],
  },
  fields: {},
  arrays: {
    members: arrayField<{ id: string; name: string }>({
      getItemId: (item) => item.id,
    }),
  },
});

form.arrays.members.items;
form.arrays.members.push({ id: '2', name: 'Ada' });
form.arrays.members.insert(1, { id: '3', name: 'Grace' });
form.arrays.members.move(0, 1);
form.arrays.members.removeById('2');
form.arrays.members.clear();
```

Array items expose the current index, current value, stable id, and generated
controls for object item fields:

```ts
const first = form.arrays.members.items[0];

first?.id;
first?.index;
first?.value;
first?.controls.name.setValue('Ada');
```

## Autosave Patches

`onPatch(listener)` emits value patches by diffing previous and current form
values. This is intended for autosave and persistence adapters.

```ts
import type { FormPatch } from '@revisium/forms-core';

declare function queueAutosave(patch: FormPatch): void;

const disposePatchListener = form.onPatch((patches) => {
  for (const patch of patches) {
    queueAutosave(patch);
  }
});

form.controls.email.setValue('user@example.com');

disposePatchListener();
```

Patch shape:

```ts
type FormPatch =
  | { type: 'set'; path: string; value: unknown; previousValue: unknown }
  | { type: 'remove'; path: string; previousValue: unknown }
  | { type: 'insert'; path: string; index: number; value: unknown }
  | { type: 'move'; path: string; fromIndex: number; toIndex: number }
  | { type: 'clear'; path: string; previousValue: unknown[] };
```

Scalar and nested edits emit full paths such as `email` or `profile.name`.
Configured arrays emit stable operation patches for `push`, `insert`,
`removeAt`, `removeById`, `move`, and `clear`. Ambiguous bulk array changes fall
back to a `set` patch for the array path.

## React Usage

React integration is consumer-side. Create and own the form in your application
state layer, view model, or dependency-injection scope, then observe the public
MobX getters from React through your chosen MobX React binding.

This package intentionally does not import React or export React components.

## Why Not @tanstack/react-form

`@tanstack/react-form` is a React adapter. `forms-core` needs a headless MobX
adapter that can live outside component lifecycle and be consumed by MobX
`computed`, `reaction`, and `autorun`. Using the React adapter as the main API
would make React a hidden runtime dependency and would not satisfy the
MobX-native contract.

## Limitations

Known limitations and deliberate constraints are tracked in
[docs/limitations.md](./docs/limitations.md).

## Development

Use Node.js 20.16 or newer. CI currently runs on Node.js 24.11.1.

```bash
npm ci
npm run verify
```

Useful commands:

- `npm run tsc` - TypeScript typecheck.
- `npm run lint:ci` - ESLint with zero warnings.
- `npm run test:cov` - Jest coverage output for Sonar.
- `npm run build` - package build and declaration output.
- `npm run ci:local:sonar` - run local verify, Sonar quality gate, and issue
  inspection.
- `npm pack --dry-run` - inspect package contents before publish.

For PRs, do not treat Sonar `PASSED` as complete by itself. Inspect unresolved
issues and fix every valid issue; this repo uses zero tolerance for PR Sonar
issues. Pushes to `master` upload Sonar analysis but do not enforce total branch
issue count.

## Release

Release and npm publish rules are documented in
[docs/release-train.md](./docs/release-train.md). Publishing requires explicit
approval and uses shared workflows from `revisium/revisium-actions`.
