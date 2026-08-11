import { useQuery } from '@tanstack/react-query';
import {
  TEACHERS_MODULE_MANIFEST,
  type Teacher,
  type TeacherRecord,
  type TeachersCommandMetricsSnapshot,
  type TeachersWidgetAggregateResult,
  type TeachersWidgetQuery,
  teachersWidgetQueryFromWidget,
} from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { createModulePaginatedListQuery } from '@/lib/query/createModulePaginatedListQuery';
import { createModuleWidgetAggregatesQuery } from '@/lib/query/createModuleWidgetAggregatesQuery';
import { createPersonModuleResolveQueries } from '@/lib/query/createPersonModuleResolveQueries';
import {
  TEACHERS_API,
  TEACHERS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  teacherDetailQueryKey,
  type TeacherNextEmployeeIdParams,
  type TeachersWidgetAggregateWidgetInput,
} from '@/tenant/features/teachers/hooks/teachersQueryKeys';
import {
  buildTeachersPageUrl,
  fetchTeacherById,
  sameTeachersListFilters,
  teachersListQueryKeyParams,
  teachersPaginatedQueryKey,
  type TeachersListPageResult,
  type TeachersPaginatedParams,
} from '@/tenant/features/teachers/hooks/teachersListQueryBuilders';

export type { TeachersListPageResult };

const useTeachersPaginatedList = createModulePaginatedListQuery<
  TeachersListPageResult,
  TeachersPaginatedParams,
  ReturnType<typeof teachersListQueryKeyParams>
>({
  queryKey: teachersPaginatedQueryKey,
  keyParams: teachersListQueryKeyParams,
  sameFilters: sameTeachersListFilters,
  buildUrl: buildTeachersPageUrl,
  staleTime: 15_000,
});

export function useTeachersPaginated(params: TeachersPaginatedParams) {
  return useTeachersPaginatedList(params);
}

export function useTeacherById(teacherId: string | undefined, enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: teacherDetailQueryKey(teacherId ?? ''),
    queryFn: ({ signal }) => fetchTeacherById(teacherId!, signal),
    enabled: isAuthenticated && enabled && Boolean(teacherId),
    staleTime: 10_000,
  });
}

const teacherResolveQueries = createPersonModuleResolveQueries<TeacherRecord, Teacher>({
  moduleQueryKey: TEACHERS_QUERY_KEY,
  apiBase: TEACHERS_API,
  responseKey: 'teachers',
  toHydrated: (rows) => rows as unknown as Teacher[],
});

export const useTeacherLinkedContactIds = teacherResolveQueries.useLinkedContactIds;
export const useTeachersByIds = teacherResolveQueries.useByIds;

export function useTeacherNextEmployeeId(params: TeacherNextEmployeeIdParams = {}) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  const queryParams = new URLSearchParams();
  if (params.prefix) queryParams.set('prefix', params.prefix);

  return useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'next-employee-id', params] as const,
    queryFn: async ({ signal }) => {
      const suffix = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const nextEmployeeIdResponse = await apiJson<{ employeeId: string }>(
        `${TEACHERS_API}/next-employee-id${suffix}`,
        { signal },
      );
      return nextEmployeeIdResponse.employeeId;
    },
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
  });
}

export function useTeachersMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<TeachersCommandMetricsSnapshot>({
    moduleId: TEACHERS_MODULE_MANIFEST.moduleId,
    apiPath: TEACHERS_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}

const buildTeachersWidgetAggregatesQuery = createModuleWidgetAggregatesQuery<
  TeachersWidgetQuery,
  TeachersWidgetAggregateResult
>({
  apiBase: TEACHERS_API,
  queryKey: TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  collection: 'teachers',
  toWidgetQuery: teachersWidgetQueryFromWidget,
});

export function useTeachersWidgetAggregates(
  widgets: TeachersWidgetAggregateWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  return useQuery(buildTeachersWidgetAggregatesQuery(widgets, isAuthenticated && enabled));
}

export type { TeachersPaginatedParams, TeacherNextEmployeeIdParams, TeachersWidgetAggregateWidgetInput };
