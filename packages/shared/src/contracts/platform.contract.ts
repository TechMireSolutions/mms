import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  platformAdminPermissionsSchema,
  platformSetupRegisterBodySchema,
  platformPasswordForgotBodySchema,
  platformPasswordResetBodySchema,
  platformPasswordResendBodySchema,
  platformProfilePatchBodySchema,
  platformChangePasswordBodySchema,
  workspaceEnabledPatchBodySchema,
  platformWorkspaceModulesPatchBodySchema,
  workspaceEmailVerificationPatchBodySchema,
  workspaceDeleteBodySchema,
  platformCreateAdminBodySchema,
  platformUpdateAdminPermissionsBodySchema,
  platformAdminDisabledBodySchema,
  platformDeleteAdminBodySchema,
  platformActivityLogsQuerySchema,
} from '../schemas/platform.dto.js';
import {
  platformSettingsUpdateSchema,
  migrateAndRestartSchema,
} from '../platformSettingsTypes.js';

const c = initContract();

// ---------------------------------------------------------------------------
// Response DTOs (SSOT mirrors of the backend platform route payloads).
// ---------------------------------------------------------------------------

const platformUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(['super_user', 'admin']),
  permissions: platformAdminPermissionsSchema,
});

const platformUserProfileSchema = platformUserSchema.extend({
  createdAt: z.string().optional(),
  emailVerifiedAt: z.string().optional(),
  disabledAt: z.string().nullable().optional(),
});

const platformSetupStatusSchema = z.object({
  needsSetup: z.boolean(),
  smtpConfigured: z.boolean(),
});

const platformSettingsSchema = z.object({
  id: z.string(),
  syncTlsOnCreate: z.boolean(),
  tlsExtraSans: z.string(),
  certbotEmail: z.string(),
  updatedAt: z.string().optional(),
});

const platformWorkspaceRowSchema = z.object({
  subdomain: z.string(),
  madrasaName: z.string(),
  tagline: z.string().optional(),
  logoUrl: z.string().optional(),
  enabled: z.boolean(),
  createdAt: z.string(),
  requireEmailVerification: z.boolean().optional(),
});

const platformActivityLogSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  userEmail: z.string(),
  action: z.string(),
  targetResource: z.string().nullable(),
  targetId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  metadataMessage: z.string().nullable(),
  createdAt: z.string(),
});

const migrateAndRestartAcceptedSchema = z.object({
  success: z.literal(true),
  accepted: z.literal(true),
  message: z.string(),
  delayMs: z.number(),
});

/** Generic platform error body: `{ type, message }`. */
const platformErrorSchema = z.object({
  type: z.string(),
  message: z.string(),
});

export const platformContract = c.router({
  // Auth
  getSetupStatus: {
    method: 'GET',
    path: '/api/platform/auth/setup/status',
    responses: {
      200: platformSetupStatusSchema,
      401: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'Get platform setup status',
  },
  setupRegister: {
    method: 'POST',
    path: '/api/platform/auth/setup/register',
    body: platformSetupRegisterBodySchema,
    responses: {
      200: z.object({ user: platformUserSchema }),
      400: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'Register first super-user',
  },
  passwordForgot: {
    method: 'POST',
    path: '/api/platform/auth/password/forgot',
    body: platformPasswordForgotBodySchema,
    responses: {
      200: z.object({ accepted: z.literal(true), devReset: z.object({ resetId: z.string(), code: z.string() }).optional() }),
      400: platformErrorSchema,
    },
    summary: 'Request platform password reset',
  },
  passwordReset: {
    method: 'POST',
    path: '/api/platform/auth/password/reset',
    body: platformPasswordResetBodySchema,
    responses: {
      200: z.object({ user: platformUserSchema }),
      400: platformErrorSchema,
    },
    summary: 'Complete platform password reset',
  },
  passwordResend: {
    method: 'POST',
    path: '/api/platform/auth/password/resend',
    body: platformPasswordResendBodySchema,
    responses: {
      200: z.object({ accepted: z.literal(true) }),
      400: platformErrorSchema,
    },
    summary: 'Resend platform password reset code',
  },
  // Profile
  getMe: {
    method: 'GET',
    path: '/api/platform/auth/me',
    responses: {
      200: z.object({ user: platformUserProfileSchema.nullable(), isAuthenticated: z.boolean() }),
      401: platformErrorSchema,
    },
    summary: 'Get platform user profile',
  },
  patchMe: {
    method: 'PATCH',
    path: '/api/platform/auth/me',
    body: platformProfilePatchBodySchema,
    responses: {
      200: z.object({ user: platformUserProfileSchema }),
      400: platformErrorSchema,
      401: platformErrorSchema,
    },
    summary: 'Update platform user profile',
  },
  changePassword: {
    method: 'POST',
    path: '/api/platform/auth/change-password',
    body: platformChangePasswordBodySchema,
    responses: {
      200: z.object({ success: z.literal(true) }),
      400: platformErrorSchema,
      401: platformErrorSchema,
    },
    summary: 'Change platform user password',
  },
  // Settings
  getSettings: {
    method: 'GET',
    path: '/api/platform/settings',
    responses: {
      200: z.object({ settings: platformSettingsSchema }),
      401: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'Get global platform settings',
  },
  updateSettings: {
    method: 'PUT',
    path: '/api/platform/settings',
    body: platformSettingsUpdateSchema,
    responses: {
      200: z.object({ settings: platformSettingsSchema, success: z.literal(true) }),
      400: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'Update global platform settings',
  },
  // System admin
  migrateAndRestart: {
    method: 'POST',
    path: '/api/platform/admin/system/migrate-and-restart',
    body: migrateAndRestartSchema,
    responses: {
      202: migrateAndRestartAcceptedSchema,
      400: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'Apply Drizzle migrations and reload backend',
  },
  getActivityLogs: {
    method: 'GET',
    path: '/api/platform/admin/system/activity-logs',
    query: platformActivityLogsQuerySchema,
    responses: {
      200: z.object({ logs: z.array(platformActivityLogSchema) }),
      401: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'Get super-user activity logs',
  },
  // Workspaces
  listWorkspaces: {
    method: 'GET',
    path: '/api/platform/workspaces',
    responses: {
      200: z.object({ workspaces: z.array(platformWorkspaceRowSchema) }),
      401: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'List all workspaces',
  },
  patchWorkspace: {
    method: 'PATCH',
    path: '/api/platform/workspaces/:subdomain',
    pathParams: z.object({ subdomain: z.string() }),
    body: workspaceEnabledPatchBodySchema,
    responses: {
      200: z.object({ workspace: platformWorkspaceRowSchema }),
      400: platformErrorSchema,
      403: platformErrorSchema,
      404: platformErrorSchema,
    },
    summary: 'Enable or disable a workspace',
  },
  deleteWorkspace: {
    method: 'DELETE',
    path: '/api/platform/workspaces/:subdomain',
    pathParams: z.object({ subdomain: z.string() }),
    body: workspaceDeleteBodySchema,
    responses: {
      200: z.object({ deleted: z.literal(true), subdomain: z.string() }),
      400: platformErrorSchema,
      403: platformErrorSchema,
      404: platformErrorSchema,
    },
    summary: 'Delete a workspace',
  },
  getWorkspaceModules: {
    method: 'GET',
    path: '/api/platform/workspaces/:subdomain/modules',
    pathParams: z.object({ subdomain: z.string() }),
    responses: {
      200: z.object({ modules: z.array(z.string()) }),
      403: platformErrorSchema,
      404: platformErrorSchema,
    },
    summary: 'Get enabled modules for workspace',
  },
  updateWorkspaceModules: {
    method: 'PATCH',
    path: '/api/platform/workspaces/:subdomain/modules',
    pathParams: z.object({ subdomain: z.string() }),
    body: platformWorkspaceModulesPatchBodySchema,
    responses: {
      200: z.object({ success: z.literal(true), modules: z.array(z.string()) }),
      400: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'Update enabled modules for workspace',
  },
  patchWorkspaceEmailVerification: {
    method: 'PATCH',
    path: '/api/platform/workspaces/:subdomain/email-verification',
    pathParams: z.object({ subdomain: z.string() }),
    body: workspaceEmailVerificationPatchBodySchema,
    responses: {
      200: z.object({ success: z.literal(true), subdomain: z.string(), requireEmailVerification: z.boolean() }),
      400: platformErrorSchema,
      403: platformErrorSchema,
      404: platformErrorSchema,
    },
    summary: 'Toggle email verification requirement for a workspace',
  },
  // Admins (users)
  listAdmins: {
    method: 'GET',
    path: '/api/platform/users',
    responses: {
      200: z.object({ users: z.array(platformUserProfileSchema) }),
      401: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'List platform admins',
  },
  createAdmin: {
    method: 'POST',
    path: '/api/platform/users',
    body: platformCreateAdminBodySchema,
    responses: {
      200: z.object({ user: platformUserProfileSchema }),
      201: z.object({ user: platformUserProfileSchema }),
      400: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'Create a new platform admin',
  },
  updateAdminPermissions: {
    method: 'PATCH',
    path: '/api/platform/users/:adminId/permissions',
    pathParams: z.object({ adminId: z.string() }),
    body: platformUpdateAdminPermissionsBodySchema,
    responses: {
      200: z.object({ user: platformUserProfileSchema }),
      400: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'Update admin permissions',
  },
  setAdminDisabled: {
    method: 'PATCH',
    path: '/api/platform/users/:adminId/disabled',
    pathParams: z.object({ adminId: z.string() }),
    body: platformAdminDisabledBodySchema,
    responses: {
      200: z.object({ user: platformUserProfileSchema }),
      400: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'Enable or disable a platform admin',
  },
  deleteAdmin: {
    method: 'DELETE',
    path: '/api/platform/users/:adminId',
    pathParams: z.object({ adminId: z.string() }),
    body: platformDeleteAdminBodySchema,
    responses: {
      200: z.object({ deleted: z.literal(true), id: z.string() }),
      400: platformErrorSchema,
      403: platformErrorSchema,
    },
    summary: 'Delete a platform admin',
  },
});
