import type { FieldDefinition } from './contactTypes.js';
import { canViewContactField, canViewContactTab } from './contactFieldAccess.js';
import type { Student } from './studentTypes.js';
import type { StudentsSettings } from './studentsModuleSettings.js';
import { primaryResponsibleAdultDisplayName } from './studentGuardianFromContacts.js';

export interface StudentExportColumn {
  id: string;
  label: string;
}

export { DEFAULT_STUDENT_EXPORT_COLUMNS, studentColumnLabelKey } from './studentDirectoryColumns.js';

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

/** Filters export columns by the same tab/field visibility rules as student validation. */
export function filterStudentExportColumnsForViewer(
  columns: StudentExportColumn[],
  settings: StudentsSettings | null | undefined,
  viewerRole: string,
): StudentExportColumn[] {
  if (!isTabKeyedFieldRegistry(settings?.fields)) return columns;
  const fields = settings.fields;
  const formTabs = settings.formTabs ?? [];

  const tabMap = new Map<string, (typeof formTabs)[number]>();
  for (const tab of formTabs) {
    if (tab.key) tabMap.set(tab.key.toLowerCase(), tab);
  }

  const fieldLocationMap = new Map<string, { tabId: string; field: FieldDefinition }>();
  for (const [tabId, tabFields] of Object.entries(fields)) {
    for (const field of tabFields) {
      if (field.key && !fieldLocationMap.has(field.key)) {
        fieldLocationMap.set(field.key, { tabId, field });
      }
    }
  }

  return columns.filter((column) => {
    if (STUDENT_EXPORT_ALWAYS_VISIBLE.has(column.id)) return true;
    const fieldKey = STUDENT_EXPORT_COLUMN_FIELD_ALIASES[column.id] ?? column.id;
    const found = fieldLocationMap.get(fieldKey);
    if (!found) return true;
    if (found.field.enabled === false) return false;
    const tab = tabMap.get(found.tabId.toLowerCase());
    if (tab && !canViewContactTab(viewerRole, tab)) return false;
    return canViewContactField(viewerRole, found.field);
  });
}

function compileStudentColumnExtractor(columnId: string): (student: Student) => string {
  if (columnId === 'name') return (s) => s.name || '';
  if (columnId === 'grNumber') return (s) => s.grNumber || '';
  if (columnId === 'gender') return (s) => s.gender || '';
  if (columnId === 'status') return (s) => String(s.status || 'active');
  if (columnId === 'phone') return (s) => s.phone || '';
  if (columnId === 'email') return (s) => s.email || '';
  if (columnId === 'dob') return (s) => s.dob || '';
  if (columnId === 'city') return (s) => s.city || '';
  if (columnId === 'studentId') return (s) => s.studentId || '';
  if (columnId === 'registeredDate') return (s) => s.registeredDate || '';
  if (columnId === 'notes') return (s) => s.notes || '';
  if (columnId === 'parents' || columnId === 'fatherName') {
    return (s) => primaryResponsibleAdultDisplayName(s);
  }
  if (columnId === 'sessions' || columnId === 'enrolledSessions') {
    return (s) => {
      const sessions = s.enrolledSessions;
      return Array.isArray(sessions) ? sessions.filter(Boolean).join('; ') : '';
    };
  }
  return (student) => {
    const cellVal = student[columnId as keyof Student];
    if (cellVal === undefined || cellVal === null) return '';
    if (Array.isArray(cellVal)) return cellVal.map(String).filter(Boolean).join('; ');
    if (typeof cellVal === 'object') return '';
    return String(cellVal);
  };
}

/** Builds CSV rows (header + data) for the given students and visible columns. */
export function buildStudentsExportRows(
  students: Student[],
  columns: StudentExportColumn[],
): unknown[][] {
  const header = columns.map((column) => column.label);
  const extractors = columns.map((column) => compileStudentColumnExtractor(column.id));
  const rows = students.map((student) =>
    extractors.map((extract) => extract(student)),
  );
  return [header, ...rows];
}
