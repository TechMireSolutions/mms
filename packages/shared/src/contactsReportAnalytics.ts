import type { Contact } from './contactTypes.js';
import { isContactDeleted } from './contactSoftDelete.js';
import { hasWhatsApp } from './utils.js';
import {
  CONTACT_METRICS_DEFAULT_PERIOD_DAYS,
  countContactsCreatedSince,
} from './contactsMetricsUtils.js';

export interface ContactsStageMetric {
  stage: string;
  count: number;
  conversionRate: number;
  activeCount: number;
  avgRating: number;
  whatsappCount: number;
}

export interface ContactsReportAnalyticsSnapshot {
  total: number;
  activeCount: number;
  leadsCount: number;
  conversionRate: number;
  whatsappCount: number;
  whatsappRate: number;
  stageDistribution: { stage: string; count: number }[];
  stageMetrics: ContactsStageMetric[];
  newLast30Days: number;
  newPrior30Days: number;
  newThisPeriod: number;
  hasSignupDates: boolean;
  growthRecentSignups30d: number;
  growthPriorSignups30d: number;
  enquiriesCount: number;
  recentEnquiries7d: number;
  ratedCount: number;
  avgRating: number;
  engagementIndex: string;
}

export interface ContactsMonthlyYearCounts {
  year: number;
  months: { month: string; count: number }[];
}

export interface ComputeContactsReportAnalyticsOptions {
  defaultStage?: string;
  periodDays?: number;
  referenceDate?: Date;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function isLeadContact(contact: Contact, defaultStage: string): boolean {
  return (contact.lifecycleStage || defaultStage) === defaultStage;
}

function stageShareConversionRate(count: number, total: number): number {
  return total > 0 ? Math.min(100, Math.round((count / total) * 200)) : 0;
}

/** Server/client CRM report aggregates (globle2 §10 — no full list on Reports tier). */
export function computeContactsReportAnalytics(
  contacts: Contact[],
  options: ComputeContactsReportAnalyticsOptions = {},
): ContactsReportAnalyticsSnapshot {
  const defaultStage = options.defaultStage ?? 'Lead';
  const periodDays = options.periodDays ?? CONTACT_METRICS_DEFAULT_PERIOD_DAYS;
  const ref = options.referenceDate ?? new Date();

  const active = contacts.filter((c) => !isContactDeleted(c));
  const total = active.length;
  const leadsCount = active.filter((c) => isLeadContact(c, defaultStage)).length;
  const conversionRate = total > 0 ? Math.round(((total - leadsCount) / total) * 100) : 0;
  const whatsappCount = active.filter((c) => hasWhatsApp(c)).length;
  const whatsappRate = total > 0 ? Math.round((whatsappCount / total) * 100) : 0;
  const activeCount = active.filter((c) => c.isActive !== false).length;

  const stageCounts: Record<string, number> = {};
  active.forEach((c) => {
    const stage = c.lifecycleStage || defaultStage;
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  });

  const stageDistribution = Object.entries(stageCounts).map(([stage, count]) => ({ stage, count }));

  const stageMetrics: ContactsStageMetric[] = Object.entries(stageCounts).map(([stage, count]) => {
    const inStage = active.filter((c) => (c.lifecycleStage || defaultStage) === stage);
    const withRating = inStage.filter((c) => typeof c.rating === 'number');
    const avgRating =
      withRating.length > 0
        ? parseFloat((withRating.reduce((sum, c) => sum + (c.rating || 0), 0) / withRating.length).toFixed(1))
        : 0;
    return {
      stage,
      count,
      conversionRate: stageShareConversionRate(count, total),
      activeCount: inStage.filter((c) => c.isActive !== false).length,
      avgRating,
      whatsappCount: inStage.filter((c) => hasWhatsApp(c)).length,
    };
  });

  const thirtyDaysAgo = new Date(ref);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(ref);
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
  let recentEnquiries7d = 0;

  if (hasSignupDates) {
    const maxDate = new Date(signupDates[signupDates.length - 1]!);
    const t0 = maxDate.getTime();
    const t30 = t0 - 30 * 24 * 60 * 60 * 1000;
    const t60 = t0 - 60 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = t0 - 7 * 24 * 60 * 60 * 1000;

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

    recentEnquiries7d = active.filter((c) => {
      if (!isLeadContact(c, defaultStage)) return false;
      if (!c.createdAt) return false;
      return new Date(c.createdAt).getTime() >= sevenDaysAgo;
    }).length;
  }

  const ratedContacts = active.filter((c) => typeof c.rating === 'number' && c.rating > 0);
  const ratedCount = ratedContacts.length;
  const avgRating =
    ratedCount > 0 ? ratedContacts.reduce((sum, c) => sum + (c.rating || 0), 0) / ratedCount : 4.2;
  const engagementIndex = (avgRating * 2).toFixed(1);

  return {
    total,
    activeCount,
    leadsCount,
    conversionRate,
    whatsappCount,
    whatsappRate,
    stageDistribution,
    stageMetrics,
    newLast30Days,
    newPrior30Days,
    newThisPeriod,
    hasSignupDates,
    growthRecentSignups30d,
    growthPriorSignups30d,
    enquiriesCount: leadsCount,
    recentEnquiries7d,
    ratedCount,
    avgRating,
    engagementIndex,
  };
}

/** Side-by-side lifecycle stage comparison (ComparisonMode). */
export function computeContactsStageComparison(
  analytics: ContactsReportAnalyticsSnapshot,
  stageA: string,
  stageB: string,
  leadStage = 'Lead',
): Array<{ metric: string; a: number; b: number }> {
  const metricA = analytics.stageMetrics.find((s) => s.stage === stageA);
  const metricB = analytics.stageMetrics.find((s) => s.stage === stageB);
  const countA = metricA?.count ?? 0;
  const countB = metricB?.count ?? 0;

  const subsetConversion = (stage: string, count: number) => {
    if (count === 0) return 0;
    return stage === leadStage ? 0 : 100;
  };

  return [
    { metric: 'Total Volume', a: countA, b: countB },
    { metric: 'Conversion%', a: subsetConversion(stageA, countA), b: subsetConversion(stageB, countB) },
    { metric: 'Engagement', a: metricA?.avgRating ?? 0, b: metricB?.avgRating ?? 0 },
    { metric: 'Active Status', a: metricA?.activeCount ?? 0, b: metricB?.activeCount ?? 0 },
  ];
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
