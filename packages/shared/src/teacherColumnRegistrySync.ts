import type { ColumnRegistryEntry, FieldDefinition } from './contactTypes.js';
import {
  DEFAULT_TEACHER_COLUMN_REGISTRY,
  TEACHER_COLUMN_FIELD_MAPPING,
  TEACHER_LOCKED_ENABLED_TABS,
} from './moduleFieldSetupPersons.js';
import type { TeacherWorkColumnLabels } from './moduleColumnCore.js';
import { teacherWorkColumnLabelsFrom } from './teacherDirectoryColumns.js';
import { syncModuleColumnRegistryWithFields } from './moduleColumnRegistrySync.js';
import { listEnabledCustomTeacherFormFields } from './teacherFormCustomFields.js';

/** Labels for preflight / sync (keys only matter for dependency checks). */
export const TEACHER_WORK_COLUMN_PLACEHOLDER_LABELS: TeacherWorkColumnLabels =
  teacherWorkColumnLabelsFrom((key) => key);

/** Default Work column registry from seed (no tenant customs). */
export function defaultTeacherWorkColumnRegistry(): ColumnRegistryEntry[] {
  return DEFAULT_TEACHER_COLUMN_REGISTRY.map((col) => ({ ...col }));
}

/**
 * Aligns Teachers Work column registry with Setup Fields draft enablement
 * ({@link DEFAULT_TEACHER_COLUMN_REGISTRY} / {@link TEACHER_COLUMN_FIELD_MAPPING} SSOT).
 */
export function syncTeacherColumnRegistryWithFields(
  columnRegistry: ColumnRegistryEntry[] | undefined,
  fields: Record<string, FieldDefinition[]>,
  enabledTabIds: Iterable<string>,
): ColumnRegistryEntry[] {
  return syncModuleColumnRegistryWithFields({
    defaultRegistry: DEFAULT_TEACHER_COLUMN_REGISTRY,
    columnFieldMapping: TEACHER_COLUMN_FIELD_MAPPING,
    lockedEnabledTabs: TEACHER_LOCKED_ENABLED_TABS,
    columnRegistry,
    fields,
    enabledTabIds,
    listEnabledCustomFields: listEnabledCustomTeacherFormFields,
    dropUnknownSystemKeys: true,
  });
}
