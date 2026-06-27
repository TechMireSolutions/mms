import type { Permission } from './permissions.js';

/** Teachers module contract — aligns with globle1 universal module architecture. */
export const TEACHERS_MODULE_CONTRACT = {
  moduleId: 'teachers',
  entityType: 'Teacher',
  collectionKey: 'teachers',
  settingsObjectKey: 'teachers_settings',
  columnPreferencesObjectKey: 'teacher_user_column_preferences',
  restBasePath: '/api/teachers',
  analyticsCategory: 'teachers',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'teachers.read',
    write: 'teachers.write',
    delete: 'teachers.write',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'teachers.read',
    reports: 'teachers.read',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['list'] as const,
    bulkActions: ['delete'] as const,
  },
  /** Default Work directory page size when using server pagination (globle1 §10). */
  defaultPageSize: 50,
  maxPageSize: 500,
} as const;

export type TeachersModuleTier = (typeof TEACHERS_MODULE_CONTRACT.tiers)[number];
