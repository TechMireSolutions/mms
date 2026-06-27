import { z } from 'zod';
import { normalizeStoredStudent } from '@mms/shared';
import { entityResolveBodySchema } from './commonSchemas.js';

const studentCoreSchema = z.object({
  id: z.union([z.string(), z.number()]),
  contactId: z.union([z.string(), z.number()]).nullish().transform(v => v === null ? undefined : v),
  fatherContactId: z.union([z.string(), z.number()]).nullish().transform(v => v === null ? undefined : v),
  motherContactId: z.union([z.string(), z.number()]).nullish().transform(v => v === null ? undefined : v),
  guardianContactId: z.union([z.string(), z.number()]).nullish().transform(v => v === null ? undefined : v),
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

const studentsWidgetQuerySchema = z.object({
  id: z.string().min(1).max(128),
  operation: z.enum(['count', 'sum', 'avg', 'percentage']),
  targetField: z.string().max(128).optional(),
  filterField: z.string().max(128).optional(),
  filterOperator: z.enum(['equals', 'contains', 'gt', 'lt']).optional(),
  filterValue: z.string().max(256).optional(),
  xAxisField: z.string().max(128).optional(),
});

export const studentsWidgetAggregatesBodySchema = z.object({
  widgets: z.array(studentsWidgetQuerySchema).max(32),
});

export const studentsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  search: z.string().max(500).optional(),
  status: z.string().max(200).optional(),
  gender: z.string().optional(),
  sortField: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export const studentsResolveBodySchema = entityResolveBodySchema;

export const studentsNextGrNumberQuerySchema = z.object({
  registeredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  template: z.string().max(64).optional(),
  digits: z.coerce.number().int().min(1).max(12).optional(),
  restartAnnually: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const studentsDuplicateCheckBodySchema = z.object({
  excludeId: z.string().optional(),
  contactId: z.union([z.string(), z.number()]).optional(),
  email: z.string().max(320).optional(),
  name: z.string().max(500).optional(),
  dob: z.string().max(32).optional(),
});

export const studentsLinkedContactIdsQuerySchema = z.object({
  excludeId: z.string().optional(),
});
