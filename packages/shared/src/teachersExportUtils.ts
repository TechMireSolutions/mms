import type { FieldDefinition } from './contactTypes.js';
import type { Teacher } from './teacherTypes.js';
import type { TeachersSettings } from './teachersModuleSettings.js';
import {
  TEACHER_COLUMN_FIELD_MAPPING,
  isTeacherLockedEnabledTab,
  type TeacherWorkColumnKey,
} from './moduleFieldSetupPersons.js';
import { DEFAULT_TEACHER_EXPORT_COLUMNS } from './teacherDirectoryColumns.js';
import { resolveTeacherEnabledTabIds } from './teacherEnabledTabs.js';
import {
  findTeacherFieldLocation,
  resolveTeacherFieldsMapForColumnSync,
} from './teacherFormCustomFields.js';
import { formatTeacherFieldCellValue } from './teacherFieldCellFormat.js';

export interface TeacherExportColumn {
  id: string;
  label: string;
}

export { DEFAULT_TEACHER_EXPORT_COLUMNS };

/** CSV identity columns always exported regardless of Setup field registry. */
const TEACHER_EXPORT_ALWAYS_VISIBLE = new Set(['name', 'employeeId']);

function resolveExportFieldKey(columnId: string): string {
  if (columnId.startsWith('custom:')) {
    return columnId.slice('custom:'.length);
  }
  const mapping = TEACHER_COLUMN_FIELD_MAPPING[columnId as TeacherWorkColumnKey];
  return mapping?.fieldId ?? columnId;
}

function isTeacherExportTabEnabled(
  tabId: string,
  enabledTabs: ReadonlySet<string>,
): boolean {
  if (isTeacherLockedEnabledTab(tabId)) return true;
  if (enabledTabs.has(tabId)) return true;
  const lower = tabId.toLowerCase();
  for (const enabled of enabledTabs) {
    if (enabled.toLowerCase() === lower) return true;
  }
  return false;
}

/**
 * Filters export columns by Setup field/tab enablement (Students-shaped).
 * Always-visible: `name`, `employeeId`. Role gating reserved for a later pass.
 */
export function filterTeacherExportColumnsForViewer(
  columns: TeacherExportColumn[],
  settings?: TeachersSettings | null,
  _viewerRole?: string,
): TeacherExportColumn[] {
  const source = columns.length > 0 ? columns : [...DEFAULT_TEACHER_EXPORT_COLUMNS];
  if (!settings) return source;

  const fields = resolveTeacherFieldsMapForColumnSync(
    settings.fields as Record<string, unknown> | undefined,
  );
  const enabledTabs = new Set(resolveTeacherEnabledTabIds(settings));

  return source.filter((column) => {
    if (TEACHER_EXPORT_ALWAYS_VISIBLE.has(column.id)) return true;

    const fieldKey = resolveExportFieldKey(column.id);
    const found = findTeacherFieldLocation(fields, fieldKey);
    if (!found) {
      // Unknown / unmapped custom with no Setup row — keep (compat).
      return true;
    }
    if (found.field.enabled === false) return false;
    return isTeacherExportTabEnabled(found.tabId, enabledTabs);
  });
}

function cellValue(
  teacher: Teacher,
  columnId: string,
  fields?: Record<string, FieldDefinition[]>,
): string {
  const propKey = resolveExportFieldKey(columnId);
  const fieldType = fields
    ? findTeacherFieldLocation(fields, propKey)?.field.type
    : undefined;
  const cellVal = teacher[propKey as keyof Teacher];
  return (
    formatTeacherFieldCellValue(cellVal, {
      fieldType,
      propKey,
      arraySeparator: '; ',
    }) ?? ''
  );
}

/** Builds CSV rows (header + data) for the given teachers and visible columns. */
export function buildTeachersExportRows(
  teachers: Teacher[],
  columns: TeacherExportColumn[],
  settings?: TeachersSettings | null,
): unknown[][] {
  const fields = settings
    ? resolveTeacherFieldsMapForColumnSync(
        settings.fields as Record<string, unknown> | undefined,
      )
    : undefined;
  const header = columns.map((column) => column.label);
  const rows = teachers.map((teacher) =>
    columns.map(({ id }) => cellValue(teacher, id, fields)),
  );
  return [header, ...rows];
}
