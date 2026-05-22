export type PublicFieldError = string | undefined;

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

  if (typeof value === 'object') {
    return stringifyObjectError(value);
  }

  return stringifyPrimitiveError(value);
}

export function normalizeErrors(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    const normalized = normalizeFirstError(value);

    return normalized === undefined ? [] : [normalized];
  }

  const errors: string[] = [];

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

function stringifyObjectError(value: object): string {
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function stringifyPrimitiveError(value: unknown): string {
  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
    case 'bigint':
      return value.toString();
    case 'symbol':
      return value.description ?? value.toString();
    case 'function':
      return value.name.length > 0 ? `[function ${value.name}]` : '[function]';
    default:
      return 'Unknown validation error';
  }
}
