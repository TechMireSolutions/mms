import { getDefaultCollectionsForSeed, getDefaultObjects } from '../db/seeds.js';
import {
  DEFAULT_STUDENTS_SETTINGS,
  DEFAULT_TEACHERS_SETTINGS,
  DEFAULT_SESSIONS_SETTINGS,
  DEFAULT_ATTENDANCE_SETTINGS,
  DEFAULT_QUESTION_BANK_SETTINGS,
  DEFAULT_QUESTION_BANK_QUESTIONS,
  DEFAULT_QUESTION_BANK_TESTS,
  DEFAULT_QUESTION_BANK_RESULTS,
  WORKSPACES_COLLECTION,
} from '@mms/shared';

const MINIMAL_SEEDED_COLLECTIONS = new Set([
  'currencies',
  'genders',
  'studentStatuses',
  'studentGenderFilters',
  'studentDiscountTypes',
  'socialPlatforms',
  'relationships',
  'lifecycleStages',
  'whatsappTemplates',
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
  minimal['questions'] = DEFAULT_QUESTION_BANK_QUESTIONS;
  minimal['tests'] = DEFAULT_QUESTION_BANK_TESTS;
  minimal['assessment_results'] = DEFAULT_QUESTION_BANK_RESULTS;
  minimal['overdue_obligations'] = [
    { id: 1, name: "Ahmad Raza",       obligationType: "Khums",   dueDate: "2026-04-01", amount: 12000, currency: "PKR", daysOverdue: 48 },
    { id: 2, name: "Fatima Noor",      obligationType: "Zakat",   dueDate: "2026-04-10", amount: 8500,  currency: "PKR", daysOverdue: 39 },
    { id: 3, name: "Hassan Ali",       obligationType: "Khums",   dueDate: "2026-04-15", amount: 30000, currency: "PKR", daysOverdue: 34 },
    { id: 4, name: "Zainab Hussain",   obligationType: "Fidya",   dueDate: "2026-04-22", amount: 3200,  currency: "PKR", daysOverdue: 27 },
    { id: 5, name: "Ibrahim Khalid",   obligationType: "Kaffarah",dueDate: "2026-04-28", amount: 15000, currency: "PKR", daysOverdue: 21 },
    { id: 6, name: "Maryam Tahir",     obligationType: "Zakat",   dueDate: "2026-05-01", amount: 6000,  currency: "PKR", daysOverdue: 18 },
    { id: 7, name: "Ali Mustafa",      obligationType: "Khums",   dueDate: "2026-05-05", amount: 22500, currency: "PKR", daysOverdue: 14 },
    { id: 8, name: "Sara Jaffery",     obligationType: "Fidya",   dueDate: "2026-05-10", amount: 1800,  currency: "PKR", daysOverdue: 9  },
  ];
  return minimal;
}

export function getMinimalObjects(): Record<string, unknown> {
  const objects = getDefaultObjects();
  return {
    ...objects,
    teachers_settings: objects.teachers_settings ?? DEFAULT_TEACHERS_SETTINGS,
    students_settings: objects.students_settings ?? DEFAULT_STUDENTS_SETTINGS,
    sessions_settings: objects.sessions_settings ?? DEFAULT_SESSIONS_SETTINGS,
    attendance_settings: objects.attendance_settings ?? DEFAULT_ATTENDANCE_SETTINGS,
    question_bank_settings: objects.question_bank_settings ?? DEFAULT_QUESTION_BANK_SETTINGS,
  };
}
