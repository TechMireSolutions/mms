import type { Contact } from './contactTypes.js';
import { isContactDeleted } from './contactSoftDelete.js';
import { hasWhatsApp } from './utils.js';
import {
  CONTACT_METRICS_DEFAULT_PERIOD_DAYS,
  countContactsCreatedSince,
} from './contactsMetricsUtils.js';

export interface ContactsReportAnalyticsSnapshot {
  total: number;
  activeCount: number;
  whatsappCount: number;
  whatsappRate: number;
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

export interface ComputeContactsReportAnalyticsOptions {
  periodDays?: number;
  referenceDate?: Date;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** Server/client CRM report aggregates (globle2 §10 — no full list on Reports tier). */
export function computeContactsReportAnalytics(
  contacts: Contact[],
  options: ComputeContactsReportAnalyticsOptions = {},
): ContactsReportAnalyticsSnapshot {
  const periodDays = options.periodDays ?? CONTACT_METRICS_DEFAULT_PERIOD_DAYS;
  const referenceDate = options.referenceDate ?? new Date();

  const active = contacts.filter((c) => !isContactDeleted(c));
  const total = active.length;
  const whatsappCount = active.filter((c) => hasWhatsApp(c)).length;
  const whatsappRate = total > 0 ? Math.round((whatsappCount / total) * 100) : 0;
  const activeCount = active.filter((c) => c.isActive !== false).length;

  const thirtyDaysAgo = new Date(referenceDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(referenceDate);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const newLast30Days = active.filter((c) => c.createdAt && new Date(c.createdAt) >= thirtyDaysAgo).length;
  const newPrior30Days = active.filter((c) => {
    if (!c.createdAt) return false;
    const created = new Date(c.createdAt);
    return created >= sixtyDaysAgo && created < thirtyDaysAgo;
  }).length;
  const newThisPeriod = countContactsCreatedSince(active, periodDays);

  const signupDates = active
    .map((c) => (c.createdAt ? new Date(c.createdAt).getTime() : 0))
    .filter((t) => t > 0)
    .sort((a, b) => a - b);

  const hasSignupDates = signupDates.length > 0;
  let growthRecentSignups30d = 0;
  let growthPriorSignups30d = 0;

  if (hasSignupDates) {
    const maxDate = new Date(signupDates[signupDates.length - 1]!);
    const t0 = maxDate.getTime();
    const t30 = t0 - 30 * 24 * 60 * 60 * 1000;
    const t60 = t0 - 60 * 24 * 60 * 60 * 1000;

    growthRecentSignups30d = active.filter((c) => {
      if (!c.createdAt) return false;
      const t = new Date(c.createdAt).getTime();
      return t >= t30 && t <= t0;
    }).length;

    growthPriorSignups30d = active.filter((c) => {
      if (!c.createdAt) return false;
      const t = new Date(c.createdAt).getTime();
      return t >= t60 && t < t30;
    }).length;
  }

  return {
    total,
    activeCount,
    whatsappCount,
    whatsappRate,
    newLast30Days,
    newPrior30Days,
    newThisPeriod,
    hasSignupDates,
    growthRecentSignups30d,
    growthPriorSignups30d,
  };
}

/** Monthly signup counts for year-over-year comparison charts. */
export function computeContactsMonthlyCreatedCounts(
  contacts: Contact[],
  year: number,
  monthCount = 6,
): { month: string; count: number }[] {
  const active = contacts.filter((c) => !isContactDeleted(c));
  const yearStr = String(year);

  return Array.from({ length: monthCount }, (_, i) => {
    const monthStr = String(i + 1).padStart(2, '0');
    const count = active.filter(
      (c) => c.createdAt?.includes(`-${monthStr}-`) && c.createdAt.startsWith(yearStr),
    ).length;
    return { month: MONTH_LABELS[i] ?? monthStr, count };
  });
}
