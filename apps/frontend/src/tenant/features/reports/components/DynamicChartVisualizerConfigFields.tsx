import React from "react";
import {
  CHART_PALETTE_DEFS,
  isColorblindSafeChartPalette,
  type AppTranslationKey,
} from "@mms/shared";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { getFieldLabel } from "@/tenant/features/reports/components/reportMetadata";
import type { ChartOperation, ChartType } from "@/tenant/features/reports/components/dynamicChartVisualizerTypes";
import type { DynamicChartVisualizerConfigPanelProps } from "@/tenant/features/reports/components/dynamicChartVisualizerConfigPanelTypes";

type FieldsProps = Pick<
  DynamicChartVisualizerConfigPanelProps,
  | "title"
  | "setTitle"
  | "collectionKey"
  | "setCollectionKey"
  | "xAxisField"
  | "setXAxisField"
  | "operation"
  | "setOperation"
  | "targetField"
  | "setTargetField"
  | "chartType"
  | "setChartType"
  | "activePalette"
  | "setActivePalette"
  | "showGrid"
  | "setShowGrid"
  | "showLegend"
  | "setShowLegend"
  | "showTooltip"
  | "setShowTooltip"
  | "activeMeta"
  | "metadataConfigs"
  | "t"
>;

export function DynamicChartVisualizerConfigFields({
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
  activeMeta,
  metadataConfigs,
  t,
}: FieldsProps): React.JSX.Element {
  return (
    <div className="space-y-3.5">
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
  );
}
