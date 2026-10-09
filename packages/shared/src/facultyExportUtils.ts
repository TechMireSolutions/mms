/**
 * @file facultyExportUtils.ts
 * @description Faculty module export utilities.
 *
 * MIGRATION (T10): `filterFacultyExportColumnsForViewer` now delegates to
 * `filterExportColumnsByVisibility`. `buildFacultyExportRows` delegates to
 * `buildExportGrid`. All existing public exports are preserved.
 */
import type { FieldDefinition } from './contactTypes.js';
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
import {
  filterExportColumnsByVisibility,
} from './dataTransfer/export/filterExportColumns.js';
import { buildExportGrid } from './dataTransfer/export/buildExportGrid.js';
import type { ExportColumn, ExportCellExtractor } from './dataTransfer/core/exportTypes.js';

// ---------------------------------------------------------------------------
// Column type
// ---------------------------------------------------------------------------

export interface FacultyExportColumn {
  id: string;
  label: string;
}

export { DEFAULT_FACULTY_EXPORT_COLUMNS };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** CSV identity columns always exported regardless of Setup field registry. */
const FACULTY_EXPORT_ALWAYS_VISIBLE = new Set(['name', 'employeeId']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveExportFieldKey(columnId: string): string {
  const customFieldId = customFieldKeyFromColumnKey(columnId);
  if (customFieldId !== null) return customFieldId;
  const mapping = FACULTY_COLUMN_FIELD_MAPPING[columnId as FacultyWorkColumnKey];
  return mapping?.fieldId ?? columnId;
}

// ---------------------------------------------------------------------------
// Column filter — delegates to generic utility
// ---------------------------------------------------------------------------

/**
 * Filters export columns by Setup field/tab enablement + viewer role.
 * Uses `filterExportColumnsByVisibility` from the shared data-transfer pipeline.
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
  const formTabs = settings.formTabs ?? [];

  // Build a field alias map: column id → field key in registry
  const columnAliases: Record<string, string> = {};
  for (const col of source) {
    const fieldKey = resolveExportFieldKey(col.id);
    if (fieldKey !== col.id) columnAliases[col.id] = fieldKey;
  }

  // Locked tabs: faculty uses isFacultyLockedEnabledTab
  const allTabIds = new Set([
    ...enabledTabs,
    ...formTabs.map((t) => t.key),
    ...Object.keys(fields),
  ]);
  const lockedTabIds = new Set<string>();
  for (const tabId of allTabIds) {
    if (isFacultyLockedEnabledTab(tabId)) lockedTabIds.add(tabId);
  }

  return filterExportColumnsByVisibility(source as ExportColumn[], {
    fieldsByTab: fields,
    formTabs,
    viewerRole: viewerRole ?? '',
    alwaysVisible: FACULTY_EXPORT_ALWAYS_VISIBLE,
    columnAliases,
    lockedTabIds,
  }) as FacultyExportColumn[];
}

// ---------------------------------------------------------------------------
// Cell extractor
// ---------------------------------------------------------------------------

/** Builds a field-type lookup from faculty settings. */
function buildFieldTypeMap(
  fields: Record<string, FieldDefinition[]> | undefined,
): Map<string, FieldDefinition['type']> {
  const map = new Map<string, FieldDefinition['type']>();
  if (!fields) return map;
  for (const tabFields of Object.values(fields)) {
    for (const field of tabFields) {
      if (field.key && !map.has(field.key)) {
        map.set(field.key, field.type);
      }
    }
  }
  return map;
}

/**
 * Creates a pure cell extractor for FacultyMember entities.
 * The fieldTypeMap enables rich formatting (e.g. currency, boolean).
 */
export function createFacultyCellExtractor(
  settings?: FacultySettings | null,
): ExportCellExtractor<FacultyMember> {
  const fields = settings ? resolveFacultyFieldsMapForColumnSync(settings.fields) : undefined;
  const fieldTypeMap = buildFieldTypeMap(fields);

  return (faculty: FacultyMember, columnId: string): string | number | null => {
    const propKey = resolveExportFieldKey(columnId) as keyof FacultyMember;
    const fieldType = fieldTypeMap.get(propKey as string);
    const cellVal = faculty[propKey];
    return formatFacultyFieldCellValue(cellVal, {
      fieldType,
      propKey: propKey as string,
      arraySeparator: '; ',
    }) ?? '';
  };
}

// ---------------------------------------------------------------------------
// Grid builder — delegates to generic utility
// ---------------------------------------------------------------------------

/** Builds a 2D grid [header, ...rows] for the given faculty and columns. */
export function buildFacultyExportRows(
  faculty: FacultyMember[],
  columns: FacultyExportColumn[],
  settings?: FacultySettings | null,
): unknown[][] {
  const extractCell = createFacultyCellExtractor(settings);
  return buildExportGrid(faculty, columns as ExportColumn[], extractCell);
}
