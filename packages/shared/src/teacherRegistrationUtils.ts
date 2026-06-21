import type { TeachersSettings } from './settingsTypes.js';

export type TeacherEmployeeIdSettings = Pick<TeachersSettings, 'idPrefix'>;

type TeacherRow = {
  id?: string | number;
  contactId?: string | number;
  employeeId?: string;
};

/** Next employee id from roster + tenant settings (shared FE/BE). */
export function computeNextTeacherEmployeeId(
  teachers: TeacherRow[],
  settings: TeacherEmployeeIdSettings,
): string {
  const prefix = settings.idPrefix || 'TCH';
  const nextSeq = teachers.length + 1;
  return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
}

export function collectTeacherLinkedContactIds(
  teachers: TeacherRow[],
  excludeTeacherId?: string,
): Array<string | number> {
  const exclude = excludeTeacherId ? String(excludeTeacherId) : undefined;
  return teachers
    .filter((row) => !exclude || String(row.id) !== exclude)
    .map((row) => row.contactId)
    .filter((id): id is string | number => id != null && id !== '');
}
