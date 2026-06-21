import type { Permission } from './permissions.js';

/** Examinations module contract — aligns with globle1 universal module architecture. */
export const EXAMINATIONS_MODULE_CONTRACT = {
  moduleId: 'examinations',
  entityType: 'Exam',
  collectionKey: 'exams',
  resultsCollectionKey: 'exam_results',
  settingsObjectKey: 'examinations_settings',
  examColumnPrefsObjectKey: 'examination_exam_user_column_prefs',
  resultsColumnPrefsObjectKey: 'examination_results_user_column_prefs',
  restBasePath: '/api/examinations',
  analyticsCategory: 'examinations',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'students.read',
    write: 'students.write',
    delete: 'students.write',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'students.read',
    reports: 'students.read',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['exams', 'results'] as const,
    bulkActions: [] as const,
  },
  defaultPageSize: 12,
} as const;

export type ExaminationsModuleTier = (typeof EXAMINATIONS_MODULE_CONTRACT.tiers)[number];
