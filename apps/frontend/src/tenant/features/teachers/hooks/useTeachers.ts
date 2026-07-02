import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Teacher, ModuleColumnPref, TeachersCommandMetricsSnapshot, TeachersListPageResult, TeachersWidgetAggregateResult } from '@mms/shared';
import { normalizeStoredTeacher, TEACHERS_MODULE_CONTRACT, teachersWidgetQueryFromWidget } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { TEACHER_COUNT_QUERY_KEY } from '@/tenant/features/teachers/hooks/useTeacherCount';
import { uniqueRegistryIds } from '@/lib/registryResolve';
import { readModuleColumnPreferences, writeModuleColumnPreferences, type ModuleColumnPreferencesResponse } from '@/lib/moduleColumnPreferencesApi';

export const TEACHERS_QUERY_KEY = ['teachers', 'list'] as const;
export const TEACHERS_METRICS_QUERY_KEY = ['teachers', 'metrics'] as const;
export const TEACHERS_WIDGET_AGGREGATES_QUERY_KEY = [TEACHERS_MODULE_CONTRACT.collectionKey, 'widget-aggregates'] as const;
export const TEACHER_COLUMN_PREFS_QUERY_KEY = [
  TEACHERS_MODULE_CONTRACT.collectionKey,
  'column-preferences',
] as const;

const TEACHERS_API = TEACHERS_MODULE_CONTRACT.restBasePath;

export interface TeachersPaginatedParams {
  page: number;
  limit?: number;
  search?: string;
  status?: string;
  specialization?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  enabled?: boolean;
}

function buildTeachersPageUrl(params: TeachersPaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit ?? TEACHERS_MODULE_CONTRACT.defaultPageSize));
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.status?.trim()) queryParams.set('status', params.status.trim());
  if (params.specialization) queryParams.set('specialization', params.specialization);
  if (params.sortField) queryParams.set('sortField', params.sortField);
  if (params.sortDir) queryParams.set('sortDir', params.sortDir);
  return `${TEACHERS_API}?${queryParams.toString()}`;
}

export function teachersPaginatedQueryKey(params: TeachersPaginatedParams) {
  return [...TEACHERS_QUERY_KEY, 'page', params] as const;
}

export function useTeachersPaginated(params: TeachersPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  return useQuery({
    queryKey: teachersPaginatedQueryKey(params),
    queryFn: async () => apiJson<TeachersListPageResult>(buildTeachersPageUrl(params)),
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
  });
}

export interface TeacherRecord {
  id: string | number;
  [key: string]: unknown;
}

export function useTeacherMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TEACHER_COUNT_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TEACHERS_METRICS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TEACHERS_WIDGET_AGGREGATES_QUERY_KEY });
  };

  const createTeacher = useMutation({
    mutationFn: async (teacher: TeacherRecord) => {
      const normalized = normalizeStoredTeacher(teacher);
      return apiJson<{ teacher: TeacherRecord }>('/api/teachers', {
        method: 'POST',
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: invalidate,
  });

  const updateTeacher = useMutation({
    mutationFn: async ({ id, teacher }: { id: string; teacher: TeacherRecord }) => {
      const normalized = normalizeStoredTeacher(teacher);
      return apiJson<{ teacher: TeacherRecord }>(`/api/teachers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: invalidate,
  });

  const deleteTeacher = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/api/teachers/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { createTeacher, updateTeacher, deleteTeacher };
}

export function useTeacherById(teacherId: string | undefined, enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'by-id', teacherId] as const,
    queryFn: async () => {
      const teacherResponse = await apiJson<{ teacher: TeacherRecord }>(`${TEACHERS_API}/${teacherId}`);
      return teacherResponse.teacher as unknown as Teacher;
    },
    enabled: isAuthenticated && enabled && Boolean(teacherId),
    staleTime: 30_000,
  });
}

export function useTeacherLinkedContactIds(excludeTeacherId?: string) {
  const { isAuthenticated } = useAuth();
  const queryString = excludeTeacherId ? `?excludeId=${encodeURIComponent(excludeTeacherId)}` : '';
  return useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'linked-contact-ids', excludeTeacherId ?? ''] as const,
    queryFn: async () => {
      const linkedContactsResponse = await apiJson<{ contactIds: Array<string | number> }>(`${TEACHERS_API}/linked-contact-ids${queryString}`);
      return linkedContactsResponse.contactIds;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export interface TeacherNextEmployeeIdParams {
  prefix?: string;
  enabled?: boolean;
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
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: TEACHERS_METRICS_QUERY_KEY,
    queryFn: async () => {
      const metricsResponse = await apiJson<{ metrics: TeachersCommandMetricsSnapshot }>(`${TEACHERS_API}/metrics`);
      return metricsResponse.metrics;
    },
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

/** Batch-resolve teacher rows by id (globle2 §10 — cross-module labels). */
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

export interface TeachersWidgetAggregateWidgetInput {
  id: string;
  collection: string;
  operation: 'count' | 'sum' | 'avg' | 'percentage';
  targetField?: string;
  filterField?: string;
  filterOperator?: 'equals' | 'contains' | 'gt' | 'lt';
  filterValue?: string;
  xAxisField?: string;
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
      return aggregateResponse.results;
    },
    enabled: isAuthenticated && enabled && teacherQueries.length > 0,
    staleTime: 30_000,
  });
}

export function useTeacherColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: TEACHER_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const preferencesResponse = await apiJson<ModuleColumnPreferencesResponse>(
        `${TEACHERS_API}/column-preferences`,
      );
      return readModuleColumnPreferences(preferencesResponse);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useTeacherColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPref[]) =>
      apiJson<ModuleColumnPreferencesResponse>(`${TEACHERS_API}/column-preferences`, {
        method: 'PUT',
        body: writeModuleColumnPreferences(preferences),
      }),
    onSuccess: (preferencesResponse) => {
      queryClient.setQueryData(TEACHER_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(preferencesResponse));
    },
  });
}
