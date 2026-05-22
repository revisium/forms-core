import { FieldApi, FormApi } from '@tanstack/form-core';

import type {
  DeepKeys,
  DeepValue,
  FieldAsyncValidateOrFn,
  FieldApiOptions,
  FieldValidateOrFn,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  ValidationCause,
} from '@tanstack/form-core';

import type { FieldConfig, FieldValidators } from './field.js';
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
  readonly [TName in StringKeyOf<TValues>]: FieldConfig<
    TValues[TName],
    TValues
  >;
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
  readonly validators?: FormValidators<TValues>;
};

export type FormValidationResult<TValues extends object> =
  | string
  | {
      readonly form?: string;
      readonly fields?: Partial<Record<StringKeyOf<TValues>, string>>;
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
  applyServerErrors(errors: Record<string, string>): void;
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

type AdaptedFieldValidators<TValue, TValues extends object> = {
  onChange?: (context: { readonly value: TValue }) => unknown;
  onChangeAsync?: (context: {
    readonly value: TValue;
    readonly signal: AbortSignal;
  }) => unknown;
  onChangeAsyncDebounceMs?: number;
  onChangeListenTo?: readonly StringKeyOf<TValues>[];
  onBlur?: (context: { readonly value: TValue }) => unknown;
  onBlurAsync?: (context: {
    readonly value: TValue;
    readonly signal: AbortSignal;
  }) => unknown;
  onBlurAsyncDebounceMs?: number;
  onBlurListenTo?: readonly StringKeyOf<TValues>[];
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

  readonly #controlByName: ReadonlyMap<string, InternalControl>;

  readonly #formApi: TanStackFormApi<TValues>;

  readonly #rawFormApi: RawTanStackFormApi<TValues>;

  readonly #formCleanup: () => void;

  readonly #stateBridge: MobxSelectorBridge<FormSnapshot>;

  readonly #serverErrors = new Map<string, string>();

  #disposed = false;

  constructor(options: CreateFormOptions<TValues, TFields>) {
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

    const controls: Partial<Record<string, FormControl<unknown>>> = {};
    const internalControls: InternalControl[] = [];
    const controlByName = new Map<string, InternalControl>();

    for (const name of fieldConfigKeys(options.fields)) {
      const config = options.fields[name];

      if (config === undefined) {
        continue;
      }

      const control = new MobxFormControl<TValues[typeof name], TValues>({
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
      internalControls.push(control);
      controlByName.set(name, control);
    }

    this.controls = controls as FormControls<TValues, TFields>;
    this.#controls = internalControls;
    this.#controlByName = controlByName;
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
    this.clearServerErrors();

    if (values === undefined) {
      this.#formApi.reset();
      return;
    }

    this.#formApi.reset(values);
  }

  async submit(): Promise<void> {
    try {
      await this.#formApi.handleSubmit();
    } finally {
      this.applyServerErrorMap();
    }
  }

  async validate(): Promise<readonly string[]> {
    await Promise.all([
      this.#formApi.validateAllFields('submit'),
      Promise.resolve(this.#formApi.validate('submit')),
    ]);
    this.applyServerErrorMap();

    return this.errors;
  }

  applyServerErrors(errors: Record<string, string>): void {
    this.#serverErrors.clear();

    for (const [fieldName, error] of Object.entries(errors)) {
      if (this.#controlByName.has(fieldName)) {
        this.#serverErrors.set(fieldName, error);
      }
    }

    this.applyServerErrorMap();
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
    if (!Object.is(this.value, value)) {
      this.#clearServerError(this.#fieldName);
    }

    this.#fieldApi.setValue(() => value);
  }

  blur(): void {
    this.#fieldApi.handleBlur();
  }

  reset(): void {
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

function fieldConfigKeys<
  TValues extends object,
  TFields extends FieldConfigs<TValues>,
>(value: TFields): Array<ControlName<TValues, TFields>> {
  return Object.keys(value) as Array<ControlName<TValues, TFields>>;
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
      readonly fields: Partial<Record<StringKeyOf<TValues>, string>>;
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
    ) as Partial<Record<StringKeyOf<TValues>, string>>;
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

function areStringArraysEqual(
  previous: readonly string[],
  next: readonly string[],
): boolean {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((value, index) => value === next[index]);
}
