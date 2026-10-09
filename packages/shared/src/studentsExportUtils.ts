/**
 * @file studentsExportUtils.ts
 * @description Students module export utilities.
 *
 * MIGRATION (T9): `filterStudentExportColumnsForViewer` and
 * `buildStudentsExportRows` now delegate to the generic pipeline:
 *   - `filterExportColumnsByVisibility` (dataTransfer/export/filterExportColumns)
 *   - `buildExportGrid`                 (dataTransfer/export/buildExportGrid)
 *
 * All existing public exports are preserved for backward compatibility.
 */
import type { FieldDefinition } from './contactTypes.js';
import type { Student } from './studentTypes.js';
import type { StudentsSettings } from './studentsModuleSettings.js';
import { primaryResponsibleAdultDisplayName } from './studentGuardianFromContacts.js';
import {
  filterExportColumnsByVisibility,
  buildSimpleVisibilityContext,
} from './dataTransfer/export/filterExportColumns.js';
import { buildExportGrid } from './dataTransfer/export/buildExportGrid.js';
import type { ExportColumn } from './dataTransfer/core/exportTypes.js';

// ---------------------------------------------------------------------------
// Column type (kept for backward compat — identical to ExportColumn)
// ---------------------------------------------------------------------------

export interface StudentExportColumn {
  id: string;
  label: string;
}

export { DEFAULT_STUDENT_EXPORT_COLUMNS, studentColumnLabelKey } from './studentDirectoryColumns.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Column ids that alias a different Setup field key. */
const STUDENT_EXPORT_COLUMN_FIELD_ALIASES: Record<string, string> = {
  parents: 'contactRelationships',
  fatherName: 'contactRelationships',
  sessions: 'enrolledSessions',
};

/** Identity columns always exported regardless of Setup field registry. */
const STUDENT_EXPORT_ALWAYS_VISIBLE = new Set(['name', 'grNumber', 'status', 'studentId']);

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

function isTabKeyedFieldRegistry(
  fields: StudentsSettings['fields'],
): fields is Record<string, FieldDefinition[]> {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return false;
  const first = Object.values(fields)[0];
  return Array.isArray(first);
}

// ---------------------------------------------------------------------------
// Column filter — delegates to generic utility
// ---------------------------------------------------------------------------

/**
 * Filters export columns by tab/field visibility rules from module settings.
 * Uses `filterExportColumnsByVisibility` from the shared data-transfer pipeline.
 */
export function filterStudentExportColumnsForViewer(
  columns: StudentExportColumn[],
  settings: StudentsSettings | null | undefined,
  viewerRole: string,
): StudentExportColumn[] {
  if (!isTabKeyedFieldRegistry(settings?.fields)) return columns;
  const ctx = buildSimpleVisibilityContext(
    settings.fields as Record<string, FieldDefinition[]>,
    settings.formTabs ?? [],
    viewerRole,
    STUDENT_EXPORT_ALWAYS_VISIBLE,
    STUDENT_EXPORT_COLUMN_FIELD_ALIASES,
  );
  return filterExportColumnsByVisibility(columns as ExportColumn[], ctx) as StudentExportColumn[];
}

// ---------------------------------------------------------------------------
// Cell extractor
// ---------------------------------------------------------------------------

/**
 * Pure cell extractor for Student entities.
 * Compatible with `ExportCellExtractor<Student>` for multi-format exports.
 */
export function extractStudentCell(student: Student, columnId: string): string | number | null {
  if (columnId === 'name') return student.name || '';
  if (columnId === 'grNumber') return student.grNumber || '';
  if (columnId === 'gender') return student.gender || '';
  if (columnId === 'status') return String(student.status || 'active');
  if (columnId === 'phone') return student.phone || '';
  if (columnId === 'email') return student.email || '';
  if (columnId === 'dob') return student.dob || '';
  if (columnId === 'city') return student.city || '';
  if (columnId === 'studentId') return student.studentId || '';
  if (columnId === 'registeredDate') return student.registeredDate || '';
  if (columnId === 'notes') return student.notes || '';
  if (columnId === 'parents' || columnId === 'fatherName') {
    return primaryResponsibleAdultDisplayName(student);
  }
  if (columnId === 'sessions' || columnId === 'enrolledSessions') {
    const sessions = student.enrolledSessions;
    return Array.isArray(sessions) ? sessions.filter(Boolean).join('; ') : '';
  }
  const cellVal = student[columnId as keyof Student];
  if (cellVal === undefined || cellVal === null) return '';
  if (Array.isArray(cellVal)) return cellVal.map(String).filter(Boolean).join('; ');
  if (typeof cellVal === 'object') return '';
  return String(cellVal);
}

// ---------------------------------------------------------------------------
// Grid builder — delegates to generic utility
// ---------------------------------------------------------------------------

/**
 * Builds a 2D grid [header, ...rows] for the given students and columns.
 * Uses `buildExportGrid` from the shared data-transfer pipeline.
 */
export function buildStudentsExportRows(
  students: Student[],
  columns: StudentExportColumn[],
): unknown[][] {
  return buildExportGrid(students, columns as ExportColumn[], extractStudentCell);
}
