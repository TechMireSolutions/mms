/**
 * Server-authoritative dashboard widget write contract.
 * The FE `CustomWidget` interface (`apps/frontend/src/lib/reports/pinnedWidgetTypes.ts`)
 * remains the app-side canonical type; this Zod schema is the FE↔BE wire DTO persisted on
 * the typed `dashboard_widgets` table (indexed columns + jsonb `config` for the remainder).
 */
import { z } from "zod";

const WIDGET_TYPES = [
  "kpi",
  "progress",
  "switch",
  "chart",
  "sessions-list",
  "attendance-summary",
  "fee-summary",
  "outstanding-list",
  "overdue-obligations",
  "enrollment-trends",
  "revenue-expenses",
  "attendance-rate",
  "hasanat-distribution",
  "card",
] as const;

const OPERATIONS = ["count", "sum", "avg", "percentage"] as const;
const SUB_TEXT_TYPES = ["fixed", "dynamic"] as const;
const TREND_TYPES = ["manual", "database"] as const;
const SWITCH_ACTION_TYPES = ["app_setting", "db_record"] as const;
const THRESHOLD_CONDITIONS = ["lt", "gt", "equals"] as const;
const THRESHOLD_COLORS = ["red", "amber", "yellow"] as const;
const FILTER_OPERATORS = ["equals", "contains", "gt", "lt"] as const;
const CHART_TYPES = ["bar", "line", "area", "pie", "radar", "kpi", "progress", "switch"] as const;

/** Single dashboard widget — strict write DTO (no unknown keys accepted). */
export const customWidgetSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    titleKey: z.string().optional(),
    category: z.string(),
    collection: z.string(),
    widgetType: z.enum(WIDGET_TYPES).optional(),
    icon: z.string().optional(),
    subTextType: z.enum(SUB_TEXT_TYPES).optional(),
    fixedSubText: z.string().optional(),
    fixedSubTextKey: z.string().optional(),
    trend: z.number().optional(),
    trendType: z.enum(TREND_TYPES).optional(),
    role: z.string().optional(),
    switchActionType: z.enum(SWITCH_ACTION_TYPES).optional(),
    switchStateKey: z.string().optional(),
    switchLabelOn: z.string().optional(),
    switchLabelOff: z.string().optional(),
    switchLabelOnKey: z.string().optional(),
    switchLabelOffKey: z.string().optional(),
    switchCollection: z.string().optional(),
    switchRecordId: z.string().optional(),
    switchField: z.string().optional(),
    thresholdEnabled: z.boolean().optional(),
    thresholdCondition: z.enum(THRESHOLD_CONDITIONS).optional(),
    thresholdValue: z.number().optional(),
    thresholdColor: z.enum(THRESHOLD_COLORS).optional(),
    chartType: z.enum(CHART_TYPES).optional(),
    xAxisField: z.string().optional(),
    operation: z.enum(OPERATIONS),
    targetField: z.string().optional(),
    filterField: z.string().optional(),
    filterOperator: z.enum(FILTER_OPERATORS).optional(),
    filterValue: z.string().optional(),
    color: z.string(),
    isPinnedToDashboard: z.boolean(),
    /** Stable pin order within the dashboard layout (BE defaults to array index). */
    sortOrder: z.number().optional(),
  })
  .strict();

/** Dashboard widget DTO crossing the FE↔BE boundary. */
export type DashboardWidgetDto = z.infer<typeof customWidgetSchema>;

/** PUT /api/dashboard/widgets — bulk upsert (insert + update; no wipe). */
export const dashboardWidgetsPutBodySchema = z
  .array(customWidgetSchema)
  .max(500, "Too many widgets in one request");

export type DashboardWidgetsPutBody = z.infer<typeof dashboardWidgetsPutBodySchema>;

/** Indexed columns projected onto `dashboard_widgets` typed fields. */
export const DASHBOARD_WIDGET_INDEXED_KEYS = [
  "id",
  "widgetType",
  "category",
  "collection",
  "role",
  "isPinnedToDashboard",
  "title",
  "icon",
  "color",
  "operation",
  "sortOrder",
] as const;