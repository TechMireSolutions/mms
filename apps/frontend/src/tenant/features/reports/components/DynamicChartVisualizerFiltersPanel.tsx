import React from "react";
import { Plus, Trash2, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { getFieldLabel } from "@/tenant/features/reports/components/reportMetadata";
import type { FilterRule } from "@/tenant/features/reports/components/dynamicChartVisualizerTypes";
import type { DynamicChartVisualizerFiltersPanelProps } from "@/tenant/features/reports/components/dynamicChartVisualizerConfigPanelTypes";

export function DynamicChartVisualizerFiltersPanel({
  filters,
  activeMeta,
  onAddFilter,
  onUpdateFilter,
  onDeleteFilter,
  t,
}: DynamicChartVisualizerFiltersPanelProps): React.JSX.Element {
  return (
    <div className={`${WORK_SURFACE} p-5 space-y-4`}>
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
          <EmptyState
            title={t("reports.visualizer.noFilters")}
            variant="dashed"
            compact
            icon={null}
            className="italic border-border/40 bg-card/10 rounded-2xl"
          />
        ) : (
          filters.map((rule) => (
            <div key={rule.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-card/30 p-2.5 sm:flex-row sm:items-center">
              <FormSelect
                value={rule.field}
                onChange={(val) => onUpdateFilter(rule.id, { field: val })}
                className="min-w-0 flex-1"
                options={activeMeta.fields.map((metadataField) => ({
                  value: metadataField.value,
                  label: getFieldLabel(metadataField.value, metadataField.label, t),
                }))}
              />

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
  );
}
