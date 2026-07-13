import { z } from 'zod';
import { phoneNumberSchema, emailAddressSchema } from '@mms/shared';

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
  avatar: z.string().optional(),
  phones: z.array(phoneNumberSchema).optional(),
  emails: z
    .array(
      emailAddressSchema.extend({
        address: z.string().email(),
      }),
    )
    .optional(),
});
