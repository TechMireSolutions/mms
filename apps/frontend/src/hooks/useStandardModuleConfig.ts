import { useMemo, useState, useEffect, useRef } from 'react';
import {
  ACCOUNTING_MODULE_CONTRACT,
  DEFAULT_ACCOUNTING_SETTINGS,
  DEFAULT_ACCOUNT_FIELD_DEFS,
  ATTENDANCE_MODULE_CONTRACT,
  DEFAULT_ATTENDANCE_SETTINGS,
  DEFAULT_ATTENDANCE_FIELD_DEFS,
  ENROLLMENTS_MODULE_CONTRACT,
  DEFAULT_ENROLLMENTS_SETTINGS,
  DEFAULT_ENROLLMENTS_FIELD_DEFS,
  EXAMINATIONS_MODULE_CONTRACT,
  DEFAULT_EXAMINATIONS_SETTINGS,
  DEFAULT_EXAMINATIONS_FIELD_DEFS,
  FINANCE_MODULE_CONTRACT,
  DEFAULT_FINANCE_SETTINGS,
  DEFAULT_FINANCE_FIELD_DEFS,
  HASANAT_MODULE_CONTRACT,
  DEFAULT_HASANAT_SETTINGS,
  DEFAULT_HASANAT_FIELD_DEFS,
  SESSIONS_MODULE_CONTRACT,
  DEFAULT_SESSIONS_SETTINGS,
  DEFAULT_SESSIONS_FIELD_DEFS,
  STUDENTS_MODULE_CONTRACT,
  DEFAULT_STUDENTS_SETTINGS,
  DEFAULT_STUDENT_FIELD_DEFS,
  normalizeStudentsSettings,
  TEACHERS_MODULE_CONTRACT,
  DEFAULT_TEACHERS_SETTINGS,
  DEFAULT_TEACHER_FIELD_DEFS,
  USERS_MODULE_CONTRACT,
  DEFAULT_USERS_SETTINGS,
  DEFAULT_USERS_FIELD_DEFS,
  QUESTION_BANK_MODULE_CONTRACT,
  DEFAULT_QUESTION_BANK_SETTINGS,
  DEFAULT_QUESTION_BANK_FIELD_DEFS,
  normalizeQuestionBankSettings,
  type ModuleFieldDef,
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
import { useModuleConfig } from './useModuleConfig';
import { getCollection, getObject, hasCollectionInCache, saveCollectionCacheOnly } from '@/lib/db';
import { apiFetch } from '@/lib/apiClient';

import {
  STUDENT_CONFIG_COLLECTION_KEYS,
  STUDENT_CONFIG_OBJECT_KEYS,
  getDefaultStudentGuardianContactDefaults,
  getStudentConfigCollectionDefaults,
  type StudentGuardianContactDefaults,
} from '@/lib/studentConfig/studentConfigSeeds';
import {
  TEACHER_CONFIG_COLLECTION_KEYS,
  getTeacherConfigCollectionDefaults,
} from '@/lib/teacherConfig/teacherConfigSeeds';
import {
  SESSION_CONFIG_COLLECTION_KEYS,
  getSessionConfigCollectionDefaults,
} from '@/lib/sessionConfig/sessionConfigSeeds';
import {
  ATTENDANCE_CONFIG_COLLECTION_KEYS,
  getAttendanceConfigCollectionDefaults,
} from '@/lib/attendanceConfig/attendanceConfigSeeds';
import type { AttendanceStatus } from '@/lib/data/attendanceData';

// Helper hook to fetch multiple collections and objects in a single React state & effect.
// Avoids dynamic loop hook calls, completely adhering to the rules of hooks.
export function useLiveCollectionsAndObjects(
  collections?: Record<string, { dbKey: string; default: () => any[] }>,
  objects?: Record<string, { dbKey: string; default: () => any }>,
) {
  const collectionsRef = useRef(collections);
  collectionsRef.current = collections;
  const objectsRef = useRef(objects);
  objectsRef.current = objects;

  const [state, setState] = useState(() => {
    const initialCollections: Record<string, any[]> = {};
    const initialObjects: Record<string, any> = {};

    if (collections) {
      for (const [key, conf] of Object.entries(collections)) {
        initialCollections[key] = getCollection(conf.dbKey, conf.default());
      }
    }
    if (objects) {
      for (const [key, conf] of Object.entries(objects)) {
        initialObjects[key] = getObject(conf.dbKey, conf.default());
      }
    }

    return { collections: initialCollections, objects: initialObjects };
  });

  useEffect(() => {
    if (!collectionsRef.current && !objectsRef.current) return;

    const handleUpdate = (): void => {
      setState(() => {
        const nextCollections: Record<string, any[]> = {};
        const nextObjects: Record<string, any> = {};

        if (collectionsRef.current) {
          for (const [key, conf] of Object.entries(collectionsRef.current)) {
            nextCollections[key] = getCollection(conf.dbKey, conf.default());
          }
        }
        if (objectsRef.current) {
          for (const [key, conf] of Object.entries(objectsRef.current)) {
            nextObjects[key] = getObject(conf.dbKey, conf.default());
          }
        }

        return { collections: nextCollections, objects: nextObjects };
      });
    };

    handleUpdate();

    const isAuth = typeof window !== 'undefined' && localStorage.getItem('mms_user') !== null;
    if (isAuth && collectionsRef.current) {
      for (const conf of Object.values(collectionsRef.current)) {
        if (!hasCollectionInCache(conf.dbKey)) {
          apiFetch(`/api/db/collections/${conf.dbKey}`)
            .then(async (res) => {
              if (res.ok) {
                const fetched = (await res.json()) as any[];
                saveCollectionCacheOnly(conf.dbKey, fetched);
              }
            })
            .catch((error) => {
              console.error(`Error fetching collection "${conf.dbKey}" on-demand:`, error);
            });
        }
      }
    }

    window.addEventListener('local-database-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('local-database-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return state;
}

export const STANDARD_MODULES_CONFIG_REGISTRY = {
  accounting: {
    settingsObjectKey: ACCOUNTING_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_ACCOUNTING_SETTINGS,
    defaultFieldDefs: DEFAULT_ACCOUNT_FIELD_DEFS,
  },
  attendance: {
    settingsObjectKey: ATTENDANCE_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_ATTENDANCE_SETTINGS,
    defaultFieldDefs: DEFAULT_ATTENDANCE_FIELD_DEFS,
    collections: {
      statuses: {
        dbKey: ATTENDANCE_CONFIG_COLLECTION_KEYS.statuses,
        default: () => getAttendanceConfigCollectionDefaults().statuses,
      },
    },
  },
  enrollments: {
    settingsObjectKey: ENROLLMENTS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_ENROLLMENTS_SETTINGS,
    defaultFieldDefs: DEFAULT_ENROLLMENTS_FIELD_DEFS,
  },
  examinations: {
    settingsObjectKey: EXAMINATIONS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_EXAMINATIONS_SETTINGS,
    defaultFieldDefs: DEFAULT_EXAMINATIONS_FIELD_DEFS,
  },
  finance: {
    settingsObjectKey: FINANCE_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_FINANCE_SETTINGS,
    defaultFieldDefs: DEFAULT_FINANCE_FIELD_DEFS,
  },
  hasanat: {
    settingsObjectKey: HASANAT_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_HASANAT_SETTINGS,
    defaultFieldDefs: DEFAULT_HASANAT_FIELD_DEFS,
  },
  sessions: {
    settingsObjectKey: SESSIONS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_SESSIONS_SETTINGS,
    defaultFieldDefs: DEFAULT_SESSIONS_FIELD_DEFS,
    collections: {
      statuses: {
        dbKey: SESSION_CONFIG_COLLECTION_KEYS.statuses,
        default: () => getSessionConfigCollectionDefaults().statuses,
      },
      types: {
        dbKey: SESSION_CONFIG_COLLECTION_KEYS.types,
        default: () => getSessionConfigCollectionDefaults().types,
      },
    },
  },
  students: {
    settingsObjectKey: STUDENTS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_STUDENTS_SETTINGS,
    defaultFieldDefs: DEFAULT_STUDENT_FIELD_DEFS,
    normalizeFn: normalizeStudentsSettings,
    collections: {
      statuses: {
        dbKey: STUDENT_CONFIG_COLLECTION_KEYS.statuses,
        default: () => getStudentConfigCollectionDefaults().statuses,
      },
      genderFilters: {
        dbKey: STUDENT_CONFIG_COLLECTION_KEYS.genderFilters,
        default: () => getStudentConfigCollectionDefaults().genderFilters,
      },
      discountTypes: {
        dbKey: STUDENT_CONFIG_COLLECTION_KEYS.discountTypes,
        default: () => getStudentConfigCollectionDefaults().discountTypes,
      },
    },
    objects: {
      guardianContactDefaults: {
        dbKey: STUDENT_CONFIG_OBJECT_KEYS.guardianContactDefaults,
        default: () => getDefaultStudentGuardianContactDefaults(),
      },
    },
  },
  teachers: {
    settingsObjectKey: TEACHERS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_TEACHERS_SETTINGS,
    defaultFieldDefs: DEFAULT_TEACHER_FIELD_DEFS,
    collections: {
      statuses: {
        dbKey: TEACHER_CONFIG_COLLECTION_KEYS.statuses,
        default: () => getTeacherConfigCollectionDefaults().statuses,
      },
      specializations: {
        dbKey: TEACHER_CONFIG_COLLECTION_KEYS.specializations,
        default: () => getTeacherConfigCollectionDefaults().specializations,
      },
    },
  },
  users: {
    settingsObjectKey: USERS_MODULE_CONTRACT.settingsObjectKey,
    defaultSettings: DEFAULT_USERS_SETTINGS,
    defaultFieldDefs: DEFAULT_USERS_FIELD_DEFS,
  },
  'question-bank': {
    settingsObjectKey: QUESTION_BANK_MODULE_CONTRACT.settingsObjectKey,
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

export function useStandardModuleConfig<M extends StandardModuleId>(
  moduleId: M,
): ReturnType<typeof useModuleConfig<StandardModuleSettingsMap[M]>> &
  StandardModuleConfigExtraMap[M] {
  const config = STANDARD_MODULES_CONFIG_REGISTRY[moduleId] as any;

  const defaultFieldDefs = useMemo(() => {
    if (moduleId === 'teachers') {
      return (config.defaultFieldDefs as ModuleFieldDef[]).map((field) => ({
        ...field,
        label: field.label || (field as any).labelKey || field.id,
      }));
    }
    return config.defaultFieldDefs as ModuleFieldDef[];
  }, [moduleId, config.defaultFieldDefs]);

  const moduleConfigResult = useModuleConfig<StandardModuleSettingsMap[M]>({
    settingsObjectKey: config.settingsObjectKey,
    defaultSettings: config.defaultSettings as any,
    defaultFieldDefs,
    normalizeFn: 'normalizeFn' in config ? (config.normalizeFn as any) : undefined,
  });

  const aux = useLiveCollectionsAndObjects(config.collections, config.objects);

  return {
    ...moduleConfigResult,
    ...aux.collections,
    ...aux.objects,
  } as any;
}
