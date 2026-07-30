import React from "react";
import { Plus, Trash2, Filter, Sparkles } from "lucide-react";
import {
  CHART_PALETTE_DEFS,
  isColorblindSafeChartPalette,
  type AppTranslationKey,
} from "@mms/shared";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { getFieldLabel } from "@/tenant/features/reports/components/reportMetadata";
import type {
  ChartOperation,
  ChartType,
  CollectionMeta,
  FilterRule,
} from "@/tenant/features/reports/components/dynamicChartVisualizerTypes";

export interface DynamicChartVisualizerConfigPanelProps {
  title: string;
  setTitle: (value: string) => void;
  collectionKey: string;
  setCollectionKey: (value: string) => void;
  xAxisField: string;
  setXAxisField: (value: string) => void;
  operation: ChartOperation;
  setOperation: (value: ChartOperation) => void;
  targetField: string;
  setTargetField: (value: string) => void;
  chartType: ChartType;
  setChartType: (value: ChartType) => void;
  activePalette: string;
  setActivePalette: (value: string) => void;
  showGrid: boolean;
  setShowGrid: (value: boolean) => void;
  showLegend: boolean;
  setShowLegend: (value: boolean) => void;
  showTooltip: boolean;
  setShowTooltip: (value: boolean) => void;
  filters: FilterRule[];
  activeMeta: CollectionMeta;
  metadataConfigs: Record<string, CollectionMeta>;
  onAddFilter: () => void;
  onUpdateFilter: (id: string, updates: Partial<FilterRule>) => void;
  onDeleteFilter: (id: string) => void;
  t: (key: AppTranslationKey) => string;
}

export function DynamicChartVisualizerConfigPanel({
  title,
  setTitle,
  collectionKey,
  setCollectionKey,
  xAxisField,
  setXAxisField,
  operation,
  setOperation,
  targetField,
  setTargetField,
  chartType,
  setChartType,
  activePalette,
  setActivePalette,
  showGrid,
  setShowGrid,
  showLegend,
  setShowLegend,
  showTooltip,
  setShowTooltip,
  filters,
  activeMeta,
  metadataConfigs,
  onAddFilter,
  onUpdateFilter,
  onDeleteFilter,
  t,
}: DynamicChartVisualizerConfigPanelProps): React.JSX.Element {
  return (
    <div className="lg:col-span-5 space-y-5 print:hidden">
      <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-foreground uppercase tracking-widest leading-none">{t("reports.visualizer.configTitle")}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{t("reports.visualizer.configSubtitle")}</p>
          </div>
        </div>

        <div className="space-y-3.5">
          {/* Widget Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.chartTitleLabel")}</label>
            <Input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("reports.visualizer.titlePlaceholder")}
              className="w-full min-h-11 px-3 py-2 text-xs rounded-xl bg-card/50 text-foreground focus:ring-2 focus:ring-primary/20 font-semibold"
            />
          </div>

          {/* Collection source selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.dataCollection")}</label>
              <FormSelect
                value={collectionKey}
                onChange={(value) => setCollectionKey(value)}
                className="w-full text-xs"
                options={Object.entries(metadataConfigs).map(([metadataKey, metadataConfig]) => {
                  const transKey = `reports.collections.${metadataKey}`;
                  const translated = t(transKey as AppTranslationKey);
                  return {
                    value: metadataKey,
                    label: translated === transKey ? metadataConfig.name : translated,
                  };
                })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.xAxisDimension")}</label>
              <FormSelect
                value={xAxisField}
                onChange={setXAxisField}
                className="w-full text-xs"
                options={activeMeta.fields.map((metadataField) => ({
                  value: metadataField.value,
                  label: getFieldLabel(metadataField.value, metadataField.label, t),
                }))}
              />
            </div>
          </div>

          {/* Formula operation & target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.operation")}</label>
              <FormSelect
                value={operation}
                onChange={(value) => setOperation(value as ChartOperation)}
                className="w-full text-xs"
                options={[
                  { value: "count", label: t("reports.visualizer.opCount") },
                  ...(activeMeta.numericFields.length > 0
                    ? [
                        { value: "sum", label: t("reports.visualizer.opSum") },
                        { value: "avg", label: t("reports.visualizer.opAvg") },
                        { value: "min", label: t("reports.visualizer.opMin") },
                        { value: "max", label: t("reports.visualizer.opMax") },
                      ]
                    : []),
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.targetField")}</label>
              <FormSelect
                disabled={operation === "count"}
                value={targetField}
                onChange={setTargetField}
                className="w-full text-xs"
                options={
                  activeMeta.numericFields.length === 0
                    ? [{ value: "", label: t("reports.widgets.builder.noNumericFields") }]
                    : activeMeta.numericFields.map((numericField) => ({
                        value: numericField.value,
                        label: getFieldLabel(numericField.value, numericField.label, t),
                      }))
                }
              />
            </div>
          </div>

          {/* Visualizer Type & Color Palette Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.chartType")}</label>
              <FormSelect
                value={chartType}
                onChange={(value) => setChartType(value as ChartType)}
                className="w-full text-xs"
                options={[
                  { value: "bar", label: t("reports.visualizer.chartBar") },
                  { value: "line", label: t("reports.visualizer.chartLine") },
                  { value: "area", label: t("reports.visualizer.chartArea") },
                  { value: "pie", label: t("reports.visualizer.chartPie") },
                  { value: "radar", label: t("reports.visualizer.chartRadar") },
                ]}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.visualizer.colorPalette")}</label>
                {isColorblindSafeChartPalette(activePalette) && (
                  <span className="text-xs bg-success/15 text-success px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest leading-none">{t('charts.accessibleBadge')}</span>
                )}
              </div>
              <FormSelect
                value={activePalette}
                onChange={setActivePalette}
                className="w-full text-xs"
                options={CHART_PALETTE_DEFS.filter((def) => def.id !== 'brand' && def.colors.length > 0).map((def) => ({
                  value: def.id,
                  label: t(def.labelKey),
                }))}
              />
            </div>
          </div>

          {/* Styling options */}
          <div className="pt-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">{t("reports.visualizer.displayCustomizations")}</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card/25 hover:bg-card/45 transition-colors cursor-pointer select-none text-xs font-semibold text-foreground">
                <Checkbox
                  checked={showGrid}
                  onCheckedChange={(checked) => setShowGrid(Boolean(checked))}
                />
                {t("reports.visualizer.gridLines")}
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card/25 hover:bg-card/45 transition-colors cursor-pointer select-none text-xs font-semibold text-foreground">
                <Checkbox
                  checked={showLegend}
                  onCheckedChange={(checked) => setShowLegend(Boolean(checked))}
                />
                {t("reports.visualizer.legends")}
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card/25 hover:bg-card/45 transition-colors cursor-pointer select-none text-xs font-semibold text-foreground">
                <Checkbox
                  checked={showTooltip}
                  onCheckedChange={(checked) => setShowTooltip(Boolean(checked))}
                />
                {t("reports.visualizer.tooltips")}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filters builder inside panel */}
      <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Filter className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-foreground uppercase tracking-widest leading-none truncate">{t("reports.visualizer.queryFilters")}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 uppercase font-bold tracking-wider truncate">{t("reports.visualizer.filtersSubtitle")}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onAddFilter}
            className="min-h-11 flex items-center gap-1 px-3 rounded-xl border border-border bg-card/50 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 shadow-none"
          >
            <Plus className="w-3 h-3" />
            {t("reports.visualizer.addRule")}
          </Button>
        </div>

        <div className="space-y-2.5 max-h-[13.75rem] overflow-y-auto pe-1">
          {filters.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 text-center bg-card/10 rounded-2xl border border-dashed border-border/40">{t("reports.visualizer.noFilters")}</p>
          ) : (
            filters.map((rule) => (
              <div key={rule.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-card/30 p-2.5 sm:flex-row sm:items-center">
                {/* Field Selector */}
                <FormSelect
                  value={rule.field}
                  onChange={(val) => onUpdateFilter(rule.id, { field: val })}
                  className="min-w-0 flex-1"
                  options={activeMeta.fields.map((metadataField) => ({
                    value: metadataField.value,
                    label: getFieldLabel(metadataField.value, metadataField.label, t),
                  }))}
                />

                {/* Operator */}
                <FormSelect
                  value={rule.operator}
                  onChange={(val) => onUpdateFilter(rule.id, { operator: val as FilterRule["operator"] })}
                  className="w-full font-medium sm:w-24"
                  options={[
                    { value: "equals", label: "=" },
                    { value: "contains", label: "like" },
                    { value: "startsWith", label: "starts" },
                    ...(activeMeta.fields.find((field) => field.value === rule.field)?.isNumeric
                      ? [
                          { value: "gt", label: ">" },
                          { value: "lt", label: "<" },
                        ]
                      : []),
                  ]}
                />

                <Input
                  type="text"
                  value={rule.value}
                  onChange={(event) => onUpdateFilter(rule.id, { value: event.target.value })}
                  placeholder={t("reports.visualizer.filterValuePlaceholder")}
                  className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-card/60 px-2 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/20"
                />

                {/* Remove */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteFilter(rule.id)}
                  className="shrink-0 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive shadow-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>

  );
}
