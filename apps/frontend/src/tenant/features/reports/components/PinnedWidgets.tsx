import React, { useState, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  LayoutDashboard, Pin, PinOff, Trash2,
  SlidersHorizontal, Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AppTranslationKey } from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";
import {
  isRestWidgetCollection,
  persistWidgetRecordToggle,
} from "@/lib/reports/widgetRecordToggle";
import { useWidgetCollections } from "@/lib/reports/useReportCollections";
import {
  CustomWidget,
} from "@/tenant/features/reports/components/pinnedWidgets/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useDashboardConfig } from "@/hooks/useDashboardConfig";
import { resolveWidgetTitle } from "@/lib/dashboardWidgets";
import { CustomWidgetRenderer } from "@/tenant/features/reports/components/pinnedWidgets/CustomWidgetRenderer";
import { WidgetBuilder } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilder";
import { useContactsWidgetAggregates } from "@/tenant/hooks/collections/contacts";
import { useStudentsWidgetAggregates } from "@/tenant/hooks/collections/students";
import { useTeachersWidgetAggregates } from "@/tenant/hooks/collections/teachers";
import { METADATA_FIELDS, getCollectionLabel } from "@/tenant/features/reports/components/reportMetadata";
import { notify } from "@/lib/notify";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
export {
  getWidgetCollections,
  getFilteredRecords,
  computeWidgetSingleValue,
} from "@/tenant/features/reports/components/pinnedWidgets/widgetDataUtils";
export { getOrInitializeCustomWidgets } from "@/tenant/features/reports/components/pinnedWidgets/widgetDefaults";
export { DashboardWidgets } from "@/tenant/features/reports/components/pinnedWidgets/DashboardWidgets";
export { WidgetBuilder } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilder";

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


/**
 * PinnedWidgets Main Module Component. Exposes custom Widget builders.
 */
export default function PinnedWidgets({ category }: { category: string }): React.JSX.Element {
  const { t } = useTranslation();
  const {
    disabledCardIds,
    toggleCardVisibility,
    customWidgets: widgets,
    updateCustomWidgets,
  } = useDashboardConfig();

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const collections = useWidgetCollections();

  const [sectionSettings, setSectionSettings] = useState<Record<string, boolean>>(() => {
    return getObject<Record<string, boolean>>("dashboard_section_settings", {
      enrollmentChart: true,
      revenueChart: true,
      attendanceChart: true,
      hasanatChart: true,
      sessionsTable: true,
      todayAttendance: true,
      feeSummary: true,
      outstandingFees: true,
      overdueObligations: true
    });
  });

  const toggleSectionSetting = (key: string) => {
    const nextSectionSettings = { ...sectionSettings, [key]: !sectionSettings[key] };
    setSectionSettings(nextSectionSettings);
    saveObject("dashboard_section_settings", nextSectionSettings);
    window.dispatchEvent(new Event("local-database-update"));
  };

  const showControls = ["students", "sessions", "attendance", "financial", "accounting", "hasanat"].includes(category);

  const defaultCollection = useMemo<CustomWidget["collection"]>(() => {
    if (category === "students") return "students";
    if (category === "contacts") return "contacts";
    if (category === "attendance") return "attendance_records";
    if (category === "financial" || category === "accounting") return "finance_invoices";
    if (category === "hasanat") return "hasanat_distributions";
    if (category === "sessions") return "sessions";
    return "students";
  }, [category]);

  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);

  const handleDeleteWidget = (id: string) => {
    updateCustomWidgets(widgets.filter((widget) => widget.id !== id));
  };

  const handleTogglePin = (id: string) => {
    updateCustomWidgets(
      widgets.map((widget) =>
        widget.id === id ? { ...widget, isPinnedToDashboard: !widget.isPinnedToDashboard } : widget
      )
    );
  };

  const handleEditClick = (widget: CustomWidget) => {
    setEditingWidgetId(widget.id);
    setIsBuilderOpen(true);
  };

  const handleOpenCreateBuilder = () => {
    setEditingWidgetId(null);
    setIsBuilderOpen(true);
  };

  const handleToggleSwitchStateLocal = (widget: CustomWidget) => {
    if (widget.switchActionType === "app_setting") {
      const switchStateKey = widget.switchStateKey || "";
      if (switchStateKey.startsWith("section_")) {
        const sectionKey = switchStateKey.replace("section_", "");
        const settings = getObject<Record<string, boolean>>("dashboard_section_settings", {});
        settings[sectionKey] = !settings[sectionKey];
        saveObject("dashboard_section_settings", settings);
      } else {
        const currentSwitchValue = getObject<unknown>(switchStateKey, false) === true || getObject<unknown>(switchStateKey, "false") === "true";
        saveObject(switchStateKey, !currentSwitchValue);
      }
      window.dispatchEvent(new Event("local-database-update"));
      return;
    }

    const collectionName = widget.switchCollection;
    const recordId = widget.switchRecordId;
    const targetField = widget.switchField || "status";
    if (!collectionName || !recordId) return;
    if (!isRestWidgetCollection(collectionName)) {
      notify.error(t("reports.widgets.errorToggleFailed"));
      return;
    }
    void (async () => {
      try {
        await persistWidgetRecordToggle({
          collectionName,
          recordId: String(recordId),
          field: targetField,
        });
      } catch (error) {
        console.error(error);
        notify.error(t("reports.widgets.errorToggleFailed"));
      }
    })();
  };

  const filteredWidgets = useMemo(() => {
    return widgets.filter((widget) => widget.category === category);
  }, [widgets, category]);

  useContactsWidgetAggregates(filteredWidgets);
  useStudentsWidgetAggregates(filteredWidgets);
  useTeachersWidgetAggregates(filteredWidgets);


  return (
    <div className="space-y-4 font-sans text-start">
      {/* Pinned widgets controls header banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl surface-glass shadow-sm select-none">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-none tracking-tight">{t("reports.widgets.title")}</h3>
            <p className="text-xs text-muted-foreground mt-1 uppercase font-semibold tracking-wider font-sans">{t("reports.widgets.subtitle")}</p>
          </div>
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isBuilderOpen) {
              setIsBuilderOpen(false);
              setEditingWidgetId(null);
            } else {
              handleOpenCreateBuilder();
            }
          }}
          className={`h-auto flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider shadow-none ${
            isBuilderOpen 
              ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:text-primary-foreground" 
              : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {isBuilderOpen ? t("reports.widgets.closeBuilder") : t("reports.widgets.createWidget")}
        </Button>
      </div>

      {/* Module checkboxes visibility parameters togglers */}
      {showControls && (
        <div className="p-5 rounded-2xl space-y-4 surface-glass shadow-sm select-none">
          <div>
            <h4 className="text-xs font-black text-foreground uppercase tracking-widest leading-none">{t("reports.widgets.controlsTitle")}</h4>
            <p className="text-xs text-muted-foreground mt-1 uppercase font-bold tracking-wider">{t("reports.widgets.controlsSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {category === "students" && (
              <>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border/50 bg-card/10 hover:bg-card/45 hover:border-primary/20 transition-all cursor-pointer select-none">
                  <Checkbox
                    checked={!disabledCardIds.includes("students")}
                    onCheckedChange={() => toggleCardVisibility("students")}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.studentsCard")}</p>
                    <p className="text-xs text-muted-foreground">{t("reports.widgets.studentsCardDesc")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border/50 bg-card/10 hover:bg-card/45 hover:border-primary/20 transition-all cursor-pointer select-none">
                  <Checkbox
                    checked={!!sectionSettings.enrollmentChart}
                    onCheckedChange={() => toggleSectionSetting("enrollmentChart")}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.enrollmentChart")}</p>
                    <p className="text-xs text-muted-foreground">{t("reports.widgets.enrollmentChartDesc")}</p>
                  </div>
                </label>
              </>
            )}

            {category === "sessions" && (
              <>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border/50 bg-card/10 hover:bg-card/45 hover:border-primary/20 transition-all cursor-pointer select-none">
                  <Checkbox
                    checked={!disabledCardIds.includes("sessions")}
                    onCheckedChange={() => toggleCardVisibility("sessions")}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.sessionsCard")}</p>
                    <p className="text-xs text-muted-foreground">{t("reports.widgets.sessionsCardDesc")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border/50 bg-card/10 hover:bg-card/45 hover:border-primary/20 transition-all cursor-pointer select-none">
                  <Checkbox
                    checked={!disabledCardIds.includes("classes")}
                    onCheckedChange={() => toggleCardVisibility("classes")}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.classesCard")}</p>
                    <p className="text-xs text-muted-foreground">{t("reports.widgets.classesCardDesc")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border/50 bg-card/10 hover:bg-card/45 hover:border-primary/20 transition-all cursor-pointer select-none">
                  <Checkbox
                    checked={!!sectionSettings.sessionsTable}
                    onCheckedChange={() => toggleSectionSetting("sessionsTable")}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.sessionsTable")}</p>
                    <p className="text-xs text-muted-foreground">{t("reports.widgets.sessionsTableDesc")}</p>
                  </div>
                </label>
              </>
            )}

            {category === "attendance" && (
              <>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border/50 bg-card/10 hover:bg-card/45 hover:border-primary/20 transition-all cursor-pointer select-none">
                  <Checkbox
                    checked={!disabledCardIds.includes("attendance")}
                    onCheckedChange={() => toggleCardVisibility("attendance")}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.attendanceCard")}</p>
                    <p className="text-xs text-muted-foreground">{t("reports.widgets.attendanceCardDesc")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border/50 bg-card/10 hover:bg-card/45 hover:border-primary/20 transition-all cursor-pointer select-none">
                  <Checkbox
                    checked={!!sectionSettings.attendanceChart}
                    onCheckedChange={() => toggleSectionSetting("attendanceChart")}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.attendanceChart")}</p>
                    <p className="text-xs text-muted-foreground">{t("reports.widgets.attendanceChartDesc")}</p>
                  </div>
                </label>
              </>
            )}

            {(category === "financial" || category === "accounting") && (
              <>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border/50 bg-card/10 hover:bg-card/45 hover:border-primary/20 transition-all cursor-pointer select-none">
                  <Checkbox
                    checked={!disabledCardIds.includes("fees")}
                    onCheckedChange={() => toggleCardVisibility("fees")}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.feeCard")}</p>
                    <p className="text-xs text-muted-foreground">{t("reports.widgets.feeCardDesc")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border/50 bg-card/10 hover:bg-card/45 hover:border-primary/20 transition-all cursor-pointer select-none">
                  <Checkbox
                    checked={!disabledCardIds.includes("outstanding")}
                    onCheckedChange={() => toggleCardVisibility("outstanding")}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.outstandingInvoicesCard")}</p>
                    <p className="text-xs text-muted-foreground">{t("reports.widgets.outstandingInvoicesCardDesc")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border/50 bg-card/10 hover:bg-card/45 hover:border-primary/20 transition-all cursor-pointer select-none">
                  <Checkbox
                    checked={!!sectionSettings.revenueChart}
                    onCheckedChange={() => toggleSectionSetting("revenueChart")}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.revenueChart")}</p>
                    <p className="text-xs text-muted-foreground">{t("reports.widgets.revenueChartDesc")}</p>
                  </div>
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Widget Architect form */}
      <AnimatePresence>
        {isBuilderOpen && (
          <WidgetBuilder
            initialCollection={defaultCollection}
            editWidgetConfig={widgets.find((widget) => widget.id === editingWidgetId) || null}
            onCancelEdit={() => {
              setIsBuilderOpen(false);
              setEditingWidgetId(null);
            }}
            onSaveWidget={(savedWidget) => {
              const widgetAlreadyExists = widgets.some((widget) => widget.id === savedWidget.id);
              const nextWidgets = widgetAlreadyExists
                ? widgets.map((widget) => widget.id === savedWidget.id ? savedWidget : widget)
                : [...widgets, savedWidget];
              updateCustomWidgets(nextWidgets);
              setIsBuilderOpen(false);
              setEditingWidgetId(null);
            }}
            category={category}
          />
        )}
      </AnimatePresence>

      {/* Dynamic widgets listings config items */}
      {filteredWidgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 bg-card/10 backdrop-blur p-8 text-center">
          <LayoutDashboard className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-black text-foreground uppercase tracking-widest">{t("reports.widgets.emptyTitle")}</h4>
          <p className="text-xs text-muted-foreground mt-1">{t("reports.widgets.emptyDescription")}</p>
        </div>
      ) : (
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
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-foreground uppercase tracking-widest leading-none block">{resolveWidgetTitle(widget, t)}</span>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                      {typeLabelKey ? t(typeLabelKey) : (widget.widgetType || "kpi")} • {getCollectionLabel(widget.collection, METADATA_FIELDS[widget.collection]?.name || widget.collection.replace("_", " "), t)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Pin toggle button handles */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleTogglePin(widget.id)}
                      className={`rounded-lg border shadow-none ${
                        widget.isPinnedToDashboard 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                      title={widget.isPinnedToDashboard ? t("reports.widgets.pinnedToDashboard") : t("reports.widgets.pinToDashboard")}
                    >
                      {widget.isPinnedToDashboard ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </Button>
                    {/* Edit configuration settings */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClick(widget)}
                      className="rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 shadow-none"
                      title={t("reports.widgets.editWidget")}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {/* Deletion handle triggers */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteWidget(widget.id)}
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
                    onSwitchToggle={handleToggleSwitchStateLocal}
                    onMetricClick={() => {}}
                  />
                </ErrorBoundary>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

