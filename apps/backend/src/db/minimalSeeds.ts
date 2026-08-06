import { getDefaultCollectionsForSeed, getDefaultObjects } from '../db/seeds.js';
import {
  DEFAULT_TEACHERS_SETTINGS,
  DEFAULT_SESSIONS_SETTINGS,
  DEFAULT_ATTENDANCE_SETTINGS,
  DEFAULT_QUESTION_BANK_SETTINGS,
  WORKSPACES_COLLECTION,
  sanitizeContactSeedObjects,
} from '@mms/shared';

const MINIMAL_SEEDED_COLLECTIONS = new Set([
  'currencies',
  'genders',
  'socialPlatforms',
  'phoneLabels',
  'emailLabels',
  'addressLabels',
  'countryCodes',
  'teacherStatuses',
  'teacherSpecializations',
  'sessionStatuses',
  'sessionTypes',
  'attendanceStatuses',
]);

/** Empty collections plus default settings objects — no demo roster on new madrasa onboard. */
export async function getMinimalCollectionsForSeed(): Promise<Record<string, unknown[]>> {
  const full = await getDefaultCollectionsForSeed();
  const minimal: Record<string, unknown[]> = {};
  for (const name of Object.keys(full)) {
    if (name === WORKSPACES_COLLECTION) continue;
    if (MINIMAL_SEEDED_COLLECTIONS.has(name)) {
      minimal[name] = full[name];
    } else {
      minimal[name] = [];
    }
  }
  minimal['relationships'] = [];
  minimal['questions'] = [];
  minimal['tests'] = [];
  minimal['assessment_results'] = [];
  minimal['backups'] = [];
  return minimal;
}

export function getMinimalObjects(): Record<string, unknown> {
  const objects = sanitizeContactSeedObjects(getDefaultObjects());
  const next = { ...objects };
  delete next.students_settings;
  delete next.student_user_column_preferences;
  return {
    ...next,
    teachers_settings: objects.teachers_settings ?? DEFAULT_TEACHERS_SETTINGS,
    sessions_settings: objects.sessions_settings ?? DEFAULT_SESSIONS_SETTINGS,
    attendance_settings: objects.attendance_settings ?? DEFAULT_ATTENDANCE_SETTINGS,
    question_bank_settings: objects.question_bank_settings ?? DEFAULT_QUESTION_BANK_SETTINGS,
  };
}
