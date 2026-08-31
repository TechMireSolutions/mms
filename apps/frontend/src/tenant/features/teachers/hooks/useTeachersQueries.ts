import {
  TEACHERS_MODULE_MANIFEST,
  type Teacher,
  type TeacherDuplicateCheckInput,
  type TeacherDuplicateReason,
  type TeacherRecord,
  type TeachersCommandMetricsSnapshot,
  teachersWidgetQueryFromWidget,
} from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { useAuth } from '@/lib/contexts/AuthContext';

import { tsrClient, apiContract } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { uniqueRegistryIds } from '@/lib/registryResolve';
import {
  TEACHERS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
  type TeacherNextEmployeeIdParams,
  type TeachersWidgetAggregateWidgetInput,
} from '@/tenant/features/teachers/hooks/teachersQueryKeys';
import {
  type TeachersListPageResult,
  type TeachersPaginatedParams,
} from '@/tenant/features/teachers/hooks/teachersListQueryBuilders';

export type { TeachersListPageResult };

/** Fetches all pages matching Work filters for export (parity with Students §8). */
export async function fetchAllTeachersForQuery(
  params: Omit<TeachersPaginatedParams, 'page' | 'enabled'>,
  onProgress?: (fetched: number, total: number) => void,
): Promise<TeacherRecord[]> {
  const limit = TEACHERS_MODULE_MANIFEST.maxPageSize;
  const all: TeacherRecord[] = [];
  let page = 1;
  let total = 0;

  for (;;) {
    const response = await apiContract.teachers.list({
      query: { ...(params), page, limit }
    });
    const teachersPage = response.body as TeachersListPageResult;
    all.push(...(teachersPage.teachers as TeacherRecord[]));
    total = teachersPage.total;
    onProgress?.(all.length, total);
    if (!teachersPage.hasMore || page >= 200) break;
    page += 1;
  }

  return all;
}

export function useTeacherLinkedContactIds(excludeId?: string, enabled = true) {
  const { isAuthenticated } = useAuth();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  const query = tsrClient.teachers.linkedContactIds.useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'linked-contact-ids', excludeId ?? ''] as const,
    queryData: { query: { excludeId } },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
  
  return { ...query, data: (query.data?.body as { contactIds?: Array<string | number> } | null)?.contactIds };
}

export function useTeachersByIds(ids: (string | number | null | undefined)[]) {
  const { isAuthenticated } = useAuth();
  const normalized = (() => uniqueRegistryIds(ids))();
  
  const query = useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'resolve', normalized.join(',')] as const,
    queryFn: async () => {
      const res = await apiContract.teachers.resolve({ body: { ids: normalized } });
      return (res.body as { teachers?: Teacher[] } | null)?.teachers;
    },
    enabled: isAuthenticated && normalized.length > 0,
    staleTime: 30_000,
  });
  
  return { ...query, data: query.data };
}

export function useTeacherNextEmployeeId(params: TeacherNextEmployeeIdParams = {}) {
  const { isAuthenticated } = useAuth();
  const enabled = params.enabled ?? true;

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const query = tsrClient.teachers.nextEmployeeId.useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'next-employee-id', params] as const,
    queryData: { query: { prefix: params.prefix } },
    enabled: isAuthenticated && enabled,
    staleTime: 15_000,
  });
  
  return { ...query, data: (query.data?.body as { employeeId?: string } | null)?.employeeId };
}

/** Server-authoritative active duplicate probe (contact / employeeId) before save. */
export async function checkTeacherRegistrationDuplicate(
  input: TeacherDuplicateCheckInput,
): Promise<TeacherDuplicateReason | null> {
  const res = await apiContract.teachers.duplicateCheck({ body: input });
  if (res.status !== 200) throw new Error("Duplicate check failed");
  return (res.body as { reason?: TeacherDuplicateReason | null } | null)?.reason ?? null;
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

  const queries = (() =>
      widgets
        .filter((widget) => widget.collection === 'teachers')
        .map((widget) => teachersWidgetQueryFromWidget(widget)))();

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
    queryKey: [...TEACHERS_WIDGET_AGGREGATES_QUERY_KEY, querySignature] as const,
    queryFn: async () => {
      const res = await apiContract.teachers.widgetAggregates({ body: { widgets: queries } });
      return (res.body as { results?: Record<string, { value?: number; totalCount?: number; chartData?: Array<{ name: string; value: number }> }> } | null)?.results ?? {};
    },
    enabled: isAuthenticated && enabled && queries.length > 0,
    staleTime: 30_000,
  });
  
  return { ...query, data: query.data ?? {} };
}

/** One-shot employee-id backfill for active teachers missing one (Setup writers). */
export async function migrateTeachersEmployeeIds(): Promise<{ updated: number }> {
  const res = await apiContract.teachers.migrateEmployeeIds({ body: {} });
  if (res.status !== 200) throw new Error("Migration failed");
  return { updated: (res.body as { updated?: number } | null)?.updated ?? 0 };
}

export type { TeachersPaginatedParams, TeacherNextEmployeeIdParams, TeachersWidgetAggregateWidgetInput };
