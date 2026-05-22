import { FieldApi, FormApi } from '@tanstack/form-core';

import type {
  DeepKeys,
  DeepValue,
  FieldApiOptions,
  FieldValidateOrFn,
  ValidationCause,
} from '@tanstack/form-core';

import type { FieldConfig, FieldValidator, FieldValidators } from './field.js';
import {
  normalizeErrors,
  normalizeFirstError,
  type PublicFieldError,
} from './internal/errors.js';
import {
  createMobxSelectorBridge,
  type MobxSelectorBridge,
  type SubscribableStore,
} from './internal/mobx-selector-bridge.js';

type StringKeyOf<TValues extends object> = Extract<keyof TValues, string>;

export type FieldConfigs<TValues extends object> = Partial<{
  readonly [TName in StringKeyOf<TValues>]: FieldConfig<TValues[TName]>;
}>;

type ControlName<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
> = Extract<keyof TFields, StringKeyOf<TValues>>;

export type FormControls<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
> = {
  readonly [TName in ControlName<TValues, TFields>]: FormControl<
    TValues[TName]
  >;
};

export type CreateFormOptions<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
> = {
  readonly defaultValues: TValues;
  readonly fields: TFields;
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

export type FormsCoreForm<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
> = {
  readonly controls: FormControls<TValues, TFields>;
  readonly isValid: boolean;
  readonly isDirty: boolean;
  readonly isTouched: boolean;
  readonly isSubmitting: boolean;
  readonly errors: readonly string[];
  getRawValue(): TValues;
  reset(values?: TValues): void;
  submit(): Promise<void>;
  validate(): Promise<readonly string[]>;
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

type RawTanStackFormApi<TValues extends object> = FormApi<
  TValues,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  never
>;

type TanStackFieldMeta = {
  readonly errors: readonly unknown[];
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

type AdaptedFieldValidators<TValue> = Partial<
  Record<
    keyof FieldValidators<TValue>,
    (context: { readonly value: TValue }) => unknown
  >
>;

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

type RawFieldApiOptions<TValues extends object> = FieldApiOptions<
  TValues,
  AnyRawFieldName<TValues>,
  AnyRawFieldValue<TValues>,
  undefined,
  RawFieldValidate<TValues>,
  undefined,
  RawFieldValidate<TValues>,
  undefined,
  RawFieldValidate<TValues>,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
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
  readonly isDirty: boolean;
  readonly isTouched: boolean;
  readonly isValidating: boolean;
};

type InternalControl = {
  dispose(): void;
};

export function createForm<
  TValues extends object,
  const TFields extends FieldConfigs<TValues>,
>(
  options: CreateFormOptions<TValues, TFields>,
): FormsCoreForm<TValues, TFields> {
  return new MobxForm(options);
}

class MobxForm<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
> implements FormsCoreForm<TValues, TFields> {
  readonly controls: FormControls<TValues, TFields>;

  readonly #controls: readonly InternalControl[];

  readonly #formApi: TanStackFormApi<TValues>;

  readonly #formCleanup: () => void;

  readonly #stateBridge: MobxSelectorBridge<FormSnapshot>;

  #disposed = false;

  constructor(options: CreateFormOptions<TValues, TFields>) {
    const rawFormApi = new FormApi<
      TValues,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      never
    >({
      defaultValues: options.defaultValues,
    });
    this.#formApi = rawFormApi;
    this.#formCleanup = this.#formApi.mount();
    this.#stateBridge = createMobxSelectorBridge(
      this.#formApi.store,
      selectFormSnapshot,
      { equals: areFormSnapshotsEqual },
    );

    const controls: Partial<Record<string, FormControl<unknown>>> = {};
    const internalControls: InternalControl[] = [];

    for (const name of fieldConfigKeys(options.fields)) {
      const config = options.fields[name];

      if (config === undefined) {
        continue;
      }

      const control = new MobxFormControl<TValues[typeof name], TValues>({
        fieldName: name,
        formApi: this.#formApi,
        getSubmissionAttempts: () => this.#stateBridge.value.submissionAttempts,
        rawFormApi,
        config,
      });

      controls[name] = control;
      internalControls.push(control);
    }

    this.controls = controls as FormControls<TValues, TFields>;
    this.#controls = internalControls;
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
    if (values === undefined) {
      this.#formApi.reset();
      return;
    }

    this.#formApi.reset(values);
  }

  async submit(): Promise<void> {
    await this.#formApi.handleSubmit();
  }

  async validate(): Promise<readonly string[]> {
    await Promise.all([
      this.#formApi.validateAllFields('submit'),
      Promise.resolve(this.#formApi.validate('submit')),
    ]);

    return this.errors;
  }

  dispose(): void {
    if (this.#disposed) {
      return;
    }

    this.#disposed = true;

    for (const control of this.#controls) {
      control.dispose();
    }

    this.#stateBridge.dispose();
    this.#formCleanup();
  }
}

class MobxFormControl<TValue, TValues extends object>
  implements FormControl<TValue>, InternalControl
{
  readonly #fieldApi: TanStackFieldApi<TValue>;

  readonly #fieldName: string;

  readonly #fieldCleanup: () => void;

  readonly #formApi: TanStackFormApi<TValues>;

  readonly #getSubmissionAttempts: () => number;

  readonly #stateBridge: MobxSelectorBridge<ControlSnapshot<TValue>>;

  #disposed = false;

  constructor(options: {
    readonly fieldName: string;
    readonly formApi: TanStackFormApi<TValues>;
    readonly getSubmissionAttempts: () => number;
    readonly rawFormApi: RawTanStackFormApi<TValues>;
    readonly config: FieldConfig<TValue>;
  }) {
    this.#fieldName = options.fieldName;
    this.#formApi = options.formApi;
    this.#getSubmissionAttempts = options.getSubmissionAttempts;

    const fieldApiOptions = {
      form: options.rawFormApi,
      name: options.fieldName,
      validators: adaptFieldValidators(options.config.validators),
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

    return state.isTouched || this.#getSubmissionAttempts() > 0
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
    this.#fieldApi.setValue(() => value);
  }

  blur(): void {
    this.#fieldApi.handleBlur();
  }

  reset(): void {
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

function fieldConfigKeys<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
>(value: TFields): Array<ControlName<TValues, TFields>> {
  return Object.keys(value) as Array<ControlName<TValues, TFields>>;
}

function adaptFieldValidators<TValue>(
  validators: FieldValidators<TValue> | undefined,
): AdaptedFieldValidators<TValue> | undefined {
  if (validators === undefined) {
    return undefined;
  }

  const adapted: AdaptedFieldValidators<TValue> = {};

  addFieldValidator(adapted, 'onChange', validators.onChange);
  addFieldValidator(adapted, 'onBlur', validators.onBlur);
  addFieldValidator(adapted, 'onSubmit', validators.onSubmit);

  return adapted;
}

function addFieldValidator<TValue>(
  adapted: Record<string, (context: { readonly value: TValue }) => unknown>,
  key: keyof FieldValidators<TValue>,
  validator: FieldValidator<TValue> | undefined,
): void {
  if (validator === undefined) {
    return;
  }

  adapted[key] = ({ value }) => validator({ value });
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
  const error = normalizeFirstError(state.meta.errors);

  return {
    value: state.value,
    error,
    isDirty: state.meta.isDirty,
    isTouched: state.meta.isTouched,
    isValidating: state.meta.isValidating,
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
    previous.isDirty === next.isDirty &&
    previous.isTouched === next.isTouched &&
    previous.isValidating === next.isValidating
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
