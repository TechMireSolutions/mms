import { z } from 'zod';
import { normalizeStoredTeacher } from '@mms/shared';

const teacherCoreSchema = z.object({
  id: z.union([z.string(), z.number()]),
  contactId: z.union([z.string(), z.number()]),
  employeeId: z.string().optional(),
  specialization: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave']).optional(),
  joinDate: z.string().optional(),
  qualification: z.string().optional(),
  notes: z.string().optional(),
  userId: z.string().nullable().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
}).passthrough();

export const teacherRecordSchema = teacherCoreSchema.transform((record) =>
  normalizeStoredTeacher(record),
);

export const teacherListSchema = z.array(teacherCoreSchema).transform((list) =>
  list.map((record) => normalizeStoredTeacher(record)),
);

export type TeacherRecord = z.infer<typeof teacherCoreSchema>;
