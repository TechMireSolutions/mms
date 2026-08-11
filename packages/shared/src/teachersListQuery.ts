import { z } from 'zod';
import type { AppTranslationKey } from './appTranslations.js';
import { baseListQuerySchema } from './apiSchemas.js';
import { TEACHER_STATUS_WRITE_MAX } from './teachersModuleManifest.js';
import {
  TEACHER_SORT_FIELDS,
  TEACHER_SORT_FIELD_SET,
  type TeacherSortField,
} from './teacherDirectoryColumns.js';
import { resolveTeacherStatusRoles, type Teacher } from './teacherTypes.js';

export { TEACHER_SORT_FIELDS, TEACHER_SORT_FIELD_SET, type TeacherSortField };

/** Work-directory filter presets — SSOT for schema + Filters menu. */
export const TEACHERS_QUICK_FILTERS = [
  'all',
  'active',
  'inactive',
  'onLeave',
  'missingEmployeeId',
] as const;

const teachersQuickFilterSchema = z.enum(TEACHERS_QUICK_FILTERS);

/** Work-directory quick filter preset ids. */
export type TeachersQuickFilter = z.infer<typeof teachersQuickFilterSchema>;

/** Narrow a dropdown/radio string to a Teachers quick-filter preset. */
export function isTeachersQuickFilter(value: string): value is TeachersQuickFilter {
  return (TEACHERS_QUICK_FILTERS as readonly string[]).includes(value);
}

const TEACHERS_QUICK_FILTER_LABEL_KEYS = {
  all: 'teachers.filtersAll',
  active: 'teachers.filtersActive',
  inactive: 'teachers.filtersInactive',
  onLeave: 'teachers.filtersOnLeave',
  missingEmployeeId: 'teachers.filtersMissingEmployeeId',
} as const satisfies Record<TeachersQuickFilter, AppTranslationKey>;

/** Preset options for the Teachers Work Filters menu. */
export const TEACHERS_QUICK_FILTER_OPTIONS: ReadonlyArray<{
  id: TeachersQuickFilter;
  labelKey: AppTranslationKey;
}> = TEACHERS_QUICK_FILTERS.map((id) => ({
  id,
  labelKey: TEACHERS_QUICK_FILTER_LABEL_KEYS[id],
}));

const TEACHERS_QUICK_FILTER_STATUS_VALUES = (() => {
  const roles = resolveTeacherStatusRoles();
  return { active: roles.active, inactive: roles.inactive, onLeave: roles.onLeave } as const;
})();

/**
 * Stored teacher status value for a status quick-filter preset id
 * (e.g. `onLeave` → `on_leave`); `undefined` for non-status presets.
 */
export function teachersQuickFilterStatusValue(preset: TeachersQuickFilter): string | undefined {
  if (preset === 'all' || preset === 'missingEmployeeId') return undefined;
  return TEACHERS_QUICK_FILTER_STATUS_VALUES[preset];
}

/** Validates Teachers Work list query received over HTTP (SQL page is authoritative). */
export const teachersListQuerySchema = baseListQuerySchema.extend({
  status: z.string().max(TEACHER_STATUS_WRITE_MAX).optional(),
  specialization: z.string().optional(),
  gender: z.string().optional(),
  quickFilter: teachersQuickFilterSchema.optional(),
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
