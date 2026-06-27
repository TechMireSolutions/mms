import { z } from 'zod';
import type { Permission } from './permissions.js';

export const userStatusSchema = z.enum(['active', 'inactive', 'suspended']);

export const workspaceUserRecordSchema = z.object({
  id: z.string(),
  contactId: z.union([z.string(), z.number()]).optional(),
  name: z.string(),
  email: z.string(),
  loginEmail: z.string().optional(),
  phone: z.string(),
  role: z.string(),
  status: userStatusSchema,
  twoFactorEnabled: z.boolean(),
  lastLogin: z.string(),
  createdDate: z.string(),
  failedLoginAttempts: z.number(),
  activeSessions: z.number(),
  avatarInitials: z.string(),
});

export const workspaceUserListSchema = z.array(workspaceUserRecordSchema);

export const activityActionSchema = z.enum([
  'login',
  'login_failed',
  'create',
  'update',
  'delete',
  'role_change',
]);

export const activityLogRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string().optional(),
  action: activityActionSchema,
  module: z.string(),
  detail: z.string(),
  ts: z.string(),
  ip: z.string(),
});

export const activityLogListSchema = z.array(activityLogRecordSchema);


/** Users module contract — aligns with globle1 universal module architecture. */
export const USERS_MODULE_CONTRACT = {
  moduleId: 'users',
  entityType: 'User',
  collectionKey: 'users',
  settingsObjectKey: 'users_settings',
  columnPreferencesObjectKey: 'users_user_column_preferences',
  restBasePath: '/api/users',
  analyticsCategory: 'users',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'users.manage',
    write: 'users.manage',
    delete: 'users.manage',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'users.manage',
    reports: 'users.manage',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['list'] as const,
    bulkActions: ['delete'] as const,
  },
  defaultPageSize: 50,
  maxPageSize: 500,
} as const;

export type UsersModuleTier = (typeof USERS_MODULE_CONTRACT.tiers)[number];
