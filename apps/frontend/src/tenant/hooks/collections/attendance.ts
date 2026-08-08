/**
 * Cross-module public surface for Attendance Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/attendance/hooks/*`.
 */
export {
  ATTENDANCE_QUERY_KEY,
  ATTENDANCE_METRICS_QUERY_KEY,
  ATTENDANCE_REPORT_AGGREGATES_QUERY_KEY,
  useAttendancePaginated,
  useAttendanceRecords,
  useAttendanceRecordsCollection,
  useAttendanceReportAggregates,
  useAttendanceMutations,
  useAttendanceMetrics,
} from '@/tenant/features/attendance/hooks/useAttendance';
