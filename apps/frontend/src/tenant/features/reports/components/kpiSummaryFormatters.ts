import { BarChart2, Users, type LucideIcon } from 'lucide-react';
import type { Contact, Enrollment, QuestionBankQuestion, QuestionBankResult, QuestionBankTest } from '@mms/shared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import type { Invoice } from '@/lib/data/financeData';
import type { Student } from '@/lib/data/studentsData';
import type { Teacher } from '@/lib/data/teachersData';
import type { Session } from '@/lib/data/sessionsData';
import type { Denomination, Distribution } from '@/lib/data/hasanatData';
import { resolveWidgetSubText, resolveWidgetTitle } from '@/lib/dashboardWidgets';
import {
  computeCustomCard as computeCustomCardShared,
  type CustomCard,
} from '@/tenant/features/reports/components/reportMetadata';
import type { AggregateCardValue, CategorizedKPIItem, KPIItem } from './kpiSummaryTypes';
import { KPI_ICONS } from './kpiSummaryIcons';

export { KPI_ICONS } from './kpiSummaryIcons';
export {
  getDefaultCardConfig,
  getDefaultKPICollection,
  getCategoryLabelKey,
} from './kpiDefaultCardConfig';

export function normalizeStoredCardIds(
  storedValues: string[],
  cards: CategorizedKPIItem[],
): string[] {
  const cardByLabel = new Map(cards.map((card) => [card.label, card.id]));
  const cardIdSet = new Set(cards.map((card) => card.id));
  const resolvedIds: string[] = [];
  for (const storedValue of storedValues) {
    const resolvedId = cardIdSet.has(storedValue) ? storedValue : cardByLabel.get(storedValue);
    if (resolvedId && !resolvedIds.includes(resolvedId)) {
      resolvedIds.push(resolvedId);
    }
  }
  return resolvedIds;
}

export function formatAggregateCardValue(
  card: CustomCard,
  aggregate: AggregateCardValue,
): { finalValue: string | number; totalCount: number } {
  return {
    finalValue: card.operation === 'percentage' ? `${aggregate.value}%` : aggregate.value,
    totalCount: aggregate.totalCount,
  };
}

export function computeLocalCustomCard(
  card: CustomCard,
  collections: {
    students: Student[];
    teachers: Teacher[];
    sessions: Session[];
    enrollments?: Enrollment[];
    finance_invoices: Invoice[];
    attendance_records: AttendanceRecord[];
    hasanat_distributions: Distribution[];
    contacts: Contact[];
    questions: QuestionBankQuestion[];
    tests: QuestionBankTest[];
    assessment_results: QuestionBankResult[];
    hasanat_denoms?: Denomination[];
  },
  t: TranslationFunction,
): CategorizedKPIItem {
  const computedCard = computeCustomCardShared(
    {
      ...card,
      title: resolveWidgetTitle(card, t),
      fixedSubText: resolveWidgetSubText(card, t) || card.fixedSubText,
    },
    collections,
    t,
  );
  return {
    id: card.id,
    label: resolveWidgetTitle(card, t),
    value: String(computedCard.value),
    sub: resolveWidgetSubText(card, t) || computedCard.sub,
    icon: (KPI_ICONS[computedCard.icon] || BarChart2) as LucideIcon,
    color: (computedCard.color === 'emerald' ? 'green' : computedCard.color) as KPIItem['color'],
    trend: 'flat',
    isAvailable: true,
    categories: [],
  };
}

export function buildAggregateCustomCard(
  card: CustomCard,
  aggregate: AggregateCardValue,
  category: string,
  t: TranslationFunction,
): CategorizedKPIItem {
  const aggregateValue = formatAggregateCardValue(card, aggregate);
  return {
    id: card.id,
    label: resolveWidgetTitle(card, t),
    value: String(aggregateValue.finalValue),
    sub: resolveWidgetSubText(card, t) || t('reports.widgets.totalCountText', { count: aggregateValue.totalCount }),
    icon: (KPI_ICONS[card.icon] || Users) as LucideIcon,
    color: (card.color === 'emerald' ? 'green' : card.color) as KPIItem['color'],
    trend: 'flat',
    isAvailable: aggregateValue.totalCount > 0,
    categories: [category],
  };
}
