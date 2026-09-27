import React from "react";
import type { AppTranslationKey } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionLabel } from "@/components/ui/SectionLabel";

export interface DynamicChartVisualizerDisplayFieldsProps {
  showGrid: boolean;
  setShowGrid: (val: boolean) => void;
  showLegend: boolean;
  setShowLegend: (val: boolean) => void;
  showTooltip: boolean;
  setShowTooltip: (val: boolean) => void;
  t: (key: AppTranslationKey) => string;
}

export function DynamicChartVisualizerDisplayFields({
  showGrid,
  setShowGrid,
  showLegend,
  setShowLegend,
  showTooltip,
  setShowTooltip,
  t,
}: DynamicChartVisualizerDisplayFieldsProps): React.JSX.Element {
  return (
    <div className="pt-2">
      <SectionLabel weight="bold" tracking="wider" className="block mb-2">
        {t("reports.visualizer.displayCustomizations")}
      </SectionLabel>
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
  );
}
