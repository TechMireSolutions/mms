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
