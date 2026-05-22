export type PublicFieldError = string | undefined;
export type PublicFormError = string;

export function normalizeFirstError(value: unknown): PublicFieldError {
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeFirstError(item);

      if (normalized !== undefined) {
        return normalized;
      }
    }

    return undefined;
  }

  if (value === null || value === undefined || value === false) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  if (hasMessage(value)) {
    return value.message;
  }

  return String(value);
}

export function normalizeErrors(value: unknown): readonly PublicFormError[] {
  if (!Array.isArray(value)) {
    const normalized = normalizeFirstError(value);

    return normalized === undefined ? [] : [normalized];
  }

  const errors: PublicFormError[] = [];

  for (const item of value) {
    const normalized = normalizeFirstError(item);

    if (normalized !== undefined) {
      errors.push(normalized);
    }
  }

  return errors;
}

function hasMessage(value: unknown): value is { readonly message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  );
}
