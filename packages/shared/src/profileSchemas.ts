import { z } from 'zod';
import { phoneNumberSchema, emailAddressSchema } from './contactNestedSchemas.js';

/** Change-password write body (tenant profile). */
export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
  })
  .strict();

/** Step-up password verification body for sensitive in-session actions. */
export const verifyPasswordBodySchema = z
  .object({
    password: z.string().min(1),
    /** Optional guard so a step-up check can assert the account it was collected for. */
    email: z.string().email().optional(),
  })
  .strict();

/** Request a login-email change (issues a verification challenge). */
export const requestLoginEmailChangeBodySchema = z
  .object({
    newLoginEmail: z.string().email(),
    currentPassword: z.string().min(1),
  })
  .strict();

/** Confirm a login-email change with the issued challenge code. */
export const confirmLoginEmailChangeBodySchema = z
  .object({
    challengeId: z.string().min(1),
    code: z.string().min(4),
  })
  .strict();

/** Own-contact patch body (authenticated user edits their linked contact). */
export const ownContactPatchBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    gender: z.string().optional(),
    dob: z.string().optional(),
    city: z.string().optional(),
    avatar: z.string().optional(),
    phones: z.array(phoneNumberSchema).optional(),
    emails: z
      .array(
        emailAddressSchema.extend({
          address: z.string().email(),
        }),
      )
      .optional(),
  })
  .strict();