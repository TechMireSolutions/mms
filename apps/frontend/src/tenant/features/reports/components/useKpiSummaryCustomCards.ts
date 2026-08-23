import { useEffect, useMemo, useState } from 'react';
import { useContactsWidgetAggregates } from '@/tenant/hooks/collections/contacts';
import { useStudentsWidgetAggregates } from '@/tenant/hooks/collections/students';
import { useTeachersWidgetAggregates } from '@/tenant/hooks/collections/teachers';
import { useSessionsWidgetAggregates } from '@/tenant/hooks/collections/sessions';
import { useEnrollmentsWidgetAggregates } from '@/tenant/hooks/collections/enrollments';
import { useAttendanceRecordsCollection } from '@/tenant/hooks/collections/attendance';
import { useFinanceInvoicesPaginated } from '@/tenant/hooks/collections/finance';
import {
  useHasanatDenomsCollection,
  useHasanatDistributionsCollection,
} from '@/tenant/hooks/collections/hasanat';
import {
  useQuestionBankQuestionsCollection,
  useQuestionBankResultsCollection,
  useQuestionBankTestsCollection,
} from '@/tenant/hooks/collections/questionBank';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { CustomCard } from './reportMetadata';
import { computeCustomCardItems } from './kpiSummaryCardHandlers';
import { cardsChangedOnLocalUpdate, loadCustomCardsForCategory } from './kpiSummaryCardSelection';
import type { AggregateCardValue, CategorizedKPIItem } from './kpiSummaryTypes';
import type { KpiCategoryFlags } from './kpiSummaryCategoryFlags';
import type { KpiSummaryDataSources } from './useKpiSummaryDataSources';

function buildServerAggregateMap(
  customCards: CustomCard[],
  contactWidgetAggregates: Record<string, unknown> | undefined,
  studentWidgetAggregates: Record<string, unknown> | undefined,
  teacherWidgetAggregates: Record<string, unknown> | undefined,
  sessionWidgetAggregates: Record<string, unknown> | undefined,
  enrollmentWidgetAggregates: Record<string, unknown> | undefined,
): Record<string, AggregateCardValue | undefined> {
  return Object.fromEntries(
    customCards.map((card) => {
      const serverAggregate = (
        card.collection === 'contacts' ? contactWidgetAggregates?.[card.id]
          : card.collection === 'students' ? studentWidgetAggregates?.[card.id]
            : card.collection === 'teachers' ? teacherWidgetAggregates?.[card.id]
              : card.collection === 'sessions' ? sessionWidgetAggregates?.[card.id]
                : card.collection === 'enrollments' ? enrollmentWidgetAggregates?.[card.id]
                  : undefined
      ) as AggregateCardValue | undefined;
      return [card.id, serverAggregate];
    }),
  );
}

export function useKpiSummaryCustomCards(
  category: string,
  flags: KpiCategoryFlags,
  dataSources: KpiSummaryDataSources,
  t: TranslationFunction,
) {
  const { isContactsCategory, isStudentsCategory, isTeachersCategory, isSessionsCategory, isEnrollmentsCategory } = flags;
  const {
    questionBankQuestions: qbFromMetricsPath,
    questionBankTests: qbTestsFromMetricsPath,
    questionBankResults: qbResultsFromMetricsPath,
  } = dataSources;

  const [customCards, setCustomCards] = useState<CustomCard[]>(() => loadCustomCardsForCategory(category));

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
  const hasSessionCustomCards = customCards.some((card) => card.collection === 'sessions');
  const hasEnrollmentCustomCards = customCards.some((card) => card.collection === 'enrollments');
  const needsFinance = customCards.some((card) => card.collection === 'finance_invoices');
  const needsAttendance = customCards.some((card) => card.collection === 'attendance_records');
  const needsHasanat = customCards.some((card) => card.collection === 'hasanat_distributions');
  const needsQuestionBank = customCards.some(
    (card) =>
      card.collection === 'questions'
      || card.collection === 'tests'
      || card.collection === 'assessment_results',
  );

  const { data: contactWidgetAggregates } = useContactsWidgetAggregates(customCardWidgetInputs, {
    enabled: isContactsCategory && hasContactCustomCards,
  });
  const { data: studentWidgetAggregates } = useStudentsWidgetAggregates(customCardWidgetInputs, {
    enabled: isStudentsCategory && hasStudentCustomCards,
  });
  const { data: teacherWidgetAggregates } = useTeachersWidgetAggregates(customCardWidgetInputs, {
    enabled: isTeachersCategory && hasTeacherCustomCards,
  });
  const { data: sessionWidgetAggregates } = useSessionsWidgetAggregates(customCardWidgetInputs, {
    enabled: isSessionsCategory && hasSessionCustomCards,
  });
  const { data: enrollmentWidgetAggregates } = useEnrollmentsWidgetAggregates(customCardWidgetInputs, {
    enabled: isEnrollmentsCategory && hasEnrollmentCustomCards,
  });

  const invoices = useFinanceInvoicesPaginated({ page: 1, limit: 500 }, { enabled: needsFinance }).data?.invoices ?? [];
  const attendanceRecords = useAttendanceRecordsCollection({ enabled: needsAttendance });
  const distributions = useHasanatDistributionsCollection({ enabled: needsHasanat });
  const denominations = useHasanatDenomsCollection({ enabled: needsHasanat });
  const questionBankQuestions = useQuestionBankQuestionsCollection({ enabled: needsQuestionBank });
  const questionBankTests = useQuestionBankTestsCollection({ enabled: needsQuestionBank });
  const questionBankResults = useQuestionBankResultsCollection({ enabled: needsQuestionBank });

  useEffect(() => {
    const handleUpdate = () => {
      setCustomCards((previousCards) => cardsChangedOnLocalUpdate(previousCards, category));
    };
    window.addEventListener('local-database-update', handleUpdate);
    return () => window.removeEventListener('local-database-update', handleUpdate);
  }, [category]);

  const computedCustomCards = useMemo(
    (): CategorizedKPIItem[] => computeCustomCardItems(
      customCards,
      category,
      t,
      buildServerAggregateMap(
        customCards,
        contactWidgetAggregates,
        studentWidgetAggregates,
        teacherWidgetAggregates,
        sessionWidgetAggregates,
        enrollmentWidgetAggregates,
      ),
      {
        sessions: [],
        enrollments: [],
        finance_invoices: invoices,
        attendance_records: attendanceRecords,
        hasanat_distributions: distributions,
        hasanat_denoms: denominations,
        questions: needsQuestionBank ? questionBankQuestions : qbFromMetricsPath,
        tests: needsQuestionBank ? questionBankTests : qbTestsFromMetricsPath,
        assessment_results: needsQuestionBank ? questionBankResults : qbResultsFromMetricsPath,
      },
    ),
    [
      customCards,
      contactWidgetAggregates,
      studentWidgetAggregates,
      teacherWidgetAggregates,
      sessionWidgetAggregates,
      enrollmentWidgetAggregates,
      category,
      invoices,
      attendanceRecords,
      distributions,
      denominations,
      needsQuestionBank,
      questionBankQuestions,
      questionBankTests,
      questionBankResults,
      qbFromMetricsPath,
      qbTestsFromMetricsPath,
      qbResultsFromMetricsPath,
      t,
    ],
  );

  return { customCards, setCustomCards, computedCustomCards };
}
