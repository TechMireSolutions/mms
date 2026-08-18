/**
 * Dashboard preference keys, defaults, and chart-preference storage contracts.
 */
import { z } from "zod";
import type { AppTranslationKey } from "./appTranslations.js";

/** Alert when attendance rate drops below this percent. */
export const DASHBOARD_LOW_ATTENDANCE_THRESHOLD = 75;
/** Mark low-attendance notification urgent below this percent. */
export const DASHBOARD_URGENT_ATTENDANCE_THRESHOLD = 60;


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

// ---------------------------------------------------------------------------
// Server-authoritative preferences write contract (typed `dashboard_preferences`).
// ---------------------------------------------------------------------------

const GRID_MODES = ["comfortable", "compact"] as const;
const ENROLLMENT_CHART_TYPES = ["area", "bar", "line"] as const;
const TREND_CHART_TYPES = ["bar", "line", "area"] as const;
const HASANAT_CHART_TYPES = ["pie", "bar", "radar"] as const;
const ENROLLMENT_COLORS = ["emerald", "blue", "violet", "amber", "red"] as const;

/** PUT /api/dashboard/preferences — layout / chart prefs (passthrough like siblings). */
export const dashboardPreferencesPutBodySchema = z
  .object({
    disabledCardIds: z.array(z.string()).optional(),
    gridMode: z.enum(GRID_MODES).optional(),
    enrollmentChartType: z.enum(ENROLLMENT_CHART_TYPES).optional(),
    enrollmentChartColor: z.enum(ENROLLMENT_COLORS).optional(),
    enrollmentChartPeriod: z.number().optional(),
    revenueChartType: z.enum(TREND_CHART_TYPES).optional(),
    revenueChartColor: z.string().optional(),
    attendanceChartType: z.enum(TREND_CHART_TYPES).optional(),
    attendanceChartColor: z.string().optional(),
    hasanatChartType: z.enum(HASANAT_CHART_TYPES).optional(),
    hasanatChartColor: z.string().optional(),
  })
  .passthrough();

export type DashboardPreferencesPutBody = z.infer<typeof dashboardPreferencesPutBodySchema>;

const DASHBOARD_PREFERENCE_KEYS = [
  "disabledCardIds",
  "gridMode",
  "enrollmentChartType",
  "enrollmentChartColor",
  "enrollmentChartPeriod",
  "revenueChartType",
  "revenueChartColor",
  "attendanceChartType",
  "attendanceChartColor",
  "hasanatChartType",
  "hasanatChartColor",
] as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isOneOf<T extends readonly string[]>(
  value: unknown,
  options: T,
): value is (T)[number] {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

/** Normalize dashboard layout/chart preferences against typed defaults. */
export function normalizeDashboardPreferences(
  partial?: Partial<DashboardPreferences> | Record<string, unknown> | null,
): DashboardPreferences {
  const defaults = DEFAULT_DASHBOARD_PREFERENCES;
  if (!partial || typeof partial !== "object" || Array.isArray(partial)) {
    return { ...defaults };
  }
  const src = partial as Record<string, unknown>;

  return {
    disabledCardIds: isStringArray(src.disabledCardIds)
      ? src.disabledCardIds
      : defaults.disabledCardIds,
    gridMode: isOneOf(src.gridMode, GRID_MODES) ? src.gridMode : defaults.gridMode,
    enrollmentChartType: isOneOf(src.enrollmentChartType, ENROLLMENT_CHART_TYPES)
      ? src.enrollmentChartType
      : defaults.enrollmentChartType,
    enrollmentChartColor: isOneOf(src.enrollmentChartColor, ENROLLMENT_COLORS)
      ? src.enrollmentChartColor
      : defaults.enrollmentChartColor,
    enrollmentChartPeriod:
      typeof src.enrollmentChartPeriod === "number" &&
      Number.isFinite(src.enrollmentChartPeriod) &&
      src.enrollmentChartPeriod > 0
        ? Math.floor(src.enrollmentChartPeriod)
        : defaults.enrollmentChartPeriod,
    revenueChartType: isOneOf(src.revenueChartType, TREND_CHART_TYPES)
      ? src.revenueChartType
      : defaults.revenueChartType,
    revenueChartColor:
      typeof src.revenueChartColor === "string" && src.revenueChartColor
        ? src.revenueChartColor
        : defaults.revenueChartColor,
    attendanceChartType: isOneOf(src.attendanceChartType, TREND_CHART_TYPES)
      ? src.attendanceChartType
      : defaults.attendanceChartType,
    attendanceChartColor:
      typeof src.attendanceChartColor === "string" && src.attendanceChartColor
        ? src.attendanceChartColor
        : defaults.attendanceChartColor,
    hasanatChartType: isOneOf(src.hasanatChartType, HASANAT_CHART_TYPES)
      ? src.hasanatChartType
      : defaults.hasanatChartType,
    hasanatChartColor:
      typeof src.hasanatChartColor === "string" && src.hasanatChartColor
        ? src.hasanatChartColor
        : defaults.hasanatChartColor,
  };
}

export { DASHBOARD_PREFERENCE_KEYS as DASHBOARD_MODULE_PREFERENCE_KEYS };

// ---------------------------------------------------------------------------
// Dashboard metric trends — shared domain contract (FE lib + feature hooks).
// Kept here so `lib/dashboardCollections.ts` does not need to reverse-import
// from `tenant/features/dashboard/hooks/` (feature-boundary violation).
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Dashboard chart option SSOT — shared by all four dashboard chart widgets.
// Replaces per-chart inline `<SelectItem>` lists and inline literal unions.
// ---------------------------------------------------------------------------

/** Chart-type values for the three trend charts (attendance/enrollment/revenue). */
export type DashboardChartType = "bar" | "line" | "area";

/** Chart-type values for the hasanat distribution chart. */
export type HasanatChartType = "pie" | "bar" | "radar";

/** Color-token values selectable across dashboard charts. */
export type ChartColorOption =
  | "emerald"
  | "blue"
  | "violet"
  | "amber"
  | "red"
  | "semantic"
  | "mixed";

export interface ChartOption<V extends string> {
  value: V;
  labelKey: AppTranslationKey;
}

/** Trend-chart type options (bar/line/area) — shared label keys. */
export const DASHBOARD_CHART_TYPE_OPTIONS: readonly ChartOption<DashboardChartType>[] = [
  { value: "bar", labelKey: "dashboard.charts.types.bar" },
  { value: "line", labelKey: "dashboard.charts.types.line" },
  { value: "area", labelKey: "dashboard.charts.types.area" },
];

/** Hasanat chart type options (pie/bar/radar). */
export const DASHBOARD_HASANAT_CHART_TYPE_OPTIONS: readonly ChartOption<HasanatChartType>[] = [
  { value: "pie", labelKey: "dashboard.charts.types.pie" },
  { value: "bar", labelKey: "dashboard.charts.types.bar" },
  { value: "radar", labelKey: "dashboard.charts.types.radar" },
];

/** Full color-option catalogue; charts filter to their supported subset. */
export const DASHBOARD_CHART_COLOR_OPTIONS: readonly ChartOption<ChartColorOption>[] = [
  { value: "semantic", labelKey: "dashboard.charts.colors.semantic" },
  { value: "mixed", labelKey: "dashboard.charts.colors.mixed" },
  { value: "emerald", labelKey: "dashboard.charts.colors.emerald" },
  { value: "blue", labelKey: "dashboard.charts.colors.blue" },
  { value: "violet", labelKey: "dashboard.charts.colors.violet" },
  { value: "amber", labelKey: "dashboard.charts.colors.amber" },
  { value: "red", labelKey: "dashboard.charts.colors.red" },
];

/** Per-chart supported color subsets (preserves existing per-chart palettes). */
export const ATTENDANCE_CHART_COLOR_OPTIONS: readonly ChartColorOption[] = [
  "semantic",
  "emerald",
  "blue",
  "violet",
  "amber",
  "red",
];
export const ENROLLMENT_CHART_COLOR_OPTIONS: readonly ChartColorOption[] = [
  "emerald",
  "blue",
  "violet",
  "amber",
  "red",
];
export const REVENUE_CHART_COLOR_OPTIONS: readonly ChartColorOption[] = [
  "mixed",
  "emerald",
  "violet",
  "blue",
  "amber",
  "red",
];
export const HASANAT_CHART_COLOR_OPTIONS: readonly ChartColorOption[] = [
  "mixed",
  "emerald",
  "blue",
  "violet",
];
