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

  const activeContacts = contacts.filter((contact) => !isContactDeleted(contact));
  const total = activeContacts.length;
  const whatsappCount = activeContacts.filter((contact) => hasWhatsApp(contact)).length;
  const whatsappRate = total > 0 ? Math.round((whatsappCount / total) * 100) : 0;
  const activeCount = activeContacts.filter((contact) => contact.isActive !== false).length;

  const thirtyDaysAgo = new Date(referenceDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(referenceDate);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const newLast30Days = activeContacts.filter((contact) => contact.createdAt && new Date(contact.createdAt) >= thirtyDaysAgo).length;
  const newPrior30Days = activeContacts.filter((contact) => {
    if (!contact.createdAt) return false;
    const created = new Date(contact.createdAt);
    return created >= sixtyDaysAgo && created < thirtyDaysAgo;
  }).length;
  const newThisPeriod = countContactsCreatedSince(activeContacts, periodDays);

  const signupDates = activeContacts
    .map((contact) => (contact.createdAt ? new Date(contact.createdAt).getTime() : 0))
    .filter((timestamp) => timestamp > 0)
    .sort((leftTimestamp, rightTimestamp) => leftTimestamp - rightTimestamp);

  const hasSignupDates = signupDates.length > 0;
  let growthRecentSignups30d = 0;
  let growthPriorSignups30d = 0;

  if (hasSignupDates) {
    const maxDate = new Date(signupDates[signupDates.length - 1]!);
    const latestSignupTime = maxDate.getTime();
    const thirtyDaysBeforeLatest = latestSignupTime - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysBeforeLatest = latestSignupTime - 60 * 24 * 60 * 60 * 1000;

    growthRecentSignups30d = activeContacts.filter((contact) => {
      if (!contact.createdAt) return false;
      const createdTime = new Date(contact.createdAt).getTime();
      return createdTime >= thirtyDaysBeforeLatest && createdTime <= latestSignupTime;
    }).length;

    growthPriorSignups30d = activeContacts.filter((contact) => {
      if (!contact.createdAt) return false;
      const createdTime = new Date(contact.createdAt).getTime();
      return createdTime >= sixtyDaysBeforeLatest && createdTime < thirtyDaysBeforeLatest;
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
  const activeContacts = contacts.filter((contact) => !isContactDeleted(contact));
  const yearStr = String(year);

  return Array.from({ length: monthCount }, (_, monthIndex) => {
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    const count = activeContacts.filter(
      (contact) => contact.createdAt?.includes(`-${monthStr}-`) && contact.createdAt.startsWith(yearStr),
    ).length;
    return { month: MONTH_LABELS[monthIndex] ?? monthStr, count };
  });
}
