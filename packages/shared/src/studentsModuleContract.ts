import type { Permission } from './permissions.js';

/** Students module contract — aligns with globle1 universal module architecture. */
export const STUDENTS_MODULE_CONTRACT = {
  moduleId: 'students',
  entityType: 'Student',
  collectionKey: 'students',
  settingsObjectKey: 'students_settings',
  columnPreferencesObjectKey: 'student_user_column_preferences',
  restBasePath: '/api/students',
  analyticsCategory: 'students',
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
    directoryViews: ['list', 'cards'] as const,
    bulkActions: ['export', 'delete', 'status'] as const,
  },
  /** Default Work directory page size when using server pagination (globle1 §10). */
  defaultPageSize: 50,
  maxPageSize: 500,
} as const;

export type StudentsModuleTier = (typeof STUDENTS_MODULE_CONTRACT.tiers)[number];
