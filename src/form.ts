import { FieldApi, FormApi } from '@tanstack/form-core';
import { observable, runInAction, untracked } from 'mobx';

import type {
  DeepKeys,
  DeepValue,
  DeepKeysOfType,
  FieldAsyncValidateOrFn,
  FieldApiOptions,
  FieldValidateOrFn,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  ValidationCause,
} from '@tanstack/form-core';
import type { IObservableValue } from 'mobx';

import type { ArrayFieldConfig } from './array-field.js';
import type { FieldConfig, FieldValidators } from './field.js';
import {
  normalizeErrors,
  normalizeFirstError,
  type PublicFieldError,
} from './internal/errors.js';
import {
  formatArrayItemPath,
  getPathValue,
  parseArrayItemPath,
} from './internal/path.js';
import {
  createMobxSelectorBridge,
  type MobxSelectorBridge,
  type StoreSubscription,
  type SubscribableStore,
} from './internal/mobx-selector-bridge.js';

type StringKeyOf<TValues extends object> = Extract<keyof TValues, string>;
type FieldPath<TValues extends object> = Extract<DeepKeys<TValues>, string>;
type FieldPathValue<
  TValues extends object,
  TName extends FieldPath<TValues>,
> = DeepValue<TValues, TName>;

type ArrayPath<TValues extends object> = Extract<
  DeepKeysOfType<TValues, unknown[]>,
  string
>;

type ArrayPathValue<
  TValues extends object,
  TName extends ArrayPath<TValues>,
> = DeepValue<TValues, TName>;

type ArrayItemValue<TValue> =
  TValue extends ReadonlyArray<infer TItem>
    ? TItem
    : TValue extends Array<infer TItem>
      ? TItem
      : never;

export type FieldConfigs<TValues extends object> = Partial<{
  readonly [TName in FieldPath<TValues>]: FieldConfig<
    FieldPathValue<TValues, TName>,
    TValues
  >;
}>;

export type ArrayFieldConfigs<TValues extends object> = Partial<{
  readonly [TName in ArrayPath<TValues>]: ArrayFieldConfig<
    ArrayItemValue<ArrayPathValue<TValues, TName>>
  >;
}>;

type ControlName<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
> = Extract<keyof TFields, FieldPath<TValues>>;

export type FormControls<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
> = {
  readonly [TName in ControlName<TValues, TFields>]: FormControl<
    FieldPathValue<TValues, TName>
  >;
};

type ArrayName<
  TValues extends object,
  TArrays extends ArrayFieldConfigs<TValues>,
> = Extract<keyof TArrays, ArrayPath<TValues>>;

export type FormArrays<
  TValues extends object,
  TArrays extends ArrayFieldConfigs<TValues>,
> = {
  readonly [TName in ArrayName<TValues, TArrays>]: FormArray<
    ArrayItemValue<ArrayPathValue<TValues, TName>>
  >;
};

export type CreateFormOptions<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
  TArrays extends ArrayFieldConfigs<TValues> = Record<never, never>,
> = {
  readonly defaultValues: TValues;
  readonly fields: TFields;
  readonly arrays?: TArrays;
  readonly validators?: FormValidators<TValues>;
};

export type FormValidationResult<TValues extends object> =
  | string
  | {
      readonly form?: string;
      readonly fields?: Partial<Record<FieldPath<TValues>, string>>;
    }
  | null
  | undefined
  | void;

export type FormValidatorContext<TValues extends object> = {
  readonly value: TValues;
};

export type FormAsyncValidatorContext<TValues extends object> =
  FormValidatorContext<TValues> & {
    readonly signal: AbortSignal;
  };

export type FormValidator<TValues extends object> = (
  context: FormValidatorContext<TValues>,
) => FormValidationResult<TValues>;

export type FormAsyncValidator<TValues extends object> = (
  context: FormAsyncValidatorContext<TValues>,
) => FormValidationResult<TValues> | Promise<FormValidationResult<TValues>>;

export type FormValidators<TValues extends object> = {
  readonly onChange?: FormValidator<TValues>;
  readonly onChangeAsync?: FormAsyncValidator<TValues>;
  readonly onChangeAsyncDebounceMs?: number;
  readonly onBlur?: FormValidator<TValues>;
  readonly onBlurAsync?: FormAsyncValidator<TValues>;
  readonly onBlurAsyncDebounceMs?: number;
  readonly onSubmit?: FormValidator<TValues>;
  readonly onSubmitAsync?: FormAsyncValidator<TValues>;
};

export type FormControl<TValue> = {
  readonly value: TValue;
  readonly displayValue: TValue;
  readonly error: PublicFieldError;
  readonly visibleError: PublicFieldError;
  readonly isDirty: boolean;
  readonly isTouched: boolean;
  readonly isValidating: boolean;
  setValue(value: TValue): void;
  blur(): void;
  reset(): void;
};

export type ArrayItemControls<TItem> = TItem extends object
  ? {
      readonly [TName in StringKeyOf<TItem>]: FormControl<TItem[TName]>;
    }
  : Record<string, never>;

export type FormArrayItem<TItem> = {
  readonly id: string;
  readonly index: number;
  readonly value: TItem;
  readonly controls: ArrayItemControls<TItem>;
};

export type FormArray<TItem> = {
  readonly value: readonly TItem[];
  readonly items: readonly FormArrayItem<TItem>[];
  push(value: TItem): void;
  insert(index: number, value: TItem): void;
  removeById(id: string): void;
  removeAt(index: number): void;
  move(fromIndex: number, toIndex: number): void;
  swap(leftIndex: number, rightIndex: number): void;
  clear(): void;
};

export type FormPatch =
  | {
      readonly type: 'set';
      readonly path: string;
      readonly value: unknown;
      readonly previousValue: unknown;
    }
  | {
      readonly type: 'remove';
      readonly path: string;
      readonly previousValue: unknown;
    }
  | {
      readonly type: 'insert';
      readonly path: string;
      readonly index: number;
      readonly value: unknown;
    }
  | {
      readonly type: 'move';
      readonly path: string;
      readonly fromIndex: number;
      readonly toIndex: number;
    }
  | {
      readonly type: 'clear';
      readonly path: string;
      readonly previousValue: unknown[];
    };

export type FormPatchListener = (patches: readonly FormPatch[]) => void;

export type FormsCoreForm<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
  TArrays extends ArrayFieldConfigs<TValues> = Record<never, never>,
> = {
  readonly controls: FormControls<TValues, TFields>;
  readonly arrays: FormArrays<TValues, TArrays>;
  readonly isValid: boolean;
  readonly isDirty: boolean;
  readonly isTouched: boolean;
  readonly isSubmitting: boolean;
  readonly errors: readonly string[];
  getRawValue(): TValues;
  reset(values?: TValues): void;
  submit(): Promise<void>;
  validate(): Promise<readonly string[]>;
  applyServerErrors(errors: Partial<Record<FieldPath<TValues>, string>>): void;
  onPatch(listener: FormPatchListener): () => void;
  dispose(): void;
};

type TanStackFormState<TValues extends object> = {
  readonly values: TValues;
  readonly isValid: boolean;
  readonly isDirty: boolean;
  readonly isTouched: boolean;
  readonly isSubmitting: boolean;
  readonly submissionAttempts: number;
  readonly errors: readonly unknown[];
};

type TanStackFormApi<TValues extends object> = {
  readonly store: SubscribableStore<TanStackFormState<TValues>>;
  readonly state: TanStackFormState<TValues>;
  mount: () => () => void;
  reset: (values?: TValues) => void;
  resetField: (field: string) => void;
  handleSubmit: () => Promise<void>;
  validate: (cause: ValidationCause) => unknown;
  validateAllFields: (cause: ValidationCause) => Promise<unknown[]>;
};

type TanStackServerErrorApi = {
  setErrorMap: (errorMap: {
    readonly onServer: {
      readonly fields: Record<string, string>;
    };
  }) => void;
};

type RawFormValidate<TValues extends object> =
  | FormValidateOrFn<TValues>
  | undefined;

type RawFormAsyncValidate<TValues extends object> =
  | FormAsyncValidateOrFn<TValues>
  | undefined;

type RawTanStackFormApi<TValues extends object> = FormApi<
  TValues,
  RawFormValidate<TValues>,
  RawFormValidate<TValues>,
  RawFormAsyncValidate<TValues>,
  RawFormValidate<TValues>,
  RawFormAsyncValidate<TValues>,
  RawFormValidate<TValues>,
  RawFormAsyncValidate<TValues>,
  undefined,
  undefined,
  undefined,
  never
>;

type TanStackFieldMeta = {
  readonly errors: readonly unknown[];
  readonly errorMap: {
    readonly onServer?: unknown;
  };
  readonly isDirty: boolean;
  readonly isTouched: boolean;
  readonly isValidating: boolean;
};

type TanStackFieldState<TValue> = {
  readonly value: TValue;
  readonly meta: TanStackFieldMeta;
};

type TanStackFieldApi<TValue> = {
  readonly store: SubscribableStore<TanStackFieldState<TValue>>;
  mount: () => () => void;
  setValue: (updater: (previous: TValue) => TValue) => void;
  handleBlur: () => void;
};

type TanStackArrayFieldApi<TItem> = TanStackFieldApi<TItem[]> & {
  pushValue: (value: TItem) => void;
  insertValue: (index: number, value: TItem) => void;
  removeValue: (index: number) => void;
  moveValue: (fromIndex: number, toIndex: number) => void;
  swapValues: (leftIndex: number, rightIndex: number) => void;
  clearValues: () => void;
};

type AdaptedFieldValidators<TValue, TValues extends object> = {
  onChange?: (context: { readonly value: TValue }) => unknown;
  onChangeAsync?: (context: {
    readonly value: TValue;
    readonly signal: AbortSignal;
  }) => unknown;
  onChangeAsyncDebounceMs?: number;
  onChangeListenTo?: readonly FieldPath<TValues>[];
  onBlur?: (context: { readonly value: TValue }) => unknown;
  onBlurAsync?: (context: {
    readonly value: TValue;
    readonly signal: AbortSignal;
  }) => unknown;
  onBlurAsyncDebounceMs?: number;
  onBlurListenTo?: readonly FieldPath<TValues>[];
  onSubmit?: (context: { readonly value: TValue }) => unknown;
  onSubmitAsync?: (context: {
    readonly value: TValue;
    readonly signal: AbortSignal;
  }) => unknown;
};

type AdaptedFormValidators<TValues extends object> = {
  onChange?: (context: { readonly value: TValues }) => unknown;
  onChangeAsync?: (context: {
    readonly value: TValues;
    readonly signal: AbortSignal;
  }) => unknown;
  onChangeAsyncDebounceMs?: number;
  onBlur?: (context: { readonly value: TValues }) => unknown;
  onBlurAsync?: (context: {
    readonly value: TValues;
    readonly signal: AbortSignal;
  }) => unknown;
  onBlurAsyncDebounceMs?: number;
  onSubmit?: (context: { readonly value: TValues }) => unknown;
  onSubmitAsync?: (context: {
    readonly value: TValues;
    readonly signal: AbortSignal;
  }) => unknown;
};

type AnyRawFieldName<TValues extends object> = DeepKeys<TValues>;

type AnyRawFieldValue<TValues extends object> = DeepValue<
  TValues,
  AnyRawFieldName<TValues>
>;

type RawFieldValidate<TValues extends object> =
  | FieldValidateOrFn<
      TValues,
      AnyRawFieldName<TValues>,
      AnyRawFieldValue<TValues>
    >
  | undefined;

type RawFieldAsyncValidate<TValues extends object> =
  | FieldAsyncValidateOrFn<
      TValues,
      AnyRawFieldName<TValues>,
      AnyRawFieldValue<TValues>
    >
  | undefined;

type RawFieldApiOptions<TValues extends object> = FieldApiOptions<
  TValues,
  AnyRawFieldName<TValues>,
  AnyRawFieldValue<TValues>,
  undefined,
  RawFieldValidate<TValues>,
  RawFieldAsyncValidate<TValues>,
  RawFieldValidate<TValues>,
  RawFieldAsyncValidate<TValues>,
  RawFieldValidate<TValues>,
  RawFieldAsyncValidate<TValues>,
  undefined,
  undefined,
  RawFormValidate<TValues>,
  RawFormValidate<TValues>,
  RawFormAsyncValidate<TValues>,
  RawFormValidate<TValues>,
  RawFormAsyncValidate<TValues>,
  RawFormValidate<TValues>,
  RawFormAsyncValidate<TValues>,
  undefined,
  undefined,
  undefined,
  never
>;

type FormSnapshot = {
  readonly isValid: boolean;
  readonly isDirty: boolean;
  readonly isTouched: boolean;
  readonly isSubmitting: boolean;
  readonly submissionAttempts: number;
  readonly errors: readonly string[];
};

type ControlSnapshot<TValue> = {
  readonly value: TValue;
  readonly error: PublicFieldError;
  readonly hasServerError: boolean;
  readonly isDirty: boolean;
  readonly isTouched: boolean;
  readonly isValidating: boolean;
};

type ArraySnapshot<TItem> = {
  readonly value: readonly TItem[];
  readonly signatures: readonly string[];
};

type CachedArrayItem<TItem> = {
  readonly item: FormArrayItem<TItem>;
  readonly controls: ArrayItemControls<TItem>;
  readonly index: IObservableValue<number>;
  lastValue: TItem;
  disposed: boolean;
  retarget(index: number): void;
  dispose(): void;
};

type PatchArrayConfigs = ReadonlyMap<string, ArrayFieldConfig<unknown>>;

type InternalControl = {
  dispose(): void;
};

export function createForm<
  TValues extends object,
  const TFields extends FieldConfigs<TValues>,
  const TArrays extends ArrayFieldConfigs<TValues> = Record<never, never>,
>(
  options: CreateFormOptions<TValues, TFields, TArrays>,
): FormsCoreForm<TValues, TFields, TArrays> {
  return new MobxForm(options);
}

class MobxForm<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
  TArrays extends ArrayFieldConfigs<TValues>,
> implements FormsCoreForm<TValues, TFields, TArrays> {
  readonly controls: FormControls<TValues, TFields>;

  readonly arrays: FormArrays<TValues, TArrays>;

  readonly #controls: InternalControl[] = [];

  readonly #arrays: InternalControl[] = [];

  readonly #formApi: TanStackFormApi<TValues>;

  readonly #rawFormApi: RawTanStackFormApi<TValues>;

  readonly #formCleanup: () => void;

  readonly #stateBridge: MobxSelectorBridge<FormSnapshot>;

  readonly #patchSubscription: StoreSubscription;

  readonly #arrayConfigs = new Map<string, ArrayFieldConfig<unknown>>();

  readonly #patchListeners = new Set<FormPatchListener>();

  readonly #serverErrors = new Map<string, string>();

  #lastPatchedValues: TValues;

  #disposed = false;

  constructor(options: CreateFormOptions<TValues, TFields, TArrays>) {
    const rawFormApi = new FormApi<
      TValues,
      RawFormValidate<TValues>,
      RawFormValidate<TValues>,
      RawFormAsyncValidate<TValues>,
      RawFormValidate<TValues>,
      RawFormAsyncValidate<TValues>,
      RawFormValidate<TValues>,
      RawFormAsyncValidate<TValues>,
      undefined,
      undefined,
      undefined,
      never
    >({
      defaultValues: options.defaultValues,
      validators: adaptFormValidators(options.validators),
    });
    this.#rawFormApi = rawFormApi;
    this.#formApi = rawFormApi;
    this.#formCleanup = this.#formApi.mount();
    this.#stateBridge = createMobxSelectorBridge(
      this.#formApi.store,
      selectFormSnapshot,
      { equals: areFormSnapshotsEqual },
    );
    this.#lastPatchedValues = clonePatchValue(this.#formApi.state.values);
    this.#patchSubscription = this.#formApi.store.subscribe(() => {
      this.emitPatchesFromState();
    });

    const controls: Partial<Record<string, FormControl<unknown>>> = {};

    for (const name of fieldConfigKeys<TValues, TFields>(options.fields)) {
      const config = options.fields[name];

      if (config === undefined) {
        continue;
      }

      const control = new MobxFormControl<
        FieldPathValue<TValues, typeof name>,
        TValues
      >({
        fieldName: name,
        formApi: this.#formApi,
        clearServerError: (fieldName) => {
          this.clearServerError(fieldName);
        },
        getSubmissionAttempts: () => this.#stateBridge.value.submissionAttempts,
        rawFormApi,
        config,
      });

      controls[name] = control;
      this.#controls.push(control);
    }

    this.controls = controls as FormControls<TValues, TFields>;

    const arrays: Partial<Record<string, FormArray<unknown>>> = {};

    for (const name of arrayConfigKeys(options.arrays ?? ({} as TArrays))) {
      const config = options.arrays?.[name];

      if (config === undefined) {
        continue;
      }

      this.#arrayConfigs.set(name, config as ArrayFieldConfig<unknown>);

      const formArray = new MobxFormArray<
        ArrayItemValue<ArrayPathValue<TValues, typeof name>>,
        TValues
      >({
        fieldName: name,
        formApi: this.#formApi,
        rawFormApi,
        config,
        clearServerError: (fieldName) => {
          this.clearServerError(fieldName);
        },
        getSubmissionAttempts: () => this.#stateBridge.value.submissionAttempts,
        remapServerErrors: (fieldName, previousItems, getItemId) => {
          this.remapArrayServerErrors(fieldName, previousItems, getItemId);
        },
      });

      arrays[name] = formArray;
      this.#arrays.push(formArray);
    }

    this.arrays = arrays as FormArrays<TValues, TArrays>;
  }

  get isValid(): boolean {
    return this.#stateBridge.value.isValid;
  }

  get isDirty(): boolean {
    return this.#stateBridge.value.isDirty;
  }

  get isTouched(): boolean {
    return this.#stateBridge.value.isTouched;
  }

  get isSubmitting(): boolean {
    return this.#stateBridge.value.isSubmitting;
  }

  get errors(): readonly string[] {
    return this.#stateBridge.value.errors;
  }

  getRawValue(): TValues {
    return this.#formApi.state.values;
  }

  reset(values?: TValues): void {
    if (this.#disposed) {
      return;
    }

    this.clearServerErrors();

    if (values === undefined) {
      this.#formApi.reset();
      return;
    }

    this.#formApi.reset(values);
  }

  async submit(): Promise<void> {
    if (this.#disposed) {
      return;
    }

    try {
      await this.#formApi.handleSubmit();
    } finally {
      this.applyServerErrorMap();
    }
  }

  async validate(): Promise<readonly string[]> {
    if (this.#disposed) {
      return this.errors;
    }

    await Promise.all([
      this.#formApi.validateAllFields('submit'),
      Promise.resolve(this.#formApi.validate('submit')),
    ]);
    this.applyServerErrorMap();

    return this.errors;
  }

  applyServerErrors(errors: Partial<Record<FieldPath<TValues>, string>>): void {
    if (this.#disposed) {
      return;
    }

    this.#serverErrors.clear();

    for (const [fieldName, error] of Object.entries(errors) as Array<
      [string, string | undefined]
    >) {
      if (error !== undefined) {
        this.#serverErrors.set(fieldName, error);
      }
    }

    this.applyServerErrorMap();
  }

  onPatch(listener: FormPatchListener): () => void {
    if (this.#disposed) {
      return noop;
    }

    this.#patchListeners.add(listener);

    return () => {
      this.#patchListeners.delete(listener);
    };
  }

  dispose(): void {
    if (this.#disposed) {
      return;
    }

    this.#disposed = true;

    for (const control of this.#controls) {
      control.dispose();
    }

    for (const array of this.#arrays) {
      array.dispose();
    }

    this.#patchListeners.clear();
    unsubscribeStoreSubscription(this.#patchSubscription);
    this.#stateBridge.dispose();
    this.#formCleanup();
  }

  private emitPatchesFromState(): void {
    if (this.#disposed) {
      return;
    }

    const currentValues = this.#formApi.store.get().values;
    const patches = diffFormValues(
      this.#lastPatchedValues,
      currentValues,
      this.#arrayConfigs,
    );
    this.#lastPatchedValues = clonePatchValue(currentValues);

    if (patches.length === 0 || this.#patchListeners.size === 0) {
      return;
    }

    for (const listener of this.#patchListeners) {
      listener(patches);
    }
  }

  private clearServerErrors(): void {
    this.#serverErrors.clear();
    this.applyServerErrorMap();
  }

  private clearServerError(fieldName: string): void {
    if (this.#serverErrors.delete(fieldName)) {
      this.applyServerErrorMap();
    }
  }

  private applyServerErrorMap(): void {
    const fields = Object.fromEntries(this.#serverErrors);

    (this.#rawFormApi as unknown as TanStackServerErrorApi).setErrorMap({
      onServer: { fields },
    });
  }

  private remapArrayServerErrors<TItem>(
    fieldName: string,
    previousItems: readonly TItem[],
    getItemId: (item: TItem) => string,
  ): void {
    if (this.#serverErrors.size === 0) {
      return;
    }

    assertUniqueArrayItemIds(fieldName, previousItems, getItemId);

    const previousErrors = Array.from(this.#serverErrors.entries());
    const errorsByItemId = new Map<string, Array<readonly [string, string]>>();

    for (const [path, error] of previousErrors) {
      const parsed = parseArrayItemPath(path, fieldName);

      if (parsed === undefined) {
        continue;
      }

      const item = previousItems[parsed.index];

      if (item === undefined) {
        continue;
      }

      const itemId = getItemId(item);
      const itemErrors = errorsByItemId.get(itemId) ?? [];
      itemErrors.push([parsed.suffix, error]);
      errorsByItemId.set(itemId, itemErrors);
      this.#serverErrors.delete(path);
    }

    if (errorsByItemId.size === 0) {
      return;
    }

    const nextValue = getPathValue(this.#formApi.state.values, fieldName);
    const nextItems = Array.isArray(nextValue) ? (nextValue as TItem[]) : [];
    assertUniqueArrayItemIds(fieldName, nextItems, getItemId);

    nextItems.forEach((item, index) => {
      const itemErrors = errorsByItemId.get(getItemId(item));

      if (itemErrors === undefined) {
        return;
      }

      for (const [suffix, error] of itemErrors) {
        this.#serverErrors.set(
          formatArrayItemPath(fieldName, index, suffix),
          error,
        );
      }
    });

    this.applyServerErrorMap();
  }
}

class MobxFormControl<TValue, TValues extends object>
  implements FormControl<TValue>, InternalControl
{
  readonly #fieldApi: TanStackFieldApi<TValue>;

  readonly #fieldName: string;

  readonly #clearServerError: (fieldName: string) => void;

  readonly #fieldCleanup: () => void;

  readonly #formApi: TanStackFormApi<TValues>;

  readonly #getSubmissionAttempts: () => number;

  readonly #stateBridge: MobxSelectorBridge<ControlSnapshot<TValue>>;

  #disposed = false;

  constructor(options: {
    readonly fieldName: string;
    readonly formApi: TanStackFormApi<TValues>;
    readonly clearServerError: (fieldName: string) => void;
    readonly getSubmissionAttempts: () => number;
    readonly rawFormApi: RawTanStackFormApi<TValues>;
    readonly config: FieldConfig<TValue, TValues>;
  }) {
    this.#fieldName = options.fieldName;
    this.#formApi = options.formApi;
    this.#clearServerError = options.clearServerError;
    this.#getSubmissionAttempts = options.getSubmissionAttempts;

    const fieldApiOptions = {
      form: options.rawFormApi,
      name: options.fieldName,
      validators: adaptFieldValidators(
        options.config.validators,
        options.formApi,
      ),
    } as unknown as RawFieldApiOptions<TValues>;

    const fieldApi = new FieldApi(fieldApiOptions);

    this.#fieldApi = fieldApi as unknown as TanStackFieldApi<TValue>;
    this.#fieldCleanup = this.#fieldApi.mount();
    this.#stateBridge = createMobxSelectorBridge(
      this.#fieldApi.store,
      selectControlSnapshot,
      { equals: areControlSnapshotsEqual },
    );
  }

  get value(): TValue {
    return this.#stateBridge.value.value;
  }

  get displayValue(): TValue {
    return this.value;
  }

  get error(): PublicFieldError {
    return this.#stateBridge.value.error;
  }

  get visibleError(): PublicFieldError {
    const state = this.#stateBridge.value;

    if (state.error === undefined) {
      return undefined;
    }

    return state.hasServerError ||
      state.isTouched ||
      this.#getSubmissionAttempts() > 0
      ? state.error
      : undefined;
  }

  get isDirty(): boolean {
    return this.#stateBridge.value.isDirty;
  }

  get isTouched(): boolean {
    return this.#stateBridge.value.isTouched;
  }

  get isValidating(): boolean {
    return this.#stateBridge.value.isValidating;
  }

  setValue(value: TValue): void {
    if (this.#disposed) {
      return;
    }

    if (!Object.is(this.value, value)) {
      this.#clearServerError(this.#fieldName);
    }

    this.#fieldApi.setValue(() => value);
  }

  blur(): void {
    if (this.#disposed) {
      return;
    }

    this.#fieldApi.handleBlur();
  }

  reset(): void {
    if (this.#disposed) {
      return;
    }

    this.#clearServerError(this.#fieldName);
    this.#formApi.resetField(this.#fieldName);
  }

  dispose(): void {
    if (this.#disposed) {
      return;
    }

    this.#disposed = true;
    this.#stateBridge.dispose();
    this.#fieldCleanup();
  }
}

class MobxFormArray<TItem, TValues extends object>
  implements FormArray<TItem>, InternalControl
{
  readonly #fieldName: string;

  readonly #arrayApi: TanStackArrayFieldApi<TItem>;

  readonly #arrayCleanup: () => void;

  readonly #config: ArrayFieldConfig<TItem>;

  readonly #clearServerError: (fieldName: string) => void;

  readonly #getSubmissionAttempts: () => number;

  readonly #remapServerErrors: (
    fieldName: string,
    previousItems: readonly TItem[],
    getItemId: (item: TItem) => string,
  ) => void;

  readonly #formApi: TanStackFormApi<TValues>;

  readonly #rawFormApi: RawTanStackFormApi<TValues>;

  readonly #valueBridge: MobxSelectorBridge<ArraySnapshot<TItem>>;

  readonly #structureBridge: MobxSelectorBridge<ArraySnapshot<TItem>>;

  readonly #itemCache = new Map<string, CachedArrayItem<TItem>>();

  #disposed = false;

  constructor(options: {
    readonly fieldName: string;
    readonly formApi: TanStackFormApi<TValues>;
    readonly rawFormApi: RawTanStackFormApi<TValues>;
    readonly config: ArrayFieldConfig<TItem>;
    readonly clearServerError: (fieldName: string) => void;
    readonly getSubmissionAttempts: () => number;
    readonly remapServerErrors: (
      fieldName: string,
      previousItems: readonly TItem[],
      getItemId: (item: TItem) => string,
    ) => void;
  }) {
    this.#fieldName = options.fieldName;
    this.#formApi = options.formApi;
    this.#rawFormApi = options.rawFormApi;
    this.#config = options.config;
    this.#clearServerError = options.clearServerError;
    this.#getSubmissionAttempts = options.getSubmissionAttempts;
    this.#remapServerErrors = options.remapServerErrors;

    const fieldApiOptions = {
      form: options.rawFormApi,
      name: options.fieldName,
    } as unknown as RawFieldApiOptions<TValues>;
    const fieldApi = new FieldApi(fieldApiOptions);

    this.#arrayApi = fieldApi as unknown as TanStackArrayFieldApi<TItem>;
    this.#arrayCleanup = this.#arrayApi.mount();
    this.#valueBridge = createMobxSelectorBridge(
      this.#arrayApi.store,
      (state) =>
        selectArraySnapshot(state, (item) =>
          createArrayItemValueSignature(item, this.#config.getItemId),
        ),
      {
        equals: (previous, next) => areArraySnapshotsEqual(previous, next),
      },
    );
    this.#structureBridge = createMobxSelectorBridge(
      this.#arrayApi.store,
      (state) =>
        selectArraySnapshot(state, (item) =>
          createArrayItemIdSignature(item, this.#config.getItemId),
        ),
      {
        equals: (previous, next) => areArraySnapshotsEqual(previous, next),
      },
    );
  }

  get value(): readonly TItem[] {
    const value = this.#valueBridge.value.value;
    assertUniqueArrayItemIds(this.#fieldName, value, this.#config.getItemId);

    return value;
  }

  get items(): readonly FormArrayItem<TItem>[] {
    const value = this.#structureBridge.value.value;
    assertUniqueArrayItemIds(this.#fieldName, value, this.#config.getItemId);

    const activeCacheKeys = new Set<string>();
    const items = value.map((item, index) => {
      const id = this.#config.getItemId(item);
      const cacheKey = createArrayItemCacheKey(id);
      activeCacheKeys.add(cacheKey);

      const cached =
        this.#itemCache.get(cacheKey) ??
        this.createCachedItem(cacheKey, item, index);

      if (untracked(() => cached.index.get()) !== index) {
        cached.retarget(index);
      }

      cached.lastValue = item;

      return cached.item;
    });

    for (const [cacheKey, cached] of this.#itemCache) {
      if (!activeCacheKeys.has(cacheKey)) {
        cached.dispose();
        this.#itemCache.delete(cacheKey);
      }
    }

    return items;
  }

  push(value: TItem): void {
    if (this.#disposed) {
      return;
    }

    const previousItems = [...this.value];
    assertUniqueArrayItemIds(
      this.#fieldName,
      [...previousItems, value],
      this.#config.getItemId,
    );
    this.#arrayApi.pushValue(value);
    this.refreshCachedItemControls();
    this.#remapServerErrors(
      this.#fieldName,
      previousItems,
      this.#config.getItemId,
    );
  }

  insert(index: number, value: TItem): void {
    if (this.#disposed) {
      return;
    }

    const previousItems = [...this.value];
    const nextItems = [...previousItems];
    nextItems.splice(index, 0, value);
    assertUniqueArrayItemIds(
      this.#fieldName,
      nextItems,
      this.#config.getItemId,
    );
    this.#arrayApi.insertValue(index, value);
    this.refreshCachedItemControls();
    this.#remapServerErrors(
      this.#fieldName,
      previousItems,
      this.#config.getItemId,
    );
  }

  removeById(id: string): void {
    if (this.#disposed) {
      return;
    }

    const index = this.value.findIndex(
      (item) => this.#config.getItemId(item) === id,
    );

    if (index === -1) {
      return;
    }

    this.removeAt(index);
  }

  removeAt(index: number): void {
    if (this.#disposed) {
      return;
    }

    if (!isArrayIndexInBounds(this.value, index)) {
      return;
    }

    const previousItems = [...this.value];
    this.#arrayApi.removeValue(index);
    this.refreshCachedItemControls();
    this.#remapServerErrors(
      this.#fieldName,
      previousItems,
      this.#config.getItemId,
    );
  }

  move(fromIndex: number, toIndex: number): void {
    if (this.#disposed) {
      return;
    }

    if (
      !isArrayIndexInBounds(this.value, fromIndex) ||
      !isArrayIndexInBounds(this.value, toIndex) ||
      fromIndex === toIndex
    ) {
      return;
    }

    const previousItems = [...this.value];
    this.#arrayApi.moveValue(fromIndex, toIndex);
    this.refreshCachedItemControls();
    this.#remapServerErrors(
      this.#fieldName,
      previousItems,
      this.#config.getItemId,
    );
  }

  swap(leftIndex: number, rightIndex: number): void {
    if (this.#disposed) {
      return;
    }

    if (
      !isArrayIndexInBounds(this.value, leftIndex) ||
      !isArrayIndexInBounds(this.value, rightIndex) ||
      leftIndex === rightIndex
    ) {
      return;
    }

    const previousItems = [...this.value];
    this.#arrayApi.swapValues(leftIndex, rightIndex);
    this.refreshCachedItemControls();
    this.#remapServerErrors(
      this.#fieldName,
      previousItems,
      this.#config.getItemId,
    );
  }

  clear(): void {
    if (this.#disposed) {
      return;
    }

    if (this.value.length === 0) {
      return;
    }

    const previousItems = [...this.value];
    this.#arrayApi.clearValues();
    this.refreshCachedItemControls();
    this.#remapServerErrors(
      this.#fieldName,
      previousItems,
      this.#config.getItemId,
    );
  }

  dispose(): void {
    if (this.#disposed) {
      return;
    }

    this.#disposed = true;

    for (const cached of this.#itemCache.values()) {
      cached.dispose();
    }

    this.#itemCache.clear();
    this.#valueBridge.dispose();
    this.#structureBridge.dispose();
    this.#arrayCleanup();
  }

  private createCachedItem(
    cacheKey: string,
    item: TItem,
    index: number,
  ): CachedArrayItem<TItem> {
    const disposers: Array<() => void> = [];
    const controls = this.createItemControls(item, index, disposers);
    const id = this.#config.getItemId(item);
    const cached: CachedArrayItem<TItem> = {
      controls,
      index: observable.box(index, { deep: false }),
      lastValue: item,
      disposed: false,
      item: this.createPublicItem(id, controls, () => cached),
      retarget: (nextIndex) => {
        runInAction(() => {
          cached.index.set(nextIndex);
        });

        for (const control of Object.values(controls)) {
          if (isRetargetableFormControl(control)) {
            control.retarget(nextIndex);
          }
        }
      },
      dispose: () => {
        cached.disposed = true;

        for (const dispose of disposers) {
          dispose();
        }
      },
    };

    this.#itemCache.set(cacheKey, cached);

    return cached;
  }

  private createPublicItem(
    id: string,
    controls: ArrayItemControls<TItem>,
    getCached: () => CachedArrayItem<TItem>,
  ): FormArrayItem<TItem> {
    const getCurrentValue = (index: number) =>
      this.#valueBridge.value.value[index];

    return {
      get id() {
        return id;
      },
      get index() {
        return getCached().index.get();
      },
      get value() {
        const cached = getCached();

        if (cached.disposed) {
          return cached.lastValue;
        }

        return getCurrentValue(cached.index.get()) ?? cached.lastValue;
      },
      controls,
    };
  }

  private refreshCachedItemControls(): void {
    const activeCacheKeys = new Set<string>();

    this.#structureBridge.value.value.forEach((item, index) => {
      const cacheKey = createArrayItemCacheKey(this.#config.getItemId(item));
      const cached = this.#itemCache.get(cacheKey);
      activeCacheKeys.add(cacheKey);

      if (
        cached !== undefined &&
        untracked(() => cached.index.get()) !== index
      ) {
        cached.retarget(index);
      }
    });

    for (const [cacheKey, cached] of this.#itemCache) {
      if (!activeCacheKeys.has(cacheKey)) {
        cached.dispose();
        this.#itemCache.delete(cacheKey);
      }
    }
  }

  private createItemControls(
    item: TItem,
    index: number,
    disposers: Array<() => void>,
  ): ArrayItemControls<TItem> {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return {} as ArrayItemControls<TItem>;
    }

    const controls: Record<string, FormControl<unknown>> = {};

    for (const key of Object.keys(item)) {
      const fieldName = `${this.#fieldName}[${index}].${key}`;
      const control = new RetargetableFormControl<unknown>({
        createControl: (nextFieldName) =>
          new MobxFormControl<unknown, TValues>({
            fieldName: nextFieldName,
            formApi: this.#formApi,
            clearServerError: this.#clearServerError,
            getSubmissionAttempts: this.#getSubmissionAttempts,
            rawFormApi: this.#rawFormApi,
            config: {},
          }),
        fieldName,
        getFieldName: (nextIndex) => `${this.#fieldName}[${nextIndex}].${key}`,
      });

      controls[key] = control;
      disposers.push(() => {
        control.dispose();
      });
    }

    return controls as ArrayItemControls<TItem>;
  }
}

class RetargetableFormControl<TValue>
  implements FormControl<TValue>, InternalControl
{
  readonly #controlBox: IObservableValue<FormControl<TValue> & InternalControl>;

  readonly #createControl: (
    fieldName: string,
  ) => FormControl<TValue> & InternalControl;

  readonly #getFieldName: (index: number) => string;

  #disposed = false;

  constructor(options: {
    readonly createControl: (
      fieldName: string,
    ) => FormControl<TValue> & InternalControl;
    readonly fieldName: string;
    readonly getFieldName: (index: number) => string;
  }) {
    this.#createControl = options.createControl;
    this.#getFieldName = options.getFieldName;
    this.#controlBox = observable.box(this.#createControl(options.fieldName), {
      deep: false,
    });
  }

  get value(): TValue {
    return this.#controlBox.get().value;
  }

  get displayValue(): TValue {
    return this.#controlBox.get().displayValue;
  }

  get error(): PublicFieldError {
    return this.#controlBox.get().error;
  }

  get visibleError(): PublicFieldError {
    return this.#controlBox.get().visibleError;
  }

  get isDirty(): boolean {
    return this.#controlBox.get().isDirty;
  }

  get isTouched(): boolean {
    return this.#controlBox.get().isTouched;
  }

  get isValidating(): boolean {
    return this.#controlBox.get().isValidating;
  }

  setValue(value: TValue): void {
    if (this.#disposed) {
      return;
    }

    this.#controlBox.get().setValue(value);
  }

  blur(): void {
    if (this.#disposed) {
      return;
    }

    this.#controlBox.get().blur();
  }

  reset(): void {
    if (this.#disposed) {
      return;
    }

    this.#controlBox.get().reset();
  }

  retarget(index: number): void {
    if (this.#disposed) {
      return;
    }

    const previousControl = this.#controlBox.get();
    const nextControl = this.#createControl(this.#getFieldName(index));

    runInAction(() => {
      this.#controlBox.set(nextControl);
    });
    previousControl.dispose();
  }

  dispose(): void {
    if (this.#disposed) {
      return;
    }

    this.#disposed = true;
    this.#controlBox.get().dispose();
  }
}

function fieldConfigKeys<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
>(value: TFields): Array<ControlName<TValues, TFields>> {
  return Object.keys(value) as Array<ControlName<TValues, TFields>>;
}

function arrayConfigKeys<
  TValues extends object,
  TArrays extends ArrayFieldConfigs<TValues>,
>(value: TArrays): Array<ArrayName<TValues, TArrays>> {
  return Object.keys(value) as Array<ArrayName<TValues, TArrays>>;
}

function adaptFieldValidators<TValue, TValues extends object>(
  validators: FieldValidators<TValue, TValues> | undefined,
  formApi: TanStackFormApi<TValues>,
): AdaptedFieldValidators<TValue, TValues> | undefined {
  if (validators === undefined) {
    return undefined;
  }

  const adapted: AdaptedFieldValidators<TValue, TValues> = {};

  if (validators.onChange !== undefined) {
    adapted.onChange = ({ value }) =>
      validators.onChange?.({ value, values: formApi.state.values });
  }

  if (validators.onChangeAsync !== undefined) {
    adapted.onChangeAsync = ({ value, signal }) =>
      validators.onChangeAsync?.({
        value,
        values: formApi.state.values,
        signal,
      });
  }

  if (validators.onChangeAsyncDebounceMs !== undefined) {
    adapted.onChangeAsyncDebounceMs = validators.onChangeAsyncDebounceMs;
  }

  if (validators.onChangeListenTo !== undefined) {
    adapted.onChangeListenTo = [...validators.onChangeListenTo];
  }

  if (validators.onBlur !== undefined) {
    adapted.onBlur = ({ value }) =>
      validators.onBlur?.({ value, values: formApi.state.values });
  }

  if (validators.onBlurAsync !== undefined) {
    adapted.onBlurAsync = ({ value, signal }) =>
      validators.onBlurAsync?.({
        value,
        values: formApi.state.values,
        signal,
      });
  }

  if (validators.onBlurAsyncDebounceMs !== undefined) {
    adapted.onBlurAsyncDebounceMs = validators.onBlurAsyncDebounceMs;
  }

  if (validators.onBlurListenTo !== undefined) {
    adapted.onBlurListenTo = [...validators.onBlurListenTo];
  }

  if (validators.onSubmit !== undefined) {
    adapted.onSubmit = ({ value }) =>
      validators.onSubmit?.({ value, values: formApi.state.values });
  }

  if (validators.onSubmitAsync !== undefined) {
    adapted.onSubmitAsync = ({ value, signal }) =>
      validators.onSubmitAsync?.({
        value,
        values: formApi.state.values,
        signal,
      });
  }

  return adapted;
}

function adaptFormValidators<TValues extends object>(
  validators: FormValidators<TValues> | undefined,
): AdaptedFormValidators<TValues> | undefined {
  if (validators === undefined) {
    return undefined;
  }

  const adapted: AdaptedFormValidators<TValues> = {};

  if (validators.onChange !== undefined) {
    adapted.onChange = ({ value }) =>
      normalizeFormValidationResult(validators.onChange?.({ value }));
  }

  if (validators.onChangeAsync !== undefined) {
    adapted.onChangeAsync = async ({ value, signal }) =>
      normalizeFormValidationResult(
        await validators.onChangeAsync?.({ value, signal }),
      );
  }

  if (validators.onChangeAsyncDebounceMs !== undefined) {
    adapted.onChangeAsyncDebounceMs = validators.onChangeAsyncDebounceMs;
  }

  if (validators.onBlur !== undefined) {
    adapted.onBlur = ({ value }) =>
      normalizeFormValidationResult(validators.onBlur?.({ value }));
  }

  if (validators.onBlurAsync !== undefined) {
    adapted.onBlurAsync = async ({ value, signal }) =>
      normalizeFormValidationResult(
        await validators.onBlurAsync?.({ value, signal }),
      );
  }

  if (validators.onBlurAsyncDebounceMs !== undefined) {
    adapted.onBlurAsyncDebounceMs = validators.onBlurAsyncDebounceMs;
  }

  if (validators.onSubmit !== undefined) {
    adapted.onSubmit = ({ value }) =>
      normalizeFormValidationResult(validators.onSubmit?.({ value }));
  }

  if (validators.onSubmitAsync !== undefined) {
    adapted.onSubmitAsync = async ({ value, signal }) =>
      normalizeFormValidationResult(
        await validators.onSubmitAsync?.({ value, signal }),
      );
  }

  return adapted;
}

function normalizeFormValidationResult<TValues extends object>(
  result: FormValidationResult<TValues>,
):
  | string
  | {
      readonly form?: string;
      readonly fields: Partial<Record<FieldPath<TValues>, string>>;
    }
  | undefined {
  if (result === null || result === undefined) {
    return undefined;
  }

  if (typeof result === 'object') {
    const fields = Object.fromEntries(
      Object.entries(result.fields ?? {}).filter(
        ([, error]) => error !== undefined && error !== null && error !== '',
      ),
    ) as Partial<Record<FieldPath<TValues>, string>>;
    const form =
      result.form === undefined || result.form === '' ? undefined : result.form;

    if (form === undefined && Object.keys(fields).length === 0) {
      return undefined;
    }

    return {
      form,
      fields,
    };
  }

  return result;
}

function selectFormSnapshot<TValues extends object>(
  state: TanStackFormState<TValues>,
): FormSnapshot {
  return {
    isValid: state.isValid,
    isDirty: state.isDirty,
    isTouched: state.isTouched,
    isSubmitting: state.isSubmitting,
    submissionAttempts: state.submissionAttempts,
    errors: normalizeErrors(state.errors),
  };
}

function selectControlSnapshot<TValue>(
  state: TanStackFieldState<TValue>,
): ControlSnapshot<TValue> {
  const serverError = normalizeFirstError(state.meta.errorMap.onServer);
  const error = serverError ?? normalizeFirstError(state.meta.errors);

  return {
    value: state.value,
    error,
    hasServerError: serverError !== undefined,
    isDirty: state.meta.isDirty,
    isTouched: state.meta.isTouched,
    isValidating: state.meta.isValidating,
  };
}

function selectArraySnapshot<TItem>(
  state: TanStackFieldState<TItem[]>,
  createSignature: (item: TItem) => string,
): ArraySnapshot<TItem> {
  const value = Array.isArray(state.value) ? [...state.value] : [];

  return {
    value,
    signatures: value.map(createSignature),
  };
}

function areFormSnapshotsEqual(
  previous: FormSnapshot,
  next: FormSnapshot,
): boolean {
  return (
    previous.isValid === next.isValid &&
    previous.isDirty === next.isDirty &&
    previous.isTouched === next.isTouched &&
    previous.isSubmitting === next.isSubmitting &&
    previous.submissionAttempts === next.submissionAttempts &&
    areStringArraysEqual(previous.errors, next.errors)
  );
}

function areControlSnapshotsEqual<TValue>(
  previous: ControlSnapshot<TValue>,
  next: ControlSnapshot<TValue>,
): boolean {
  return (
    Object.is(previous.value, next.value) &&
    previous.error === next.error &&
    previous.hasServerError === next.hasServerError &&
    previous.isDirty === next.isDirty &&
    previous.isTouched === next.isTouched &&
    previous.isValidating === next.isValidating
  );
}

function areArraySnapshotsEqual<TItem>(
  previous: ArraySnapshot<TItem>,
  next: ArraySnapshot<TItem>,
): boolean {
  if (Object.is(previous.value, next.value)) {
    return true;
  }

  if (previous.signatures.length !== next.signatures.length) {
    return false;
  }

  return previous.signatures.every(
    (signature, index) => signature === next.signatures[index],
  );
}

function areStringArraysEqual(
  previous: readonly string[],
  next: readonly string[],
): boolean {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((value, index) => value === next[index]);
}

function diffFormValues(
  previous: unknown,
  next: unknown,
  arrayConfigs: PatchArrayConfigs,
): readonly FormPatch[] {
  const patches: FormPatch[] = [];
  appendValuePatches('', previous, next, patches, arrayConfigs);

  return patches;
}

function appendValuePatches(
  path: string,
  previous: unknown,
  next: unknown,
  patches: FormPatch[],
  arrayConfigs: PatchArrayConfigs,
): void {
  if (Object.is(previous, next)) {
    return;
  }

  if (Array.isArray(previous) && Array.isArray(next)) {
    appendArrayPatches(path, previous, next, patches, arrayConfigs);
    return;
  }

  if (isPlainRecord(previous) && isPlainRecord(next)) {
    appendObjectPatches(path, previous, next, patches, arrayConfigs);
    return;
  }

  patches.push({
    type: 'set',
    path,
    value: clonePatchValue(next),
    previousValue: clonePatchValue(previous),
  });
}

function appendObjectPatches(
  path: string,
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
  patches: FormPatch[],
  arrayConfigs: PatchArrayConfigs,
): void {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);

  for (const key of keys) {
    const keyPath = formatObjectFieldPath(path, key);
    const hasPrevious = Object.hasOwn(previous, key);
    const hasNext = Object.hasOwn(next, key);

    if (!hasNext) {
      patches.push({
        type: 'remove',
        path: keyPath,
        previousValue: clonePatchValue(previous[key]),
      });
      continue;
    }

    if (!hasPrevious) {
      patches.push({
        type: 'set',
        path: keyPath,
        value: clonePatchValue(next[key]),
        previousValue: undefined,
      });
      continue;
    }

    appendValuePatches(
      keyPath,
      previous[key],
      next[key],
      patches,
      arrayConfigs,
    );
  }
}

function appendArrayPatches(
  path: string,
  previous: readonly unknown[],
  next: readonly unknown[],
  patches: FormPatch[],
  arrayConfigs: PatchArrayConfigs,
): void {
  const arrayConfig = path === '' ? undefined : arrayConfigs.get(path);

  if (arrayConfig !== undefined) {
    appendConfiguredArrayPatches(
      path,
      previous,
      next,
      arrayConfig,
      patches,
      arrayConfigs,
    );
    return;
  }

  if (previous.length !== next.length) {
    pushSetPatch(path, previous, next, patches);
    return;
  }

  previous.forEach((previousItem, index) => {
    appendValuePatches(
      formatArrayIndexPath(path, index),
      previousItem,
      next[index],
      patches,
      arrayConfigs,
    );
  });
}

function appendConfiguredArrayPatches(
  path: string,
  previous: readonly unknown[],
  next: readonly unknown[],
  config: ArrayFieldConfig<unknown>,
  patches: FormPatch[],
  arrayConfigs: PatchArrayConfigs,
): void {
  const previousIds = getUniquePatchItemIds(path, previous, config.getItemId);
  const nextIds = getUniquePatchItemIds(path, next, config.getItemId);

  if (previousIds === undefined || nextIds === undefined) {
    pushSetPatch(path, previous, next, patches);
    return;
  }

  if (previous.length > 0 && next.length === 0) {
    patches.push({
      type: 'clear',
      path,
      previousValue: clonePatchArray(previous),
    });
    return;
  }

  const insertedIndex = findInsertedIndex(previousIds, nextIds);

  if (insertedIndex !== undefined) {
    patches.push({
      type: 'insert',
      path,
      index: insertedIndex,
      value: clonePatchValue(next[insertedIndex]),
    });
    return;
  }

  const removedIndex = findRemovedIndex(previousIds, nextIds);

  if (removedIndex !== undefined) {
    patches.push({
      type: 'remove',
      path: formatArrayIndexPath(path, removedIndex),
      previousValue: clonePatchValue(previous[removedIndex]),
    });
    return;
  }

  if (areStringArraysEqual(previousIds, nextIds)) {
    previous.forEach((previousItem, index) => {
      appendValuePatches(
        formatArrayIndexPath(path, index),
        previousItem,
        next[index],
        patches,
        arrayConfigs,
      );
    });
    return;
  }

  const movedIndex = findMovedIndex(previousIds, nextIds);

  if (movedIndex !== undefined) {
    patches.push({
      type: 'move',
      path,
      fromIndex: movedIndex.fromIndex,
      toIndex: movedIndex.toIndex,
    });
    return;
  }

  pushSetPatch(path, previous, next, patches);
}

function pushSetPatch(
  path: string,
  previous: unknown,
  next: unknown,
  patches: FormPatch[],
): void {
  patches.push({
    type: 'set',
    path,
    value: clonePatchValue(next),
    previousValue: clonePatchValue(previous),
  });
}

function getUniquePatchItemIds(
  path: string,
  items: readonly unknown[],
  getItemId: (item: unknown) => string,
): readonly string[] | undefined {
  try {
    assertUniqueArrayItemIds(path, items, getItemId);
    return items.map(getItemId);
  } catch {
    return undefined;
  }
}

function findInsertedIndex(
  previousIds: readonly string[],
  nextIds: readonly string[],
): number | undefined {
  if (nextIds.length !== previousIds.length + 1) {
    return undefined;
  }

  let previousIndex = 0;
  let insertedIndex: number | undefined;

  for (let nextIndex = 0; nextIndex < nextIds.length; nextIndex += 1) {
    if (
      previousIndex < previousIds.length &&
      nextIds[nextIndex] === previousIds[previousIndex]
    ) {
      previousIndex += 1;
      continue;
    }

    if (insertedIndex !== undefined) {
      return undefined;
    }

    insertedIndex = nextIndex;
  }

  return insertedIndex;
}

function findRemovedIndex(
  previousIds: readonly string[],
  nextIds: readonly string[],
): number | undefined {
  if (previousIds.length !== nextIds.length + 1) {
    return undefined;
  }

  let nextIndex = 0;
  let removedIndex: number | undefined;

  for (
    let previousIndex = 0;
    previousIndex < previousIds.length;
    previousIndex += 1
  ) {
    if (
      nextIndex < nextIds.length &&
      previousIds[previousIndex] === nextIds[nextIndex]
    ) {
      nextIndex += 1;
      continue;
    }

    if (removedIndex !== undefined) {
      return undefined;
    }

    removedIndex = previousIndex;
  }

  return removedIndex;
}

function findMovedIndex(
  previousIds: readonly string[],
  nextIds: readonly string[],
): { readonly fromIndex: number; readonly toIndex: number } | undefined {
  if (
    previousIds.length !== nextIds.length ||
    !haveSameStringMembers(previousIds, nextIds)
  ) {
    return undefined;
  }

  for (let fromIndex = 0; fromIndex < previousIds.length; fromIndex += 1) {
    for (let toIndex = 0; toIndex < previousIds.length; toIndex += 1) {
      if (fromIndex === toIndex) {
        continue;
      }

      if (
        areStringArraysEqual(
          moveArrayItem(previousIds, fromIndex, toIndex),
          nextIds,
        )
      ) {
        return { fromIndex, toIndex };
      }
    }
  }

  return undefined;
}

function haveSameStringMembers(
  previous: readonly string[],
  next: readonly string[],
): boolean {
  if (previous.length !== next.length) {
    return false;
  }

  const nextIds = new Set(next);

  return previous.every((id) => nextIds.has(id));
}

function moveArrayItem<TItem>(
  value: readonly TItem[],
  fromIndex: number,
  toIndex: number,
): readonly TItem[] {
  const next = [...value];
  const [item] = next.splice(fromIndex, 1);

  if (item === undefined) {
    return value;
  }

  next.splice(toIndex, 0, item);

  return next;
}

function formatObjectFieldPath(basePath: string, key: string): string {
  return basePath === '' ? key : `${basePath}.${key}`;
}

function formatArrayIndexPath(basePath: string, index: number): string {
  return `${basePath}[${index}]`;
}

function clonePatchArray(value: readonly unknown[]): unknown[] {
  return value.map((item) => clonePatchValue(item));
}

function clonePatchValue<TValue>(value: TValue): TValue {
  if (Array.isArray(value)) {
    return value.map((item) => clonePatchValue(item)) as TValue;
  }

  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, clonePatchValue(item)]),
    ) as TValue;
  }

  return value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function unsubscribeStoreSubscription(subscription: StoreSubscription): void {
  if (typeof subscription === 'function') {
    subscription();
    return;
  }

  subscription.unsubscribe();
}

function noop(): void {}

function createArrayItemIdSignature<TItem>(
  item: TItem,
  getItemId: (item: TItem) => string,
): string {
  return getItemId(item);
}

function createArrayItemValueSignature<TItem>(
  item: TItem,
  getItemId: (item: TItem) => string,
): string {
  return `${getItemId(item)}:${stableFormValueSignature(item)}`;
}

function stableFormValueSignature(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'bigint') {
    return `bigint:${value.toString()}`;
  }

  if (typeof value === 'number') {
    return stableNumberValueSignature(value);
  }

  if (typeof value === 'boolean') {
    return `boolean:${value}`;
  }

  if (typeof value === 'string') {
    return `string:${JSON.stringify(value)}`;
  }

  if (typeof value === 'symbol') {
    return `symbol:${JSON.stringify(value.description)}`;
  }

  if (typeof value === 'function') {
    return `function:${JSON.stringify(value.name)}`;
  }

  if (Array.isArray(value)) {
    return stableArrayValueSignature(value);
  }

  if (isPlainRecord(value)) {
    return stablePlainRecordValueSignature(value);
  }

  return `object:${Object.prototype.toString.call(value)}`;
}

function stableNumberValueSignature(value: number): string {
  if (Number.isNaN(value)) {
    return 'number:NaN';
  }

  if (value === Infinity) {
    return 'number:Infinity';
  }

  if (value === -Infinity) {
    return 'number:-Infinity';
  }

  if (Object.is(value, -0)) {
    return 'number:-0';
  }

  return `number:${value}`;
}

function stableArrayValueSignature(value: readonly unknown[]): string {
  return `array:${value.length}:[${value
    .map((item, index) => `${index}:${stableFormValueSignature(item)}`)
    .join(',')}]`;
}

function stablePlainRecordValueSignature(
  value: Record<string, unknown>,
): string {
  return `object:{${Object.keys(value)
    .sort((left, right) => left.localeCompare(right))
    .map(
      (key) => `${JSON.stringify(key)}:${stableFormValueSignature(value[key])}`,
    )
    .join(',')}}`;
}

function isRetargetableFormControl<TValue>(
  control: FormControl<TValue>,
): control is RetargetableFormControl<TValue> {
  return control instanceof RetargetableFormControl;
}

function createArrayItemCacheKey(id: string): string {
  return id;
}

function assertUniqueArrayItemIds<TItem>(
  fieldName: string,
  items: readonly TItem[],
  getItemId: (item: TItem) => string,
): void {
  const seenIds = new Set<string>();

  for (const item of items) {
    const id = getItemId(item);

    if (seenIds.has(id)) {
      throw new Error(
        `Array field "${fieldName}" has duplicate item id "${id}". getItemId must return a unique stable id for each item.`,
      );
    }

    seenIds.add(id);
  }
}

function isArrayIndexInBounds(
  value: readonly unknown[],
  index: number,
): boolean {
  return Number.isInteger(index) && index >= 0 && index < value.length;
}
