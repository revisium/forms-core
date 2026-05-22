# forms-core Architecture

## Goal

`@revisium/forms-core` is a headless TypeScript form library built on top of
`@tanstack/form-core` with a MobX-native public API.

The library must let consumers keep forms outside React/component lifecycle and
observe public getters with MobX:

```ts
const form = createForm({
  defaultValues: { email: '' },
  fields: {
    email: field<string>({
      validators: {
        onChange: ({ value }) =>
          value.includes('@') ? undefined : 'Invalid email',
      },
    }),
  },
});

reaction(
  () => form.controls.email.value,
  (value) => {
    console.log(value);
  },
);
```

Consumers should not know about the TanStack store bridge.

## Non-Goals

- No React components.
- No Chakra or design-system components.
- No `@tanstack/react-form` public API.
- No custom form engine fork.
- No monkey-patching `@tanstack/form-core`.
- No generated UI from schemas in this package.

## Adapter Pattern

The architecture follows TanStack adapter style:

1. Own a TanStack `FormApi`.
2. Read TanStack state through `store.get()`.
3. Subscribe through `store.subscribe(listener)`.
4. Bridge selected state into the target reactive runtime, MobX.
5. Expose the adapter API, not the raw TanStack store.

## Private MobX Selector Bridge

The bridge is internal. It accepts:

```ts
type SubscribableStore<TState> = {
  get(): TState;
  subscribe(listener: () => void): { unsubscribe(): void } | (() => void);
};

type Selector<TState, TValue> = (state: TState) => TValue;
```

Behavior:

- initialize an `observable.box(selected, { deep: false })`;
- call the selector against `store.get()`;
- compare previous/next selected values with a custom comparator when provided;
- update the box inside `runInAction`;
- expose `get value()` and `dispose()`;
- normalize both unsubscribe object and function return shapes;
- never be exported from the package entrypoint.

The bridge is the only place where TanStack store subscriptions should be
created.

## Public API Shape

Target usage:

```ts
const form = createForm({
  defaultValues: {
    email: '',
    password: '',
    members: [{ id: '1', name: '' }],
  },
  fields: {
    email: field<string>(),
    password: field<string>(),
  },
  arrays: {
    members: arrayField({
      getItemId: (item) => item.id,
    }),
  },
});

form.controls.email.value;
form.controls.email.displayValue;
form.controls.email.error;
form.controls.email.visibleError;
form.controls.email.isDirty;
form.controls.email.isTouched;
form.controls.email.setValue('user@example.com');
form.controls.email.blur();

form.arrays.members.items;
form.arrays.members.push({ id: '2', name: '' });
form.arrays.members.removeById('2');
```

## Form Wrapper

Responsibilities:

- own `new FormApi(...)`;
- call `formApi.mount()` during construction;
- dispose `formApi` mount cleanup and all bridge subscriptions;
- expose MobX-reactive getters:
  - `isValid`;
  - `isDirty`;
  - `isTouched`;
  - `isSubmitting`;
  - `errors`;
- expose commands:
  - `getRawValue()`;
  - `reset(values?)`;
  - `submit()`;
  - `validate()`;
  - `applyServerErrors(errors)`;
  - `onPatch(listener)`;
  - `dispose()`;
- keep raw TanStack state private.

## Control Wrapper

Each control owns or references a TanStack `FieldApi` for its path.

Responsibilities:

- use field-level selectors for value and meta;
- expose MobX-reactive getters:
  - `value`;
  - `displayValue`;
  - `error`;
  - `visibleError`;
  - `isDirty`;
  - `isTouched`;
  - `isValidating`;
- expose commands:
  - `setValue(value)`;
  - `blur()`;
  - `reset()`;
- normalize TanStack error maps into simple public errors.

`displayValue` is the value formatted for direct display. In the first version it
can equal `value` for primitive fields. Future formatting must be explicit and
documented.

## Form Array Wrapper

Arrays support nested paths and stable public identity.

Rules:

- `getItemId` is required.
- Public `items` expose stable ids, current indexes, and item controls/value.
- Public identity never relies on array index.
- Internally, TanStack index paths may be used.
- Reordering must preserve item ids.

Commands:

- `push(value)`;
- `insert(index, value)`;
- `removeById(id)`;
- `removeAt(index)`;
- `move(fromIndex, toIndex)`;
- `swap(leftIndex, rightIndex)`;
- `clear()`.

## Error Model

Public errors should be simple:

```ts
type FormError = string;
type FieldError = string | undefined;
```

Implementation may keep richer internal data, but consumers should not parse
TanStack error maps.

`visibleError` returns an error when it should be displayed. Initial rule:

- server error is visible immediately;
- validation error is visible after the field is touched or after submit.

## Server Error Lifecycle

`applyServerErrors(errors)` accepts dot/bracket paths:

```ts
form.applyServerErrors({
  email: 'Email already exists',
  'members[0].name': 'Required',
});
```

Server errors are explicit external errors:

- they survive validation cycles;
- they are cleared for a field when that field value changes;
- nested paths clear only their own server error;
- all server errors clear on `reset()`;
- submitting does not clear server errors unless the implementation explicitly
  receives new server errors or values change.

Array server-error rules:

- array fields with `arrayField({ getItemId })` should preserve server errors by
  stable item id when the error path points inside an item;
- `push()` creates a new item with no server errors;
- `insert()` creates a new item with no server errors and keeps existing item
  errors attached to their original ids;
- `removeById()` and `removeAt()` clear errors for the removed item and remap
  remaining item errors to their new index paths;
- `move()` and `swap()` preserve errors by stable item id and remap them to each
  item's new index path;
- `clear()` removes all errors under that array path.

Example: if `members[1].name` has a server error for member id `b`, removing
`members[0]` remaps the error to `members[0].name` because member `b` moved to
index `0`. The error is cleared only if the removed item was the item that owned
the error.

The first implementation requires `getItemId` for public arrays, so array
server errors should follow item identity rather than raw index identity. If a
future low-level path API accepts arrays without stable ids, its errors must be
documented as path-based and reindexed with raw array indexes.

This behavior must be tested.

## Validation

The wrapper must support:

- field sync validators;
- field async validators;
- async debounce;
- form-level validation;
- submit validation;
- linked/dependent field validation where `@tanstack/form-core` supports it.

Do not implement a parallel validation engine. Adapter code should translate the
public config to TanStack validation config and normalize results back into the
public error model.

## Patches

`onPatch(listener)` emits patches by diffing previous/current `state.values`.

Initial public patch shape:

```ts
type FormPatch =
  | { type: 'set'; path: string; value: unknown; previousValue: unknown }
  | { type: 'remove'; path: string; previousValue: unknown }
  | { type: 'insert'; path: string; index: number; value: unknown }
  | { type: 'move'; path: string; fromIndex: number; toIndex: number }
  | { type: 'clear'; path: string; previousValue: unknown[] };
```

Patch rules:

- scalar changes emit `set`;
- nested object changes include full dot/bracket path;
- `push()` emits `insert`;
- `insert(index, value)` emits `insert`;
- `removeById(id)` and `removeAt(index)` emit `remove`;
- `clear()` emits `clear`;
- `move(fromIndex, toIndex)` emits `move`;
- `swap(leftIndex, rightIndex)` emits two `move` patches or one `set` patch for
  the array path; the chosen representation must be stable and tested before
  release;
- direct scalar edits inside array items emit `set` at the item field path after
  resolving the current index from the stable item id.

Fallback `set` patches are allowed only for ambiguous bulk changes that cannot
be mapped to one public array command, such as replacing the whole array value,
multiple simultaneous inserts/removes from an external reset, or concurrent
changes where stable ids are duplicated or missing. Public array commands should
not fall back to vague `set` patches except for the documented `swap()`
representation if the implementation chooses that route.

Common array operation mapping:

| Operation                     | Patch type                        |
| ----------------------------- | --------------------------------- |
| `push(value)`                 | `insert`                          |
| `insert(index, value)`        | `insert`                          |
| `removeById(id)`              | `remove`                          |
| `removeAt(index)`             | `remove`                          |
| `move(fromIndex, toIndex)`    | `move`                            |
| `swap(leftIndex, rightIndex)` | two `move` patches or array `set` |
| `clear()`                     | `clear`                           |
| whole-array replacement       | array `set`                       |
| duplicate or missing ids      | array `set` plus validation error |

Patches are for autosave, not for replacing TanStack state.

## Type Strategy

Public API should preserve typed values where practical:

- `createForm<TValues>()` infers `TValues` from `defaultValues`;
- `field<TValue>()` keeps control value type;
- `arrayField<TItem>()` keeps item type and id extractor type;
- deep path typing should not leak complex implementation generics.

If deep path typing becomes too complex, isolate casts in internal helpers and
keep the public API readable.

## Disposal

`dispose()` must:

- unsubscribe all selector bridges;
- dispose form mount cleanup;
- dispose field/array wrappers;
- stop patch listeners;
- cancel or ignore pending async validation updates where possible;
- leave public command methods either no-op or throw a documented disposed error.

Tests must prove bridge unsubscribe happens.

## Why Not @tanstack/react-form

`@tanstack/react-form` is a React adapter. This package needs a MobX adapter that
works outside component lifecycle. Using React adapter APIs would leak React
assumptions into a headless package and would not give MobX `computed`,
`reaction`, and `autorun` a native observable surface.
