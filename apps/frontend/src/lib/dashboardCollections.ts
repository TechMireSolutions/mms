import type { ReportCollection } from '@/lib/reports/reportMetadata';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import { widgetMatchesDashboardRole, type DashboardRole } from '@/lib/dashboardRole';
import { isSeededDashboardWidget, DASHBOARD_WIDGET_REGISTRY } from '@/lib/dashboardWidgets';
import {
  type DashboardTrendMetric,
  type DashboardMetricTrends,
  SESSIONS_MODULE_MANIFEST,
  ATTENDANCE_MODULE_MANIFEST,
  HASANAT_MODULE_MANIFEST,
  FINANCE_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
  TEACHERS_MODULE_MANIFEST,
  CONTACTS_MODULE_MANIFEST,
  QUESTION_BANK_MODULE_MANIFEST,
  ACCOUNTING_MODULE_MANIFEST,
} from '@mms/shared';

export type { DashboardTrendMetric };

const REVENUE_WIDGET_TYPES = new Set(['revenue-expenses']);

/**
 * Maps report collections to Settings → System Modules keys.
 * Single source for dashboard card visibility vs enabledModules.
 */
export const DASHBOARD_COLLECTION_MODULE_ID: Partial<Record<ReportCollection, string>> = {
  sessions: SESSIONS_MODULE_MANIFEST.moduleId,
  attendance_records: ATTENDANCE_MODULE_MANIFEST.moduleId,
  hasanat_distributions: HASANAT_MODULE_MANIFEST.moduleId,
  finance_invoices: FINANCE_MODULE_MANIFEST.moduleId,
  students: STUDENTS_MODULE_MANIFEST.moduleId,
  teachers: TEACHERS_MODULE_MANIFEST.moduleId,
  contacts: CONTACTS_MODULE_MANIFEST.moduleId,
  questions: QUESTION_BANK_MODULE_MANIFEST.moduleId,
  tests: QUESTION_BANK_MODULE_MANIFEST.moduleId,
  assessment_results: QUESTION_BANK_MODULE_MANIFEST.moduleId,
};

/** Widget ids that require the accounting module (not finance alone). */
export const DASHBOARD_ACCOUNTING_WIDGET_IDS = new Set([
  'def-card-accountant-revenue',
  'def-card-accountant-expenses',
  'def-revenue-expenses',
  'def-finance-toggle-rev',
]);

export const TREND_METRIC_KEY_MAP: Record<DashboardTrendMetric, keyof DashboardMetricTrends> = {
  attendance: 'attendanceTrend',
  fees: 'feesTrend',
  outstanding: 'outstandingTrend',
  hasanat: 'hasanatTrend',
  sessions: 'sessionsTrend',
  contacts: 'contactTrend',
  students: 'studentTrend',
  teachers: 'teacherTrend',
};


/** Filters custom widgets to active card-type widgets matching the dashboard role. */
export function filterDashboardCardWidgets(
  widgets: CustomWidget[],
  dashboardRole: DashboardRole,
): CustomWidget[] {
  return widgets.filter(
    (widget) => widget.widgetType === 'card' && widgetMatchesDashboardRole(widget.role, dashboardRole),
  );
}


/**
 * Whether a dashboard card/widget should show given enabledModules.
 * Accounting-tagged finance cards require the accounting module.
 */
export function isDashboardWidgetModuleEnabled(
  widget: Pick<CustomWidget, 'id' | 'collection' | 'category'>,
  enabledModules: Record<string, boolean | undefined>,
): boolean {
  const isModuleEnabled = (moduleId: string) => enabledModules[moduleId] !== false;
  const collection = widget.collection;

  if (collection === 'finance_invoices') {
    if (
      DASHBOARD_ACCOUNTING_WIDGET_IDS.has(widget.id) ||
      widget.category === ACCOUNTING_MODULE_MANIFEST.moduleId
    ) {
      return isModuleEnabled(ACCOUNTING_MODULE_MANIFEST.moduleId);
    }
    return isModuleEnabled(FINANCE_MODULE_MANIFEST.moduleId);
  }

  const moduleId = DASHBOARD_COLLECTION_MODULE_ID[collection];
  if (!moduleId) return true;
  return isModuleEnabled(moduleId);
}

/** Explicit trend source for seeded metric cards — sourced from
 *  `DASHBOARD_WIDGET_REGISTRY` (see `dashboardWidgets.ts`). Custom cards
 *  fall back to id heuristics below. */
export function resolveDashboardTrendMetric(
  widgetId: string,
): DashboardTrendMetric | undefined {
  const mapped = DASHBOARD_WIDGET_REGISTRY[widgetId]?.trendMetric;
  if (mapped) return mapped;

  // Custom (non-seeded) cards: best-effort id heuristics.
  const id = widgetId.toLowerCase();
  if (id.includes('attendance') || id.includes('rate')) return 'attendance';
  if (id.includes('fees') || id.includes('revenue') || id.includes('income')) return 'fees';
  if (id.includes('outstanding') || id.includes('debt') || id.includes('overdue')) return 'outstanding';
  if (id.includes('hasanat') || id.includes('points')) return 'hasanat';
  if (id.includes('sessions') || id.includes('classes')) return 'sessions';
  return undefined;
}

/** Predicate checking if a widget is active (pinned or role-scoped metric card) on the dashboard layout. */
export function isWidgetActiveForDashboard(
  widget: Pick<CustomWidget, 'role' | 'widgetType' | 'isPinnedToDashboard'>,
  dashboardRole: DashboardRole,
): boolean {
  return (
    Boolean(widget.isPinnedToDashboard) ||
    (widget.widgetType === 'card' && widgetMatchesDashboardRole(widget.role, dashboardRole))
  );
}

/** Filters widgets matching a specific collection that are active for the active dashboard role. */
export function filterDashboardWidgetsByCollection(
  widgets: CustomWidget[],
  collection: ReportCollection,
  dashboardRole: DashboardRole,
): CustomWidget[] {
  return widgets.filter(
    (widget) => widget.collection === collection && isWidgetActiveForDashboard(widget, dashboardRole),
  );
}

/**
 * Collections referenced by visible dashboard cards and pinned widgets.
 * Used to gate `/metrics` fetches — not full collection dumps.
 */
export function getRequiredDashboardCollections(
  widgets: CustomWidget[],
  dashboardRole: DashboardRole,
): Set<ReportCollection> {
  const required = new Set<ReportCollection>();

  for (const widget of widgets) {
    const isActive = isWidgetActiveForDashboard(widget, dashboardRole);
    const isPinnedWidget = Boolean(widget.isPinnedToDashboard);

    if (isActive) {
      required.add(widget.collection);
    }

    if (isPinnedWidget && widget.widgetType && REVENUE_WIDGET_TYPES.has(widget.widgetType)) {
      required.add('finance_invoices');
    }
  }

  return required;
}

/** Returns custom (user-created, non-seeded) card widget IDs active for the active dashboard role. */
export function getActiveCustomCardIds(
  widgets: CustomWidget[],
  dashboardRole: DashboardRole,
): string[] {
  return filterDashboardCardWidgets(widgets, dashboardRole)
    .filter((widget) => !isSeededDashboardWidget(widget.id))
    .map((widget) => widget.id);
}

/** Count of widgets pinned to the dashboard layout. */
export function getPinnedDashboardWidgetCount(widgets: CustomWidget[]): number {
  return widgets.filter((widget) => widget.isPinnedToDashboard).length;
}


