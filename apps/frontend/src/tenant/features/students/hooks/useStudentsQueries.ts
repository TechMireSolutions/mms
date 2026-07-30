import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  STUDENTS_MODULE_MANIFEST,
  type Student,
  type StudentDuplicateCheckInput,
  type StudentDuplicateReason,
  type StudentsCommandMetricsSnapshot,
  type StudentsWidgetAggregateResult,
  studentsWidgetQueryFromWidget,
} from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { uniqueRegistryIds } from '@/lib/registryResolve';
import {
  STUDENTS_API,
  STUDENTS_QUERY_KEY,
  STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
  buildStudentsPageUrl,
  studentDetailQueryKey,
  studentsPaginatedQueryKey,
  type StudentNextGrNumberParams,
  type StudentRecord,
  type StudentsListPageResult,
  type StudentsPaginatedParams,
  type StudentsWidgetAggregateWidgetInput,
} from '@/tenant/features/students/hooks/studentsQueryShared';

/** Performs server-authoritative paginated query for Student directory views. */
export function useStudentsPaginated(params: StudentsPaginatedParams) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;
  return useQuery({
    queryKey: studentsPaginatedQueryKey(params),
    queryFn: async ({ signal }) => apiJson<StudentsListPageResult>(buildStudentsPageUrl(params), { signal }),
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
  });
}

/** Fetches all pages matching Work filters for export (globle1 §8). */
export async function fetchAllStudentsForQuery(
  params: Omit<StudentsPaginatedParams, 'page' | 'enabled'>,
  onProgress?: (fetched: number, total: number) => void,
): Promise<StudentRecord[]> {
  const limit = STUDENTS_MODULE_MANIFEST.maxPageSize;
  const all: StudentRecord[] = [];
  let page = 1;
  let total = 0;

  for (;;) {
    const studentsPage = await apiJson<StudentsListPageResult>(
      buildStudentsPageUrl({ ...params, page, limit }),
    );
    all.push(...(studentsPage.students as StudentRecord[]));
    total = studentsPage.total;
    onProgress?.(all.length, total);
    if (!studentsPage.hasMore || page >= 200) break;
    page += 1;
  }

  return all;
}

export function useStudentById(studentId: string | undefined, enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: studentDetailQueryKey(studentId ?? ''),
    queryFn: async () => {
      const studentResponse = await apiJson<{ student: StudentRecord }>(`${STUDENTS_API}/${studentId}`);
      return studentResponse.student as unknown as Student;
    },
    enabled: isAuthenticated && enabled && Boolean(studentId),
    staleTime: 30_000,
  });
}

export function useStudentLinkedContactIds(
  excludeStudentId?: string,
  enabled = true,
) {
  const { isAuthenticated } = useAuth();
  const queryString = excludeStudentId ? `?excludeId=${encodeURIComponent(excludeStudentId)}` : '';
  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, 'linked-contact-ids', excludeStudentId ?? ''] as const,
    queryFn: async () => {
      const linkedContactsResponse = await apiJson<{ contactIds: Array<string | number> }>(`${STUDENTS_API}/linked-contact-ids${queryString}`);
      return linkedContactsResponse.contactIds;
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}

/** Fetches next sequential GR Number based on tenant settings and registration date. */
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
      const nextGrNumberResponse = await apiJson<{ grNumber: string }>(`${STUDENTS_API}/next-gr-number?${queryParams.toString()}`);
      return nextGrNumberResponse.grNumber;
    },
    enabled: isAuthenticated && enabled && Boolean(params.registeredDate),
    staleTime: 15_000,
  });
}

export async function checkStudentRegistrationDuplicate(
  input: StudentDuplicateCheckInput,
): Promise<StudentDuplicateReason | null> {
  const duplicateCheckResponse = await apiJson<{ reason: StudentDuplicateReason | null }>(`${STUDENTS_API}/duplicate-check`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return duplicateCheckResponse.reason;
}

export function useStudentsMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<StudentsCommandMetricsSnapshot>({
    moduleId: STUDENTS_MODULE_MANIFEST.moduleId,
    apiPath: STUDENTS_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
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
      const studentsResponse = await apiJson<{ students: StudentRecord[] }>(`${STUDENTS_API}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ ids: normalized }),
      });
      return studentsResponse.students as unknown as Student[];
    },
    enabled: isAuthenticated && normalized.length > 0,
    staleTime: 30_000,
  });
}

/** Computes server-authoritative widget aggregates for Students module analytics. */
export function useStudentsWidgetAggregates(
  widgets: StudentsWidgetAggregateWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const studentQueries = widgets
    .filter((widget) => widget.collection === 'students')
    .map((widget) => studentsWidgetQueryFromWidget(widget));
  const querySignature = JSON.stringify(studentQueries.map((query) => ({ id: query.id, target: query.targetField, filter: query.filterValue })).sort((a, b) => a.id.localeCompare(b.id)));

  return useQuery({
    queryKey: [...STUDENTS_WIDGET_AGGREGATES_QUERY_KEY, querySignature] as const,
    queryFn: async () => {
      const aggregateResponse = await apiJson<{ results: Record<string, StudentsWidgetAggregateResult> }>(
        `${STUDENTS_API}/widget-aggregates`,
        {
          method: 'POST',
          body: JSON.stringify({ widgets: studentQueries }),
        },
      );
      return aggregateResponse?.results ?? {};
    },
    enabled: isAuthenticated && enabled && studentQueries.length > 0,
    staleTime: 30_000,
  });
}

export type { StudentsWidgetAggregateWidgetInput, StudentNextGrNumberParams, StudentsPaginatedParams };
