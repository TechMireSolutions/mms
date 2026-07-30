import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  DEFAULT_CHART_PALETTE_ID,
  getChartPaletteColors,
} from "@mms/shared";

import { useTranslation } from "@/hooks/useTranslation";

import { getObject, saveObject } from "@/lib/db";
import { useReportCollectionRows } from "@/lib/reports/useReportCollections";
import { METADATA_FIELDS, VisualizerConfig } from "@/tenant/features/reports/components/reportMetadata";
import type {
  AggregatedItem,
  ChartOperation,
  ChartType,
  CollectionMeta,
  CustomWidget,
  FilterRule,
} from "@/tenant/features/reports/components/dynamicChartVisualizerTypes";
import {
  aggregateVisualizerRows,
  isDateDimensionField,
  resolveWidgetPinColor,
} from "@/tenant/features/reports/components/dynamicChartVisualizerHelpers";
import {
  exportVisualizerExcel,
  exportVisualizerPdf,
  exportVisualizerPng,
} from "@/tenant/features/reports/components/dynamicChartVisualizerExports";
import { DynamicChartVisualizerConfigPanel } from "@/tenant/features/reports/components/DynamicChartVisualizerConfigPanel";
import { DynamicChartVisualizerPreview } from "@/tenant/features/reports/components/DynamicChartVisualizerPreview";

const METADATA_CONFIGS: Record<string, CollectionMeta> = METADATA_FIELDS as unknown as Record<string, CollectionMeta>;

interface DynamicChartVisualizerProps {
  initialConfig?: VisualizerConfig;
  onSave?: (config: VisualizerConfig) => void;
  onClose?: () => void;
}

export default function DynamicChartVisualizer({
  initialConfig,
  onSave,
  onClose
}: DynamicChartVisualizerProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const chartRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const [title, setTitle] = useState(() => initialConfig?.title || t("reports.visualizer.defaultTitle"));
  const [collectionKey, setCollectionKey] = useState<keyof typeof METADATA_CONFIGS>(initialConfig?.collection || "students");
  const [chartType, setChartType] = useState<ChartType>(initialConfig?.chartType || "bar");
  const [xAxisField, setXAxisField] = useState(initialConfig?.xAxisField || "status");
  const [operation, setOperation] = useState<ChartOperation>(initialConfig?.operation || "count");
  const [targetField, setTargetField] = useState(initialConfig?.targetField || "");
  const [activePalette, setActivePalette] = useState(initialConfig?.activePalette || DEFAULT_CHART_PALETTE_ID);

  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showDataTable, setShowDataTable] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<"p" | "l">("p");
  const [pdfFormat, setPdfFormat] = useState<string>("a4");
  const [showPdfSettings, setShowPdfSettings] = useState<boolean>(false);

  const [filters, setFilters] = useState<FilterRule[]>([]);

  const [dashboardWidgets, setDashboardWidgets] = useState<CustomWidget[]>(() => {
    return getObject<CustomWidget[]>("kpi_custom_widgets", []);
  });

  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver((resizeEntries) => {
      for (const resizeEntry of resizeEntries) {
        if (resizeEntry.contentRect.width > 0) {
          setContainerWidth(resizeEntry.contentRect.width);
        }
      }
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const axisFontSize = useMemo(() => {
    return Math.max(9, Math.min(13, Math.round(containerWidth / 60)));
  }, [containerWidth]);

  const legendFontSize = useMemo(() => {
    return Math.max(10, Math.min(13, Math.round(containerWidth / 55)));
  }, [containerWidth]);

  const tickGap = useMemo(() => {
    return Math.max(10, Math.min(30, Math.round(containerWidth / 25)));
  }, [containerWidth]);

  const activeMeta = METADATA_CONFIGS[collectionKey];
  const { rows: collectionRows, denominations } = useReportCollectionRows(collectionKey);

  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }
    const meta = METADATA_CONFIGS[collectionKey];
    if (meta) {
      if (meta.fields[0]) {
        const defaultField = meta.fields[0].value;
        setXAxisField(defaultField);
        setChartType(isDateDimensionField(defaultField) ? "line" : "bar");
      }
      if (meta.numericFields[0]) {
        setTargetField(meta.numericFields[0].value);
      } else {
        setTargetField("");
        setOperation("count");
      }
    }
    setFilters([]);
  }, [collectionKey]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setChartType(isDateDimensionField(xAxisField) ? "line" : "bar");
  }, [xAxisField]);

  useEffect(() => {
    if (activeMeta.numericFields.length === 0 && operation !== "count") {
      setOperation("count");
    }
  }, [operation, activeMeta]);

  const processedData = useMemo<AggregatedItem[]>(() => {
    return aggregateVisualizerRows({
      collectionKey,
      collectionRows,
      denominations,
      filters,
      xAxisField,
      operation,
      targetField,
    });
  }, [collectionKey, xAxisField, operation, targetField, filters, collectionRows, denominations]);

  const isPinned = useMemo(() => {
    return dashboardWidgets.some(
      (widget) =>
        widget.collection === collectionKey &&
        widget.xAxisField === xAxisField &&
        widget.operation === (operation === "min" || operation === "max" ? "count" : operation) && // map compatibility
        widget.chartType === chartType &&
        widget.isPinnedToDashboard
    );
  }, [dashboardWidgets, collectionKey, xAxisField, operation, chartType]);

  const handleTogglePin = () => {
    const nextWidgets = [...dashboardWidgets];
    const matchingIndex = nextWidgets.findIndex(
      (widget) =>
        widget.collection === collectionKey &&
        widget.xAxisField === xAxisField &&
        widget.operation === (operation === "min" || operation === "max" ? "count" : operation)
    );

    if (matchingIndex > -1) {
      nextWidgets[matchingIndex].isPinnedToDashboard = !nextWidgets[matchingIndex].isPinnedToDashboard;
    } else {
      const newWidget: CustomWidget = {
        id: "widget-" + Date.now(),
        title: title,
        category: collectionKey === "finance_invoices" ? "financial" : (collectionKey === "attendance_records" ? "attendance" : String(collectionKey)),
        collection: collectionKey as CustomWidget["collection"],
        chartType: chartType,
        xAxisField: xAxisField,
        operation: operation === "min" || operation === "max" ? "count" : operation,
        targetField: targetField,
        color: resolveWidgetPinColor(activePalette),
        isPinnedToDashboard: true,
        filterOperator: "equals"
      };
      nextWidgets.push(newWidget);
    }

    setDashboardWidgets(nextWidgets);
    saveObject("kpi_custom_widgets", nextWidgets);
    window.dispatchEvent(new Event("local-database-update"));
  };

  const handleAddFilter = () => {
    const defaultField = activeMeta.fields[0]?.value || "";
    const newRule: FilterRule = {
      id: "filter-" + Date.now() + Math.random().toString(36).slice(2, 5),
      field: defaultField,
      operator: "equals",
      value: ""
    };
    setFilters([...filters, newRule]);
  };

  const handleUpdateFilter = (id: string, updates: Partial<FilterRule>) => {
    const updatedFilters = filters.map((rule) => {
      if (rule.id === id) {
        return { ...rule, ...updates };
      }
      return rule;
    });
    setFilters(updatedFilters);
  };

  const handleDeleteFilter = (id: string) => {
    setFilters(filters.filter((rule) => rule.id !== id));
  };

  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    try {
      await exportVisualizerPng({ chartElement: chartRef.current, title });
    } catch (error) {
      console.error("Failed to export chart image", error);
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportVisualizerExcel({ title, processedData });
    } catch (error) {
      console.error("Failed to export Excel spreadsheet", error);
    }
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    try {
      await exportVisualizerPdf({
        chartElement: chartRef.current,
        title,
        processedData,
        operation,
        xAxisField,
        collectionLabel: activeMeta.name,
        pdfFormat,
        pdfOrientation,
      });
    } catch (error) {
      console.error("Failed to export PDF report", error);
    }
  };

  const handleSaveVisual = onSave
    ? () => {
        onSave({
          id: initialConfig?.id || "visual-" + Date.now(),
          title,
          collection: collectionKey as VisualizerConfig["collection"],
          chartType,
          xAxisField,
          operation,
          targetField,
          activePalette
        });
      }
    : undefined;

  const currentColors = [...getChartPaletteColors(activePalette)];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-start font-sans">
      
      <DynamicChartVisualizerConfigPanel
        title={title}
        setTitle={setTitle}
        collectionKey={collectionKey}
        setCollectionKey={(value) => setCollectionKey(value as keyof typeof METADATA_CONFIGS)}
        xAxisField={xAxisField}
        setXAxisField={setXAxisField}
        operation={operation}
        setOperation={setOperation}
        targetField={targetField}
        setTargetField={setTargetField}
        chartType={chartType}
        setChartType={setChartType}
        activePalette={activePalette}
        setActivePalette={setActivePalette}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        showLegend={showLegend}
        setShowLegend={setShowLegend}
        showTooltip={showTooltip}
        setShowTooltip={setShowTooltip}
        filters={filters}
        activeMeta={activeMeta}
        metadataConfigs={METADATA_CONFIGS}
        onAddFilter={handleAddFilter}
        onUpdateFilter={handleUpdateFilter}
        onDeleteFilter={handleDeleteFilter}
        t={t}
      />

      <DynamicChartVisualizerPreview
        chartRef={chartRef}
        title={title}
        collectionKey={collectionKey}
        chartType={chartType}
        xAxisField={xAxisField}
        operation={operation}
        activeMeta={activeMeta}
        processedData={processedData}
        currentColors={currentColors}
        showGrid={showGrid}
        showLegend={showLegend}
        showTooltip={showTooltip}
        showDataTable={showDataTable}
        showPdfSettings={showPdfSettings}
        pdfOrientation={pdfOrientation}
        pdfFormat={pdfFormat}
        containerWidth={containerWidth}
        axisFontSize={axisFontSize}
        legendFontSize={legendFontSize}
        tickGap={tickGap}
        isPinned={isPinned}
        onSaveVisual={handleSaveVisual}
        onClose={onClose}
        onTogglePin={handleTogglePin}
        onExportPng={handleExportPNG}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPDF}
        onToggleDataTable={() => setShowDataTable(!showDataTable)}
        onTogglePdfSettings={() => setShowPdfSettings(!showPdfSettings)}
        onPdfOrientationChange={setPdfOrientation}
        onPdfFormatChange={setPdfFormat}
        t={t}
      />

    </div>
  );
}
