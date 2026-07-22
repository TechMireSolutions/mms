import { z } from 'zod';
import { PLATFORM_MIN_PASSWORD_LENGTH } from './platformTypes.js';
import {
  validatePlatformSetupEmail,
  validatePlatformSetupName,
  validatePlatformSetupPassword,
} from './platformSetupValidation.js';

export const platformSetupRegisterBodySchema = z.object({
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
});

export type PlatformSetupRegisterInput = z.infer<typeof platformSetupRegisterBodySchema>;

export const platformSetupVerifyBodySchema = z.object({
  setupId: z.string().min(8),
  code: z.string().min(4).max(12),
});

export type PlatformSetupVerifyInput = z.infer<typeof platformSetupVerifyBodySchema>;

export const platformSetupResendBodySchema = z.object({
  setupId: z.string().min(8),
});

export type PlatformSetupResendInput = z.infer<typeof platformSetupResendBodySchema>;

export const platformPasswordForgotBodySchema = z.object({
  email: z.string().min(3),
});

export type PlatformPasswordForgotInput = z.infer<typeof platformPasswordForgotBodySchema>;

export const platformPasswordResetBodySchema = z.object({
  resetId: z.string().min(8),
  code: z.string().min(4).max(12),
  password: z.string().refine(
    (val: string) => !validatePlatformSetupPassword(val),
    {
      message: 'Password must be at least 10 characters long and contain both letters and numbers',
    },
  ),
});

export type PlatformPasswordResetInput = z.infer<typeof platformPasswordResetBodySchema>;

export const platformPasswordResendBodySchema = z.object({
  resetId: z.string().min(8),
});

export type PlatformPasswordResendInput = z.infer<typeof platformPasswordResendBodySchema>;

export const platformProfilePatchBodySchema = z.object({
  name: z.string().refine((val: string) => !validatePlatformSetupName(val), {
    message: 'Invalid display name',
  }),
});

export type PlatformProfilePatchInput = z.infer<typeof platformProfilePatchBodySchema>;

export const platformChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().refine(
    (val: string) => !validatePlatformSetupPassword(val),
    {
      message: 'Password must be at least 10 characters long and contain both letters and numbers',
    },
  ),
});

export type PlatformChangePasswordInput = z.infer<typeof platformChangePasswordBodySchema>;

export const workspaceEnabledPatchBodySchema = z.object({
  enabled: z.boolean(),
});

export type WorkspaceEnabledPatchInput = z.infer<typeof workspaceEnabledPatchBodySchema>;

export const workspaceDeleteBodySchema = z.object({
  password: z.string().min(1),
});

export type WorkspaceDeleteInput = z.infer<typeof workspaceDeleteBodySchema>;

export const platformCreateAdminBodySchema = z.object({
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
});

export type PlatformCreateAdminInput = z.infer<typeof platformCreateAdminBodySchema>;
