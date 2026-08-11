import { useQuery } from '@tanstack/react-query';
import {
  TEACHERS_MODULE_MANIFEST,
  type Teacher,
  type TeacherDuplicateCheckInput,
  type TeacherDuplicateReason,
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
  type TeacherNextEmployeeIdParams,
  type TeachersWidgetAggregateWidgetInput,
} from '@/tenant/features/teachers/hooks/teachersQueryKeys';
import {
  buildTeachersPageUrl,
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
    const teachersPage = await apiJson<TeachersListPageResult>(
      buildTeachersPageUrl({ ...params, page, limit }),
    );
    all.push(...(teachersPage.teachers as TeacherRecord[]));
    total = teachersPage.total;
    onProgress?.(all.length, total);
    if (!teachersPage.hasMore || page >= 200) break;
    page += 1;
  }

  return all;
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

/** Server-authoritative active duplicate probe (contact / employeeId) before save. */
export async function checkTeacherRegistrationDuplicate(
  input: TeacherDuplicateCheckInput,
): Promise<TeacherDuplicateReason | null> {
  const duplicateCheckResponse = await apiJson<{ reason: TeacherDuplicateReason | null }>(
    `${TEACHERS_API}/duplicate-check`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return duplicateCheckResponse.reason;
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

/** One-shot employee-id backfill for active teachers missing one (Setup writers). */
export async function migrateTeachersEmployeeIds(): Promise<{ updated: number }> {
  const migrateResponse = await apiJson<{ success: boolean; updated: number }>(
    `${TEACHERS_API}/migrate-employee-ids`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );
  return { updated: migrateResponse.updated ?? 0 };
}

export type { TeachersPaginatedParams, TeacherNextEmployeeIdParams, TeachersWidgetAggregateWidgetInput };
