import { useEffect, useMemo, useState } from 'react';
import { useContactsWidgetAggregates } from '@/tenant/hooks/collections/contacts';
import { useStudentsWidgetAggregates } from '@/tenant/hooks/collections/students';
import { useTeachersWidgetAggregates } from '@/tenant/hooks/collections/teachers';
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
): Record<string, AggregateCardValue | undefined> {
  return Object.fromEntries(
    customCards.map((card) => {
      const serverAggregate = (
        card.collection === 'contacts' ? contactWidgetAggregates?.[card.id]
          : card.collection === 'students' ? studentWidgetAggregates?.[card.id]
            : card.collection === 'teachers' ? teacherWidgetAggregates?.[card.id]
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
  const { isContactsCategory, isStudentsCategory, isTeachersCategory } = flags;
  const {
    sessions,
    invoices,
    attendanceRecords,
    distributions,
    denominations,
    questionBankQuestions,
    questionBankTests,
    questionBankResults,
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
      ),
      {
        sessions,
        finance_invoices: invoices,
        attendance_records: attendanceRecords,
        hasanat_distributions: distributions,
        hasanat_denoms: denominations,
        questions: questionBankQuestions,
        tests: questionBankTests,
        assessment_results: questionBankResults,
      },
    ),
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

  return { customCards, setCustomCards, computedCustomCards };
}
