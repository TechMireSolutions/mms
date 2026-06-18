import { USER_STATUS_VALUES } from '@mms/shared';
import { z } from 'zod';

const statusSchema = z.enum(USER_STATUS_VALUES);

const contactIdSchema = z.union([
  z.string().trim().min(1, 'users.addErrorContact'),
  z.number(),
]);

export const editUserSchema = z.object({
  contactId: contactIdSchema,
  role: z.string().min(1, 'users.errorRoleRequired'),
  status: statusSchema,
  twoFactorEnabled: z.boolean(),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;

export const inviteUserSchema = z.object({
  contactId: contactIdSchema,
  role: z.string().min(1, 'users.errorRoleRequired'),
  status: statusSchema,
  sendEmail: z.boolean(),
});

export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;
