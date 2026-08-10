import type { ColumnRegistryEntry } from './contactTypes.js';
import { TEACHER_COLUMN_FIELD_MAPPING } from './moduleFieldSetupPersons.js';
import { createFieldRemovalIssuesChecker } from './createFieldRemovalIssuesChecker.js';
import { listTeacherSystemFormFieldKeys } from './teacherFormCustomFields.js';

export type TeacherFieldDependencyArea = 'systemField' | 'column';

export interface TeacherFieldDependencyIssue {
  area: TeacherFieldDependencyArea;
  /** i18n key — FE passes to t() with optional { count }. */
  messageKey: string;
  count?: number;
}

export interface TeacherFieldDependencyInput {
  fieldKey: string;
  columnRegistry: ColumnRegistryEntry[];
}

const checker = createFieldRemovalIssuesChecker({
  systemFieldKeys: listTeacherSystemFormFieldKeys(),
  columnFieldMapping: TEACHER_COLUMN_FIELD_MAPPING,
  messageKeys: {
    systemField: 'teachers.setup.cannotDeleteSystemField',
    fieldUsedInColumn: 'teachers.setup.fieldUsedInColumn',
  },
});

export const isTeacherSeedFieldKey = checker.isSeedFieldKey;

/**
 * Returns blocking issues before removing a field from Teachers Setup.
 * Checks system seed keys and enabled Work column registry usage.
 */
export function getTeacherFieldRemovalIssues(
  input: TeacherFieldDependencyInput,
): TeacherFieldDependencyIssue[] {
  return checker.getFieldRemovalIssues(input);
}
