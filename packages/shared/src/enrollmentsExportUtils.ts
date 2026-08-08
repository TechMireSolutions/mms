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

/** Enrollments Work CSV uses simple always-visible core columns. */
export function filterEnrollmentExportColumnsForViewer(
  columns: EnrollmentExportColumn[],
): EnrollmentExportColumn[] {
  if (columns.length === 0) {
    return [
      { id: 'studentName', label: 'Student' },
      { id: 'sessionName', label: 'Session' },
      { id: 'className', label: 'Class' },
      { id: 'enrolledDate', label: 'Date' },
      { id: 'finalFee', label: 'Fee' },
      { id: 'status', label: 'Status' },
      { id: 'paymentStatus', label: 'Payment' },
    ];
  }
  return columns.filter(
    (column) => ENROLLMENT_EXPORT_ALWAYS_VISIBLE.has(column.id) || column.id.startsWith('custom:'),
  );
}

function cellValue(enrollment: Enrollment, columnId: string): string {
  if (columnId === 'studentName') return enrollment.studentName || '';
  if (columnId === 'sessionName') return enrollment.sessionName || '';
  if (columnId === 'className') return enrollment.className || '';
  if (columnId === 'enrolledDate') return enrollment.enrolledDate || '';
  if (columnId === 'finalFee') return String(enrollment.finalFee ?? '');
  if (columnId === 'status') return String(enrollment.status || '');
  if (columnId === 'paymentStatus') return String(enrollment.paymentStatus || '');
  if (columnId.startsWith('custom:')) {
    const customKey = columnId.slice('custom:'.length);
    const cellVal = (enrollment as unknown as Record<string, unknown>)[customKey];
    if (cellVal === undefined || cellVal === null) return '';
    if (Array.isArray(cellVal)) return cellVal.map(String).filter(Boolean).join('; ');
    if (typeof cellVal === 'object') return '';
    return String(cellVal);
  }
  const cellVal = (enrollment as unknown as Record<string, unknown>)[columnId];
  if (cellVal === undefined || cellVal === null) return '';
  if (Array.isArray(cellVal)) return cellVal.map(String).filter(Boolean).join('; ');
  if (typeof cellVal === 'object') return '';
  return String(cellVal);
}

/** Builds CSV rows (header + data) for the given enrollments and visible columns. */
export function buildEnrollmentsExportRows(
  enrollments: Enrollment[],
  columns: EnrollmentExportColumn[],
): unknown[][] {
  const header = columns.map((column) => column.label);
  const rows = enrollments.map((enrollment) =>
    columns.map(({ id }) => cellValue(enrollment, id)),
  );
  return [header, ...rows];
}
