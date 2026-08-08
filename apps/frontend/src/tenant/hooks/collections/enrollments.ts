/**
 * Cross-module public surface for Enrollments Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/enrollments/hooks/*`.
 */
export {
  ENROLLMENTS_QUERY_KEY,
  ENROLLMENTS_METRICS_QUERY_KEY,
  ENROLLMENTS_REPORT_AGGREGATES_QUERY_KEY,
  ENROLLMENTS_WIDGET_AGGREGATES_QUERY_KEY,
  useEnrollments,
  useEnrollmentsPaginated,
  useEnrollmentsCollection,
  useEnrollmentMutations,
  useEnrollmentsMetrics,
  useEnrollmentsReportAggregates,
  useEnrollmentsWidgetAggregates,
} from '@/tenant/features/enrollments/hooks/useEnrollmentsApi';
