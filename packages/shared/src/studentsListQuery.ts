import { z } from 'zod';
import type { Student } from './studentTypes.js';
import { baseListQuerySchema } from './apiSchemas.js';

export interface StudentsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  /** Comma-separated status values (e.g. `active,inactive`). */
  status?: string;
  gender?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  /** When true, SQL list returns deleted-only rows (Work trash). */
  includeDeleted?: boolean;
}

/** Validates Students Work list query received over HTTP (Contacts-shaped SSOT). */
export const studentsListQuerySchema = baseListQuerySchema.extend({
  status: z.string().max(200).optional(),
  gender: z.string().optional(),
});

export type StudentsListQueryParsed = z.infer<typeof studentsListQuerySchema>;

export interface StudentsListPageResult {
  students: Student[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
