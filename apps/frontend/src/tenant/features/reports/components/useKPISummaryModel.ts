import { useEffect, useMemo, useRef, useState } from 'react';
import { useAttendanceRecordsCollection } from '@/tenant/hooks/collections/attendance';
import { useFinanceInvoicesCollection } from '@/tenant/hooks/collections/finance';
import { useExaminationsExamsCollection, useExaminationsResultsCollection } from '@/tenant/hooks/collections/examinations';
import { useHasanatDenomsCollection, useHasanatDistributionsCollection } from '@/tenant/hooks/collections/hasanat';
import {
  useQuestionBankQuestionsCollection,
  useQuestionBankResultsCollection,
  useQuestionBankTestsCollection,
} from '@/tenant/hooks/collections/questionBank';
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useContactsReportAnalytics, useContactsWidgetAggregates } from '@/tenant/hooks/collections/contacts';
import { useStudentsMetrics, useStudentsWidgetAggregates } from '@/tenant/hooks/collections/students';
import { useTeachersMetrics, useTeachersWidgetAggregates } from '@/tenant/hooks/collections/teachers';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import { useTranslation } from '@/hooks/useTranslation';
import { useFinanceCurrency } from '@/hooks/useCurrency';
import { getObject, saveObject } from '@/lib/db';
import type { CustomCard } from './reportMetadata';
import {
  areCustomCardsEqual,
  areStringListsEqual,
  KPI_ROLE_ATTENDANCE_ONLY_IDS,
  KPI_ROLE_FINANCE_ONLY_IDS,
  KPI_TITLE_KEYS,
} from './kpiSummaryConfig';
import {
  buildAggregateCustomCard,
  computeLocalCustomCard,
  getCategoryLabelKey,
  getDefaultCardConfig,
  getDefaultKPICollection,
  normalizeStoredCardIds,
} from './kpiSummaryFormatters';
import { buildStandardKPICards } from './kpiSummaryStandardCards';
import type { AggregateCardValue, CategorizedKPIItem, KPIItem, KPISummaryProps } from './kpiSummaryTypes';

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
  const isContactsCategory = category === 'contacts';
  const isStudentsCategory = category === 'students';
  const isTeachersCategory = category === 'teachers' || category === 'faculty';
  const needsContactAnalytics = isContactsCategory || isStudentsCategory || category === 'sessions';

  const { data: contactsReportData } = useContactsReportAnalytics({ enabled: needsContactAnalytics });
  const { data: studentMetrics } = useStudentsMetrics({ enabled: isStudentsCategory || category === 'enrollments' });
  const { data: teacherMetrics } = useTeachersMetrics({ enabled: isTeachersCategory || category === 'enrollments' });
  const { data: crossStudentMetrics } = useStudentsMetrics({
    enabled: !isStudentsCategory && !isContactsCategory && !isTeachersCategory && category !== 'enrollments',
  });
  const { data: crossTeacherMetrics } = useTeachersMetrics({
    enabled: !isTeachersCategory && category !== 'enrollments',
  });
  const contactAnalytics = contactsReportData?.analytics;
  const auxiliaryStudentMetrics = category === 'enrollments' ? studentMetrics : crossStudentMetrics;
  const auxiliaryTeacherMetrics = category === 'enrollments' ? teacherMetrics : crossTeacherMetrics;

  const attendanceRecords = useAttendanceRecordsCollection();
  const invoices = useFinanceInvoicesCollection();
  const exams = useExaminationsExamsCollection();
  const examResults = useExaminationsResultsCollection();
  const sessions = useSessionsCollection();
  const distributions = useHasanatDistributionsCollection();
  const denominations = useHasanatDenomsCollection();
  const questionBankQuestions = useQuestionBankQuestionsCollection();
  const questionBankTests = useQuestionBankTestsCollection();
  const questionBankResults = useQuestionBankResultsCollection();

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
    () => standardCards.filter((card) => {
      if (!card.categories.includes(category)) return false;
      if (can('attendance.write') && !can('finance.write')) {
        return KPI_ROLE_ATTENDANCE_ONLY_IDS.includes(card.id);
      }
      if (can('finance.write') && !can('attendance.write')) {
        return KPI_ROLE_FINANCE_ONLY_IDS.includes(card.id);
      }
      return true;
    }),
    [standardCards, category, can],
  );

  const [customCards, setCustomCards] = useState<CustomCard[]>(() => (
    getObject<CustomCard[]>(`kpi_custom_cards_${category}`, [])
  ));
  const [editingCardConfig, setEditingCardConfig] = useState<CustomCard | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>(() => (
    getObject<string[]>(`kpi_config_${category}_${role || 'all'}`, [])
  ));
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const customCardWidgetInputs = useMemo(
    () => customCards.map((card) => ({
      id: card.id,
      collection: card.collection,
      operation: card.operation,
      targetField: card.targetField,
      filterField: card.filterField,
      filterOperator: card.filterOperator,
      filterValue: card.filterValue,
    })),
    [customCards],
  );
  const hasContactCustomCards = customCards.some((card) => card.collection === 'contacts');
  const hasStudentCustomCards = customCards.some((card) => card.collection === 'students');
  const hasTeacherCustomCards = customCards.some((card) => card.collection === 'teachers');
  const { data: contactWidgetAggregates } = useContactsWidgetAggregates(customCardWidgetInputs, {
    enabled: isContactsCategory && hasContactCustomCards,
  });
  const { data: studentWidgetAggregates } = useStudentsWidgetAggregates(customCardWidgetInputs, {
    enabled: isStudentsCategory && hasStudentCustomCards,
  });
  const { data: teacherWidgetAggregates } = useTeachersWidgetAggregates(customCardWidgetInputs, {
    enabled: isTeachersCategory && hasTeacherCustomCards,
  });

  useEffect(() => {
    const handleUpdate = () => {
      const nextCards = getObject<CustomCard[]>(`kpi_custom_cards_${category}`, []);
      setCustomCards((previousCards) => (
        areCustomCardsEqual(previousCards, nextCards) ? previousCards : nextCards
      ));
    };
    window.addEventListener('local-database-update', handleUpdate);
    return () => window.removeEventListener('local-database-update', handleUpdate);
  }, [category]);

  useEffect(() => {
    setEditingCardConfig(null);
  }, [category]);

  const computedCustomCards = useMemo(
    () => customCards.map((card) => {
      const serverAggregate = (
        card.collection === 'contacts' ? contactWidgetAggregates?.[card.id]
          : card.collection === 'students' ? studentWidgetAggregates?.[card.id]
            : card.collection === 'teachers' ? teacherWidgetAggregates?.[card.id]
              : undefined
      ) as AggregateCardValue | undefined;
      if (serverAggregate) return buildAggregateCustomCard(card, serverAggregate, category, t);
      return computeLocalCustomCard(card, {
        students: [],
        teachers: [],
        sessions,
        finance_invoices: invoices,
        attendance_records: attendanceRecords,
        hasanat_distributions: distributions,
        hasanat_denoms: denominations,
        contacts: [],
        questions: questionBankQuestions,
        tests: questionBankTests,
        assessment_results: questionBankResults,
      }, t);
    }),
    [
      customCards,
      contactWidgetAggregates,
      studentWidgetAggregates,
      teacherWidgetAggregates,
      category,
      sessions,
      invoices,
      attendanceRecords,
      distributions,
      denominations,
      questionBankQuestions,
      questionBankTests,
      questionBankResults,
      t,
    ],
  );

  const possibleCards = useMemo(() => {
    const customCardIds = new Set(computedCustomCards.map((card) => card.id));
    return [
      ...standardPossibleCards.filter((card) => !customCardIds.has(card.id)),
      ...computedCustomCards,
    ];
  }, [standardPossibleCards, computedCustomCards]);

  const availableCardIdsKey = useMemo(
    () => possibleCards.filter((card) => card.isAvailable).map((card) => card.id).join('\u0000'),
    [possibleCards],
  );

  useEffect(() => {
    const availableCards = possibleCards.filter((card) => card.isAvailable);
    const availableCardIds = availableCardIdsKey ? availableCardIdsKey.split('\u0000') : [];
    const selectedIds = normalizeStoredCardIds(selectedCardIds, availableCards);
    let validSelectedCardIds = selectedIds.filter((cardId) => availableCardIds.includes(cardId));
    if (validSelectedCardIds.length === 0 && availableCardIds.length > 0) {
      validSelectedCardIds = availableCardIds;
    }
    if (areStringListsEqual(selectedCardIds, validSelectedCardIds)) return;
    saveObject(`kpi_config_${category}_${role || 'all'}`, validSelectedCardIds);
    setSelectedCardIds(validSelectedCardIds);
  }, [availableCardIdsKey, category, role, selectedCardIds, possibleCards]);

  const previousCustomIdsRef = useRef<string[]>(getObject<string[]>(`prev_kpi_ids_${category}`, []));
  const previousCustomIdsCategoryRef = useRef(category);
  useEffect(() => {
    if (previousCustomIdsCategoryRef.current !== category) {
      previousCustomIdsCategoryRef.current = category;
      previousCustomIdsRef.current = getObject<string[]>(`prev_kpi_ids_${category}`, []);
    }
    const currentIds = customCards.map((card) => card.id);
    const newlyAdded = currentIds.filter((id) => !previousCustomIdsRef.current.includes(id));
    previousCustomIdsRef.current = currentIds;
    saveObject(`prev_kpi_ids_${category}`, currentIds);
    if (newlyAdded.length === 0) return;
    const nextSelectedCardIds = [...new Set([...selectedCardIds, ...newlyAdded])];
    if (areStringListsEqual(selectedCardIds, nextSelectedCardIds)) return;
    saveObject(`kpi_config_${category}_${role || 'all'}`, nextSelectedCardIds);
    setSelectedCardIds(nextSelectedCardIds);
  }, [customCards, category, role, selectedCardIds]);

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

  const primaryVolume = useMemo(() => {
    switch (category) {
      case 'students': return studentMetrics?.total ?? 0;
      case 'contacts': return contactAnalytics?.total ?? 0;
      case 'attendance': return attendanceRecords.length;
      case 'financial':
      case 'accounting': return invoices.length;
      case 'hasanat': return distributions.length;
      case 'sessions': return sessions.length;
      case 'examinations': return examResults.length + exams.length;
      case 'questionBank':
        return questionBankQuestions.length + questionBankTests.length + questionBankResults.length;
      case 'enrollments': return (studentMetrics?.total ?? 0) + sessions.length;
      case 'teachers':
      case 'faculty': return teacherMetrics?.total ?? 0;
      default: return 0;
    }
  }, [
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
  ]);

  const categoryLabelKey = getCategoryLabelKey(category);
  const moduleLabel = categoryLabelKey ? t(categoryLabelKey) : category;
  const visibleCards = possibleCards.filter((card) => selectedCardIds.includes(card.id));

  const openCustomCardBuilder = () => {
    setIsConfigOpen(true);
    window.setTimeout(() => {
      document.getElementById(`config-panel-${category}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

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
    handleToggleCard,
    handleDeleteCustomCard,
    handleEditCard,
    openCustomCardBuilder,
    cancelEdit: () => setEditingCardConfig(null),
  };
}
