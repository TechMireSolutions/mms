import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
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
import { uniqueRegistryIds } from '@/lib/registryResolve';
import {
  TEACHERS_API,
  TEACHERS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  buildTeachersPageUrl,
  teacherDetailQueryKey,
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

export async function fetchAllTeachersForQuery(
  params: Omit<TeachersPaginatedParams, 'page' | 'enabled'> = {},
  onProgress?: (fetched: number, total: number) => void,
): Promise<Teacher[]> {
  const limit = TEACHERS_MODULE_MANIFEST.maxPageSize;
  const all: Teacher[] = [];
  let page = 1;
  let total = 0;

  for (;;) {
    const teachersPage = await apiJson<TeachersListPageResult>(buildTeachersPageUrl({ ...params, page, limit }));
    all.push(...(teachersPage.teachers as Teacher[]));
    total = teachersPage.total;
    onProgress?.(all.length, total);
    if (!teachersPage.hasMore || page >= 200) break;
    page += 1;
  }

  return all;
}

export function useTeacherById(teacherId: string | undefined, enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: teacherDetailQueryKey(teacherId ?? ''),
    queryFn: async () => {
      const teacherResponse = await apiJson<{ teacher: TeacherRecord }>(`${TEACHERS_API}/${teacherId}`);
      return teacherResponse.teacher as unknown as Teacher;
    },
    enabled: isAuthenticated && enabled && Boolean(teacherId),
    staleTime: 30_000,
  });
}

export function useTeacherLinkedContactIds(
  excludeTeacherId?: string,
  enabled = true,
) {
  const { isAuthenticated } = useAuth();
  const queryString = excludeTeacherId ? `?excludeId=${encodeURIComponent(excludeTeacherId)}` : '';
  return useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'linked-contact-ids', excludeTeacherId ?? ''] as const,
    queryFn: async () => {
      const linkedContactsResponse = await apiJson<{ contactIds: Array<string | number> }>(`${TEACHERS_API}/linked-contact-ids${queryString}`);
      return linkedContactsResponse.contactIds;
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

export function useTeacherNextEmployeeId(params: TeacherNextEmployeeIdParams = {}) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  const queryParams = new URLSearchParams();
  if (params.prefix) queryParams.set('prefix', params.prefix);

  return useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'next-employee-id', params] as const,
    queryFn: async () => {
      const suffix = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const nextEmployeeIdResponse = await apiJson<{ employeeId: string }>(`${TEACHERS_API}/next-employee-id${suffix}`);
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

export function useTeachersByIds(ids: (string | number | null | undefined)[]) {
  const { isAuthenticated } = useAuth();
  const normalized = useMemo(() => uniqueRegistryIds(ids), [ids]);
  const signature = normalized.join(',');

  return useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'resolve', signature] as const,
    queryFn: async () => {
      const teachersResponse = await apiJson<{ teachers: TeacherRecord[] }>(`${TEACHERS_API}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ ids: normalized }),
      });
      return teachersResponse.teachers as unknown as Teacher[];
    },
    enabled: isAuthenticated && normalized.length > 0,
    staleTime: 30_000,
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
    queryFn: async () => {
      const aggregateResponse = await apiJson<{ results: Record<string, TeachersWidgetAggregateResult> }>(
        `${TEACHERS_API}/widget-aggregates`,
        {
          method: 'POST',
          body: JSON.stringify({ widgets: teacherQueries }),
        },
      );
      return aggregateResponse?.results ?? {};
    },
    enabled: isAuthenticated && enabled && teacherQueries.length > 0,
    staleTime: 30_000,
  });
}

export type { TeachersWidgetAggregateWidgetInput, TeacherNextEmployeeIdParams, TeachersPaginatedParams };
