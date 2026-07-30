import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  Image,
  Pin,
  PinOff,
  Printer,
  Settings,
  Table,
} from "lucide-react";
import { formatNumber } from "@mms/shared";

import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import {
  getCollectionLabel,
  getFieldLabel,
} from "@/tenant/features/reports/components/reportMetadata";
import { DynamicChartVisualizerChart } from "@/tenant/features/reports/components/DynamicChartVisualizerChart";
import type {
  AggregatedItem,
  ChartOperation,
  ChartType,
  CollectionMeta,
} from "@/tenant/features/reports/components/dynamicChartVisualizerTypes";

export interface DynamicChartVisualizerPreviewProps {
  chartRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  collectionKey: string;
  chartType: ChartType;
  xAxisField: string;
  operation: ChartOperation;
  activeMeta: CollectionMeta;
  processedData: AggregatedItem[];
  currentColors: string[];
  showGrid: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  showDataTable: boolean;
  showPdfSettings: boolean;
  pdfOrientation: "p" | "l";
  pdfFormat: string;
  containerWidth: number;
  axisFontSize: number;
  legendFontSize: number;
  tickGap: number;
  isPinned: boolean;
  onSaveVisual?: () => void;
  onClose?: () => void;
  onTogglePin: () => void;
  onExportPng: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onToggleDataTable: () => void;
  onTogglePdfSettings: () => void;
  onPdfOrientationChange: (value: "p" | "l") => void;
  onPdfFormatChange: (value: string) => void;
  t: TranslationFunction;
}

export function DynamicChartVisualizerPreview({
  chartRef,
  title,
  collectionKey,
  chartType,
  xAxisField,
  operation,
  activeMeta,
  processedData,
  currentColors,
  showGrid,
  showLegend,
  showTooltip,
  showDataTable,
  showPdfSettings,
  pdfOrientation,
  pdfFormat,
  containerWidth,
  axisFontSize,
  legendFontSize,
  tickGap,
  isPinned,
  onSaveVisual,
  onClose,
  onTogglePin,
  onExportPng,
  onExportExcel,
  onExportPdf,
  onToggleDataTable,
  onTogglePdfSettings,
  onPdfOrientationChange,
  onPdfFormatChange,
  t,
}: DynamicChartVisualizerPreviewProps): React.JSX.Element {
  const activeField = activeMeta.fields.find((field) => field.value === xAxisField);
  const totalValue = processedData.reduce((sum, aggregatedItem) => sum + aggregatedItem.value, 0);
  const avgGroupValue = processedData.length ? Math.round(totalValue / processedData.length) : 0;
  const topGroup = processedData[0]?.name || "N/A";

  return (
    <div className="lg:col-span-7 space-y-5">
      <div className="rounded-3xl border border-border/50 bg-card/45 backdrop-blur-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-foreground tracking-tight leading-none">{title}</h3>
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">
              {t("reports.visualizer.sourceSubtitle", {
                source: getCollectionLabel(collectionKey, activeMeta.name, t),
                axis: getFieldLabel(xAxisField, activeField?.label || xAxisField, t),
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {onSaveVisual && (
              <Button
                type="button"
                onClick={onSaveVisual}
                className="min-h-11 flex items-center gap-1.5 px-3.5 rounded-2xl bg-primary text-primary-foreground border border-primary/50 text-xs font-black uppercase tracking-wider hover:opacity-90 shadow-md shadow-primary/15"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("reports.visualizer.saveVisual")}
              </Button>
            )}

            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="min-h-11 flex items-center gap-1.5 px-3.5 rounded-2xl border border-border bg-card/50 text-muted-foreground hover:text-foreground text-xs font-black uppercase tracking-wider shadow-none"
              >
                {t("reports.visualizer.cancel")}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={onTogglePin}
              className={`min-h-11 flex items-center gap-1.5 px-3.5 rounded-2xl border text-xs font-black uppercase tracking-wider shadow-none ${
                isPinned
                  ? "border-success/30 bg-success/10 text-success shadow-md shadow-success/5 hover:bg-success/15 hover:text-success"
                  : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              {isPinned ? t("reports.visualizer.pinnedToHome") : t("reports.visualizer.pinToDashboard")}
            </Button>

            <div className="flex items-center gap-1.5 relative">
              {showPdfSettings && (
                <div className="absolute end-0 bottom-full mb-2 bg-card border border-border rounded-2xl p-4 shadow-xl z-50 flex flex-col gap-3.5 min-w-[12.5rem] backdrop-blur-xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("reports.visualizer.pdfOrientation")}</label>
                    <div className="flex gap-1 p-1 bg-muted rounded-xl">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onPdfOrientationChange("p")}
                        className={`min-h-11 flex-1 px-2 rounded-lg text-xs font-black uppercase shadow-none ${pdfOrientation === "p" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {t("reports.export.portrait")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onPdfOrientationChange("l")}
                        className={`min-h-11 flex-1 px-2 rounded-lg text-xs font-black uppercase shadow-none ${pdfOrientation === "l" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {t("reports.export.landscape")}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("reports.visualizer.pdfPageSize")}</label>
                    <FormSelect
                      value={pdfFormat}
                      onChange={onPdfFormatChange}
                      className="w-full text-xs"
                      options={[
                        { value: "a4", label: t("reports.builder.formatA4") },
                        { value: "letter", label: t("reports.builder.formatLetter") },
                        { value: "a3", label: t("reports.builder.formatA3") },
                        { value: "legal", label: t("reports.builder.formatLegal") },
                      ]}
                    />
                  </div>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => window.print()}
                className="bg-card/60 hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground rounded-xl shadow-none"
                title={t("reports.visualizer.printReport")}
              >
                <Printer className="w-3.5 h-3.5" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onExportExcel}
                className="bg-card/60 hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground rounded-xl shadow-none"
                title={t("reports.visualizer.exportExcel")}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-success" />
              </Button>

              <div className="flex bg-card/60 border border-border/50 rounded-xl overflow-x-auto p-0.5 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onExportPng}
                  className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg shadow-none"
                  title={t("reports.visualizer.exportPng")}
                >
                  <Image className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onExportPdf}
                  className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg shadow-none"
                  title={t("reports.visualizer.exportPdf")}
                >
                  <FileText className="w-3.5 h-3.5 text-destructive" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onTogglePdfSettings}
                  className={`hover:bg-muted rounded-lg shadow-none ${showPdfSettings ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                  title={t("reports.visualizer.pdfSettings")}
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div ref={chartRef} className="relative overflow-hidden rounded-3xl border border-border/30 bg-card/5 p-4 shadow-inner backdrop-blur-md">
          <DynamicChartVisualizerChart
            chartType={chartType}
            operation={operation}
            processedData={processedData}
            currentColors={currentColors}
            showGrid={showGrid}
            showLegend={showLegend}
            showTooltip={showTooltip}
            containerWidth={containerWidth}
            axisFontSize={axisFontSize}
            legendFontSize={legendFontSize}
            tickGap={tickGap}
            t={t}
          />
        </div>

        {processedData.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="p-3 border border-border bg-card/30 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.totalAggregated")}</span>
              <span className="text-sm font-black text-foreground mt-1 leading-none">
                {formatNumber(totalValue)}
              </span>
            </div>
            <div className="p-3 border border-border bg-card/30 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.avgPerGroup")}</span>
              <span className="text-sm font-black text-foreground mt-1 leading-none">
                {formatNumber(avgGroupValue)}
              </span>
            </div>
            <div className="p-3 border border-border bg-card/30 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.topGroup")}</span>
              <span className="text-sm font-black text-foreground mt-1 leading-none truncate block max-w-full">
                {topGroup}
              </span>
            </div>
          </div>
        )}

        <div className="border-t border-border/40 pt-4 flex flex-col gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onToggleDataTable}
            className="min-h-11 w-full flex items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground select-none shadow-none px-0"
          >
            <span className="flex items-center gap-1.5">
              <Table className="w-4 h-4 text-primary" />
              {t("reports.visualizer.dataMatrix")}
            </span>
            {showDataTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          <AnimatePresence>
            {showDataTable && processedData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border border-border/60 bg-card/25 rounded-2xl overflow-hidden mt-1 max-h-[13.75rem] overflow-y-auto">
                  <div className="space-y-3 p-3 md:hidden">
                    {processedData.map((processedRow, index) => (
                      <article
                        key={index}
                        className="space-y-2 rounded-xl border border-border bg-card p-3"
                      >
                        <p className="text-sm font-semibold text-foreground">{processedRow.name}</p>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <dt className="text-xs font-semibold text-muted-foreground">
                              {t("reports.visualizer.aggregatedValue", { op: operation.toUpperCase() })}
                            </dt>
                            <dd className="font-bold text-primary">{formatNumber(processedRow.value)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-muted-foreground">{t("reports.visualizer.recordCount")}</dt>
                            <dd className="text-muted-foreground">{processedRow.count}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-xs text-start">
                      <thead className="bg-muted/50 border-b border-border/50 text-xs font-black uppercase text-muted-foreground tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5">{t("reports.visualizer.xAxisCategory")}</th>
                          <th className="px-4 py-2.5">{t("reports.visualizer.aggregatedValue", { op: operation.toUpperCase() })}</th>
                          <th className="px-4 py-2.5">{t("reports.visualizer.recordCount")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium">
                        {processedData.map((processedRow, index) => (
                          <tr key={index} className="hover:bg-muted/20">
                            <td className="px-4 py-2.5 text-foreground font-semibold">{processedRow.name}</td>
                            <td className="px-4 py-2.5 text-primary font-bold">{formatNumber(processedRow.value)}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{processedRow.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
