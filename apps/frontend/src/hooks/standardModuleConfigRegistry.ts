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
import type { AttendanceStatus } from '@/lib/data/attendanceData';

// Seed Collection/Object Keys and Defaults colocated for DRY
const STUDENT_CONFIG_COLLECTION_KEYS = {
  statuses: 'studentStatuses',
  genderFilters: 'studentGenderFilters',
  discountTypes: 'studentDiscountTypes',
} as const;

const STUDENT_CONFIG_OBJECT_KEYS = {
  guardianContactDefaults: 'studentGuardianContactDefaults',
} as const;

export interface StudentGuardianContactDefault {
  filterGender?: string;
  createGender?: string;
  lockGender?: boolean;
}

export type StudentGuardianContactDefaults = Record<string, StudentGuardianContactDefault>;

const TEACHER_CONFIG_COLLECTION_KEYS = {
  statuses: 'teacherStatuses',
  specializations: 'teacherSpecializations',
} as const;

const SESSION_CONFIG_COLLECTION_KEYS = {
  statuses: 'sessionStatuses',
  types: 'sessionTypes',
} as const;

const ATTENDANCE_CONFIG_COLLECTION_KEYS = {
  statuses: 'attendanceStatuses',
} as const;

const DEFAULT_ATTENDANCE_STATUSES: AttendanceStatus[] = [
  { id: 'present', label: 'Present', short: 'P', color: 'emerald', bg: 'bg-success/10', text: 'text-success', border: 'border-success/30', dot: 'bg-success' },
  { id: 'absent',  label: 'Absent',  short: 'A', color: 'red',     bg: 'bg-destructive/10',     text: 'text-destructive',     border: 'border-destructive/30',     dot: 'bg-destructive' },
  { id: 'late',    label: 'Late',    short: 'L', color: 'amber',   bg: 'bg-warning/10',   text: 'text-warning',   border: 'border-warning/30',   dot: 'bg-warning' },
  { id: 'excused', label: 'Excused', short: 'E', color: 'blue',    bg: 'bg-info/10',    text: 'text-info',    border: 'border-info/30',    dot: 'bg-info' },
];
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
    collections: {
      statuses: {
        dbKey: STUDENT_CONFIG_COLLECTION_KEYS.statuses,
        default: () => [],
      },
      genderFilters: {
        dbKey: STUDENT_CONFIG_COLLECTION_KEYS.genderFilters,
        default: () => [],
      },
      discountTypes: {
        dbKey: STUDENT_CONFIG_COLLECTION_KEYS.discountTypes,
        default: () => [],
      },
    },
    objects: {
      guardianContactDefaults: {
        dbKey: STUDENT_CONFIG_OBJECT_KEYS.guardianContactDefaults,
        default: () => ({}),
      },
    },
  },
  teachers: {
    settingsObjectKey: TEACHERS_MODULE_MANIFEST.settingsObjectKey,
    defaultSettings: DEFAULT_TEACHERS_SETTINGS,
    defaultFieldDefs: DEFAULT_TEACHER_FIELD_DEFS,
    collections: {
      statuses: {
        dbKey: TEACHER_CONFIG_COLLECTION_KEYS.statuses,
        default: () => [],
      },
      specializations: {
        dbKey: TEACHER_CONFIG_COLLECTION_KEYS.specializations,
        default: () => [],
      },
    },
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
    discountTypes: Array<{ id: string; label: string; pct: number }>;
    guardianContactDefaults: StudentGuardianContactDefaults;
  };
  teachers: { statuses: string[]; specializations: string[] };
  users: Record<string, never>;
  'question-bank': Record<string, never>;
};
