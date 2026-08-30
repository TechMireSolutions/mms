import { useEffect, useMemo, useState } from 'react';
import { useModuleWidgetAggregates } from './useModuleWidgetAggregates';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { CustomCard } from '@/lib/reports/reportMetadata';
import { computeCustomCardItems } from './kpiSummaryCardHandlers';
import { cardsChangedOnLocalUpdate, loadCustomCardsForCategory } from './kpiSummaryCardSelection';
import type { AggregateCardValue, CategorizedKPIItem } from './kpiSummaryTypes';
import type { KpiCategoryFlags } from './kpiSummaryCategoryFlags';
import type { KpiSummaryDataSources } from './useKpiSummaryDataSources';

function buildServerAggregateMap(
  customCards: CustomCard[],
  widgetAggregates: Record<string, unknown> | undefined,
): Record<string, AggregateCardValue | undefined> {
  return Object.fromEntries(
    customCards.map((card) => {
      const serverAggregate = widgetAggregates?.[card.id] as AggregateCardValue | undefined;
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

  const { data: widgetAggregates } = useModuleWidgetAggregates(customCardWidgetInputs);

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
        widgetAggregates,
      ),
    ),
    [
      customCards,
      widgetAggregates,
      category,
      t,
    ],
  );

  return { customCards, setCustomCards, computedCustomCards };
}
