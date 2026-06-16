import { z } from 'zod';

export const studentRecordSchema = z.object({
  id: z.union([z.string(), z.number()]),
  contactId: z.union([z.string(), z.number()]).optional(),
  fatherContactId: z.union([z.string(), z.number()]).optional(),
  motherContactId: z.union([z.string(), z.number()]).optional(),
  studentId: z.string().optional(),
  status: z.string().optional(),
  enrollmentDate: z.string().optional(),
  notes: z.string().optional(),
}).passthrough();

export const studentListSchema = z.array(studentRecordSchema);

export type StudentRecord = z.infer<typeof studentRecordSchema>;
