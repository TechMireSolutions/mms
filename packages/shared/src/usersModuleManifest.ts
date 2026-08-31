import { z } from 'zod';
import type { Permission } from './permissions.js';

export const userStatusSchema = z.enum(['active', 'inactive', 'suspended']);

const userFormContactIdSchema = z.union([
  z.string().trim().min(1, 'users.addErrorContact'),
  z.number(),
]);

/** Shared form contract for editing a workspace user. */
export const editWorkspaceUserSchema = z.object({
  contactId: userFormContactIdSchema,
  role: z.string().min(1, 'users.errorRoleRequired'),
  status: userStatusSchema,
  twoFactorEnabled: z.boolean(),
});

/** Values accepted by the workspace user edit form. */
export type EditWorkspaceUserInput = z.infer<typeof editWorkspaceUserSchema>;

/** Admin-issued temporary password for an existing workspace user. */
export const resetWorkspaceUserPasswordSchema = z
  .object({
    temporaryPassword: z.string().min(1, 'users.resetPasswordRequired'),
  })
  .strict();

export type ResetWorkspaceUserPasswordInput = z.infer<
  typeof resetWorkspaceUserPasswordSchema
>;

/** Shared form contract for inviting a workspace user. */
export const inviteWorkspaceUserSchema = z.object({
  contactId: userFormContactIdSchema,
  role: z.string().min(1, 'users.errorRoleRequired'),
  status: userStatusSchema,
  sendEmail: z.boolean(),
});

/** Values accepted by the workspace user invite form. */
export type InviteWorkspaceUserInput = z.infer<typeof inviteWorkspaceUserSchema>;

export const workspaceUserRecordSchema = z
  .object({
    id: z.string(),
    contactId: z.union([z.string(), z.number()]).optional(),
    name: z.string(),
    email: z.string(),
    loginEmail: z.string().optional(),
    mustChangePassword: z.boolean().optional(),
    temporaryPassword: z.string().optional(),
    phone: z.string().optional().default(''),
    role: z.string(),
    status: userStatusSchema.optional().default('active'),
    twoFactorEnabled: z.boolean().optional().default(false),
    lastLogin: z.string().optional().default(''),
    createdDate: z.string().optional().default(''),
    failedLoginAttempts: z.number().optional().default(0),
    activeSessions: z.number().optional().default(0),
    avatarInitials: z.string().optional().default(''),
    deletedAt: z.string().nullable().optional(),
    deletedBy: z.string().nullable().optional(),
    emailVerifiedAt: z.string().nullable().optional(),
  })
  .passthrough();

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


/** Users module manifest — aligns with globle1 universal module architecture. */
export const USERS_MODULE_MANIFEST = {
  moduleId: 'users',
  entityType: 'User',
  collectionKey: 'users',
  /** Legacy remap / backup key — typed field-config lives on `user_field_configs`. */
  settingsObjectKey: 'users_settings',
  configObjectKey: 'user_field_config',
  preferencesObjectKey: 'user_module_preferences',
  columnPreferencesObjectKey: 'users_user_column_preferences',
  restBasePath: '/api/users',
  analyticsCategory: 'users',
  tiers: ['work', 'reports', 'setup'] as const,
  setupSubTabs: ['permissions', 'preferences'] as const,
  /** Soft-delete via tenant_users.deleted_at; status remains invite/suspend lifecycle. */
  softDelete: {
    workExcludesDeleted: true,
    reportsIncludeDeleted: false,
    exportsIncludeDeleted: false,
    captureDeletionReason: false,
  },
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
    directoryViews: ['table', 'cards'] as const,
    bulkActions: ['whatsapp', 'sms', 'email', 'delete'] as const,
  },
  defaultPageSize: 50,
  maxPageSize: 500,
  defaultExportFilename: 'users.csv',
  exportChunkSize: 100,
} as const;

export type UsersModuleTier = (typeof USERS_MODULE_MANIFEST.tiers)[number];
