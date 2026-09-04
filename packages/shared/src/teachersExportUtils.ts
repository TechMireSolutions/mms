import type { FieldDefinition } from './contactTypes.js';
import { canViewContactField, canViewContactTab } from './contactFieldAccess.js';
import type { Teacher } from './teacherTypes.js';
import type { TeachersSettings } from './teachersModuleSettings.js';
import {
  TEACHER_COLUMN_FIELD_MAPPING,
  isTeacherLockedEnabledTab,
  type TeacherWorkColumnKey,
} from './moduleFieldSetupPersons.js';
import { DEFAULT_TEACHER_EXPORT_COLUMNS } from './teacherDirectoryColumns.js';
import { resolveTeacherEnabledTabIds } from './teacherEnabledTabs.js';
import { customFieldKeyFromColumnKey } from './moduleColumnCore.js';
import { resolveTeacherFieldsMapForColumnSync } from './teacherFormCustomFields.js';
import { formatTeacherFieldCellValue } from './teacherFieldCellFormat.js';

export interface TeacherExportColumn {
  id: string;
  label: string;
}

export { DEFAULT_TEACHER_EXPORT_COLUMNS };

/** CSV identity columns always exported regardless of Setup field registry. */
const TEACHER_EXPORT_ALWAYS_VISIBLE = new Set(['name', 'employeeId']);

function resolveExportFieldKey(columnId: string): string {
  const customFieldId = customFieldKeyFromColumnKey(columnId);
  if (customFieldId !== null) return customFieldId;
  const mapping = TEACHER_COLUMN_FIELD_MAPPING[columnId as TeacherWorkColumnKey];
  return mapping?.fieldId ?? columnId;
}

function isTeacherExportTabEnabled(
  tabId: string,
  enabledTabs: ReadonlySet<string>,
  enabledTabsLower: ReadonlySet<string>,
): boolean {
  if (isTeacherLockedEnabledTab(tabId)) return true;
  if (enabledTabs.has(tabId)) return true;
  return enabledTabsLower.has(tabId.toLowerCase());
}

/**
 * Filters export columns by Setup field/tab enablement + viewer role.
 * Always-visible: `name`, `employeeId`. Disabled or role-hidden Setup fields are
 * dropped; unregistered custom keys and always-visible identity columns survive.
 */
export function filterTeacherExportColumnsForViewer(
  columns: TeacherExportColumn[],
  settings?: TeachersSettings | null,
  viewerRole?: string,
): TeacherExportColumn[] {
  const source = columns.length > 0 ? columns : [...DEFAULT_TEACHER_EXPORT_COLUMNS];
  if (!settings) return source;

  const fields = resolveTeacherFieldsMapForColumnSync(settings.fields);
  const enabledTabs = new Set(resolveTeacherEnabledTabIds(settings));
  const enabledTabsLower = new Set(Array.from(enabledTabs, (tab) => tab.toLowerCase()));
  const formTabs = settings.formTabs ?? [];
  const tabMap = new Map<string, (typeof formTabs)[number]>();
  for (const t of formTabs) {
    if (t.key) tabMap.set(t.key.toLowerCase(), t);
  }

  const fieldLocationMap = new Map<string, { tabId: string; field: FieldDefinition }>();
  for (const [tabId, tabFields] of Object.entries(fields)) {
    for (const field of tabFields) {
      if (field.key && !fieldLocationMap.has(field.key)) {
        fieldLocationMap.set(field.key, { tabId, field });
      }
    }
  }

  return source.filter((column) => {
    if (TEACHER_EXPORT_ALWAYS_VISIBLE.has(column.id)) return true;

    const fieldKey = resolveExportFieldKey(column.id);
    const found = fieldLocationMap.get(fieldKey);
    if (!found) {
      // Unknown / unmapped custom with no Setup row — keep (compat).
      return true;
    }
    if (found.field.enabled === false) return false;
    if (!isTeacherExportTabEnabled(found.tabId, enabledTabs, enabledTabsLower)) return false;
    if (viewerRole) {
      if (!canViewContactField(viewerRole, found.field)) return false;
      const tab = tabMap.get((found.tabId || '').toLowerCase());
      if (tab && !canViewContactTab(viewerRole, tab)) return false;
    }
    return true;
  });
}

function compileTeacherColumnExtractor(
  columnId: string,
  fieldTypeMap: Map<string, FieldDefinition['type']>,
): (teacher: Teacher) => unknown {
  const propKey = resolveExportFieldKey(columnId) as keyof Teacher;
  const fieldType = fieldTypeMap.get(propKey as string);
  const options = {
    fieldType,
    propKey: propKey as string,
    arraySeparator: '; ',
  };

  return (teacher: Teacher) => {
    const cellVal = teacher[propKey];
    return (
      formatTeacherFieldCellValue(cellVal, options) ?? ''
    );
  };
}

/** Builds CSV rows (header + data) for the given teachers and visible columns. */
export function buildTeachersExportRows(
  teachers: Teacher[],
  columns: TeacherExportColumn[],
  settings?: TeachersSettings | null,
): unknown[][] {
  const fields = settings
    ? resolveTeacherFieldsMapForColumnSync(settings.fields)
    : undefined;

  const fieldTypeMap = new Map<string, FieldDefinition['type']>();
  if (fields) {
    for (const tabFields of Object.values(fields)) {
      for (const field of tabFields) {
        if (field.key && !fieldTypeMap.has(field.key)) {
          fieldTypeMap.set(field.key, field.type);
        }
      }
    }
  }

  const extractors = columns.map((col) =>
    compileTeacherColumnExtractor(col.id, fieldTypeMap),
  );
  const header = columns.map((column) => column.label);
  const rows = teachers.map((teacher) =>
    extractors.map((extractor) => extractor(teacher)),
  );
  return [header, ...rows];
}
