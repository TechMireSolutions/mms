import type {
  Faculty,
  FacultyListQuery,
  FacultyQuickFilter,
  FacultySortField,
  Teacher,
  TeachersListQuery,
  TeachersQuickFilter,
  TeacherSortField,
} from '@mms/shared';

export {
  FACULTY_API,
  FACULTY_METRICS_QUERY_KEY,
  FACULTY_QUERY_KEY,
  FACULTY_WIDGET_AGGREGATES_QUERY_KEY,
  buildFacultyPageUrl,
  facultyListQueryKeyParams,
  facultyPaginatedQueryKey,
  sameFacultyListFilters,
  TEACHERS_API,
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  buildTeachersPageUrl,
  sameTeachersListFilters,
  teachersListQueryKeyParams,
  teachersPaginatedQueryKey,
} from './facultyQueryKeys.js';
export type {
  FacultyRecord,
  FacultyNextEmployeeIdParams,
  FacultyListPageResult,
  FacultyPaginatedParams,
  FacultyWidgetAggregateWidgetInput,
  TeacherRecord,
  TeacherNextEmployeeIdParams,
  TeachersListPageResult,
  TeachersPaginatedParams,
  TeachersWidgetAggregateWidgetInput,
} from './facultyQueryKeys.js';
export type { Faculty, FacultyListQuery, Teacher, TeachersListQuery };

export interface FacultyDirectoryQueryInput {
  search?: string;
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  quickFilter: FacultyQuickFilter | TeachersQuickFilter;
  sortField: FacultySortField | TeacherSortField | null | undefined;
  sortDir: 'asc' | 'desc';
}
export type TeachersDirectoryQueryInput = FacultyDirectoryQueryInput;

/** Directory filter state → {@link FacultyListQuery} (Work page + server CSV share this). */
export function buildFacultyDirectoryQuery({
  search,
  filterStatus,
  filterSpecialization,
  filterGender,
  quickFilter,
  sortField,
  sortDir,
}: FacultyDirectoryQueryInput): FacultyListQuery {
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
export const buildTeachersDirectoryQuery = buildFacultyDirectoryQuery;

