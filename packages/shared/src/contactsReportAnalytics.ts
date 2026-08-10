export interface ContactsReportAnalyticsSnapshot {
  total: number;
  activeCount: number;
  whatsappCount: number;
  whatsappRate: number;
  missingInfoCount: number;
  newLast30Days: number;
  newPrior30Days: number;
  newThisPeriod: number;
  hasSignupDates: boolean;
  growthRecentSignups30d: number;
  growthPriorSignups30d: number;
}

export interface ContactsMonthlyYearCounts {
  year: number;
  months: { month: string; count: number }[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** Localized short month labels for comparison charts (falls back to English abbreviations). */
export function formatContactsMonthLabels(
  language = 'en',
  monthCount = 12,
): string[] {
  const locale = language.trim() || 'en';
  try {
    const formatter = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
    return Array.from({ length: monthCount }, (_, monthIndex) => {
      const label = formatter.format(new Date(Date.UTC(2020, monthIndex, 1)));
      return label || MONTH_LABELS[monthIndex] || String(monthIndex + 1);
    });
  } catch {
    return MONTH_LABELS.slice(0, monthCount).map(String);
  }
}
