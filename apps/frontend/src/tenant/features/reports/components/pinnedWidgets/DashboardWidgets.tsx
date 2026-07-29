import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { PinOff, Trash2, Pencil, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getObject, saveObject } from "@/lib/db";
import {
  isRestWidgetCollection,
  persistWidgetRecordToggle,
} from "@/lib/reports/widgetRecordToggle";
import { useWidgetCollections } from "@/lib/reports/useReportCollections";
import type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import { useDashboardConfig } from "@/hooks/useDashboardConfig";
import { CustomWidgetRenderer, WidgetDrilldownModal } from "@/tenant/features/reports/components/pinnedWidgets/CustomWidgetRenderer";
import { isComposedWidgetType } from "@/components/dashboard-widgets/registry";
import { useContactsWidgetAggregates } from "@/tenant/hooks/collections/contacts";
import { useStudentsWidgetAggregates } from "@/tenant/hooks/collections/students";
import { useTeachersWidgetAggregates } from "@/tenant/hooks/collections/teachers";
import { applyContactsWorkDrillDown } from "@/lib/contacts/contactsWorkDrillDown";
import { isSeededDashboardWidget } from "@/lib/dashboardWidgets";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";

interface DashboardWidgetsProps {
  widgets?: CustomWidget[];
  onUnpin?: (id: string) => void;
  isEditMode?: boolean;
  onEditWidget?: (widget: CustomWidget) => void;
  onDeleteWidget?: (id: string) => void;
}

/**
 * Pinned Custom Dashboard Widgets Section. Displays widgets with size controls.
 */
export function DashboardWidgets({ 
  widgets, 
  onUnpin,
  isEditMode = false,
  onEditWidget,
  onDeleteWidget
}: DashboardWidgetsProps = {}): React.JSX.Element | null {
  const { t } = useTranslation();
  const { gridMode, updatePref } = useDashboardConfig();
  const [localWidgets, setLocalWidgets] = useState<CustomWidget[]>([]);
  const collections = useWidgetCollections();
  
  const [drilldownWidget, setDrilldownWidget] = useState<CustomWidget | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      if (widgets) return;
      try {
        const savedWidgets = getObject<CustomWidget[] | null>("kpi_custom_widgets", null);
        if (savedWidgets) {
          setLocalWidgets(savedWidgets.filter((widget) => widget.isPinnedToDashboard));
        }
      } catch (error) {
        console.error("Failed to load pinned widgets on dashboard", error);
        notify.error(t("reports.widgets.errorLoadFailed"));
      }
    };

    handleUpdate();
    window.addEventListener("local-database-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("local-database-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [widgets, t]);

  const activeWidgets = widgets ?? localWidgets;
  useContactsWidgetAggregates(activeWidgets);
  useStudentsWidgetAggregates(activeWidgets);
  useTeachersWidgetAggregates(activeWidgets);

  const handleMetricClick = useCallback((widget: CustomWidget) => {
    if (widget.collection === "contacts") {
      applyContactsWorkDrillDown({
        gender: widget.filterField === "gender" && widget.filterValue ? widget.filterValue : undefined,
      });
      window.location.assign("/contacts");
      return;
    }
    setDrilldownWidget(widget);
  }, []);

  const handleLocalUnpin = (id: string) => {
    if (onUnpin) {
      onUnpin(id);
      return;
    }
    try {
      const savedWidgets = getObject<CustomWidget[] | null>("kpi_custom_widgets", null);
      if (savedWidgets) {
        const updatedWidgets = savedWidgets.map((widget) => {
          if (widget.id === id) {
            return { ...widget, isPinnedToDashboard: false };
          }
          return widget;
        });
        saveObject("kpi_custom_widgets", updatedWidgets);
        setLocalWidgets(updatedWidgets.filter((widget) => widget.isPinnedToDashboard));
        window.dispatchEvent(new Event("local-database-update"));
      }
    } catch (error) {
      console.error("Failed to unpin widget", error);
      notify.error(t("reports.widgets.errorUnpinFailed"));
    }
  };

  const handleToggleSwitchState = (widget: CustomWidget) => {
    if (widget.switchActionType === "app_setting") {
      const switchStateKey = widget.switchStateKey || "";
      if (switchStateKey.startsWith("section_")) {
        const sectionKey = switchStateKey.replace("section_", "");
        const settings = getObject<Record<string, boolean>>("dashboard_section_settings", {});
        settings[sectionKey] = !settings[sectionKey];
        saveObject("dashboard_section_settings", settings);
      } else {
        const isEnabled = getObject<unknown>(switchStateKey, false) === true || getObject<unknown>(switchStateKey, "false") === "true";
        saveObject(switchStateKey, !isEnabled);
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

  const handleToggleGridMode = (mode: "comfortable" | "compact") => {
    updatePref("gridMode", mode);
  };

  if (activeWidgets.length === 0) return null;

  return (
    <div className="space-y-4 text-start font-sans mt-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <LayoutDashboard className="w-4 h-4 shrink-0 text-primary" />
          <h3 className="min-w-0 truncate text-xs font-black text-foreground uppercase tracking-widest leading-none">{t("reports.widgets.pinnedPanels")}</h3>
        </div>
        
        {/* Layout Density Controls */}
        <div className="flex shrink-0 items-center gap-1 border border-border/60 bg-muted/20 p-1 rounded-xl shadow-inner backdrop-blur-xs relative select-none">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleToggleGridMode("comfortable")}
            className={`min-h-11 px-3 rounded-lg text-xs font-black uppercase tracking-wider relative z-10 shadow-none ${
              gridMode === "comfortable" 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {gridMode === "comfortable" && (
              <motion.div
                layoutId="gridModeHighlight"
                className="absolute inset-0 bg-card rounded-lg shadow-xs border border-border/40 -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {t("reports.widgets.comfortable")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleToggleGridMode("compact")}
            className={`min-h-11 px-3 rounded-lg text-xs font-black uppercase tracking-wider relative z-10 shadow-none ${
              gridMode === "compact" 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {gridMode === "compact" && (
              <motion.div
                layoutId="gridModeHighlight"
                className="absolute inset-0 bg-card rounded-lg shadow-xs border border-border/40 -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {t("reports.widgets.compact")}
          </Button>
        </div>
      </div>

      <div className={
        gridMode === "compact"
          ? "flex flex-wrap gap-2.5 pt-1"
          : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-1"
      }>
        <AnimatePresence mode="popLayout">
          {activeWidgets.map((widget) => {
            let colSpanClass = "";
            if (gridMode !== "compact") {
              if (widget.widgetType === "overdue-obligations") {
                colSpanClass = "col-span-full";
              } else if (isComposedWidgetType(widget.widgetType)) {
                colSpanClass = "lg:col-span-2 md:col-span-3 col-span-1";
              }
            }
            return (
              <motion.div
                key={widget.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`relative group ${colSpanClass}`}
              >
                <ErrorBoundary>
                  <CustomWidgetRenderer
                    widget={widget}
                    collections={collections}
                    isCompact={gridMode === "compact"}
                    isEditMode={isEditMode}
                    onSwitchToggle={handleToggleSwitchState}
                    onMetricClick={handleMetricClick}
                  />
                </ErrorBoundary>
                
                {/* Overlaid unpin/edit/delete action handles */}
                <div className={`absolute top-2.5 end-2.5 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 z-10 transition-all ${
                  gridMode === "compact" ? "top-0.5 end-0.5" : ""
                }`}>
                  {isEditMode && onEditWidget && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditWidget(widget);
                      }}
                      className="rounded bg-card/85 backdrop-blur border border-border/60 hover:bg-primary hover:text-primary-foreground text-muted-foreground shadow-none"
                      title={t("reports.widgets.editWidget")}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  )}
                  {isEditMode && onDeleteWidget && !isSeededDashboardWidget(widget.id) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteWidget(widget.id);
                      }}
                      className="rounded bg-card/85 backdrop-blur border border-border/60 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground shadow-none"
                      title={t("reports.widgets.deleteWidget")}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleLocalUnpin(widget.id)}
                    className="rounded bg-card/85 backdrop-blur border border-border/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive shadow-none"
                    title={t("reports.widgets.unpinWidget")}
                  >
                    <PinOff className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Drilldown modal rendering */}
      <AnimatePresence>
        {drilldownWidget && (
          <WidgetDrilldownModal
            widget={drilldownWidget}
            onClose={() => setDrilldownWidget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
