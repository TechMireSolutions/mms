import type { ReportCollection } from '@/components/reports/reportMetadata';
import type { CustomWidget } from '@/components/reports/pinnedWidgets/types';
import { widgetMatchesPersona, type DashboardPersona } from '@/lib/dashboardPersona';

const REVENUE_WIDGET_TYPES = new Set(['revenue-expenses']);

/** Collections referenced by visible dashboard cards and pinned widgets. */
export function getRequiredDashboardCollections(
  widgets: CustomWidget[],
  persona: DashboardPersona,
): Set<ReportCollection> {
  const required = new Set<ReportCollection>([
    'students',
    'sessions',
    'finance_invoices',
    'attendance_records',
  ]);

  for (const widget of widgets) {
    const cardForPersona =
      widget.widgetType === 'card' && widgetMatchesPersona(widget.role, persona);
    const pinned = widget.isPinnedToDashboard;

    if (cardForPersona || pinned) {
      required.add(widget.collection);
    }

    if (pinned && widget.widgetType && REVENUE_WIDGET_TYPES.has(widget.widgetType)) {
      // revenue-expenses chart reads the revenue_expenses document collection
      required.add('finance_invoices');
    }
  }

  return required;
}
