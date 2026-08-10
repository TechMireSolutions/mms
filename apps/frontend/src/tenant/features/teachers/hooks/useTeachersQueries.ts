import { useQuery } from '@tanstack/react-query';
import {
  TEACHERS_MODULE_MANIFEST,
  type TeacherRecord,
  type TeachersCommandMetricsSnapshot,
  type TeachersWidgetAggregateResult,
  teachersWidgetQueryFromWidget,
} from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { createPersonModuleResolveQueries } from '@/lib/query/createPersonModuleResolveQueries';
import {
  TEACHERS_API,
  TEACHERS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  buildTeachersPageUrl,
  teachersPaginatedQueryKey,
  type Teacher,
  type TeacherNextEmployeeIdParams,
  type TeachersListPageResult,
  type TeachersPaginatedParams,
  type TeachersWidgetAggregateWidgetInput,
} from '@/tenant/features/teachers/hooks/teachersQueryShared';

export function useTeachersPaginated(params: TeachersPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  return useQuery({
    queryKey: teachersPaginatedQueryKey(params),
    queryFn: async ({ signal }) => apiJson<TeachersListPageResult>(buildTeachersPageUrl(params), { signal }),
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
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

export function useTeachersWidgetAggregates(
  widgets: TeachersWidgetAggregateWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const teacherQueries = widgets
    .filter((widget) => widget.collection === 'teachers')
    .map((widget) => teachersWidgetQueryFromWidget(widget));
  const querySignature = teacherQueries.map((query) => query.id).sort().join(',');

  return useQuery({
    queryKey: [...TEACHERS_WIDGET_AGGREGATES_QUERY_KEY, querySignature] as const,
    queryFn: async ({ signal }) => {
      const aggregateResponse = await apiJson<{ results: Record<string, TeachersWidgetAggregateResult> }>(
        `${TEACHERS_API}/widget-aggregates`,
        {
          method: 'POST',
          body: JSON.stringify({ widgets: teacherQueries }),
          signal,
        },
      );
      return aggregateResponse?.results ?? {};
    },
    enabled: isAuthenticated && enabled && teacherQueries.length > 0,
    staleTime: 30_000,
  });
}

export type { TeachersWidgetAggregateWidgetInput, TeacherNextEmployeeIdParams, TeachersPaginatedParams };
