import type { Permission } from './permissions.js';

/** Enrollments module contract — aligns with globle1 universal module architecture. */
export const ENROLLMENTS_MODULE_CONTRACT = {
  moduleId: 'enrollments',
  entityType: 'Enrollment',
  collectionKey: 'enrollments',
  settingsObjectKey: 'enrollments_settings',
  columnPrefsObjectKey: 'enrollment_user_column_prefs',
  restBasePath: '/api/enrollments',
  analyticsCategory: 'enrollments',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'enrollments.read',
    write: 'enrollments.write',
    delete: 'enrollments.write',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'enrollments.read',
    reports: 'enrollments.read',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['list', 'eligibility'] as const,
    bulkActions: ['cancel'] as const,
  },
  defaultPageSize: 12,
} as const;

export type EnrollmentsModuleTier = (typeof ENROLLMENTS_MODULE_CONTRACT.tiers)[number];
