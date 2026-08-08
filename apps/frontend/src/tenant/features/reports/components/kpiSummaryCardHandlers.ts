import type { Permission } from '@mms/shared';
import type { Dispatch, SetStateAction } from 'react';
import { saveObject } from '@/lib/db';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { CustomCard } from './reportMetadata';
import {
  KPI_ROLE_ATTENDANCE_ONLY_IDS,
  KPI_ROLE_FINANCE_ONLY_IDS,
  KPI_TITLE_KEYS,
} from './kpiSummaryConfig';
import {
  buildAggregateCustomCard,
  computeLocalCustomCard,
  getDefaultCardConfig,
} from './kpiSummaryFormatters';
import type { AggregateCardValue, CategorizedKPIItem, KPIItem } from './kpiSummaryTypes';
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import type { Invoice } from '@/lib/data/financeData';
import type { Denomination, Distribution } from '@/lib/data/hasanatData';
import type { QuestionBankQuestion, QuestionBankResult, QuestionBankTest, Enrollment } from '@mms/shared';
import type { Session } from '@/lib/data/sessionsData';

export interface CustomCardLocalCollections {
  sessions: Session[];
  enrollments: Enrollment[];
  finance_invoices: Invoice[];
  attendance_records: AttendanceRecord[];
  hasanat_distributions: Distribution[];
  hasanat_denoms: Denomination[];
  questions: QuestionBankQuestion[];
  tests: QuestionBankTest[];
  assessment_results: QuestionBankResult[];
}

export function filterStandardPossibleCards(
  standardCards: CategorizedKPIItem[],
  category: string,
  can: (permission: Permission) => boolean,
): CategorizedKPIItem[] {
  return standardCards.filter((card) => {
    if (!card.categories.includes(category)) return false;
    if (can('attendance.write') && !can('finance.write')) {
      return KPI_ROLE_ATTENDANCE_ONLY_IDS.includes(card.id);
    }
    if (can('finance.write') && !can('attendance.write')) {
      return KPI_ROLE_FINANCE_ONLY_IDS.includes(card.id);
    }
    return true;
  });
}

export function buildPossibleCards(
  standardPossibleCards: CategorizedKPIItem[],
  computedCustomCards: CategorizedKPIItem[],
): CategorizedKPIItem[] {
  const customCardIds = new Set(computedCustomCards.map((card) => card.id));
  return [
    ...standardPossibleCards.filter((card) => !customCardIds.has(card.id)),
    ...computedCustomCards,
  ];
}

export function computeCustomCardItems(
  customCards: CustomCard[],
  category: string,
  t: TranslationFunction,
  serverAggregates: Record<string, AggregateCardValue | undefined>,
  localCollections: CustomCardLocalCollections,
): CategorizedKPIItem[] {
  return customCards.map((card) => {
    const serverAggregate = serverAggregates[card.id];
    if (serverAggregate) return buildAggregateCustomCard(card, serverAggregate, category, t);
    return computeLocalCustomCard(card, {
      students: [],
      teachers: [],
      sessions: localCollections.sessions,
      enrollments: localCollections.enrollments,
      finance_invoices: localCollections.finance_invoices,
      attendance_records: localCollections.attendance_records,
      hasanat_distributions: localCollections.hasanat_distributions,
      hasanat_denoms: localCollections.hasanat_denoms,
      contacts: [],
      questions: localCollections.questions,
      tests: localCollections.tests,
      assessment_results: localCollections.assessment_results,
    }, t);
  });
}

export function createKpiCardHandlers(
  category: string,
  role: string | undefined,
  customCards: CustomCard[],
  selectedCardIds: string[],
  setCustomCards: Dispatch<SetStateAction<CustomCard[]>>,
  setSelectedCardIds: Dispatch<SetStateAction<string[]>>,
  setEditingCardConfig: Dispatch<SetStateAction<CustomCard | null>>,
  editingCardConfig: CustomCard | null,
  setIsConfigOpen: Dispatch<SetStateAction<boolean>>,
) {
  const handleToggleCard = (cardId: string) => {
    setSelectedCardIds((previousCardIds) => {
      const nextCardIds = previousCardIds.includes(cardId)
        ? previousCardIds.filter((selectedCardId) => selectedCardId !== cardId)
        : [...previousCardIds, cardId];
      saveObject(`kpi_config_${category}_${role || 'all'}`, nextCardIds);
      return nextCardIds;
    });
  };

  const handleDeleteCustomCard = (cardId: string) => {
    const nextCustomCards = customCards.filter((card) => card.id !== cardId);
    const nextSelectedCardIds = selectedCardIds.filter((selectedCardId) => selectedCardId !== cardId);
    setCustomCards(nextCustomCards);
    setSelectedCardIds(nextSelectedCardIds);
    saveObject(`kpi_custom_cards_${category}`, nextCustomCards);
    saveObject(`kpi_config_${category}_${role || 'all'}`, nextSelectedCardIds);
    if (editingCardConfig?.id === cardId) setEditingCardConfig(null);
    window.dispatchEvent(new Event('local-database-update'));
  };

  const handleEditCard = (card: KPIItem) => {
    const customCard = customCards.find((savedCard) => savedCard.id === card.id);
    const cardConfig = customCard ?? {
      ...getDefaultCardConfig(category, card.id, card.label, KPI_TITLE_KEYS[card.id]),
      id: `edit-default-${card.id}-${Date.now()}`,
    };
    setEditingCardConfig(cardConfig);
    document.getElementById(`config-panel-${category}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  const openCustomCardBuilder = () => {
    setIsConfigOpen(true);
    window.setTimeout(() => {
      document.getElementById(`config-panel-${category}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return {
    handleToggleCard,
    handleDeleteCustomCard,
    handleEditCard,
    openCustomCardBuilder,
  };
}
