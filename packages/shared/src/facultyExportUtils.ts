import type { FieldDefinition } from './contactTypes.js';
import { canViewContactField, canViewContactTab } from './contactFieldAccess.js';
import type { FacultyMember } from './facultyTypes.js';
import type { FacultySettings } from './facultyModuleSettings.js';
import { isFacultyLockedEnabledTab } from './moduleFieldSetupPersons.js';
import {
  DEFAULT_FACULTY_EXPORT_COLUMNS,
  FACULTY_COLUMN_FIELD_MAPPING,
  type FacultyWorkColumnKey,
} from './facultyDirectoryColumns.js';
import { resolveFacultyEnabledTabIds } from './facultyEnabledTabs.js';
import { customFieldKeyFromColumnKey } from './moduleColumnCore.js';
import { resolveFacultyFieldsMapForColumnSync } from './facultyFormCustomFields.js';
import { formatFacultyFieldCellValue } from './facultyFieldCellFormat.js';

export interface FacultyExportColumn {
  id: string;
  label: string;
}

export { DEFAULT_FACULTY_EXPORT_COLUMNS };

/** CSV identity columns always exported regardless of Setup field registry. */
const FACULTY_EXPORT_ALWAYS_VISIBLE = new Set(['name', 'employeeId']);

function resolveExportFieldKey(columnId: string): string {
  const customFieldId = customFieldKeyFromColumnKey(columnId);
  if (customFieldId !== null) return customFieldId;
  const mapping = FACULTY_COLUMN_FIELD_MAPPING[columnId as FacultyWorkColumnKey];
  return mapping?.fieldId ?? columnId;
}

function isFacultyExportTabEnabled(
  tabId: string,
  enabledTabs: ReadonlySet<string>,
  enabledTabsLower: ReadonlySet<string>,
): boolean {
  if (isFacultyLockedEnabledTab(tabId)) return true;
  if (enabledTabs.has(tabId)) return true;
  return enabledTabsLower.has(tabId.toLowerCase());
}

/**
 * Filters export columns by Setup field/tab enablement + viewer role.
 * Always-visible: `name`, `employeeId`. Disabled or role-hidden Setup fields are
 * dropped; unregistered custom keys and always-visible identity columns survive.
 */
export function filterFacultyExportColumnsForViewer(
  columns: FacultyExportColumn[],
  settings?: FacultySettings | null,
  viewerRole?: string,
): FacultyExportColumn[] {
  const source = columns.length > 0 ? columns : [...DEFAULT_FACULTY_EXPORT_COLUMNS];
  if (!settings) return source;

  const fields = resolveFacultyFieldsMapForColumnSync(settings.fields);
  const enabledTabs = new Set(resolveFacultyEnabledTabIds(settings));
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
    if (FACULTY_EXPORT_ALWAYS_VISIBLE.has(column.id)) return true;

    const fieldKey = resolveExportFieldKey(column.id);
    const found = fieldLocationMap.get(fieldKey);
    if (!found) {
      // Unknown / unmapped custom with no Setup row — keep (compat).
      return true;
    }
    if (found.field.enabled === false) return false;
    if (!isFacultyExportTabEnabled(found.tabId, enabledTabs, enabledTabsLower)) return false;
    if (viewerRole) {
      if (!canViewContactField(viewerRole, found.field)) return false;
      const tab = tabMap.get((found.tabId || '').toLowerCase());
      if (tab && !canViewContactTab(viewerRole, tab)) return false;
    }
    return true;
  });
}

function compileFacultyColumnExtractor(
  columnId: string,
  fieldTypeMap: Map<string, FieldDefinition['type']>,
): (faculty: FacultyMember) => unknown {
  const propKey = resolveExportFieldKey(columnId) as keyof FacultyMember;
  const fieldType = fieldTypeMap.get(propKey as string);
  const options = {
    fieldType,
    propKey: propKey as string,
    arraySeparator: '; ',
  };

  return (faculty: FacultyMember) => {
    const cellVal = faculty[propKey];
    return (
      formatFacultyFieldCellValue(cellVal, options) ?? ''
    );
  };
}

/** Builds CSV rows (header + data) for the given faculty and visible columns. */
export function buildFacultyExportRows(
  faculty: FacultyMember[],
  columns: FacultyExportColumn[],
  settings?: FacultySettings | null,
): unknown[][] {
  const fields = settings
    ? resolveFacultyFieldsMapForColumnSync(settings.fields)
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
    compileFacultyColumnExtractor(col.id, fieldTypeMap),
  );
  const header = columns.map((column) => column.label);
  const rows = faculty.map((member) =>
    extractors.map((extractor) => extractor(member)),
  );
  return [header, ...rows];
}
