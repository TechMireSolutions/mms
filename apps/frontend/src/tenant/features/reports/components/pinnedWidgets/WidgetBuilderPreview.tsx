import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { ReportCollectionsSnapshot } from "@/lib/reports/useReportCollections";
import { CustomWidgetRenderer } from "@/tenant/features/reports/components/pinnedWidgets/CustomWidgetRenderer";
import type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

interface WidgetBuilderPreviewProps {
  previewWidget: CustomWidget;
  collections: ReportCollectionsSnapshot;
  scalerSize: number;
  setScalerSize: (scalerSize: number) => void;
  onCancelEdit: () => void;
  onSave: () => void;
  canSave: boolean;
  isEditing: boolean;
  onSwitchToggle: () => void;
}

export function WidgetBuilderPreview({
  previewWidget,
  collections,
  scalerSize,
  setScalerSize,
  onCancelEdit,
  onSave,
  canSave,
  isEditing,
  onSwitchToggle,
}: WidgetBuilderPreviewProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={cn(WORK_SURFACE, "p-4 flex flex-col justify-between relative min-h-[21.875rem]")}>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-start">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest block">{t("reports.widgets.builder.testerPreview")}</span>
          <span className="text-xs text-primary font-bold">{scalerSize}x{scalerSize}px</span>
        </div>

        <div className="space-y-1 bg-card/30 p-2.5 rounded-xl border border-border/50">
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block">{t("reports.widgets.builder.dragToScale")}</label>
          <input
            type="range"
            min={100}
            max={250}
            value={scalerSize}
            onChange={(event) => setScalerSize(Number(event.target.value))}
            className="w-full accent-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-center py-4 bg-muted/10 rounded-2xl border border-dashed border-border/60 min-h-[13.75rem]">
          <div
            className={cn(WORK_SURFACE_INNER, "overflow-hidden shadow-lg rounded-3xl transition-all duration-100 flex items-center justify-center animate-fade-in")}
            style={{ width: scalerSize, height: scalerSize }}
          >
            <CustomWidgetRenderer
              widget={previewWidget}
              collections={collections}
              isCompact={scalerSize < 140}
              onSwitchToggle={onSwitchToggle}
              onMetricClick={() => {}}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancelEdit}
          className="flex-1 h-auto py-2.5 rounded-xl border border-border bg-card/50 hover:bg-muted text-foreground font-black text-xs uppercase tracking-wider shadow-none"
        >
          {t("reports.widgets.builder.cancel")}
        </Button>
        <Button
          type="button"
          disabled={!canSave}
          onClick={onSave}
          className="flex-[2] h-auto py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-wider disabled:opacity-40 shadow-lg hover:shadow-primary/20 shadow-primary/10"
        >
          {isEditing ? t("reports.widgets.builder.updateWidget") : t("reports.widgets.builder.createWidget")}
        </Button>
      </div>
    </div>
  );
}
