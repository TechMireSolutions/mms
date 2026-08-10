import type { FieldDefinition } from './contactTypes.js';
import { canViewContactField, canViewContactTab } from './contactFieldAccess.js';
import type { Student } from './studentTypes.js';
import type { StudentsSettings } from './studentsModuleSettings.js';
import { primaryResponsibleAdultDisplayName } from './studentGuardianFromContacts.js';
import type { AppTranslationKey } from './appTranslations.js';

export interface StudentExportColumn {
  id: string;
  label: string;
}

/** Default CSV export columns (English labels; FE may re-label via `t()`). */
export const DEFAULT_STUDENT_EXPORT_COLUMNS: StudentExportColumn[] = [
  { id: 'name', label: 'Student' },
  { id: 'grNumber', label: 'GR Number' },
  { id: 'gender', label: 'Gender' },
  { id: 'status', label: 'Status' },
  { id: 'parents', label: 'Parent / Guardian' },
];

/** Translation key for a Students column label (`students.columns.${columnKey}` fallback). */
export function studentColumnLabelKey(columnKey: string): AppTranslationKey {
  return `students.columns.${columnKey}` as AppTranslationKey;
}

/** Work/CSV column ids that alias a Setup field key. */
const STUDENT_EXPORT_COLUMN_FIELD_ALIASES: Record<string, string> = {
  parents: 'contactRelationships',
  fatherName: 'contactRelationships',
  sessions: 'enrolledSessions',
};

/** Identity columns always exported regardless of Setup field registry. */
const STUDENT_EXPORT_ALWAYS_VISIBLE = new Set(['name', 'grNumber', 'status', 'studentId']);

function isTabKeyedFieldRegistry(
  fields: StudentsSettings['fields'],
): fields is Record<string, FieldDefinition[]> {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return false;
  const first = Object.values(fields)[0];
  return Array.isArray(first);
}

function findStudentExportField(
  fields: Record<string, FieldDefinition[]>,
  fieldKey: string,
): { tabId: string; field: FieldDefinition } | null {
  for (const [tabId, tabFields] of Object.entries(fields)) {
    const field = tabFields.find((candidate) => candidate.key === fieldKey);
    if (field) return { tabId, field };
  }
  return null;
}

/** Filters export columns by the same tab/field visibility rules as student validation. */
export function filterStudentExportColumnsForViewer(
  columns: StudentExportColumn[],
  settings: StudentsSettings | null | undefined,
  viewerRole: string,
): StudentExportColumn[] {
  if (!isTabKeyedFieldRegistry(settings?.fields)) return columns;
  const fields = settings.fields;
  const formTabs = settings.formTabs ?? [];

  return columns.filter((column) => {
    if (STUDENT_EXPORT_ALWAYS_VISIBLE.has(column.id)) return true;
    const fieldKey = STUDENT_EXPORT_COLUMN_FIELD_ALIASES[column.id] ?? column.id;
    const found = findStudentExportField(fields, fieldKey);
    if (!found) return true;
    if (found.field.enabled === false) return false;
    const tab = formTabs.find((candidate) => candidate.key === found.tabId);
    if (tab && !canViewContactTab(viewerRole, tab)) return false;
    return canViewContactField(viewerRole, found.field);
  });
}

function cellValue(student: Student, columnId: string): string {
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

/** Builds CSV rows (header + data) for the given students and visible columns. */
export function buildStudentsExportRows(
  students: Student[],
  columns: StudentExportColumn[],
): unknown[][] {
  const header = columns.map((column) => column.label);
  const rows = students.map((student) =>
    columns.map(({ id }) => cellValue(student, id)),
  );
  return [header, ...rows];
}
