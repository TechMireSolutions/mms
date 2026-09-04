import type { Enrollment } from './enrollmentsModuleManifest.js';

export interface EnrollmentExportColumn {
  id: string;
  label: string;
}

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

/** Enrollments Work CSV uses simple always-visible core columns. */
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

function compileEnrollmentColumnExtractor(columnId: string): (enrollment: Enrollment) => string {
  if (columnId === 'studentName') return (e) => e.studentName || '';
  if (columnId === 'sessionName') return (e) => e.sessionName || '';
  if (columnId === 'className') return (e) => e.className || '';
  if (columnId === 'enrolledDate') return (e) => e.enrolledDate || '';
  if (columnId === 'finalFee') return (e) => String(e.finalFee ?? '');
  if (columnId === 'status') return (e) => String(e.status || '');
  if (columnId === 'paymentStatus') return (e) => String(e.paymentStatus || '');
  const propKey = columnId.startsWith('custom:') ? columnId.slice('custom:'.length) : columnId;
  return (enrollment) => {
    const cellVal = (enrollment as unknown as Record<string, unknown>)[propKey];
    if (cellVal === undefined || cellVal === null) return '';
    if (Array.isArray(cellVal)) return cellVal.map(String).filter(Boolean).join('; ');
    if (typeof cellVal === 'object') return '';
    return String(cellVal);
  };
}

/** Builds CSV rows (header + data) for the given enrollments and visible columns. */
export function buildEnrollmentsExportRows(
  enrollments: Enrollment[],
  columns: EnrollmentExportColumn[],
): unknown[][] {
  const header = columns.map((column) => column.label);
  const extractors = columns.map((column) => compileEnrollmentColumnExtractor(column.id));
  const rows = enrollments.map((enrollment) =>
    extractors.map((extract) => extract(enrollment)),
  );
  return [header, ...rows];
}
