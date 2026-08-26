import type { RefObject } from 'react';
import type { FilterRule, CustomWidget } from '@/components/ui/reports/dynamicChartVisualizerTypes';
import type { VisualizerConfig } from '@/components/ui/reports/reportMetadata';
import {
  createFilterRule,
  deleteFilterRule,
  getDefaultCollectionField,
  toggleVisualizerWidgetPin,
  updateFilterRules,
} from '@/components/ui/reports/dynamicChartVisualizerPin';
import {
  runVisualizerExcelExport,
  runVisualizerPdfExport,
  runVisualizerPngExport,
} from '@/components/ui/reports/dynamicChartVisualizerExportHandlers';
import type { AggregatedItem, ChartOperation, ChartType } from '@/components/ui/reports/dynamicChartVisualizerTypes';
import type { CollectionMeta } from '@/components/ui/reports/dynamicChartVisualizerTypes';

interface BuildVisualizerHandlersOptions {
  chartRef: RefObject<HTMLDivElement | null>;
  title: string;
  collectionKey: string;
  xAxisField: string;
  operation: ChartOperation;
  chartType: ChartType;
  targetField: string;
  activePalette: string;
  activeMeta: CollectionMeta;
  filters: FilterRule[];
  setFilters: (filters: FilterRule[]) => void;
  dashboardWidgets: CustomWidget[];
  persistWidgets: (widgets: CustomWidget[]) => void;
  processedData: AggregatedItem[];
  pdfFormat: string;
  pdfOrientation: 'p' | 'l';
  initialConfig?: VisualizerConfig;
  onSave?: (config: VisualizerConfig) => void;
  onExportFailed: () => void;
}

export function buildDynamicChartVisualizerHandlers({
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
  persistWidgets,
  processedData,
  pdfFormat,
  pdfOrientation,
  initialConfig,
  onSave,
  onExportFailed,
}: BuildVisualizerHandlersOptions) {
  const handleTogglePin = () => {
    const nextWidgets = toggleVisualizerWidgetPin({
      widgets: dashboardWidgets,
      collectionKey,
      xAxisField,
      operation,
      chartType,
      title,
      targetField,
      activePalette,
    });
    persistWidgets(nextWidgets);
  };

  const handleAddFilter = () => {
    const defaultField = getDefaultCollectionField(activeMeta);
    setFilters([...filters, createFilterRule(defaultField)]);
  };

  const handleUpdateFilter = (id: string, updates: Partial<FilterRule>) => {
    setFilters(updateFilterRules(filters, id, updates));
  };

  const handleDeleteFilter = (id: string) => {
    setFilters(deleteFilterRule(filters, id));
  };

  const handleExportPNG = () => {
    void runVisualizerPngExport(chartRef, title).then((ok) => {
      if (!ok) onExportFailed();
    });
  };

  const handleExportExcel = () => {
    void runVisualizerExcelExport(title, processedData).then((ok) => {
      if (!ok) onExportFailed();
    });
  };

  const handleExportPDF = () => {
    void runVisualizerPdfExport({
      chartRef,
      title,
      processedData,
      operation,
      xAxisField,
      collectionLabel: activeMeta.name,
      pdfFormat,
      pdfOrientation,
    }).then((ok) => {
      if (!ok) onExportFailed();
    });
  };

  const handleSaveVisual = onSave
    ? () => {
        onSave({
          id: initialConfig?.id || 'visual-' + Date.now(),
          title,
          collection: collectionKey as VisualizerConfig['collection'],
          chartType,
          xAxisField,
          operation,
          targetField,
          activePalette,
        });
      }
    : undefined;

  return {
    handleTogglePin,
    handleAddFilter,
    handleUpdateFilter,
    handleDeleteFilter,
    handleExportPNG,
    handleExportExcel,
    handleExportPDF,
    handleSaveVisual,
  };
}
