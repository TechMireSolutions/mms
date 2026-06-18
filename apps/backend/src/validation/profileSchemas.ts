import { z } from 'zod';

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const requestLoginEmailChangeBodySchema = z.object({
  newLoginEmail: z.string().email(),
  currentPassword: z.string().min(1),
});

export const confirmLoginEmailChangeBodySchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().min(4),
});

export const ownContactPatchBodySchema = z.object({
  name: z.string().min(1).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  city: z.string().optional(),
  phones: z
    .array(
      z.object({
        label: z.string().optional(),
        number: z.string(),
        countryCode: z.string().optional(),
      }),
    )
    .optional(),
  emails: z
    .array(
      z.object({
        label: z.string().optional(),
        address: z.string().email(),
      }),
    )
    .optional(),
});
