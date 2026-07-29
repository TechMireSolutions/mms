import type { ElementType } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart2,
  CalendarCheck,
  DollarSign,
  GraduationCap,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { AppTranslationKey, Contact, QuestionBankQuestion, QuestionBankResult, QuestionBankTest } from '@mms/shared';
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

export const KPI_ICONS: Record<string, ElementType> = {
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Star,
  AlertCircle,
  GraduationCap,
  BarChart2,
  Target,
  Zap,
  Activity,
  CalendarCheck,
  Receipt,
  ShieldCheck,
  MessageCircle,
};

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

export function getDefaultCardConfig(
  category: string,
  cardId: string,
  title: string,
  titleKey?: AppTranslationKey,
): CustomCard {
  const config: CustomCard = {
    id: cardId,
    title,
    titleKey,
    collection: 'students',
    operation: 'count',
    filterField: 'status',
    filterOperator: 'equals',
    filterValue: 'active',
    icon: 'GraduationCap',
    color: 'emerald',
    subTextType: 'dynamic',
    fixedSubText: '',
  };

  switch (cardId) {
    case 'kpi-total-students':
      if (category === 'contacts') {
        Object.assign(config, { collection: 'contacts', filterField: '', icon: 'Users', color: 'blue' });
      }
      break;
    case 'kpi-avg-attendance':
      Object.assign(config, { collection: 'attendance_records', operation: 'percentage', filterValue: 'present', icon: 'UserCheck' });
      break;
    case 'kpi-fee-collected':
      Object.assign(config, { collection: 'finance_invoices', operation: 'sum', targetField: 'finalAmt', filterValue: 'paid', icon: 'DollarSign', color: 'blue' });
      break;
    case 'kpi-outstanding':
      Object.assign(config, { collection: 'finance_invoices', operation: 'sum', targetField: 'finalAmt', filterValue: 'unpaid', icon: 'AlertCircle', color: 'red' });
      break;
    case 'kpi-hasanat-awarded':
      Object.assign(config, { collection: 'hasanat_distributions', operation: 'sum', targetField: 'points', filterField: '', icon: 'Star', color: 'amber' });
      break;
    case 'kpi-pass-rate':
      Object.assign(config, { operation: 'percentage', icon: 'GraduationCap', color: 'violet' });
      break;
    case 'kpi-capacity-used':
      Object.assign(config, { collection: 'sessions', operation: 'percentage', icon: 'BarChart2', color: 'blue' });
      break;
    case 'kpi-growth-rate':
      Object.assign(config, { collection: 'contacts', filterField: '', icon: 'TrendingUp' });
      break;
    case 'kpi-whatsapp-verified':
      Object.assign(config, { collection: 'contacts', operation: 'percentage', filterField: 'whatsappStatus', filterValue: 'REGISTERED', icon: 'MessageCircle', color: 'amber' });
      break;
    case 'kpi-active-contacts':
      Object.assign(config, { collection: 'contacts', operation: 'percentage', filterField: 'isActive', filterValue: 'true', icon: 'UserCheck', color: 'green' });
      break;
    case 'kpi-total-contacts':
      Object.assign(config, { collection: 'contacts', filterField: '', icon: 'Users', color: 'blue' });
      break;
    case 'kpi-total-questions':
      Object.assign(config, { collection: 'questions', filterField: '', icon: 'BarChart2', color: 'blue' });
      break;
    case 'kpi-generated-tests':
      Object.assign(config, { collection: 'tests', filterField: '', icon: 'CalendarCheck', color: 'blue' });
      break;
    case 'kpi-test-submissions':
      Object.assign(config, { collection: 'assessment_results', filterField: '', icon: 'UserCheck', color: 'violet' });
      break;
    case 'kpi-avg-test-score':
      Object.assign(config, { collection: 'assessment_results', operation: 'percentage', filterField: '', icon: 'Target', color: 'green' });
      break;
    case 'kpi-total-faculty':
      Object.assign(config, { collection: 'teachers', icon: 'GraduationCap', color: 'primary' });
      break;
    case 'kpi-on-leave':
      Object.assign(config, { collection: 'teachers', filterValue: 'on_leave', icon: 'Activity', color: 'amber' });
      break;
  }
  return config;
}

export function getDefaultKPICollection(category: string): CustomCard['collection'] {
  if (category === 'contacts') return 'contacts';
  if (category === 'attendance') return 'attendance_records';
  if (category === 'financial' || category === 'accounting') return 'finance_invoices';
  if (category === 'hasanat') return 'hasanat_distributions';
  if (category === 'sessions') return 'sessions';
  if (category === 'questionBank') return 'questions';
  if (category === 'teachers' || category === 'faculty') return 'teachers';
  return 'students';
}

export function getCategoryLabelKey(category: string): AppTranslationKey | undefined {
  const keys: Partial<Record<string, AppTranslationKey>> = {
    contacts: 'nav.contacts',
    students: 'nav.students',
    attendance: 'nav.attendance',
    financial: 'nav.finance',
    hasanat: 'nav.hasanatCards',
    sessions: 'nav.sessions',
    examinations: 'nav.examinations',
    questionBank: 'nav.questionBank',
    enrollments: 'nav.enrollments',
    faculty: 'nav.teachers',
    teachers: 'nav.teachers',
    accounting: 'nav.accounting',
  };
  return keys[category];
}
