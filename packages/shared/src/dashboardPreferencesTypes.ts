/**
 * Dashboard preference keys, defaults, and chart-preference storage contracts.
 */

export interface DashboardPreferences {
  disabledCardIds: string[];
  gridMode: "comfortable" | "compact";
  enrollmentChartType: "area" | "bar" | "line";
  enrollmentChartColor: "emerald" | "blue" | "violet" | "amber" | "red";
  enrollmentChartPeriod: number;
  revenueChartType: "bar" | "line" | "area";
  revenueChartColor: string;
  attendanceChartType: "bar" | "line" | "area";
  attendanceChartColor: string;
  hasanatChartType: "pie" | "bar" | "radar";
  hasanatChartColor: string;
}

export const DASHBOARD_DISABLED_CARDS_KEY = "mms_dashboard_disabled_cards";
export const DASHBOARD_WIDGETS_KEY = "kpi_custom_widgets";
export const DASHBOARD_PREFERENCES_KEY = "mms_dashboard_preferences";

export const PINNED_WIDGETS_GRID_MODE_KEY = "pinned_widgets_grid_mode";

export const ENROLLMENT_CHART_TYPE_KEY = "db_chart_type_enrollment";
export const ENROLLMENT_CHART_COLOR_KEY = "db_chart_color_enrollment";
export const ENROLLMENT_CHART_PERIOD_KEY = "db_chart_period_enrollment";

export const REVENUE_CHART_TYPE_KEY = "db_chart_type_revenue";
export const REVENUE_CHART_COLOR_KEY = "db_chart_color_revenue";

export const ATTENDANCE_CHART_TYPE_KEY = "db_chart_type_attendance";
export const ATTENDANCE_CHART_COLOR_KEY = "db_chart_color_attendance";

export const HASANAT_CHART_TYPE_KEY = "db_chart_type_hasanat";
export const HASANAT_CHART_COLOR_KEY = "db_chart_color_hasanat";

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  disabledCardIds: [],
  gridMode: "comfortable",
  enrollmentChartType: "area",
  enrollmentChartColor: "emerald",
  enrollmentChartPeriod: 10,
  revenueChartType: "bar",
  revenueChartColor: "mixed",
  attendanceChartType: "bar",
  attendanceChartColor: "semantic",
  hasanatChartType: "pie",
  hasanatChartColor: "mixed",
};
