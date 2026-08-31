import { useQueryClient } from '@tanstack/react-query';
import type {
  AttendanceCommandMetricsSnapshot,
  AttendanceListPageResult,
  AttendanceReportAggregates,
  AttendanceReportComparisonQuery,
} from '@mms/shared';
import {
  ATTENDANCE_MODULE_MANIFEST,
  normalizeAttendanceReportComparisonQuery,
} from '@mms/shared';
import { useServerMetrics } from '@/hooks/useServerMetrics';
import { tsrClient } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { AttendanceRecord } from '@/lib/data/attendanceData';

export const ATTENDANCE_QUERY_KEY = ['attendance', 'list'] as const;
export const ATTENDANCE_METRICS_QUERY_KEY = ['attendance', 'metrics'] as const;
export const ATTENDANCE_REPORT_AGGREGATES_QUERY_KEY = [
  ATTENDANCE_MODULE_MANIFEST.collectionKey,
  'report-aggregates',
] as const;

const ATTENDANCE_API = ATTENDANCE_MODULE_MANIFEST.restBasePath;

export interface AttendancePaginatedParams {
  page: number;
  limit?: number;
  search?: string;
  sessionId?: string;
  classId?: string;
  teacherId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  includeDeleted?: boolean;
  enabled?: boolean;
}

export function useAttendancePaginated(params: AttendancePaginatedParams) {
  const { isAuthenticated } = useAuth();
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  
  const query = tsrClient.attendance.list.useQuery({
    queryKey: [...ATTENDANCE_QUERY_KEY, 'page', params] as const,
    queryData: {
      query: {
        page: params.page,
        limit: params.limit ?? ATTENDANCE_MODULE_MANIFEST.defaultPageSize,
        search: params.search?.trim(),
        sessionId: params.sessionId?.trim(),
        classId: params.classId?.trim(),
        teacherId: params.teacherId?.trim(),
        date: params.date?.trim(),
        dateFrom: params.dateFrom?.trim(),
        dateTo: params.dateTo?.trim(),
        status: params.status?.trim(),
        sortField: params.sortField?.trim(),
        sortDir: params.sortDir,
        includeDeleted: params.includeDeleted ? 'true' : undefined,
      },
    },
    enabled: isAuthenticated && (params.enabled ?? true),
    staleTime: 15_000,
    placeholderData: (previousData: any) => previousData,
  });
  
  return { ...query, data: query.data?.body as AttendanceListPageResult | undefined };
}

export function useAttendanceRecords(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuth();
  // @ts-expect-error - TS union discrimination limit with ts-rest
  const query = tsrClient.attendance.list.useQuery({
    queryKey: ATTENDANCE_QUERY_KEY,
    queryData: {
      query: { page: 1, limit: ATTENDANCE_MODULE_MANIFEST.maxPageSize },
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 15_000,
  });
  
  const records = query.data?.body ? (query.data.body as any).records ?? [] : [];
  return { ...query, data: records as AttendanceRecord[] };
}

export function useAttendanceRecordsCollection(options?: { enabled?: boolean }): AttendanceRecord[] {
  return useAttendanceRecords(options).data ?? [];
}

export function useAttendanceMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ATTENDANCE_METRICS_QUERY_KEY });
  };

  /** Bulk upsert. The legacy name is retained for callers while the endpoint remains PUT /bulk. */
  // @ts-expect-error - TS union discrimination limit with ts-rest
  const bulkUpsert = tsrClient.attendance.bulk.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const createRecord = tsrClient.attendance.create.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const updateRecord = tsrClient.attendance.update.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const deleteRecord = tsrClient.attendance.delete.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const restoreRecord = tsrClient.attendance.restore.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const bulkDeleteRecords = tsrClient.attendance.bulkDelete.useMutation({
    onSuccess: invalidate,
  });

  // @ts-expect-error - TS union discrimination limit with ts-rest

  const bulkRestoreRecords = tsrClient.attendance.bulkRestore.useMutation({
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


export function useAttendanceReportAggregates(
  options?: {
    enabled?: boolean;
    classId?: string;
    comparison?: AttendanceReportComparisonQuery;
  },
) {
  const { isAuthenticated } = useAuth();
  const enabled = options?.enabled ?? true;
  const comparison = normalizeAttendanceReportComparisonQuery(options?.comparison);
  const classId = options?.classId?.trim() || undefined;
  // @ts-expect-error - TS union discrimination limit with ts-rest
  const query = tsrClient.attendance.reportAggregates.useQuery({
    queryKey: [...ATTENDANCE_REPORT_AGGREGATES_QUERY_KEY, classId ?? null, comparison ?? null] as const,
    queryData: {
      query: {
        classId,
        sessionIds: comparison?.sessionIds?.length ? comparison.sessionIds.join(',') : undefined,
        rangeAFrom: comparison?.rangeAFrom,
        rangeATo: comparison?.rangeATo,
        rangeBFrom: comparison?.rangeBFrom,
        rangeBTo: comparison?.rangeBTo,
      },
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });

  return {
    ...query,
    data: query.data?.status === 200
      ? query.data.body as AttendanceReportAggregates
      : undefined,
  };
}

export function useAttendanceMetrics(selectedDate: string, options?: { enabled?: boolean }) {
  return useServerMetrics<AttendanceCommandMetricsSnapshot>({
    moduleId: ATTENDANCE_MODULE_MANIFEST.moduleId,
    apiPath: ATTENDANCE_MODULE_MANIFEST.restBasePath,
    extraParam: selectedDate,
    enabled: options?.enabled,
  });
}
