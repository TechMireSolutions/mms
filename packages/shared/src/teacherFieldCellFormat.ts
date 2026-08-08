import { formatDate, formatDateTime } from './settingsDateFormatters.js';
import { DEFAULT_TEACHER_STATUS } from './teacherTypes.js';

export type FormatTeacherFieldCellOptions = {
  /** Setup field type (`date` | `datetime` | `boolean` | …). */
  fieldType?: string;
  /**
   * When `propKey` is `status` (or `statusDefault` is true), empty values become
   * {@link DEFAULT_TEACHER_STATUS}.
   */
  propKey?: string;
  statusDefault?: boolean;
  /** Localized yes/no for boolean values (export may omit → `true`/`false`). */
  booleanLabels?: { yes: string; no: string };
  /** Array join separator — `, ` for UI, `; ` for CSV. */
  arraySeparator?: string;
};

/**
 * Formats a teacher field / export cell value by optional Setup field type.
 * Returns `undefined` when empty (callers apply notSpecified / status default / blank CSV).
 */
export function formatTeacherFieldCellValue(
  value: unknown,
  options: FormatTeacherFieldCellOptions = {},
): string | undefined {
  const {
    fieldType,
    propKey,
    statusDefault = propKey === 'status',
    booleanLabels,
    arraySeparator = ', ',
  } = options;

  if (value === undefined || value === null || value === '') {
    return statusDefault ? DEFAULT_TEACHER_STATUS : undefined;
  }
  if (typeof value === 'string' && !value.trim()) {
    return statusDefault ? DEFAULT_TEACHER_STATUS : undefined;
  }

  if (Array.isArray(value)) {
    const joined = value.map(String).filter(Boolean).join(arraySeparator);
    return joined || (statusDefault ? DEFAULT_TEACHER_STATUS : undefined);
  }

  if (typeof value === 'boolean') {
    if (booleanLabels) {
      return value ? booleanLabels.yes : booleanLabels.no;
    }
    return value ? 'true' : 'false';
  }

  if (typeof value === 'object') {
    return undefined;
  }

  if (typeof value === 'string') {
    if (fieldType === 'datetime') {
      return formatDateTime(value, true);
    }
    if (fieldType === 'date') {
      return formatDate(value, true);
    }
    if (!fieldType && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.includes('T') ? formatDateTime(value, true) : formatDate(value, true);
    }
  }

  return String(value);
}
