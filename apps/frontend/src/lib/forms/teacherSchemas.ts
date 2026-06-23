import { z } from 'zod';
import { TEACHER_SPECIALIZATION_VALUES } from '@mms/shared';

export const teacherFormSchema = z.object({
  contactId: z.union([z.string(), z.number()], {
    error: 'teachers.errorContactRequired',
  }),
  employeeId: z.string().optional(),
  specialization: z.string().min(1, 'teachers.errorSpecializationRequired'),
  status: z.string().min(1, 'teachers.errorStatusRequired'),
  joinDate: z.string().min(1, 'teachers.errorJoinDateRequired'),
  qualification: z.string().optional(),
  notes: z.string().optional(),
});

export type TeacherFormValues = z.infer<typeof teacherFormSchema>;

export const TEACHER_SPECIALIZATION_OPTIONS = [...TEACHER_SPECIALIZATION_VALUES];
