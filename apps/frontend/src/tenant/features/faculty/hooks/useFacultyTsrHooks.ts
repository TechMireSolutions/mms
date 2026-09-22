/**
 * Contract-driven query/mutation hooks for the Faculty module.
 */
import { apiContract, tsr } from '@/lib/api';
import { queryOptions, useQueryClient } from '@tanstack/react-query';
import { FACULTY_QUERY_KEY } from '@/tenant/features/faculty/hooks/facultyQueryKeys';
import { invalidateFacultyQueries } from '@/tenant/features/faculty/hooks/invalidateFacultyQueries';

const facultyClient = tsr.faculty;
const facultyApi = apiContract.faculty;

export function facultyListQueryOptions(query: Record<string, unknown> = {}) {
  return queryOptions({
    queryKey: [...FACULTY_QUERY_KEY, 'contract-list', query] as const,
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
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });
}
export const teachersListQueryOptions = facultyListQueryOptions;


/** Contract-backed paginated list. */
export function useFacultyContractList(query: Record<string, unknown>, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.list.useQuery({
    queryKey: [...FACULTY_QUERY_KEY, 'contract-list', query],
    queryData: { query },
    staleTime: 15_000,
    enabled,
  });
}
export const useTeachersContractList = useFacultyContractList;

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
export const useTeachersContractGet = useFacultyContractGet;

/** Contract-backed create. */
export function useFacultyContractCreate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.create.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}
export const useTeachersContractCreate = useFacultyContractCreate;

/** Contract-backed update. */
export function useFacultyContractUpdate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.update.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}
export const useTeachersContractUpdate = useFacultyContractUpdate;

/** Contract-backed soft-delete. */
export function useFacultyContractDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.delete.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}
export const useTeachersContractDelete = useFacultyContractDelete;

/** Contract-backed bulk status update. */
export function useFacultyContractBulkStatus() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.bulkStatus.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}
export const useTeachersContractBulkStatus = useFacultyContractBulkStatus;

/** Contract-backed duplicate check mutation. */
export function useFacultyContractDuplicateCheck() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.duplicateCheck.useMutation({});
}
export const useTeachersContractDuplicateCheck = useFacultyContractDuplicateCheck;

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
export const useTeachersContractNextEmployeeId = useFacultyContractNextEmployeeId;

/** Contract-backed restore */
export function useFacultyContractRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.restore.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}
export const useTeachersContractRestore = useFacultyContractRestore;

/** Contract-backed bulk delete */
export function useFacultyContractBulkDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.bulkDelete.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}
export const useTeachersContractBulkDelete = useFacultyContractBulkDelete;

/** Contract-backed bulk restore */
export function useFacultyContractBulkRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.bulkRestore.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}
export const useTeachersContractBulkRestore = useFacultyContractBulkRestore;

/** Contract-backed bulk specialization */
export function useFacultyContractBulkSpecialization() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.bulkSpecialization.useMutation({ onSuccess: () => invalidateFacultyQueries(queryClient) });
}
export const useTeachersContractBulkSpecialization = useFacultyContractBulkSpecialization;

/** Contract-backed migrate employee IDs */
export function useFacultyContractMigrateEmployeeIds() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.migrateEmployeeIds.useMutation({});
}
export const useTeachersContractMigrateEmployeeIds = useFacultyContractMigrateEmployeeIds;

/** Contract-backed log export audit */
export function useFacultyContractLogExportAudit() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.exportAudit.useMutation({});
}
export const useTeachersContractLogExportAudit = useFacultyContractLogExportAudit;

/** Contract-backed log setup audit */
export function useFacultyContractLogSetupAudit() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.setupAudit.useMutation({});
}
export const useTeachersContractLogSetupAudit = useFacultyContractLogSetupAudit;

/** Contract-backed hierarchy tree */
export function useFacultyHierarchyTree(enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return facultyClient.hierarchyTree.useQuery({
    queryKey: [...FACULTY_QUERY_KEY, 'hierarchy-tree'],
    enabled,
    staleTime: 60_000,
  });
}
export const useTeachersHierarchyTree = useFacultyHierarchyTree;



