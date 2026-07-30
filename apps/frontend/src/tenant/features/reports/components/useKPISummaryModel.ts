import { useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import { useTranslation } from '@/hooks/useTranslation';
import { useFinanceCurrency } from '@/hooks/useCurrency';
import type { CustomCard } from './reportMetadata';
import { getDefaultKPICollection, getCategoryLabelKey } from './kpiSummaryFormatters';
import { buildStandardKPICards } from './kpiSummaryStandardCards';
import {
  buildPossibleCards,
  createKpiCardHandlers,
  filterStandardPossibleCards,
} from './kpiSummaryCardHandlers';
import { computePrimaryVolume } from './kpiSummaryPrimaryVolume';
import { getKpiCategoryFlags } from './kpiSummaryCategoryFlags';
import { useKpiSummaryDataSources } from './useKpiSummaryDataSources';
import { useKpiSummaryCustomCards } from './useKpiSummaryCustomCards';
import { useKpiSummaryCardSelection } from './useKpiSummaryCardSelection';
import type { CategorizedKPIItem, KPIItem, KPISummaryProps } from './kpiSummaryTypes';

export interface KPISummaryModel {
  moduleLabel: string;
  possibleCards: CategorizedKPIItem[];
  visibleCards: CategorizedKPIItem[];
  customCards: CustomCard[];
  selectedCardIds: string[];
  primaryVolume: number;
  defaultCollection: ReturnType<typeof getDefaultKPICollection>;
  editingCardConfig: CustomCard | null;
  isConfigOpen: boolean;
  setIsConfigOpen: (open: boolean) => void;
  handleToggleCard: (cardId: string) => void;
  handleDeleteCustomCard: (cardId: string) => void;
  handleEditCard: (card: KPIItem) => void;
  openCustomCardBuilder: () => void;
  cancelEdit: () => void;
}

/** Loads KPI collections/metrics and owns card selection persistence for a report category. */
export function useKPISummaryModel({ category, role }: KPISummaryProps): KPISummaryModel {
  const { can } = usePermissions();
  const { t } = useTranslation();
  const { activeCurrency } = useFinanceCurrency();
  const categoryFlags = getKpiCategoryFlags(category);
  const dataSources = useKpiSummaryDataSources(category, categoryFlags);

  const {
    contactAnalytics,
    studentMetrics,
    teacherMetrics,
    auxiliaryStudentMetrics,
    auxiliaryTeacherMetrics,
    attendanceRecords,
    invoices,
    exams,
    examResults,
    sessions,
    distributions,
    denominations,
    questionBankQuestions,
    questionBankTests,
    questionBankResults,
  } = dataSources;

  const standardCards = useMemo(
    () => buildStandardKPICards({
      category,
      activeCurrencyCode: activeCurrency.code,
      contactAnalytics,
      studentMetrics,
      auxiliaryStudentMetrics,
      teacherMetrics,
      auxiliaryTeacherMetrics,
      attendanceRecords,
      invoices,
      exams,
      examResults,
      sessions,
      distributions,
      denominations,
      questionBankQuestions,
      questionBankTests,
      questionBankResults,
      t,
    }),
    [
      category,
      activeCurrency.code,
      contactAnalytics,
      studentMetrics,
      auxiliaryStudentMetrics,
      teacherMetrics,
      auxiliaryTeacherMetrics,
      attendanceRecords,
      invoices,
      exams,
      examResults,
      sessions,
      distributions,
      denominations,
      questionBankQuestions,
      questionBankTests,
      questionBankResults,
      t,
    ],
  );

  const standardPossibleCards = useMemo(
    () => filterStandardPossibleCards(standardCards, category, can),
    [standardCards, category, can],
  );

  const [editingCardConfig, setEditingCardConfig] = useState<CustomCard | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const { customCards, setCustomCards, computedCustomCards } = useKpiSummaryCustomCards(
    category,
    categoryFlags,
    dataSources,
    t,
  );

  useEffect(() => {
    setEditingCardConfig(null);
  }, [category]);

  const possibleCards = useMemo(
    () => buildPossibleCards(standardPossibleCards, computedCustomCards),
    [standardPossibleCards, computedCustomCards],
  );

  const { selectedCardIds, setSelectedCardIds } = useKpiSummaryCardSelection(
    category,
    role,
    possibleCards,
    customCards,
  );

  const cardHandlers = createKpiCardHandlers(
    category,
    role,
    customCards,
    selectedCardIds,
    setCustomCards,
    setSelectedCardIds,
    setEditingCardConfig,
    editingCardConfig,
    setIsConfigOpen,
  );

  const primaryVolume = useMemo(
    () => computePrimaryVolume({
      category,
      studentMetrics,
      teacherMetrics,
      contactAnalytics,
      attendanceRecords,
      invoices,
      distributions,
      sessions,
      examResults,
      exams,
      questionBankQuestions,
      questionBankTests,
      questionBankResults,
    }),
    [
      category,
      studentMetrics,
      teacherMetrics,
      contactAnalytics,
      attendanceRecords,
      invoices,
      distributions,
      sessions,
      examResults,
      exams,
      questionBankQuestions,
      questionBankTests,
      questionBankResults,
    ],
  );

  const categoryLabelKey = getCategoryLabelKey(category);
  const moduleLabel = categoryLabelKey ? t(categoryLabelKey) : category;
  const visibleCards = possibleCards.filter((card) => selectedCardIds.includes(card.id));

  return {
    moduleLabel,
    possibleCards,
    visibleCards,
    customCards,
    selectedCardIds,
    primaryVolume,
    defaultCollection: getDefaultKPICollection(category),
    editingCardConfig,
    isConfigOpen,
    setIsConfigOpen,
    ...cardHandlers,
    cancelEdit: () => setEditingCardConfig(null),
  };
}
