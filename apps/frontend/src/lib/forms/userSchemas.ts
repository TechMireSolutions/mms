import { USER_STATUS_VALUES } from '@mms/shared';
import { z } from 'zod';

const statusSchema = z.enum(USER_STATUS_VALUES);

export const editUserSchema = z.object({
  name: z.string().trim().min(1, 'users.errorNameRequired'),
  email: z.string().trim().min(1, 'users.errorEmailRequired').email('users.errorEmailRequired'),
  phone: z.string(),
  role: z.string().min(1, 'users.errorRoleRequired'),
  status: statusSchema,
  twoFactorEnabled: z.boolean(),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;

export const inviteUserSchema = z.object({
  name: z.string().trim().min(1, 'users.errorNameEmailRequired'),
  email: z.string().trim().min(1, 'users.errorNameEmailRequired').email('users.errorNameEmailRequired'),
  phone: z.string(),
  role: z.string().min(1, 'users.errorRoleRequired'),
  status: statusSchema,
  sendEmail: z.boolean(),
});

export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;
