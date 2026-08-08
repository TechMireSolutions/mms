import {
  ACCOUNTING_MODULE_MANIFEST,
  DEFAULT_ACCOUNTING_SETTINGS,
  DEFAULT_ACCOUNT_FIELD_DEFS,
  ATTENDANCE_MODULE_MANIFEST,
  DEFAULT_ATTENDANCE_SETTINGS,
  DEFAULT_ATTENDANCE_FIELD_DEFS,
  ENROLLMENTS_MODULE_MANIFEST,
  DEFAULT_ENROLLMENTS_SETTINGS,
  DEFAULT_ENROLLMENTS_FIELD_DEFS,
  EXAMINATIONS_MODULE_MANIFEST,
  DEFAULT_EXAMINATIONS_SETTINGS,
  DEFAULT_EXAMINATIONS_FIELD_DEFS,
  FINANCE_MODULE_MANIFEST,
  DEFAULT_FINANCE_SETTINGS,
  DEFAULT_FINANCE_FIELD_DEFS,
  HASANAT_MODULE_MANIFEST,
  DEFAULT_HASANAT_SETTINGS,
  DEFAULT_HASANAT_FIELD_DEFS,
  SESSIONS_MODULE_MANIFEST,
  DEFAULT_SESSIONS_SETTINGS,
  DEFAULT_SESSIONS_FIELD_DEFS,
  STUDENTS_MODULE_MANIFEST,
  DEFAULT_STUDENTS_SETTINGS,
  DEFAULT_STUDENT_FIELD_DEFS,
  normalizeStudentsSettings,
  TEACHERS_MODULE_MANIFEST,
  DEFAULT_TEACHERS_SETTINGS,
  DEFAULT_TEACHER_FIELD_DEFS,
  USERS_MODULE_MANIFEST,
  DEFAULT_USERS_SETTINGS,
  DEFAULT_USERS_FIELD_DEFS,
  QUESTION_BANK_MODULE_MANIFEST,
  DEFAULT_QUESTION_BANK_SETTINGS,
  DEFAULT_QUESTION_BANK_FIELD_DEFS,
  normalizeQuestionBankSettings,
  type AccountingSettings,
  type AttendanceModuleSettings,
  type EnrollmentsSettings,
  type ExaminationsSettings,
  type FinanceSettings,
  type HasanatSettings,
  type SessionsSettings,
  type StudentsSettings,
  type TeachersSettings,
  type UsersSettings,
  type QuestionBankSettings,
} from '@mms/shared';
import {
  ATTENDANCE_CONFIG_COLLECTION_KEYS,
  DEFAULT_ATTENDANCE_STATUSES,
  SESSION_CONFIG_COLLECTION_KEYS,
} from '@/hooks/standardModuleConfigRegistryKeys';
import type { AttendanceStatus } from '@/lib/data/attendanceData';

export const STANDARD_MODULES_CONFIG_REGISTRY = {
  accounting: {
    settingsObjectKey: ACCOUNTING_MODULE_MANIFEST.settingsObjectKey,
    defaultSettings: DEFAULT_ACCOUNTING_SETTINGS,
    defaultFieldDefs: DEFAULT_ACCOUNT_FIELD_DEFS,
  },
  attendance: {
    settingsObjectKey: ATTENDANCE_MODULE_MANIFEST.settingsObjectKey,
    defaultSettings: DEFAULT_ATTENDANCE_SETTINGS,
    defaultFieldDefs: DEFAULT_ATTENDANCE_FIELD_DEFS,
    collections: {
      statuses: {
        dbKey: ATTENDANCE_CONFIG_COLLECTION_KEYS.statuses,
        default: () => DEFAULT_ATTENDANCE_STATUSES,
      },
    },
  },
  enrollments: {
    settingsObjectKey: ENROLLMENTS_MODULE_MANIFEST.settingsObjectKey,
    defaultSettings: DEFAULT_ENROLLMENTS_SETTINGS,
    defaultFieldDefs: DEFAULT_ENROLLMENTS_FIELD_DEFS,
  },
  examinations: {
    settingsObjectKey: EXAMINATIONS_MODULE_MANIFEST.settingsObjectKey,
    defaultSettings: DEFAULT_EXAMINATIONS_SETTINGS,
    defaultFieldDefs: DEFAULT_EXAMINATIONS_FIELD_DEFS,
  },
  finance: {
    settingsObjectKey: FINANCE_MODULE_MANIFEST.settingsObjectKey,
    defaultSettings: DEFAULT_FINANCE_SETTINGS,
    defaultFieldDefs: DEFAULT_FINANCE_FIELD_DEFS,
  },
  hasanat: {
    settingsObjectKey: HASANAT_MODULE_MANIFEST.settingsObjectKey,
    defaultSettings: DEFAULT_HASANAT_SETTINGS,
    defaultFieldDefs: DEFAULT_HASANAT_FIELD_DEFS,
  },
  sessions: {
    settingsObjectKey: SESSIONS_MODULE_MANIFEST.settingsObjectKey,
    defaultSettings: DEFAULT_SESSIONS_SETTINGS,
    defaultFieldDefs: DEFAULT_SESSIONS_FIELD_DEFS,
    collections: {
      statuses: {
        dbKey: SESSION_CONFIG_COLLECTION_KEYS.statuses,
        default: () => [],
      },
      types: {
        dbKey: SESSION_CONFIG_COLLECTION_KEYS.types,
        default: () => [],
      },
    },
  },
  students: {
    settingsObjectKey: STUDENTS_MODULE_MANIFEST.settingsObjectKey,
    defaultSettings: DEFAULT_STUDENTS_SETTINGS,
    defaultFieldDefs: DEFAULT_STUDENT_FIELD_DEFS,
    normalizeFn: normalizeStudentsSettings,
  },
  teachers: {
    settingsObjectKey: TEACHERS_MODULE_MANIFEST.settingsObjectKey,
    defaultSettings: DEFAULT_TEACHERS_SETTINGS,
    defaultFieldDefs: DEFAULT_TEACHER_FIELD_DEFS,
  },
  users: {
    settingsObjectKey: USERS_MODULE_MANIFEST.settingsObjectKey,
    defaultSettings: DEFAULT_USERS_SETTINGS,
    defaultFieldDefs: DEFAULT_USERS_FIELD_DEFS,
  },
  'question-bank': {
    settingsObjectKey: QUESTION_BANK_MODULE_MANIFEST.settingsObjectKey,
    defaultSettings: DEFAULT_QUESTION_BANK_SETTINGS,
    defaultFieldDefs: DEFAULT_QUESTION_BANK_FIELD_DEFS,
    normalizeFn: normalizeQuestionBankSettings,
  },
} as const;

export type StandardModuleId = keyof typeof STANDARD_MODULES_CONFIG_REGISTRY;

export type StandardModuleSettingsMap = {
  accounting: AccountingSettings;
  attendance: AttendanceModuleSettings;
  enrollments: EnrollmentsSettings;
  examinations: ExaminationsSettings;
  finance: FinanceSettings;
  hasanat: HasanatSettings;
  sessions: SessionsSettings;
  students: StudentsSettings;
  teachers: TeachersSettings;
  users: UsersSettings;
  'question-bank': QuestionBankSettings;
};

export type StandardModuleConfigExtraMap = {
  accounting: Record<string, never>;
  attendance: { statuses: AttendanceStatus[] };
  enrollments: Record<string, never>;
  examinations: Record<string, never>;
  finance: Record<string, never>;
  hasanat: Record<string, never>;
  sessions: { statuses: string[]; types: string[] };
  students: {
    statuses: string[];
    genderFilters: string[];
    discountTypes: string[];
  };
  teachers: { statuses: string[]; specializations: string[] };
  users: Record<string, never>;
  'question-bank': Record<string, never>;
};
