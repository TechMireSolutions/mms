import { z } from 'zod';
import { baseListQuerySchema } from './apiSchemas.js';
import { TEACHER_STATUS_WRITE_MAX } from './teachersModuleManifest.js';
import {
  TEACHER_SORT_FIELDS,
  TEACHER_SORT_FIELD_SET,
  type TeacherSortField,
} from './teacherDirectoryColumns.js';
import type { Teacher } from './teacherTypes.js';

export { TEACHER_SORT_FIELDS, TEACHER_SORT_FIELD_SET, type TeacherSortField };

/** Validates Teachers Work list query received over HTTP (SQL page is authoritative). */
export const teachersListQuerySchema = baseListQuerySchema.extend({
  status: z.string().max(TEACHER_STATUS_WRITE_MAX).optional(),
  specialization: z.string().optional(),
  sortField: z.enum(TEACHER_SORT_FIELDS).optional(),
});

/** Zod-inferred HTTP list query (includeDeleted is `'true' | 'false'` from base). */
export type TeachersListQueryParsed = z.infer<typeof teachersListQuerySchema>;

/**
 * Service / FE Query / SQL list query — Zod wire fields with boolean `includeDeleted`
 * after HTTP normalize (same authority as {@link teachersListQuerySchema}).
 */
export type TeachersListQuery = Omit<TeachersListQueryParsed, 'includeDeleted'> & {
  includeDeleted?: boolean;
};

/** Server SQL page result shape (FE Query + BE repository). */
export interface TeachersListPageResult {
  teachers: Teacher[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
