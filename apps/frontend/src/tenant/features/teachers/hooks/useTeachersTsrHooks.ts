/**
 * Phase 7: Contract-driven query/mutation hooks for the Teachers module.
 */
import { tsrClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { TEACHERS_QUERY_KEY } from '@/tenant/features/teachers/hooks/teachersQueryKeys';
import { invalidateTeachersQueries } from '@/tenant/features/teachers/hooks/invalidateTeachersQueries';

/** Contract-backed paginated list. */
export function useTeachersContractList(query: Record<string, unknown>, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.list.useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'contract-list', query],
    queryData: { query },
    staleTime: 15_000,
    enabled,
  });
}

/** Contract-backed get by ID. */
export function useTeachersContractGet(id: string, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.get.useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'contract-get', id],
    queryData: { params: { id } },
    enabled,
    staleTime: 30_000,
  });
}

/** Contract-backed create. */
export function useTeachersContractCreate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.create.useMutation({ onSuccess: () => invalidateTeachersQueries(queryClient) });
}

/** Contract-backed update. */
export function useTeachersContractUpdate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.update.useMutation({ onSuccess: () => invalidateTeachersQueries(queryClient) });
}

/** Contract-backed soft-delete. */
export function useTeachersContractDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.delete.useMutation({ onSuccess: () => invalidateTeachersQueries(queryClient) });
}

/** Contract-backed bulk status update. */
export function useTeachersContractBulkStatus() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.bulkStatus.useMutation({ onSuccess: () => invalidateTeachersQueries(queryClient) });
}

/** Contract-backed duplicate check mutation. */
export function useTeachersContractDuplicateCheck() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.duplicateCheck.useMutation({});
}

/** Contract-backed next employee ID query. */
export function useTeachersContractNextEmployeeId(query: { prefix?: string }, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.nextEmployeeId.useQuery({
    queryKey: [TEACHERS_QUERY_KEY, 'next-employee-id', query],
    queryData: { query },
    enabled,
    staleTime: 0,
  });
}

/** Contract-backed restore */
export function useTeachersContractRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.restore.useMutation({ onSuccess: () => invalidateTeachersQueries(queryClient) });
}

/** Contract-backed bulk delete */
export function useTeachersContractBulkDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.bulkDelete.useMutation({ onSuccess: () => invalidateTeachersQueries(queryClient) });
}

/** Contract-backed bulk restore */
export function useTeachersContractBulkRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.bulkRestore.useMutation({ onSuccess: () => invalidateTeachersQueries(queryClient) });
}

/** Contract-backed bulk specialization */
export function useTeachersContractBulkSpecialization() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.bulkSpecialization.useMutation({ onSuccess: () => invalidateTeachersQueries(queryClient) });
}

/** Contract-backed migrate employee IDs */
export function useTeachersContractMigrateEmployeeIds() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.migrateEmployeeIds.useMutation({});
}

/** Contract-backed log export audit */
export function useTeachersContractLogExportAudit() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.exportAudit.useMutation({});
}

/** Contract-backed log setup audit */
export function useTeachersContractLogSetupAudit() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.teachers.setupAudit.useMutation({});
}
