/**
 * Phase 7: Contract-driven query/mutation hooks for the Students module.
 * Uses tsrClient (@ts-rest/react-query v5) for full contract schema enforcement.
 */
import { tsrClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { STUDENTS_QUERY_KEY } from '@/tenant/features/students/hooks/studentsQueryKeys';
import { invalidateStudentsQueries } from '@/tenant/features/students/hooks/invalidateStudentsQueries';
import { SESSIONS_QUERY_KEY } from '@/tenant/hooks/collections/sessions';

export function useStudentsContractList(
  query: { page?: number; limit?: number; search?: string; sessionId?: string; className?: string; [key: string]: unknown },
  enabled = true,
) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.list.useQuery({ queryKey: [...STUDENTS_QUERY_KEY, 'contract', query], queryData: { query }, staleTime: 15_000, enabled });
}

export function useStudentsContractCreate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.create.useMutation({ onSuccess: () => invalidateStudentsQueries(queryClient) });
}

export function useStudentsContractUpdate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.update.useMutation({ onSuccess: () => invalidateStudentsQueries(queryClient) });
}

export function useStudentsContractDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.delete.useMutation({ onSuccess: () => invalidateStudentsQueries(queryClient) });
}

export function useStudentsContractBulkStatus() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.bulkStatus.useMutation({ onSuccess: () => invalidateStudentsQueries(queryClient) });
}

export function useStudentsContractBulkEnroll() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.bulkEnroll.useMutation({ 
    onSuccess: () => {
      void invalidateStudentsQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: [SESSIONS_QUERY_KEY] });
    }
  });
}

export function useStudentsContractNextGrNumber(
  query: { registeredDate: string; template?: string; digits?: number; restartAnnually?: 'true' | 'false' },
  enabled = true,
) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.nextGrNumber.useQuery({ queryKey: [STUDENTS_QUERY_KEY, 'next-gr', query], queryData: { query }, staleTime: 0, enabled });
}

export function useStudentsContractDuplicateCheck() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.duplicateCheck.useMutation({});
}

export function useStudentsContractRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.restore.useMutation({ onSuccess: () => invalidateStudentsQueries(queryClient) });
}

export function useStudentsContractBulkDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.bulkDelete.useMutation({ onSuccess: () => invalidateStudentsQueries(queryClient) });
}

export function useStudentsContractBulkRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.bulkRestore.useMutation({ onSuccess: () => invalidateStudentsQueries(queryClient) });
}

export function useStudentsContractLogExportAudit() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.exportAudit.useMutation({});
}

export function useStudentsContractLogSetupAudit() {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.students.setupAudit.useMutation({});
}
