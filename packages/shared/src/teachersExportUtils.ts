import type { Teacher } from './teacherTypes.js';

export interface TeacherExportColumn {
  id: string;
  label: string;
}

const TEACHER_EXPORT_ALWAYS_VISIBLE = new Set([
  'name',
  'employeeId',
  'specialization',
  'status',
  'qualification',
  'joinDate',
]);

/** Teachers Work CSV uses simple always-visible core columns. */
export function filterTeacherExportColumnsForViewer(
  columns: TeacherExportColumn[],
): TeacherExportColumn[] {
  if (columns.length === 0) {
    return [
      { id: 'name', label: 'Name' },
      { id: 'employeeId', label: 'Employee ID' },
      { id: 'specialization', label: 'Specialization' },
      { id: 'status', label: 'Status' },
      { id: 'qualification', label: 'Qualification' },
      { id: 'joinDate', label: 'Join date' },
    ];
  }
  return columns.filter((column) => TEACHER_EXPORT_ALWAYS_VISIBLE.has(column.id) || column.id.startsWith('custom:'));
}

function cellValue(teacher: Teacher, columnId: string): string {
  if (columnId === 'name') return teacher.name || '';
  if (columnId === 'employeeId') return teacher.employeeId || '';
  if (columnId === 'specialization') return teacher.specialization || '';
  if (columnId === 'status') return String(teacher.status || 'active');
  if (columnId === 'qualification') return teacher.qualification || '';
  if (columnId === 'joinDate') return teacher.joinDate || '';
  if (columnId.startsWith('custom:')) {
    const customKey = columnId.slice('custom:'.length);
    const cellVal = teacher[customKey as keyof Teacher];
    if (cellVal === undefined || cellVal === null) return '';
    if (Array.isArray(cellVal)) return cellVal.map(String).filter(Boolean).join('; ');
    if (typeof cellVal === 'object') return '';
    return String(cellVal);
  }
  const cellVal = teacher[columnId as keyof Teacher];
  if (cellVal === undefined || cellVal === null) return '';
  if (Array.isArray(cellVal)) return cellVal.map(String).filter(Boolean).join('; ');
  if (typeof cellVal === 'object') return '';
  return String(cellVal);
}

/** Builds CSV rows (header + data) for the given teachers and visible columns. */
export function buildTeachersExportRows(
  teachers: Teacher[],
  columns: TeacherExportColumn[],
): unknown[][] {
  const header = columns.map((column) => column.label);
  const rows = teachers.map((teacher) =>
    columns.map(({ id }) => cellValue(teacher, id)),
  );
  return [header, ...rows];
}
