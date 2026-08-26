import { z } from 'zod';
import { DEFAULT_PLATFORM_ADMIN_PERMISSIONS } from '../platformTypes.js';
import {
  validatePlatformSetupEmail,
  validatePlatformSetupName,
  validatePlatformSetupPassword,
} from '../platformSetupValidation.js';
import { deepSanitizeStrings } from './sanitize.js';

export const platformAdminPermissionsSchema = z.object({
  workspaces: z.boolean(),
  onboard: z.boolean(),
  settings: z.boolean(),
  admins: z.boolean(),
  system: z.boolean(),
}).strict();

export type PlatformAdminPermissionsInput = z.infer<typeof platformAdminPermissionsSchema>;

const platformSetupRegisterBodyBaseSchema = z.object({
  name: z.string().refine((val: string) => !validatePlatformSetupName(val), {
    message: 'Invalid display name',
  }),
  email: z.string().refine((val: string) => !validatePlatformSetupEmail(val), {
    message: 'Invalid email address',
  }),
  password: z.string().refine(
    (val: string) => !validatePlatformSetupPassword(val),
    {
      message: 'Password must be at least 10 characters long and contain both letters and numbers',
    },
  ),
}).strict();

export const platformSetupRegisterBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformSetupRegisterBodyBaseSchema);

export type PlatformSetupRegisterInput = z.infer<typeof platformSetupRegisterBodyBaseSchema>;

const platformSetupVerifyBodyBaseSchema = z.object({
  setupId: z.string().min(8),
  code: z.string().min(4).max(12),
}).strict();

export const platformSetupVerifyBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformSetupVerifyBodyBaseSchema);

export type PlatformSetupVerifyInput = z.infer<typeof platformSetupVerifyBodyBaseSchema>;

const platformSetupResendBodyBaseSchema = z.object({
  setupId: z.string().min(8),
}).strict();

export const platformSetupResendBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformSetupResendBodyBaseSchema);

export type PlatformSetupResendInput = z.infer<typeof platformSetupResendBodyBaseSchema>;

const platformPasswordForgotBodyBaseSchema = z.object({
  email: z.string().min(3),
}).strict();

export const platformPasswordForgotBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformPasswordForgotBodyBaseSchema);

export type PlatformPasswordForgotInput = z.infer<typeof platformPasswordForgotBodyBaseSchema>;

const platformPasswordResetBodyBaseSchema = z.object({
  resetId: z.string().min(8),
  code: z.string().min(4).max(12),
  password: z.string().refine(
    (val: string) => !validatePlatformSetupPassword(val),
    {
      message: 'Password must be at least 10 characters long and contain both letters and numbers',
    },
  ),
}).strict();

export const platformPasswordResetBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformPasswordResetBodyBaseSchema);

export type PlatformPasswordResetInput = z.infer<typeof platformPasswordResetBodyBaseSchema>;

const platformPasswordResendBodyBaseSchema = z.object({
  resetId: z.string().min(8),
}).strict();

export const platformPasswordResendBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformPasswordResendBodyBaseSchema);

export type PlatformPasswordResendInput = z.infer<typeof platformPasswordResendBodyBaseSchema>;

const platformProfilePatchBodyBaseSchema = z.object({
  name: z.string().refine((val: string) => !validatePlatformSetupName(val), {
    message: 'Invalid display name',
  }),
}).strict();

export const platformProfilePatchBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformProfilePatchBodyBaseSchema);

export type PlatformProfilePatchInput = z.infer<typeof platformProfilePatchBodyBaseSchema>;

const platformChangePasswordBodyBaseSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().refine(
    (val: string) => !validatePlatformSetupPassword(val),
    {
      message: 'Password must be at least 10 characters long and contain both letters and numbers',
    },
  ),
}).strict();

export const platformChangePasswordBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformChangePasswordBodyBaseSchema);

export type PlatformChangePasswordInput = z.infer<typeof platformChangePasswordBodyBaseSchema>;

const workspaceEnabledPatchBodyBaseSchema = z.object({
  enabled: z.boolean(),
}).strict();

export const workspaceEnabledPatchBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, workspaceEnabledPatchBodyBaseSchema);

export type WorkspaceEnabledPatchInput = z.infer<typeof workspaceEnabledPatchBodyBaseSchema>;

const platformWorkspaceModulesPatchBodyBaseSchema = z.object({
  modules: z.array(z.string()),
}).strict();

export const platformWorkspaceModulesPatchBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformWorkspaceModulesPatchBodyBaseSchema);

export type PlatformWorkspaceModulesPatchInput = z.infer<typeof platformWorkspaceModulesPatchBodyBaseSchema>;

const workspaceDeleteBodyBaseSchema = z.object({
  password: z.string().min(1),
  confirmSubdomain: z.string().min(1),
}).strict();

export const workspaceDeleteBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, workspaceDeleteBodyBaseSchema);

export type WorkspaceDeleteInput = z.infer<typeof workspaceDeleteBodyBaseSchema>;

const platformCreateAdminBodyBaseSchema = z.object({
  name: z.string().refine((val: string) => !validatePlatformSetupName(val), {
    message: 'Invalid display name',
  }),
  email: z.string().refine((val: string) => !validatePlatformSetupEmail(val), {
    message: 'Invalid email address',
  }),
  password: z.string().refine(
    (val: string) => !validatePlatformSetupPassword(val),
    {
      message: 'Password must be at least 10 characters long and contain both letters and numbers',
    },
  ),
  permissions: platformAdminPermissionsSchema.default(DEFAULT_PLATFORM_ADMIN_PERMISSIONS),
}).strict();

export const platformCreateAdminBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformCreateAdminBodyBaseSchema);

export type PlatformCreateAdminInput = z.infer<typeof platformCreateAdminBodyBaseSchema>;

const platformUpdateAdminPermissionsBodyBaseSchema = z.object({
  permissions: platformAdminPermissionsSchema,
}).strict();

export const platformUpdateAdminPermissionsBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformUpdateAdminPermissionsBodyBaseSchema);

export type PlatformUpdateAdminPermissionsInput = z.infer<
  typeof platformUpdateAdminPermissionsBodyBaseSchema
>;

const platformAdminDisabledBodyBaseSchema = z.object({
  disabled: z.boolean(),
  password: z.string().min(1),
}).strict();

export const platformAdminDisabledBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformAdminDisabledBodyBaseSchema);

export type PlatformAdminDisabledInput = z.infer<typeof platformAdminDisabledBodyBaseSchema>;

const platformDeleteAdminBodyBaseSchema = z.object({
  password: z.string().min(1),
}).strict();

export const platformDeleteAdminBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, platformDeleteAdminBodyBaseSchema);

export type PlatformDeleteAdminInput = z.infer<typeof platformDeleteAdminBodyBaseSchema>;

export const platformActivityLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
}).strict();

export type PlatformActivityLogsQueryInput = z.infer<typeof platformActivityLogsQuerySchema>;
