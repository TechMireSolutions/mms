import type { AppTranslationKey } from '@mms/shared';

/** Prefix for seeded default dashboard/report widgets (`widgetDefaults`). */
export const SEED_WIDGET_ID_PREFIX = 'def-';

/** True when the widget id is a system-seeded default (not user-created). */
export function isSeededDashboardWidget(widgetId: string): boolean {
  return widgetId.startsWith(SEED_WIDGET_ID_PREFIX);
}

/** Minimal widget/card shape for title/subtitle resolution. */
export type WidgetI18nSource = {
  id: string;
  title: string;
  titleKey?: AppTranslationKey;
  fixedSubText?: string;
  fixedSubTextKey?: AppTranslationKey;
};

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
  'def-card-admin-contacts': 'widget.title.totalContacts',
  'def-card-accountant-contacts': 'widget.title.totalContacts',
  'def-contacts-total': 'widget.title.totalContacts',
  'def-contacts-whatsapp': 'widget.title.whatsappVerifiedRate',
  'def-students-kpi': 'widget.title.activeStudents',
  'def-students-lock': 'widget.title.attendanceLocking',
  'def-attendance-summary': 'widget.title.todaysAttendanceSummary',
  'def-enrollment-trends': 'widget.title.enrollmentTrends',
  'def-attendance-rate': 'widget.title.attendanceRate',
  'def-finance-outstanding': 'widget.title.overduePayments',
  'def-finance-paid-rate': 'widget.title.paidInvoicesRatio',
  'def-finance-toggle-rev': 'widget.title.showRevenueGraph',
  'def-fee-summary': 'widget.title.feeCollectionSummary',
  'def-outstanding-list': 'widget.title.outstandingInvoicesList',
  'def-overdue-obligations': 'widget.title.overdueObligations',
  'def-revenue-expenses': 'widget.title.revenueExpenses',
  'def-hasanat-points': 'widget.title.totalPointsIssued',
  'def-hasanat-distribution': 'widget.title.hasanatDistribution',
  'def-sessions-count': 'widget.title.activeSessions',
  'def-sessions-list': 'widget.title.activeSessionsList',
  'def-sessions-toggle-grid': 'widget.title.dashboardSessionList',
};

/** i18n keys for seeded default card subtitles (user-created widgets keep custom `fixedSubText`). */
export const DEFAULT_WIDGET_SUBTEXT_KEYS: Partial<Record<string, AppTranslationKey>> = {
  'def-card-admin-contacts': 'widget.subtitle.totalContacts',
  'def-card-accountant-contacts': 'widget.subtitle.totalContacts',
  'def-card-admin-students': 'widget.subtitle.registeredStudents',
  'def-card-admin-attendance': 'widget.subtitle.attendanceRateToday',
  'def-card-teacher-attendance': 'widget.subtitle.averagePresentRate',
  'def-card-admin-fees': 'widget.subtitle.thisMonth',
  'def-card-accountant-fees': 'widget.subtitle.thisMonth',
  'def-card-admin-outstanding': 'widget.subtitle.unpaidInvoices',
  'def-card-accountant-outstanding': 'widget.subtitle.unpaidInvoices',
  'def-card-accountant-revenue': 'widget.subtitle.fromInvoices',
  'def-card-accountant-expenses': 'widget.subtitle.totalDiscountOffset',
  'def-card-admin-hasanat': 'widget.subtitle.allTimePoints',
  'def-card-teacher-hasanat': 'widget.subtitle.awardedByMe',
  'def-card-admin-sessions': 'widget.subtitle.activeSessions',
  'def-card-teacher-sessions': 'widget.subtitle.fromActiveSessions',
  'def-card-admin-classes': 'widget.subtitle.allActiveClasses',
  'def-card-teacher-classes': 'widget.subtitle.activeClassesCount',
};

const LOWERCASE_KEYS = Object.values(DEFAULT_WIDGET_TITLE_KEYS).reduce<Record<string, AppTranslationKey>>((acc, key) => {
  if (key) {
    acc[key.toLowerCase()] = key;
  }
  return acc;
}, {});

export function resolveWidgetTitle(
  widget: WidgetI18nSource,
  t: (key: AppTranslationKey) => string,
): string {
  const rawKey = widget.titleKey ?? DEFAULT_WIDGET_TITLE_KEYS[widget.id];
  if (rawKey) {
    const normalized = rawKey.toLowerCase();
    const key = LOWERCASE_KEYS[normalized] ?? (rawKey.startsWith('Widget.title.')
      ? (`widget.title.${rawKey.substring(13)}` as AppTranslationKey)
      : rawKey);
    return t(key);
  }
  return widget.title;
}

/** Resolve card subtitle: keyed defaults first, then user fixed text. Empty string if neither. */
export function resolveWidgetSubText(
  widget: WidgetI18nSource,
  t: (key: AppTranslationKey) => string,
): string {
  const key = widget.fixedSubTextKey ?? DEFAULT_WIDGET_SUBTEXT_KEYS[widget.id];
  if (key) return t(key);
  return widget.fixedSubText ?? '';
}
