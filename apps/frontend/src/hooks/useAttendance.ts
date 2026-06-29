import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AttendanceCommandMetricsSnapshot, ModuleColumnPref } from '@mms/shared';
import { ATTENDANCE_MODULE_CONTRACT } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { readModuleColumnPreferences, writeModuleColumnPreferences, type ModuleColumnPreferencesResponse } from '@/lib/moduleColumnPreferencesApi';
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import { ATTENDANCE_RECORDS } from '@/lib/data/attendanceData';

export const ATTENDANCE_QUERY_KEY = ['attendance', 'list'] as const;
export const ATTENDANCE_METRICS_QUERY_KEY = ['attendance', 'metrics'] as const;
export const ATTENDANCE_COLUMN_PREFS_QUERY_KEY = [
  ATTENDANCE_MODULE_CONTRACT.collectionKey,
  'column-preferences',
] as const;

const ATTENDANCE_API = ATTENDANCE_MODULE_CONTRACT.restBasePath;

async function fetchAttendanceRecords(): Promise<AttendanceRecord[]> {
  const body = await apiJson<{ records: AttendanceRecord[] }>(ATTENDANCE_API);
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
  const enabled = options?.enabled ?? true;
  const { data: queryRecords = [] } = useAttendanceRecords({ enabled });
  const localRecords = useLiveCollection<AttendanceRecord>('attendance_records', ATTENDANCE_RECORDS, { enabled });
  if (!enabled) return [];
  if (queryRecords.length > 0) {
    return queryRecords;
  }
  return localRecords;
}

export function useAttendanceMetrics(selectedDate: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...ATTENDANCE_METRICS_QUERY_KEY, selectedDate] as const,
    queryFn: async () => {
      const queryString = selectedDate ? `?date=${encodeURIComponent(selectedDate)}` : '';
      const body = await apiJson<{ metrics: AttendanceCommandMetricsSnapshot }>(
        `${ATTENDANCE_API}/metrics${queryString}`,
      );
      return body.metrics;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useAttendanceColumnPrefs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ATTENDANCE_COLUMN_PREFS_QUERY_KEY,
    queryFn: async () => {
      const body = await apiJson<ModuleColumnPreferencesResponse>(
        `${ATTENDANCE_API}/column-preferences`,
      );
      return readModuleColumnPreferences(body);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useAttendanceColumnPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: ModuleColumnPref[]) =>
      apiJson<ModuleColumnPreferencesResponse>(`${ATTENDANCE_API}/column-preferences`, {
        method: 'PUT',
        body: writeModuleColumnPreferences(preferences),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(ATTENDANCE_COLUMN_PREFS_QUERY_KEY, readModuleColumnPreferences(response));
    },
  });
}
