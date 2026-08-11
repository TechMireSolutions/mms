import type {
  Teacher,
  TeachersListQuery,
  TeachersQuickFilter,
  TeacherSortField,
} from '@mms/shared';

export {
  TEACHERS_API,
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  buildTeachersPageUrl,
  sameTeachersListFilters,
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
  filterGender: string;
  quickFilter: TeachersQuickFilter;
  sortField: TeacherSortField | null | undefined;
  sortDir: 'asc' | 'desc';
}

/** Directory filter state → {@link TeachersListQuery} (Work page + server CSV share this). */
export function buildTeachersDirectoryQuery({
  search,
  filterStatus,
  filterSpecialization,
  filterGender,
  quickFilter,
  sortField,
  sortDir,
}: TeachersDirectoryQueryInput): TeachersListQuery {
  return {
    search: search?.trim() || undefined,
    status: filterStatus.length > 0 ? filterStatus.join(',') : undefined,
    specialization: filterSpecialization || undefined,
    gender: filterGender || undefined,
    quickFilter: quickFilter !== 'all' ? quickFilter : undefined,
    sortField: sortField ?? undefined,
    sortDir: sortField ? sortDir : undefined,
  };
}
