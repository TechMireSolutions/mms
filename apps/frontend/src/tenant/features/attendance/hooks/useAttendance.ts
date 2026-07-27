import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AttendanceCommandMetricsSnapshot, AttendanceListPageResult } from '@mms/shared';
import { ATTENDANCE_MODULE_MANIFEST } from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { useCollectionSync } from '@/hooks/useCollectionSync';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import { ATTENDANCE_RECORDS } from '@/lib/data/attendanceData';

export const ATTENDANCE_QUERY_KEY = ['attendance', 'list'] as const;
export const ATTENDANCE_METRICS_QUERY_KEY = ['attendance', 'metrics'] as const;

const ATTENDANCE_API = ATTENDANCE_MODULE_MANIFEST.restBasePath;

export interface AttendancePaginatedParams {
  page: number;
  limit?: number;
  search?: string;
  classId?: string;
  date?: string;
  status?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  includeDeleted?: boolean;
  enabled?: boolean;
}

function buildAttendancePageUrl(params: AttendancePaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit ?? ATTENDANCE_MODULE_MANIFEST.defaultPageSize));
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.classId?.trim()) queryParams.set('classId', params.classId.trim());
  if (params.date?.trim()) queryParams.set('date', params.date.trim());
  if (params.status?.trim()) queryParams.set('status', params.status.trim());
  if (params.sortField?.trim()) queryParams.set('sortField', params.sortField.trim());
  if (params.sortDir) queryParams.set('sortDir', params.sortDir);
  if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
  return `${ATTENDANCE_API}?${queryParams.toString()}`;
}

export function useAttendancePaginated(params: AttendancePaginatedParams) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...ATTENDANCE_QUERY_KEY, 'page', params] as const,
    queryFn: () => apiJson<AttendanceListPageResult>(buildAttendancePageUrl(params)),
    enabled: isAuthenticated && (params.enabled ?? true),
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
  });
}

export function useAttendanceRecords(options?: { enabled?: boolean }) {
  return useCollectionSync<AttendanceRecord>({
    queryKey: ATTENDANCE_QUERY_KEY,
    apiPath: `${ATTENDANCE_API}?page=1&limit=${ATTENDANCE_MODULE_MANIFEST.maxPageSize}`,
    responseKey: 'records',
    collectionName: 'attendance_records',
    defaultData: ATTENDANCE_RECORDS,
    staleTime: 15_000,
    enabled: options?.enabled,
  });
}

export function useAttendanceMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ATTENDANCE_METRICS_QUERY_KEY });
  };

  /** Bulk upsert. The legacy name is retained for callers while the endpoint remains PUT /bulk. */
  const bulkUpsert = useMutation({
    mutationFn: async (records: AttendanceRecord[]) =>
      apiJson<{ records: AttendanceRecord[] }>(`${ATTENDANCE_API}/bulk`, {
        method: 'PUT',
        body: JSON.stringify({ records }),
      }),
    onSuccess: invalidate,
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

  const restoreRecord = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${ATTENDANCE_API}/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
      }),
    onSuccess: invalidate,
  });

  const bulkDeleteRecords = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${ATTENDANCE_API}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidate,
  });

  const bulkRestoreRecords = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${ATTENDANCE_API}/bulk-restore`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidate,
  });

  return {
    bulkUpsert,
    replaceAll: bulkUpsert,
    createRecord,
    updateRecord,
    deleteRecord,
    restoreRecord,
    bulkDeleteRecords,
    bulkRestoreRecords,
  };
}

/** Query-first attendance; falls back to localStorage cache (hydrated). */
export function useAttendanceRecordsCollection(options?: { enabled?: boolean }): AttendanceRecord[] {
  return useAttendanceRecords(options).syncedData;
}

export function useAttendanceMetrics(selectedDate: string, options?: { enabled?: boolean }) {
  return useServerMetrics<AttendanceCommandMetricsSnapshot>({
    moduleId: ATTENDANCE_MODULE_MANIFEST.moduleId,
    apiPath: ATTENDANCE_MODULE_MANIFEST.restBasePath,
    extraParam: selectedDate,
    enabled: options?.enabled,
  });
}
