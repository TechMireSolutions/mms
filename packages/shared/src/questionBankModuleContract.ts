import type { Permission } from './permissions.js';

/** Question Bank module contract — aligns with globle1 universal module architecture. */
export const QUESTION_BANK_MODULE_CONTRACT = {
  moduleId: 'questionBank',
  entityType: 'QuestionBankQuestion',
  collectionKey: 'questions',
  testsCollectionKey: 'tests',
  resultsCollectionKey: 'assessment_results',
  settingsObjectKey: 'question_bank_settings',
  columnPrefsObjectKey: 'question_bank_user_column_prefs',
  restBasePath: '/api/question-bank',
  analyticsCategory: 'questionBank',
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
    directoryViews: ['questions', 'generate'] as const,
    bulkActions: [] as const,
  },
  defaultPageSize: 15,
} as const;

export type QuestionBankModuleTier = (typeof QUESTION_BANK_MODULE_CONTRACT.tiers)[number];
