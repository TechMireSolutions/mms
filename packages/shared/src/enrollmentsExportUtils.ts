/**
 * @file enrollmentsExportUtils.ts
 * @description Enrollments module export utilities.
 *
 * MIGRATION (T10): `buildEnrollmentsExportRows` now delegates to `buildExportGrid`.
 * `filterEnrollmentExportColumnsForViewer` is simple (no tab/field registry),
 * so it retains its own logic but is kept as the single public entry point.
 */
import type { Enrollment } from './enrollmentsModuleManifest.js';
import { buildExportGrid } from './dataTransfer/export/buildExportGrid.js';
import type { ExportColumn } from './dataTransfer/core/exportTypes.js';

// ---------------------------------------------------------------------------
// Column type
// ---------------------------------------------------------------------------

export interface EnrollmentExportColumn {
  id: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENROLLMENT_EXPORT_ALWAYS_VISIBLE = new Set([
  'studentName',
  'sessionName',
  'className',
  'enrolledDate',
  'finalFee',
  'status',
  'paymentStatus',
]);

export const DEFAULT_ENROLLMENT_EXPORT_COLUMNS: readonly EnrollmentExportColumn[] = [
  { id: 'studentName', label: 'Student' },
  { id: 'sessionName', label: 'Session' },
  { id: 'className', label: 'Class' },
  { id: 'enrolledDate', label: 'Date' },
  { id: 'finalFee', label: 'Fee' },
  { id: 'status', label: 'Status' },
  { id: 'paymentStatus', label: 'Payment' },
] as const;

// ---------------------------------------------------------------------------
// Column filter
// ---------------------------------------------------------------------------

/** Enrollments Work CSV uses simple always-visible core columns (no tab registry). */
export function filterEnrollmentExportColumnsForViewer(
  columns: EnrollmentExportColumn[],
): EnrollmentExportColumn[] {
  if (columns.length === 0) {
    return [...DEFAULT_ENROLLMENT_EXPORT_COLUMNS];
  }
  return columns.filter(
    (column) => ENROLLMENT_EXPORT_ALWAYS_VISIBLE.has(column.id) || column.id.startsWith('custom:'),
  );
}

// ---------------------------------------------------------------------------
// Cell extractor
// ---------------------------------------------------------------------------

/** Pure cell extractor for Enrollment entities. Compatible with ExportCellExtractor<Enrollment>. */
export function extractEnrollmentCell(
  enrollment: Enrollment,
  columnId: string,
): string | number | null {
  if (columnId === 'studentName') return enrollment.studentName || '';
  if (columnId === 'sessionName') return enrollment.sessionName || '';
  if (columnId === 'className') return enrollment.className || '';
  if (columnId === 'enrolledDate') return enrollment.enrolledDate || '';
  if (columnId === 'finalFee') return String(enrollment.finalFee ?? '');
  if (columnId === 'status') return String(enrollment.status || '');
  if (columnId === 'paymentStatus') return String(enrollment.paymentStatus || '');
  const propKey = columnId.startsWith('custom:') ? columnId.slice('custom:'.length) : columnId;
  const cellVal = Reflect.get(enrollment, propKey);
  if (cellVal === undefined || cellVal === null) return '';
  if (Array.isArray(cellVal)) return cellVal.map(String).filter(Boolean).join('; ');
  if (typeof cellVal === 'object') return '';
  return String(cellVal);
}

// ---------------------------------------------------------------------------
// Grid builder — delegates to generic utility
// ---------------------------------------------------------------------------

/** Builds a 2D grid [header, ...rows] for the given enrollments and columns. */
export function buildEnrollmentsExportRows(
  enrollments: Enrollment[],
  columns: EnrollmentExportColumn[],
): unknown[][] {
  return buildExportGrid(enrollments, columns as ExportColumn[], extractEnrollmentCell);
}
