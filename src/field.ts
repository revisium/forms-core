export type FieldValidationResult = string | null | undefined | void;

export type FieldValidatorContext<TValue> = {
  readonly value: TValue;
};

export type FieldValidator<TValue> = (
  context: FieldValidatorContext<TValue>,
) => FieldValidationResult;

export type FieldValidators<TValue> = {
  readonly onChange?: FieldValidator<TValue>;
  readonly onBlur?: FieldValidator<TValue>;
  readonly onSubmit?: FieldValidator<TValue>;
};

export type FieldConfig<TValue> = {
  readonly validators?: FieldValidators<TValue>;
};

export function field<TValue>(
  config: FieldConfig<TValue> = {},
): FieldConfig<TValue> {
  return config;
}
