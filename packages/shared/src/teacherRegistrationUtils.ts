import type { TeachersSettings } from './settingsTypes.js';
import { DEFAULT_TEACHERS_SETTINGS } from './teachersModuleSettings.js';

export type TeacherEmployeeIdSettings = Pick<TeachersSettings, 'idPrefix'>;

/** Next employee id from active roster count + tenant settings (shared FE/BE). */
export function computeNextTeacherEmployeeIdFromCount(
  count: number,
  settings: TeacherEmployeeIdSettings,
): string {
  const prefix = settings.idPrefix || DEFAULT_TEACHERS_SETTINGS.idPrefix;
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const nextSeq = safeCount + 1;
  return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
}

export type TeacherDuplicateCheckInput = {
  excludeId?: string;
  contactId?: string | number;
  employeeId?: string;
};

export type TeacherDuplicateReason = 'contact' | 'employeeId';

type TeacherRow = {
  id?: string | number;
  contactId?: string | number;
  employeeId?: string;
  deletedAt?: string;
};

/** Client-side duplicate guard before save (server authoritative on POST). */
export function findTeacherRegistrationConflict(
  teachers: TeacherRow[],
  input: TeacherDuplicateCheckInput,
): TeacherDuplicateReason | null {
  const excludeId = input.excludeId ? String(input.excludeId) : undefined;
  const employeeId = input.employeeId?.trim().toLowerCase();

  for (const row of teachers) {
    if (row.deletedAt) continue;
    if (excludeId && String(row.id) === excludeId) continue;

    if (
      input.contactId != null &&
      row.contactId != null &&
      String(input.contactId) === String(row.contactId)
    ) {
      return 'contact';
    }

    if (
      employeeId &&
      row.employeeId &&
      employeeId === String(row.employeeId).trim().toLowerCase()
    ) {
      return 'employeeId';
    }
  }

  return null;
}
