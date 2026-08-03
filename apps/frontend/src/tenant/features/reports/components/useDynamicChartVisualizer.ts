import { useState, useMemo, useRef } from 'react';
import {
  DEFAULT_CHART_PALETTE_ID,
  getChartPaletteColors,
  type ContactsWidgetOperation,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { getObject } from '@/lib/db';
import { useReportCollectionRows } from '@/lib/reports/useReportCollections';
import { useContactsWidgetAggregates } from '@/tenant/hooks/collections/contacts';
import { METADATA_FIELDS, type VisualizerConfig } from '@/tenant/features/reports/components/reportMetadata';
import type {
  AggregatedItem,
  ChartOperation,
  ChartType,
  CollectionMeta,
  CustomWidget,
  FilterRule,
} from '@/tenant/features/reports/components/dynamicChartVisualizerTypes';
import {
  aggregateVisualizerRows,
  sortAndCapAggregatedItems,
} from '@/tenant/features/reports/components/dynamicChartVisualizerHelpers';
import { useDynamicChartVisualizerMetaEffects } from '@/tenant/features/reports/components/useDynamicChartVisualizerEffects';
import { useDynamicChartVisualizerContainer } from '@/tenant/features/reports/components/useDynamicChartVisualizerContainer';
import { isVisualizerWidgetPinned } from '@/tenant/features/reports/components/dynamicChartVisualizerPin';
import { buildDynamicChartVisualizerHandlers } from '@/tenant/features/reports/components/useDynamicChartVisualizerHandlers';

const METADATA_CONFIGS: Record<string, CollectionMeta> = METADATA_FIELDS as unknown as Record<string, CollectionMeta>;
const CONTACTS_VISUALIZER_QUERY_ID = 'contacts-visualizer';

function toContactsWidgetOperation(operation: ChartOperation): ContactsWidgetOperation {
  if (operation === 'sum' || operation === 'avg') return operation;
  return 'count';
}

interface UseDynamicChartVisualizerOptions {
  initialConfig?: VisualizerConfig;
  onSave?: (config: VisualizerConfig) => void;
}

export function useDynamicChartVisualizer({
  initialConfig,
  onSave,
}: UseDynamicChartVisualizerOptions = {}) {
  const { t } = useTranslation();
  const chartRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const [title, setTitle] = useState(() => initialConfig?.title || t('reports.visualizer.defaultTitle'));
  const [collectionKey, setCollectionKey] = useState<keyof typeof METADATA_CONFIGS>(
    initialConfig?.collection || 'students',
  );
  const [chartType, setChartType] = useState<ChartType>(initialConfig?.chartType || 'bar');
  const [xAxisField, setXAxisField] = useState(initialConfig?.xAxisField || 'status');
  const [operation, setOperation] = useState<ChartOperation>(initialConfig?.operation || 'count');
  const [targetField, setTargetField] = useState(initialConfig?.targetField || '');
  const [activePalette, setActivePalette] = useState(initialConfig?.activePalette || DEFAULT_CHART_PALETTE_ID);

  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showDataTable, setShowDataTable] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<'p' | 'l'>('p');
  const [pdfFormat, setPdfFormat] = useState<string>('a4');
  const [showPdfSettings, setShowPdfSettings] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [dashboardWidgets, setDashboardWidgets] = useState<CustomWidget[]>(() =>
    getObject<CustomWidget[]>('kpi_custom_widgets', []),
  );

  const { containerWidth, axisFontSize, legendFontSize, tickGap } = useDynamicChartVisualizerContainer(chartRef);
  const activeMeta = METADATA_CONFIGS[collectionKey];
  const isContacts = collectionKey === 'contacts';
  const { rows: collectionRows, denominations } = useReportCollectionRows(
    isContacts ? '' : collectionKey,
  );

  const contactsVisualizerWidgets = useMemo(() => {
    if (!isContacts) return [];
    return [
      {
        id: CONTACTS_VISUALIZER_QUERY_ID,
        collection: 'contacts',
        operation: toContactsWidgetOperation(operation),
        targetField: targetField || undefined,
        xAxisField,
        filters: filters
          .filter((rule) => rule.field && rule.value)
          .map((rule) => ({
            field: rule.field,
            operator: rule.operator,
            value: rule.value,
          })),
        chartLimit: 20,
      },
    ];
  }, [isContacts, operation, targetField, xAxisField, filters]);

  const { data: contactsAggregates } = useContactsWidgetAggregates(contactsVisualizerWidgets, {
    enabled: isContacts,
  });

  useDynamicChartVisualizerMetaEffects({
    collectionKey,
    xAxisField,
    operation,
    activeMeta,
    metadataConfigs: METADATA_CONFIGS,
    isInitialMount,
    setXAxisField,
    setChartType,
    setTargetField,
    setOperation,
    setFilters,
  });

  const processedData = useMemo<AggregatedItem[]>(() => {
    if (isContacts) {
      const chartData = contactsAggregates?.[CONTACTS_VISUALIZER_QUERY_ID]?.chartData ?? [];
      const items: AggregatedItem[] = chartData.map((row) => ({
        name: row.name,
        value: row.value,
        count: row.value,
      }));
      return sortAndCapAggregatedItems(items, xAxisField, operation);
    }
    return aggregateVisualizerRows({
      collectionKey,
      collectionRows,
      denominations,
      filters,
      xAxisField,
      operation,
      targetField,
    });
  }, [
    isContacts,
    contactsAggregates,
    collectionKey,
    xAxisField,
    operation,
    targetField,
    filters,
    collectionRows,
    denominations,
  ]);

  const isPinned = useMemo(
    () => isVisualizerWidgetPinned(dashboardWidgets, collectionKey, xAxisField, operation, chartType),
    [dashboardWidgets, collectionKey, xAxisField, operation, chartType],
  );

  const {
    handleTogglePin,
    handleAddFilter,
    handleUpdateFilter,
    handleDeleteFilter,
    handleExportPNG,
    handleExportExcel,
    handleExportPDF,
    handleSaveVisual,
  } = buildDynamicChartVisualizerHandlers({
    chartRef,
    title,
    collectionKey,
    xAxisField,
    operation,
    chartType,
    targetField,
    activePalette,
    activeMeta,
    filters,
    setFilters,
    dashboardWidgets,
    setDashboardWidgets,
    processedData,
    pdfFormat,
    pdfOrientation,
    initialConfig,
    onSave,
    onExportFailed: () => {
      notify.error(t('reports.visualizer.exportFailed'));
    },
  });

  const currentColors = [...getChartPaletteColors(activePalette)];

  return {
    t,
    chartRef,
    title,
    setTitle,
    collectionKey,
    setCollectionKey,
    chartType,
    setChartType,
    xAxisField,
    setXAxisField,
    operation,
    setOperation,
    targetField,
    setTargetField,
    activePalette,
    setActivePalette,
    showGrid,
    setShowGrid,
    showLegend,
    setShowLegend,
    showTooltip,
    setShowTooltip,
    showDataTable,
    showPdfSettings,
    pdfOrientation,
    pdfFormat,
    containerWidth,
    axisFontSize,
    legendFontSize,
    tickGap,
    activeMeta,
    metadataConfigs: METADATA_CONFIGS,
    filters,
    processedData,
    currentColors,
    isPinned,
    handleTogglePin,
    handleAddFilter,
    handleUpdateFilter,
    handleDeleteFilter,
    handleExportPNG,
    handleExportExcel,
    handleExportPDF,
    handleSaveVisual,
    setShowDataTable,
    setShowPdfSettings,
    setPdfOrientation,
    setPdfFormat,
  };
}

export { METADATA_CONFIGS };
