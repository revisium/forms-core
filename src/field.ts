export type FieldValidationResult = string | null | undefined | void;

export type FieldValidatorContext<TValue, TValues extends object = object> = {
  readonly value: TValue;
  readonly values: TValues;
};

export type FieldAsyncValidatorContext<
  TValue,
  TValues extends object = object,
> = FieldValidatorContext<TValue, TValues> & {
  readonly signal: AbortSignal;
};

export type FieldValidator<TValue, TValues extends object = object> = (
  context: FieldValidatorContext<TValue, TValues>,
) => FieldValidationResult;

export type FieldAsyncValidator<TValue, TValues extends object = object> = (
  context: FieldAsyncValidatorContext<TValue, TValues>,
) => FieldValidationResult | Promise<FieldValidationResult>;

export type FieldValidators<TValue, TValues extends object = object> = {
  readonly onChange?: FieldValidator<TValue, TValues>;
  readonly onChangeAsync?: FieldAsyncValidator<TValue, TValues>;
  readonly onChangeAsyncDebounceMs?: number;
  readonly onChangeListenTo?: readonly Extract<keyof TValues, string>[];
  readonly onBlur?: FieldValidator<TValue, TValues>;
  readonly onBlurAsync?: FieldAsyncValidator<TValue, TValues>;
  readonly onBlurAsyncDebounceMs?: number;
  readonly onBlurListenTo?: readonly Extract<keyof TValues, string>[];
  readonly onSubmit?: FieldValidator<TValue, TValues>;
  readonly onSubmitAsync?: FieldAsyncValidator<TValue, TValues>;
};

export type FieldConfig<TValue, TValues extends object = object> = {
  readonly validators?: FieldValidators<TValue, TValues>;
};

export function field<TValue, TValues extends object = object>(
  config: FieldConfig<TValue, TValues> = {},
): FieldConfig<TValue, TValues> {
  return config;
}
