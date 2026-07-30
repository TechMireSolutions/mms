import type React from "react";
import { LayoutDashboard, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { AppTranslationKey } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { resolveWidgetTitle } from "@/lib/dashboardWidgets";
import type { ReportCollectionsSnapshot } from "@/lib/reports/useReportCollections";
import { CustomWidgetRenderer } from "@/tenant/features/reports/components/pinnedWidgets/CustomWidgetRenderer";
import type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import { METADATA_FIELDS, getCollectionLabel } from "@/tenant/features/reports/components/reportMetadata";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

const WIDGET_TYPE_LABEL_KEYS: Partial<Record<NonNullable<CustomWidget["widgetType"]>, AppTranslationKey>> = {
  kpi: "reports.widgets.builder.typeKpi",
  card: "reports.widgets.builder.typeCard",
  progress: "reports.widgets.builder.typeProgress",
  switch: "reports.widgets.builder.typeSwitch",
  "sessions-list": "reports.widgets.builder.typeSessionsList",
  "attendance-summary": "reports.widgets.builder.typeAttendanceSummary",
  "attendance-rate": "reports.widgets.builder.typeAttendanceRate",
  "fee-summary": "reports.widgets.builder.typeFeeSummary",
  "outstanding-list": "reports.widgets.builder.typeOutstandingList",
  "overdue-obligations": "reports.widgets.builder.typeOverdueObligations",
  "enrollment-trends": "reports.widgets.builder.typeEnrollmentTrends",
  "revenue-expenses": "reports.widgets.builder.typeRevenueExpenses",
  "hasanat-distribution": "reports.widgets.builder.typeHasanatDistribution",
};

interface PinnedWidgetsGridProps {
  filteredWidgets: CustomWidget[];
  collections: ReportCollectionsSnapshot;
  onTogglePin: (id: string) => void;
  onEditClick: (widget: CustomWidget) => void;
  onDeleteWidget: (id: string) => void;
  onSwitchToggle: (widget: CustomWidget) => void;
  t: TranslationFunction;
}

export function PinnedWidgetsGrid({
  filteredWidgets,
  collections,
  onTogglePin,
  onEditClick,
  onDeleteWidget,
  onSwitchToggle,
  t,
}: PinnedWidgetsGridProps): React.JSX.Element {
  if (filteredWidgets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-card/10 backdrop-blur p-8 text-center">
        <LayoutDashboard className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <h4 className="text-sm font-black text-foreground uppercase tracking-widest">{t("reports.widgets.emptyTitle")}</h4>
        <p className="text-xs text-muted-foreground mt-1">{t("reports.widgets.emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredWidgets.map((widget) => {
        const typeLabelKey = WIDGET_TYPE_LABEL_KEYS[widget.widgetType || "kpi"];
        return (
          <motion.div
            key={widget.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-md p-5 space-y-4 shadow-sm relative group text-start font-sans"
          >
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-0.5">
                <span className="block truncate text-xs font-black uppercase leading-none tracking-widest text-foreground">{resolveWidgetTitle(widget, t)}</span>
                <p className="truncate text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {typeLabelKey ? t(typeLabelKey) : (widget.widgetType || "kpi")} • {getCollectionLabel(widget.collection, METADATA_FIELDS[widget.collection]?.name || widget.collection.replace("_", " "), t)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onTogglePin(widget.id)}
                  className={`rounded-lg border shadow-none ${
                    widget.isPinnedToDashboard
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  title={widget.isPinnedToDashboard ? t("reports.widgets.pinnedToDashboard") : t("reports.widgets.pinToDashboard")}
                >
                  {widget.isPinnedToDashboard ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onEditClick(widget)}
                  className="rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 shadow-none"
                  title={t("reports.widgets.editWidget")}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onDeleteWidget(widget.id)}
                  className="rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 shadow-none"
                  title={t("reports.widgets.deleteWidget")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <ErrorBoundary>
              <CustomWidgetRenderer
                widget={widget}
                collections={collections}
                onSwitchToggle={onSwitchToggle}
                onMetricClick={() => {}}
              />
            </ErrorBoundary>
          </motion.div>
        );
      })}
    </div>
  );
}
