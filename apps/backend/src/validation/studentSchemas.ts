import { z } from 'zod';
import { normalizeStoredStudent } from '@mms/shared';

const studentCoreSchema = z.object({
  id: z.union([z.string(), z.number()]),
  contactId: z.union([z.string(), z.number()]).optional(),
  fatherContactId: z.union([z.string(), z.number()]).optional(),
  motherContactId: z.union([z.string(), z.number()]).optional(),
  guardianContactId: z.union([z.string(), z.number()]).optional(),
  studentId: z.string().optional(),
  status: z.string().optional(),
  enrollmentDate: z.string().optional(),
  notes: z.string().optional(),
  name: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  city: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  guardianName: z.string().optional(),
}).passthrough();

export const studentRecordSchema = studentCoreSchema.transform((record) =>
  normalizeStoredStudent(record),
);

export const studentListSchema = z.array(studentCoreSchema).transform((list) =>
  list.map((record) => normalizeStoredStudent(record)),
);

export type StudentRecord = z.infer<typeof studentCoreSchema>;
