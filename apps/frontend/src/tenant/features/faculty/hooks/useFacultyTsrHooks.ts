/**
 * Contract-driven query/mutation hooks for the Faculty module.
 */
import {
  FACULTY_MODULE_MANIFEST,
  type FacultyQuickFilter,
  type FacultySortField,
} from '@mms/shared';
import { apiContract, tsr } from '@/lib/api';
import { queryOptions, useQueryClient } from '@tanstack/react-query';
import { FACULTY_QUERY_KEY } from '@/tenant/features/faculty/hooks/facultyQueryKeys';
import {
  facultyListQueryKeyParams,
  facultyPaginatedQueryKey,
  sameFacultyListFilters,
  type FacultyPaginatedParams,
} from '@/tenant/features/faculty/hooks/facultyListQueryBuilders';
import { invalidateFacultyQueries } from '@/tenant/features/faculty/hooks/invalidateFacultyQueries';

function facultyPaginatedParamsFromRecord(query: Record<string, unknown>): FacultyPaginatedParams {
  const page = typeof query.page === 'number' ? query.page : Number(query.page ?? 1);
  const limit = typeof query.limit === 'number' ? query.limit : Number(query.limit ?? FACULTY_MODULE_MANIFEST.defaultPageSize);
  return {
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : FACULTY_MODULE_MANIFEST.defaultPageSize,
    search: typeof query.search === 'string' ? query.search : undefined,
    status: typeof query.status === 'string' ? query.status : undefined,
    specialization: typeof query.specialization === 'string' ? query.specialization : undefined,
    gender: typeof query.gender === 'string' ? query.gender : undefined,
    department: typeof query.department === 'string' ? query.department : undefined,
    designation: typeof query.designation === 'string' ? query.designation : undefined,
    reportingFacultyId:
      typeof query.reportingFacultyId === 'string' ? query.reportingFacultyId : undefined,
    quickFilter:
      typeof query.quickFilter === 'string' ? (query.quickFilter as FacultyQuickFilter) : undefined,
    sortField: typeof query.sortField === 'string' ? (query.sortField as FacultySortField) : undefined,
    sortDir: query.sortDir === 'desc' ? 'desc' : query.sortDir === 'asc' ? 'asc' : undefined,
    includeDeleted: query.includeDeleted === true,
  };
}

const facultyClient = tsr.faculty;
const facultyApi = apiContract.faculty;

export function facultyListQueryOptions(query: Record<string, unknown> = {}) {
  const params = facultyPaginatedParamsFromRecord(query);
  const keyParams = facultyListQueryKeyParams(params);
  return queryOptions({
    queryKey: facultyPaginatedQueryKey(params),
    queryFn: async ({ signal }) => {
      const response = await facultyApi.list({
        query: query as Record<string, string>,
        signal,
        fetchOptions: { signal },
      });
      if (response.status !== 200) {
        throw new Error('Failed to fetch faculty');
      }
      return response.body;
    },
    placeholderData: (previousData, previousQuery) => {
      const previousKey = (previousQuery as unknown as { queryKey?: readonly unknown[] })?.queryKey?.[3];
      return sameFacultyListFilters(
        previousKey as ReturnType<typeof facultyListQueryKeyParams> | undefined,
        keyParams,
      )
        ? previousData
        : undefined;
    },
    staleTime: 15_000,
  });
}



/** Contract-backed paginated list. */
export function useFacultyContractList(query: Record<string, unknown>, enabled = true) {
  const params = facultyPaginatedParamsFromRecord(query);
  const keyParams = facultyListQueryKeyParams(params);
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.list.useQuery({
    queryKey: facultyPaginatedQueryKey(params),
    queryData: { query },
    staleTime: 15_000,
    enabled,
    placeholderData: (previousData: unknown, previousQuery: unknown) => {
      const previousKey = (previousQuery as unknown as { queryKey?: readonly unknown[] })?.queryKey?.[3];
      return sameFacultyListFilters(
        previousKey as ReturnType<typeof facultyListQueryKeyParams> | undefined,
        keyParams,
      )
        ? previousData
        : undefined;
    },
  });
}


/** Contract-backed get by ID. */
export function useFacultyContractGet(id: string, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.get.useQuery({
    queryKey: [...FACULTY_QUERY_KEY, 'contract-get', id],
    queryData: { params: { id } },
    enabled,
    staleTime: 30_000,
  });
}


/** Contract-backed create. */
export function useFacultyContractCreate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.create.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}


/** Contract-backed update. */
export function useFacultyContractUpdate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.update.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}


/** Contract-backed soft-delete. */
export function useFacultyContractDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.delete.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}


/** Contract-backed bulk status update. */
export function useFacultyContractBulkStatus() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.bulkStatus.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}


/** Contract-backed duplicate check mutation. */
export function useFacultyContractDuplicateCheck() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.duplicateCheck.useMutation({});
}


/** Contract-backed next employee ID query. */
export function useFacultyContractNextEmployeeId(query: { prefix?: string }, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.nextEmployeeId.useQuery({
    queryKey: [...FACULTY_QUERY_KEY, 'next-employee-id', query],
    queryData: { query },
    enabled,
    staleTime: 0,
  });
}


/** Contract-backed restore */
export function useFacultyContractRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.restore.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}


/** Contract-backed bulk delete */
export function useFacultyContractBulkDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.bulkDelete.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}


/** Contract-backed bulk restore */
export function useFacultyContractBulkRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.bulkRestore.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}


/** Contract-backed bulk specialization */
export function useFacultyContractBulkSpecialization() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.bulkSpecialization.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}


/** Contract-backed migrate employee IDs */
export function useFacultyContractMigrateEmployeeIds() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.migrateEmployeeIds.useMutation({});
}


/** Contract-backed log export audit */
export function useFacultyContractLogExportAudit() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.exportAudit.useMutation({});
}


/** Contract-backed log setup audit */
export function useFacultyContractLogSetupAudit() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.setupAudit.useMutation({});
}

