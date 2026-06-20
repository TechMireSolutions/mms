import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import { ATTENDANCE_RECORDS } from '@/lib/data/attendanceData';

export const ATTENDANCE_QUERY_KEY = ['attendance', 'list'] as const;

async function fetchAttendanceRecords(): Promise<AttendanceRecord[]> {
  const body = await apiJson<{ records: AttendanceRecord[] }>('/api/attendance');
  saveCollection('attendance_records', body.records);
  return getCollection<AttendanceRecord>('attendance_records', []);
}

export function useAttendanceRecords(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ATTENDANCE_QUERY_KEY,
    queryFn: fetchAttendanceRecords,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 15_000,
  });
}

export function useAttendanceMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEY });
  };

  const replaceAll = useMutation({
    mutationFn: async (records: AttendanceRecord[]) =>
      apiJson<{ records: AttendanceRecord[] }>('/api/attendance/bulk', {
        method: 'PUT',
        body: JSON.stringify({ records }),
      }),
    onSuccess: (data) => {
      saveCollection('attendance_records', data.records);
      invalidate();
    },
  });

  const createRecord = useMutation({
    mutationFn: async (record: AttendanceRecord) =>
      apiJson<{ record: AttendanceRecord }>('/api/attendance', {
        method: 'POST',
        body: JSON.stringify(record),
      }),
    onSuccess: invalidate,
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, record }: { id: string; record: AttendanceRecord }) =>
      apiJson<{ record: AttendanceRecord }>(`/api/attendance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(record),
      }),
    onSuccess: invalidate,
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/attendance/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { replaceAll, createRecord, updateRecord, deleteRecord };
}

/** Query-first attendance; falls back to localStorage cache (hydrated). */
export function useAttendanceRecordsCollection(options?: { enabled?: boolean }): AttendanceRecord[] {
  const enabled = options?.enabled ?? true;
  const { data: fromQuery = [] } = useAttendanceRecords({ enabled });
  const fromLocal = useLiveCollection<AttendanceRecord>('attendance_records', ATTENDANCE_RECORDS, { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery;
  }
  return fromLocal;
}
