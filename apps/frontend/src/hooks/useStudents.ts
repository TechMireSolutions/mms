import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { normalizeStoredStudent, STUDENTS_MODULE_CONTRACT, type ModuleColumnPreference, type StudentDuplicateCheckInput, type StudentDuplicateReason, type StudentsCommandMetricsSnapshot, type StudentsListPageResult, studentsWidgetQueryFromWidget, type StudentsWidgetAggregateResult } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { STUDENT_COUNT_QUERY_KEY } from './useStudentCount';
import { uniqueRegistryIds } from '@/lib/registryResolve';
import type { Student } from '@/lib/data/studentsData';

export const STUDENTS_QUERY_KEY = ['students', 'list'] as const;
export const STUDENTS_METRICS_QUERY_KEY = ['students', 'metrics'] as const;
export const STUDENTS_WIDGET_AGGREGATES_QUERY_KEY = [STUDENTS_MODULE_CONTRACT.collectionKey, 'widget-aggregates'] as const;
export const STUDENT_COLUMN_PREFERENCES_QUERY_KEY = [
  STUDENTS_MODULE_CONTRACT.collectionKey,
  'column-preferences',
] as const;

const STUDENTS_API = STUDENTS_MODULE_CONTRACT.restBasePath;

export interface StudentsPaginatedParams {
  page: number;
  limit?: number;
  search?: string;
  status?: string;
  gender?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  enabled?: boolean;
}

function buildStudentsPageUrl(params: StudentsPaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit ?? STUDENTS_MODULE_CONTRACT.defaultPageSize));
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.status?.trim()) queryParams.set('status', params.status.trim());
  if (params.gender) queryParams.set('gender', params.gender);
  if (params.sortField) queryParams.set('sortField', params.sortField);
  if (params.sortDir) queryParams.set('sortDir', params.sortDir);
  return `${STUDENTS_API}?${queryParams.toString()}`;
}

export function studentsPaginatedQueryKey(params: StudentsPaginatedParams) {
  return [...STUDENTS_QUERY_KEY, 'page', params] as const;
}

export function useStudentsPaginated(params: StudentsPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  return useQuery({
    queryKey: studentsPaginatedQueryKey(params),
    queryFn: async () => apiJson<StudentsListPageResult>(buildStudentsPageUrl(params)),
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

/** Fetches all pages matching Work filters for export (globle1 §8). */
export async function fetchAllStudentsForQuery(
  params: Omit<StudentsPaginatedParams, 'page' | 'enabled'>,
  onProgress?: (fetched: number, total: number) => void,
): Promise<StudentRecord[]> {
  const limit = STUDENTS_MODULE_CONTRACT.maxPageSize;
  const all: StudentRecord[] = [];
  let page = 1;
  let total = 0;

  for (;;) {
    const body = await apiJson<StudentsListPageResult>(buildStudentsPageUrl({ ...params, page, limit }));
    all.push(...(body.students as StudentRecord[]));
    total = body.total;
    onProgress?.(all.length, total);
    if (!body.hasMore || page >= 200) break;
    page += 1;
  }

  return all;
}

export interface StudentRecord {
  id: string | number;
  [key: string]: unknown;
}

export function useStudentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: STUDENT_COUNT_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: STUDENTS_METRICS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: STUDENTS_WIDGET_AGGREGATES_QUERY_KEY });
  };

  const createStudent = useMutation({
    mutationFn: async (student: StudentRecord) => {
      const [normalized] = [normalizeStoredStudent(student)];
      return apiJson<{ student: StudentRecord }>('/api/students', {
        method: 'POST',
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: invalidate,
  });

  const updateStudent = useMutation({
    mutationFn: async ({ id, student }: { id: string; student: StudentRecord }) => {
      const normalized = normalizeStoredStudent(student);
      return apiJson<{ student: StudentRecord }>(`/api/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: invalidate,
  });

  const deleteStudent = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/api/students/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { createStudent, updateStudent, deleteStudent };
}

export function useStudentById(studentId: string | undefined, enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, 'by-id', studentId] as const,
    queryFn: async () => {
      const body = await apiJson<{ student: StudentRecord }>(`${STUDENTS_API}/${studentId}`);
      return body.student as unknown as Student;
    },
    enabled: isAuthenticated && enabled && Boolean(studentId),
    staleTime: 30_000,
  });
}

export function useStudentLinkedContactIds(excludeStudentId?: string) {
  const { isAuthenticated } = useAuth();
  const queryString = excludeStudentId ? `?excludeId=${encodeURIComponent(excludeStudentId)}` : '';
  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, 'linked-contact-ids', excludeStudentId ?? ''] as const,
    queryFn: async () => {
      const body = await apiJson<{ contactIds: Array<string | number> }>(`${STUDENTS_API}/linked-contact-ids${queryString}`);
      return body.contactIds;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export interface StudentNextGrNumberParams {
  registeredDate: string;
  template?: string;
  digits?: number;
  restartAnnually?: boolean;
  enabled?: boolean;
}

export function useStudentNextGrNumber(params: StudentNextGrNumberParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  const queryParams = new URLSearchParams();
  queryParams.set('registeredDate', params.registeredDate);
  if (params.template) queryParams.set('template', params.template);
  if (params.digits != null) queryParams.set('digits', String(params.digits));
  if (params.restartAnnually != null) queryParams.set('restartAnnually', String(params.restartAnnually));

  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, 'next-gr-number', params] as const,
    queryFn: async () => {
      const body = await apiJson<{ grNumber: string }>(`${STUDENTS_API}/next-gr-number?${queryParams.toString()}`);
      return body.grNumber;
    },
    enabled: isAuthenticated && enabled && Boolean(params.registeredDate),
    staleTime: 15_000,
  });
}

export async function checkStudentRegistrationDuplicate(
  input: StudentDuplicateCheckInput,
): Promise<StudentDuplicateReason | null> {
  const body = await apiJson<{ reason: StudentDuplicateReason | null }>(`${STUDENTS_API}/duplicate-check`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.reason;
}

export function useStudentsMetrics(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: STUDENTS_METRICS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ metrics: StudentsCommandMetricsSnapshot }>(`${STUDENTS_API}/metrics`);
      return body.metrics;
    },
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

/** Batch-resolve student rows by id (globle2 §10 — cross-module labels). */
export function useStudentsByIds(ids: (string | number | null | undefined)[]) {
  const { isAuthenticated } = useAuth();
  const normalized = useMemo(() => uniqueRegistryIds(ids), [ids]);
  const signature = normalized.join(',');

  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, 'resolve', signature] as const,
    queryFn: async () => {
      const body = await apiJson<{ students: StudentRecord[] }>(`${STUDENTS_API}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ ids: normalized }),
      });
      return body.students as unknown as Student[];
    },
    enabled: isAuthenticated && normalized.length > 0,
    staleTime: 30_000,
  });
}

export interface StudentsWidgetAggregateWidgetInput {
  id: string;
  collection: string;
  operation: 'count' | 'sum' | 'avg' | 'percentage';
  targetField?: string;
  filterField?: string;
  filterOperator?: 'equals' | 'contains' | 'gt' | 'lt';
  filterValue?: string;
  xAxisField?: string;
}

export function useStudentsWidgetAggregates(
  widgets: StudentsWidgetAggregateWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const studentQueries = widgets
    .filter((widget) => widget.collection === 'students')
    .map((widget) => studentsWidgetQueryFromWidget(widget));
  const querySignature = studentQueries.map((query) => query.id).sort().join(',');

  return useQuery({
    queryKey: [...STUDENTS_WIDGET_AGGREGATES_QUERY_KEY, querySignature] as const,
    queryFn: async () => {
      const body = await apiJson<{ results: Record<string, StudentsWidgetAggregateResult> }>(
        `${STUDENTS_API}/widget-aggregates`,
        {
          method: 'POST',
          body: JSON.stringify({ widgets: studentQueries }),
        },
      );
      return body.results;
    },
    enabled: isAuthenticated && enabled && studentQueries.length > 0,
    staleTime: 30_000,
  });
}

export function useStudentColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: STUDENT_COLUMN_PREFERENCES_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<{ preferences: ModuleColumnPreference[]; prefs?: ModuleColumnPreference[] }>(
        `${STUDENTS_API}/column-preferences`,
      );
      return body.preferences ?? body.prefs ?? [];
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useStudentColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPreference[]) =>
      apiJson<{ success: boolean; preferences: ModuleColumnPreference[]; prefs?: ModuleColumnPreference[] }>(
        `${STUDENTS_API}/column-preferences`,
        {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
        },
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(STUDENT_COLUMN_PREFERENCES_QUERY_KEY, data.preferences ?? data.prefs ?? []);
    },
  });
}
