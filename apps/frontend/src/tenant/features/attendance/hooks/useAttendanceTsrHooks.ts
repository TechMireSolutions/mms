/**
 * Phase 7: Contract-driven query/mutation hooks for the Attendance module.
 */
import { tsrClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { ATTENDANCE_QUERY_KEY } from '@/tenant/features/attendance/hooks/useAttendance';
import { invalidateAttendanceQueries } from '@/tenant/features/attendance/hooks/invalidateAttendanceQueries';

export function useAttendanceContractList(query: Record<string, unknown>, enabled = true) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.attendance.list.useQuery({
    queryKey: [...ATTENDANCE_QUERY_KEY, 'contract', query],
    queryData: { query: query as any },
    staleTime: 15_000,
    enabled,
  });
}

export function useAttendanceContractCreate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.attendance.create.useMutation({ onSuccess: () => invalidateAttendanceQueries(queryClient) });
}

export function useAttendanceContractBulk() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.attendance.bulk.useMutation({ onSuccess: () => invalidateAttendanceQueries(queryClient) });
}

export function useAttendanceContractBulkDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.attendance.bulkDelete.useMutation({ onSuccess: () => invalidateAttendanceQueries(queryClient) });
}

export function useAttendanceContractBulkRestore() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.attendance.bulkRestore.useMutation({ onSuccess: () => invalidateAttendanceQueries(queryClient) });
}

export function useAttendanceContractUpdate() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.attendance.update.useMutation({ onSuccess: () => invalidateAttendanceQueries(queryClient) });
}

export function useAttendanceContractDelete() {
  const queryClient = useQueryClient();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.attendance.delete.useMutation({ onSuccess: () => invalidateAttendanceQueries(queryClient) });
}
