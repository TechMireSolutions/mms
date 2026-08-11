import type { Teacher, TeacherSortField, TeachersListQuery } from '@mms/shared';

export {
  TEACHERS_API,
  TEACHER_COUNT_QUERY_KEY,
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  buildTeachersPageUrl,
  fetchTeacherById,
  sameTeachersListFilters,
  teacherDetailQueryKey,
  teachersListQueryKeyParams,
  teachersPaginatedQueryKey,
} from './teachersQueryKeys.js';
export type {
  TeacherRecord,
  TeacherNextEmployeeIdParams,
  TeachersListPageResult,
  TeachersPaginatedParams,
  TeachersWidgetAggregateWidgetInput,
} from './teachersQueryKeys.js';
export type { Teacher, TeachersListQuery };

export interface TeachersDirectoryQueryInput {
  search?: string;
  filterStatus: string[];
  filterSpecialization: string;
  sortField: TeacherSortField | null | undefined;
  sortDir: 'asc' | 'desc';
}

/** Directory filter state → {@link TeachersListQuery} (Work page + server CSV share this). */
export function buildTeachersDirectoryQuery({
  search,
  filterStatus,
  filterSpecialization,
  sortField,
  sortDir,
}: TeachersDirectoryQueryInput): TeachersListQuery {
  return {
    search: search?.trim() || undefined,
    status: filterStatus.length > 0 ? filterStatus.join(',') : undefined,
    specialization: filterSpecialization || undefined,
    sortField: sortField ?? undefined,
    sortDir: sortField ? sortDir : undefined,
  };
}
