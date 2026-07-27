import type { ReportCollection } from '@/lib/reports/reportMetadata';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import { widgetMatchesDashboardRole, type DashboardRole } from '@/lib/dashboardRole';

const REVENUE_WIDGET_TYPES = new Set(['revenue-expenses']);

/**
 * Maps report collections to Settings → System Modules keys.
 * Single source for dashboard card visibility vs enabledModules.
 */
export const DASHBOARD_COLLECTION_MODULE_ID: Partial<Record<ReportCollection, string>> = {
  sessions: 'sessions',
  attendance_records: 'attendance',
  hasanat_distributions: 'hasanat',
  finance_invoices: 'finance',
  students: 'students',
  teachers: 'teachers',
  contacts: 'contacts',
  questions: 'questionBank',
  tests: 'questionBank',
  assessment_results: 'questionBank',
};

/** Widget ids that require the accounting module (not finance alone). */
export const DASHBOARD_ACCOUNTING_WIDGET_IDS = new Set([
  'def-card-accountant-revenue',
  'def-card-accountant-expenses',
  'def-revenue-expenses',
  'def-finance-toggle-rev',
]);

export type DashboardTrendMetric =
  | 'attendance'
  | 'fees'
  | 'outstanding'
  | 'hasanat'
  | 'sessions'
  | 'contacts'
  | 'students'
  | 'teachers';

/** Explicit trend source for seeded metric cards (avoids id.includes heuristics). */
export const DASHBOARD_WIDGET_TREND_METRIC: Partial<Record<string, DashboardTrendMetric>> = {
  'def-card-admin-attendance': 'attendance',
  'def-card-teacher-attendance': 'attendance',
  'def-attendance-rate': 'attendance',
  'def-card-admin-fees': 'fees',
  'def-card-accountant-fees': 'fees',
  'def-fee-summary': 'fees',
  'def-card-admin-outstanding': 'outstanding',
  'def-card-accountant-outstanding': 'outstanding',
  'def-finance-outstanding': 'outstanding',
  'def-outstanding-list': 'outstanding',
  'def-card-admin-hasanat': 'hasanat',
  'def-card-teacher-hasanat': 'hasanat',
  'def-hasanat-points': 'hasanat',
  'def-card-admin-sessions': 'sessions',
  'def-card-teacher-sessions': 'sessions',
  'def-sessions-count': 'sessions',
  'def-card-admin-contacts': 'contacts',
  'def-card-accountant-contacts': 'contacts',
  'def-contacts-total': 'contacts',
  'def-card-admin-students': 'students',
  'def-students-kpi': 'students',
};

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
      widget.category === 'accounting'
    ) {
      return isModuleEnabled('accounting');
    }
    return isModuleEnabled('finance');
  }

  const moduleId = DASHBOARD_COLLECTION_MODULE_ID[collection];
  if (!moduleId) return true;
  return isModuleEnabled(moduleId);
}

export function resolveDashboardTrendMetric(
  widgetId: string,
): DashboardTrendMetric | undefined {
  const mapped = DASHBOARD_WIDGET_TREND_METRIC[widgetId];
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

/** Collections referenced by visible dashboard cards and pinned widgets. */
export function getRequiredDashboardCollections(
  widgets: CustomWidget[],
  dashboardRole: DashboardRole,
): Set<ReportCollection> {
  const required = new Set<ReportCollection>([
    'sessions',
    'finance_invoices',
    'attendance_records',
  ]);

  for (const widget of widgets) {
    const cardForDashboardRole =
      widget.widgetType === 'card' && widgetMatchesDashboardRole(widget.role, dashboardRole);
    const isPinnedWidget = widget.isPinnedToDashboard;

    if (cardForDashboardRole || isPinnedWidget) {
      required.add(widget.collection);
    }

    if (isPinnedWidget && widget.widgetType && REVENUE_WIDGET_TYPES.has(widget.widgetType)) {
      // revenue-expenses chart reads the revenue_expenses document collection
      required.add('finance_invoices');
    }
  }

  return required;
}
