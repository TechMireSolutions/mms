import { INITIAL_STUDENT_FIELD_SEED } from './moduleFieldSetupPersons.js';
import type { ColumnRegistryEntry } from './contactTypes.js';

export type StudentFieldDependencyArea = 'systemField' | 'column';

export interface StudentFieldDependencyIssue {
  area: StudentFieldDependencyArea;
  /** i18n key — FE passes to t() with optional { count }. */
  messageKey: string;
  count?: number;
}

const SEED_FIELD_KEYS = new Set(
  Object.values(INITIAL_STUDENT_FIELD_SEED).flatMap((fields) => fields.map((field) => field.key)),
);

export function isStudentSeedFieldKey(fieldKey: string): boolean {
  return SEED_FIELD_KEYS.has(fieldKey);
}

export interface StudentFieldDependencyInput {
  fieldKey: string;
  columnRegistry: ColumnRegistryEntry[];
}

/**
 * Returns blocking issues before removing a field from Students Setup.
 * Checks system seed keys and enabled Work column registry usage.
 */
export function getStudentFieldRemovalIssues(
  input: StudentFieldDependencyInput,
): StudentFieldDependencyIssue[] {
  const { fieldKey, columnRegistry } = input;
  const issues: StudentFieldDependencyIssue[] = [];

  if (isStudentSeedFieldKey(fieldKey)) {
    issues.push({
      area: 'systemField',
      messageKey: 'students.setup.cannotDeleteSystemField',
    });
    return issues;
  }

  const columnKeys = new Set([fieldKey, `custom:${fieldKey}`]);
  const column = columnRegistry.find(
    (col) => columnKeys.has(col.key) && col.enabled !== false,
  );
  if (column) {
    issues.push({
      area: 'column',
      messageKey: 'students.setup.fieldUsedInColumn',
    });
  }

  return issues;
}
