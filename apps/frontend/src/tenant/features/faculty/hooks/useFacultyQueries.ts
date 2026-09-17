import {
  FACULTY_MODULE_MANIFEST,
  type Faculty,
  type FacultyDuplicateCheckInput,
  type FacultyDuplicateReason,
  type FacultyRecord,
  type FacultyCommandMetricsSnapshot,
  facultyWidgetQueryFromWidget,
  type TeacherDuplicateCheckInput,
  type TeacherDuplicateReason,
  type TeachersCommandMetricsSnapshot,
  teachersWidgetQueryFromWidget,
} from '@mms/shared';
import { serverMetricsQueryOptions, useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';

import { apiContract } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { uniqueRegistryIds } from '@/lib/registryResolve';
import {
  FACULTY_QUERY_KEY,
  FACULTY_WIDGET_AGGREGATES_QUERY_KEY,
  type FacultyNextEmployeeIdParams,
  type FacultyWidgetAggregateWidgetInput,
  type TeacherNextEmployeeIdParams,
  type TeachersWidgetAggregateWidgetInput,
} from '@/tenant/features/faculty/hooks/facultyQueryKeys';
import {
  type FacultyListPageResult,
  type FacultyPaginatedParams,
  type TeachersListPageResult,
  type TeachersPaginatedParams,
} from '@/tenant/features/faculty/hooks/facultyListQueryBuilders';

export type {
  FacultyListPageResult,
  FacultyPaginatedParams,
  FacultyNextEmployeeIdParams,
  FacultyWidgetAggregateWidgetInput,
  TeachersListPageResult,
  TeachersPaginatedParams,
  TeacherNextEmployeeIdParams,
  TeachersWidgetAggregateWidgetInput,
};

export function facultyCommandMetricsQueryOptions() {
  return serverMetricsQueryOptions<FacultyCommandMetricsSnapshot | TeachersCommandMetricsSnapshot>({
    moduleId: FACULTY_MODULE_MANIFEST.moduleId,
    apiPath: FACULTY_MODULE_MANIFEST.restBasePath,
  });
}
export const teachersCommandMetricsQueryOptions = facultyCommandMetricsQueryOptions;

/** Fetches all pages matching Work filters for export (parity with Students §8). */
export async function fetchAllFacultyForQuery(
  params: Omit<FacultyPaginatedParams, 'page' | 'enabled'>,
  onProgress?: (fetched: number, total: number) => void,
): Promise<FacultyRecord[]> {
  const limit = FACULTY_MODULE_MANIFEST.maxPageSize;
  const all: FacultyRecord[] = [];
  let page = 1;
  let total = 0;

  for (;;) {
    const response = await apiContract.teachers.list({
      query: { ...(params), page, limit }
    });
    const facultyPage = response.body as FacultyListPageResult;
    all.push(...(facultyPage.teachers as FacultyRecord[]));
    total = facultyPage.total;
    onProgress?.(all.length, total);
    if (!facultyPage.hasMore) break;
    if (page >= 200) {
      throw new Error('Faculty export exceeds the 100,000-record safety limit; narrow the filters.');
    }
    page += 1;
  }

  return all;
}
export const fetchAllTeachersForQuery = fetchAllFacultyForQuery;

export function useFacultyLinkedContactIds(excludeId?: string, enabled = true) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: [...FACULTY_QUERY_KEY, 'linked-contact-ids', excludeId ?? ''] as const,
    queryFn: async ({ signal }) => {
      const res = await apiContract.teachers.linkedContactIds({
        query: { excludeId },
        fetchOptions: { signal },
      });
      if (res.status !== 200) {
        throw new Error('Failed to fetch linked contact IDs');
      }
      const body = res.body as { contactIds?: Array<string | number> } | undefined;
      return body?.contactIds ?? [];
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}
export const useTeacherLinkedContactIds = useFacultyLinkedContactIds;

export function useFacultyByIds(ids: (string | number | null | undefined)[]) {
  const { isAuthenticated } = useAuth();
  const normalized = (() => uniqueRegistryIds(ids))();
  
  const query = useQuery({
    queryKey: [...FACULTY_QUERY_KEY, 'resolve', normalized.join(',')] as const,
    queryFn: async () => {
      const res = await apiContract.teachers.resolve({ body: { ids: normalized } });
      return (res.body as { teachers?: Faculty[] } | null)?.teachers;
    },
    enabled: isAuthenticated && normalized.length > 0,
    staleTime: 30_000,
  });
  
  return { ...query, data: query.data };
}
export const useTeachersByIds = useFacultyByIds;

export function useFacultyNextEmployeeId(params: FacultyNextEmployeeIdParams = {}) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;

  return useQuery({
    queryKey: [...FACULTY_QUERY_KEY, 'next-employee-id', params] as const,
    queryFn: async ({ signal }) => {
      const res = await apiContract.teachers.nextEmployeeId({
        query: {
          prefix: params.prefix,
          template: params.template,
          digits: params.digits,
          startSeq: params.startSeq,
          restartAnnually: params.restartAnnually,
        },
        fetchOptions: { signal },
      });
      if (res.status !== 200) {
        throw new Error('Failed to fetch next employee ID');
      }
      const body = res.body as { employeeId?: string } | undefined;
      return typeof body?.employeeId === 'string' ? body.employeeId : '';
    },
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
  });
}
export const useTeacherNextEmployeeId = useFacultyNextEmployeeId;

/** Server-authoritative active duplicate probe (contact / employeeId) before save. */
export async function checkFacultyRegistrationDuplicate(
  input: FacultyDuplicateCheckInput | TeacherDuplicateCheckInput,
): Promise<FacultyDuplicateReason | TeacherDuplicateReason | null> {
  const res = await apiContract.teachers.duplicateCheck({ body: input });
  if (res.status !== 200) throw new Error("Duplicate check failed");
  return (res.body as { reason?: FacultyDuplicateReason | null } | null)?.reason ?? null;
}
export const checkTeacherRegistrationDuplicate = checkFacultyRegistrationDuplicate;

export function useFacultyMetrics(options?: { enabled?: boolean }) {
  return useServerMetrics<FacultyCommandMetricsSnapshot | TeachersCommandMetricsSnapshot>({
    moduleId: FACULTY_MODULE_MANIFEST.moduleId,
    apiPath: FACULTY_MODULE_MANIFEST.restBasePath,
    enabled: options?.enabled,
  });
}
export const useTeachersMetrics = useFacultyMetrics;

const toWidgetQuery = facultyWidgetQueryFromWidget || teachersWidgetQueryFromWidget;

export function useFacultyWidgetAggregates(
  widgets: FacultyWidgetAggregateWidgetInput[],
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;

  const queries = (() =>
      widgets
        .filter((widget) => widget.collection === 'teachers' || widget.collection === 'faculty')
        .map((widget) => toWidgetQuery(widget)))();

  const querySignature = (() => {
    return JSON.stringify(
      [...queries]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((query) => ({
          id: query.id,
          target: query.targetField,
          filter: query.filterValue,
          filterOperator: query.filterOperator,
          xAxis: query.xAxisField,
        })),
    );
  })();

  const query = useQuery({
    queryKey: [...FACULTY_WIDGET_AGGREGATES_QUERY_KEY, querySignature] as const,
    queryFn: async () => {
      const res = await apiContract.teachers.widgetAggregates({ body: { widgets: queries } });
      return (res.body as { results?: Record<string, { value?: number; totalCount?: number; chartData?: Array<{ name: string; value: number }> }> } | null)?.results ?? {};
    },
    enabled: isAuthenticated && enabled && queries.length > 0,
    staleTime: 30_000,
  });
  
  return { ...query, data: query.data ?? {} };
}
export const useTeachersWidgetAggregates = useFacultyWidgetAggregates;

/** One-shot employee-id backfill for active faculty missing one (Setup writers). */
export async function migrateFacultyEmployeeIds(): Promise<{ updated: number }> {
  const res = await apiContract.teachers.migrateEmployeeIds({ body: {} });
  if (res.status !== 200) throw new Error("Migration failed");
  return { updated: (res.body as { updated?: number } | null)?.updated ?? 0 };
}
export const migrateTeachersEmployeeIds = migrateFacultyEmployeeIds;

