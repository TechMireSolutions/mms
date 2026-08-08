import { INITIAL_TEACHERS_FIELD_SEED } from './moduleFieldSetupPersons.js';
import type { ColumnRegistryEntry } from './contactTypes.js';

export type TeacherFieldDependencyArea = 'systemField' | 'column';

export interface TeacherFieldDependencyIssue {
  area: TeacherFieldDependencyArea;
  /** i18n key — FE passes to t() with optional { count }. */
  messageKey: string;
  count?: number;
}

const SEED_FIELD_KEYS = new Set(
  Object.values(INITIAL_TEACHERS_FIELD_SEED).flatMap((fields) => fields.map((field) => field.key)),
);

/** Work column keys that mirror a Setup field id. */
function columnKeysForField(fieldKey: string): string[] {
  return [fieldKey, `custom:${fieldKey}`];
}

export function isTeacherSeedFieldKey(fieldKey: string): boolean {
  return SEED_FIELD_KEYS.has(fieldKey);
}

export interface TeacherFieldDependencyInput {
  fieldKey: string;
  columnRegistry: ColumnRegistryEntry[];
}

/**
 * Returns blocking issues before removing a field from Teachers Setup.
 * Checks system seed keys and enabled Work column registry usage.
 */
export function getTeacherFieldRemovalIssues(
  input: TeacherFieldDependencyInput,
): TeacherFieldDependencyIssue[] {
  const { fieldKey, columnRegistry } = input;
  const issues: TeacherFieldDependencyIssue[] = [];

  if (isTeacherSeedFieldKey(fieldKey)) {
    issues.push({
      area: 'systemField',
      messageKey: 'teachers.setup.cannotDeleteSystemField',
    });
    return issues;
  }

  const columnKeys = new Set(columnKeysForField(fieldKey));
  const column = columnRegistry.find(
    (col) => columnKeys.has(col.key) && col.enabled !== false,
  );
  if (column) {
    issues.push({
      area: 'column',
      messageKey: 'teachers.setup.fieldUsedInColumn',
    });
  }

  return issues;
}
