import { z } from 'zod';
import { normalizeStoredTeacher } from '@mms/shared';
import { entityResolveBodySchema } from './commonSchemas.js';

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

const teachersWidgetQuerySchema = z.object({
  id: z.string().min(1).max(128),
  operation: z.enum(['count', 'sum', 'avg', 'percentage']),
  targetField: z.string().max(128).optional(),
  filterField: z.string().max(128).optional(),
  filterOperator: z.enum(['equals', 'contains', 'gt', 'lt']).optional(),
  filterValue: z.string().max(256).optional(),
  xAxisField: z.string().max(128).optional(),
});

export const teachersWidgetAggregatesBodySchema = z.object({
  widgets: z.array(teachersWidgetQuerySchema).max(32),
});

export const teachersListQuerySchema = z.object({
  page: z.coerce.number().int().min(1),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  search: z.string().max(500).optional(),
  status: z.string().max(200).optional(),
  specialization: z.string().optional(),
  sortField: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export const teachersResolveBodySchema = entityResolveBodySchema;

export const teachersNextEmployeeIdQuerySchema = z.object({
  prefix: z.string().max(16).optional(),
});

export const teachersLinkedContactIdsQuerySchema = z.object({
  excludeId: z.string().optional(),
});
