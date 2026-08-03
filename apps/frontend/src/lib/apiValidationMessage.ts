import { isApiError } from '@/lib/apiClient';
import type { ValidationError } from '@mms/shared';

function isValidationErrorList(value: unknown): value is ValidationError[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item !== null &&
        typeof item === 'object' &&
        'fieldId' in item &&
        'message' in item &&
        typeof (item as ValidationError).fieldId === 'string' &&
        typeof (item as ValidationError).message === 'string',
    )
  );
}

/** Prefer first field-level API validation message (e.g. Contacts unique conflicts). */
export function getApiValidationMessage(error: unknown): string | undefined {
  if (!isApiError(error)) return undefined;
  if (isValidationErrorList(error.errors) && error.errors[0]?.message) {
    return error.errors[0].message;
  }
  if (error.type === 'validation_error' && error.message.trim()) {
    return error.message;
  }
  return undefined;
}

export function getApiValidationErrors(error: unknown): ValidationError[] | undefined {
  if (!isApiError(error) || !isValidationErrorList(error.errors)) return undefined;
  return error.errors;
}
