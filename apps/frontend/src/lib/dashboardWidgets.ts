import type { AppTranslationKey } from '@mms/shared';
import type { CustomWidget } from '@/components/reports/pinnedWidgets/types';

/** i18n keys for seeded default widgets (user-created widgets keep custom `title`). */
export const DEFAULT_WIDGET_TITLE_KEYS: Partial<Record<string, AppTranslationKey>> = {
  'def-card-admin-students': 'widget.title.totalStudents',
  'def-card-admin-attendance': 'widget.title.attendanceToday',
  'def-card-admin-fees': 'widget.title.feeCollection',
  'def-card-admin-outstanding': 'widget.title.outstandingPayments',
  'def-card-admin-hasanat': 'widget.title.hasanatAwarded',
  'def-card-admin-sessions': 'widget.title.activeSessions',
  'def-card-admin-classes': 'widget.title.activeClasses',
  'def-card-teacher-attendance': 'widget.title.attendanceToday',
  'def-card-teacher-hasanat': 'widget.title.hasanatAwarded',
  'def-card-teacher-classes': 'widget.title.myClasses',
  'def-card-teacher-sessions': 'widget.title.sessionsToday',
  'def-card-accountant-fees': 'widget.title.feeCollection',
  'def-card-accountant-outstanding': 'widget.title.outstandingPayments',
  'def-card-accountant-revenue': 'widget.title.totalRevenueYtd',
  'def-card-accountant-expenses': 'widget.title.totalExpensesYtd',
  'def-contacts-total': 'widget.title.totalContacts',
  'def-contacts-conversion': 'widget.title.activeLeadsRate',
  'def-students-kpi': 'widget.title.activeStudents',
  'def-attendance-summary': 'widget.title.todaysAttendanceSummary',
  'def-enrollment-trends': 'widget.title.enrollmentTrends',
  'def-attendance-rate': 'widget.title.attendanceRate',
  'def-finance-outstanding': 'widget.title.overduePayments',
  'def-finance-paid-rate': 'widget.title.paidInvoicesRatio',
  'def-fee-summary': 'widget.title.feeCollectionSummary',
  'def-outstanding-list': 'widget.title.outstandingInvoicesList',
  'def-overdue-obligations': 'widget.title.overdueObligations',
  'def-revenue-expenses': 'widget.title.revenueExpenses',
  'def-hasanat-points': 'widget.title.totalPointsIssued',
  'def-hasanat-distribution': 'widget.title.hasanatDistribution',
  'def-sessions-count': 'widget.title.activeSessions',
  'def-sessions-list': 'widget.title.activeSessionsList',
};

export function resolveWidgetTitle(
  widget: Pick<CustomWidget, 'id' | 'title' | 'titleKey'>,
  t: (key: AppTranslationKey) => string,
): string {
  const key = widget.titleKey ?? DEFAULT_WIDGET_TITLE_KEYS[widget.id];
  if (key) return t(key);
  return widget.title;
}
