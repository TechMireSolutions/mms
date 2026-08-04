import React from "react";
import { Sparkles } from "lucide-react";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { DynamicChartVisualizerFiltersPanel } from "@/tenant/features/reports/components/DynamicChartVisualizerFiltersPanel";
import { DynamicChartVisualizerConfigFields } from "@/tenant/features/reports/components/DynamicChartVisualizerConfigFields";
import type { DynamicChartVisualizerConfigPanelProps } from "@/tenant/features/reports/components/dynamicChartVisualizerConfigPanelTypes";

export type { DynamicChartVisualizerConfigPanelProps } from "@/tenant/features/reports/components/dynamicChartVisualizerConfigPanelTypes";

export function DynamicChartVisualizerConfigPanel(
  props: DynamicChartVisualizerConfigPanelProps,
): React.JSX.Element {
  const {
    filters,
    activeMeta,
    onAddFilter,
    onUpdateFilter,
    onDeleteFilter,
    t,
  } = props;

  return (
    <div className="lg:col-span-5 space-y-5 print:hidden">
      <div className={`${WORK_SURFACE} p-5 space-y-4`}>
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-foreground uppercase tracking-widest leading-none">{t("reports.visualizer.configTitle")}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">{t("reports.visualizer.configSubtitle")}</p>
          </div>
        </div>

        <DynamicChartVisualizerConfigFields {...props} />
      </div>

      <DynamicChartVisualizerFiltersPanel
        filters={filters}
        activeMeta={activeMeta}
        onAddFilter={onAddFilter}
        onUpdateFilter={onUpdateFilter}
        onDeleteFilter={onDeleteFilter}
        t={t}
      />
    </div>
  );
}
