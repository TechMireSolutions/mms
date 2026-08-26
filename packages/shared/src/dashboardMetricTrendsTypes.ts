/**
 * Dashboard metric trend domain contracts (FE lib + feature hooks).
 */

/** Trend metric domain buckets resolved from a seeded widget id. */
export type DashboardTrendMetric =
  | "attendance"
  | "fees"
  | "outstanding"
  | "hasanat"
  | "sessions"
  | "contacts"
  | "students"
  | "teachers";

/** Live trend snapshots computed from server `/metrics` aggregates. */
export interface DashboardMetricTrends {
  studentTrend: number;
  teacherTrend: number;
  contactTrend: number;
  attendanceTrend: number;
  feesTrend: number;
  outstandingTrend: number;
  hasanatTrend: number;
  sessionsTrend: number;
}
