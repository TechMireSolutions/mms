import { TEACHER_COLUMN_FIELD_MAPPING } from './moduleFieldSetupPersons.js';
import type { ColumnRegistryEntry } from './contactTypes.js';
import { listTeacherSystemFormFieldKeys } from './teacherFormCustomFields.js';

export type TeacherFieldDependencyArea = 'systemField' | 'column';

export interface TeacherFieldDependencyIssue {
  area: TeacherFieldDependencyArea;
  /** i18n key — FE passes to t() with optional { count }. */
  messageKey: string;
  count?: number;
}

/** Work column keys that mirror a Setup field id (including mapped columns). */
function columnKeysForField(fieldKey: string): string[] {
  const keys = new Set<string>([fieldKey, `custom:${fieldKey}`]);
  for (const [columnKey, mapping] of Object.entries(TEACHER_COLUMN_FIELD_MAPPING)) {
    if (mapping.fieldId === fieldKey) {
      keys.add(columnKey);
    }
  }
  return [...keys];
}

export function isTeacherSeedFieldKey(fieldKey: string): boolean {
  return listTeacherSystemFormFieldKeys().has(fieldKey);
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
