import { z } from 'zod';
import { PLATFORM_MIN_PASSWORD_LENGTH } from '@mms/shared';

export const platformLoginBodySchema = z.object({
  email: z.string().min(3),
  password: z.string().min(6),
});

export const platformSetupRegisterBodySchema = z.object({
  name: z.string().min(2),
  email: z.string().min(3),
  password: z.string().min(PLATFORM_MIN_PASSWORD_LENGTH),
});

export const platformSetupVerifyBodySchema = z.object({
  setupId: z.string().min(8),
  code: z.string().min(4).max(12),
});

export const platformSetupResendBodySchema = z.object({
  setupId: z.string().min(8),
});

export const platformPasswordForgotBodySchema = z.object({
  email: z.string().min(3),
});

export const platformPasswordResetBodySchema = z.object({
  resetId: z.string().min(8),
  code: z.string().min(4).max(12),
  password: z.string().min(PLATFORM_MIN_PASSWORD_LENGTH),
});

export const platformPasswordResendBodySchema = z.object({
  resetId: z.string().min(8),
});

export const platformProfilePatchBodySchema = z.object({
  name: z.string().min(2),
});

export const platformChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(PLATFORM_MIN_PASSWORD_LENGTH),
});

export const workspaceEnabledPatchBodySchema = z.object({
  enabled: z.boolean(),
});

export const workspaceDeleteBodySchema = z.object({
  password: z.string().min(1),
});
