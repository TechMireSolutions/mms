import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AttendanceCommandMetricsSnapshot } from '@mms/shared';
import { ATTENDANCE_MODULE_CONTRACT } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { saveCollection } from '@/lib/db';
import { useCollectionSync } from '@/hooks/useCollectionSync';
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import { ATTENDANCE_RECORDS } from '@/lib/data/attendanceData';

export const ATTENDANCE_QUERY_KEY = ['attendance', 'list'] as const;
export const ATTENDANCE_METRICS_QUERY_KEY = ['attendance', 'metrics'] as const;

const ATTENDANCE_API = ATTENDANCE_MODULE_CONTRACT.restBasePath;

export function useAttendanceRecords(options?: { enabled?: boolean }) {
  return useCollectionSync<AttendanceRecord>({
    queryKey: ATTENDANCE_QUERY_KEY,
    apiPath: ATTENDANCE_API,
    responseKey: 'records',
    collectionName: 'attendance_records',
    defaultData: ATTENDANCE_RECORDS,
    staleTime: 15_000,
    enabled: options?.enabled,
  }).queryResult;
}

export function useAttendanceMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ATTENDANCE_METRICS_QUERY_KEY });
  };

  const replaceAll = useMutation({
    mutationFn: async (records: AttendanceRecord[]) =>
      apiJson<{ records: AttendanceRecord[] }>(`${ATTENDANCE_API}/bulk`, {
        method: 'PUT',
        body: JSON.stringify({ records }),
      }),
    onSuccess: (response) => {
      saveCollection('attendance_records', response.records);
      invalidate();
    },
  });

  const createRecord = useMutation({
    mutationFn: async (record: AttendanceRecord) =>
      apiJson<{ record: AttendanceRecord }>(ATTENDANCE_API, {
        method: 'POST',
        body: JSON.stringify(record),
      }),
    onSuccess: invalidate,
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, record }: { id: string; record: AttendanceRecord }) =>
      apiJson<{ record: AttendanceRecord }>(`${ATTENDANCE_API}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(record),
      }),
    onSuccess: invalidate,
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => apiFetch(`${ATTENDANCE_API}/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { replaceAll, createRecord, updateRecord, deleteRecord };
}

/** Query-first attendance; falls back to localStorage cache (hydrated). */
export function useAttendanceRecordsCollection(options?: { enabled?: boolean }): AttendanceRecord[] {
  return useCollectionSync<AttendanceRecord>({
    queryKey: ATTENDANCE_QUERY_KEY,
    apiPath: ATTENDANCE_API,
    responseKey: 'records',
    collectionName: 'attendance_records',
    defaultData: ATTENDANCE_RECORDS,
    staleTime: 15_000,
    enabled: options?.enabled,
  }).syncedData;
}

export function useAttendanceMetrics(selectedDate: string, options?: { enabled?: boolean }) {
  return useServerMetrics<AttendanceCommandMetricsSnapshot>({
    moduleId: ATTENDANCE_MODULE_CONTRACT.moduleId,
    apiPath: ATTENDANCE_MODULE_CONTRACT.restBasePath,
    extraParam: selectedDate,
    enabled: options?.enabled,
  });
}
