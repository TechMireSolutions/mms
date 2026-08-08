import { useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { getObject, saveObject } from "@/lib/db";
import {
  isRestWidgetCollection,
  persistWidgetRecordToggle,
} from "@/lib/reports/widgetRecordToggle";
import { useWidgetCollections } from "@/lib/reports/useReportCollections";
import { useDashboardConfig } from "@/hooks/useDashboardConfig";
import { useContactsWidgetAggregates } from "@/tenant/hooks/collections/contacts";
import { useStudentsWidgetAggregates } from "@/tenant/hooks/collections/students";
import { useTeachersWidgetAggregates } from "@/tenant/hooks/collections/teachers";
import { useSessionsWidgetAggregates } from "@/tenant/hooks/collections/sessions";
import { useEnrollmentsWidgetAggregates } from "@/tenant/hooks/collections/enrollments";
import { notify } from "@/lib/notify";
import type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";

const DEFAULT_SECTION_SETTINGS: Record<string, boolean> = {
  enrollmentChart: true,
  revenueChart: true,
  attendanceChart: true,
  hasanatChart: true,
  sessionsTable: true,
  todayAttendance: true,
  feeSummary: true,
  outstandingFees: true,
  overdueObligations: true,
};

export function usePinnedWidgetsController(category: string) {
  const { t } = useTranslation();
  const {
    disabledCardIds,
    toggleCardVisibility,
    customWidgets: widgets,
    updateCustomWidgets,
  } = useDashboardConfig();

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [sectionSettings, setSectionSettings] = useState<Record<string, boolean>>(() => {
    return getObject<Record<string, boolean>>("dashboard_section_settings", DEFAULT_SECTION_SETTINGS);
  });

  const defaultCollection = useMemo<CustomWidget["collection"]>(() => {
    if (category === "students") return "students";
    if (category === "contacts") return "contacts";
    if (category === "attendance") return "attendance_records";
    if (category === "financial" || category === "accounting") return "finance_invoices";
    if (category === "hasanat") return "hasanat_distributions";
    if (category === "sessions") return "sessions";
    if (category === "enrollments") return "enrollments";
    return "students";
  }, [category]);

  const filteredWidgets = useMemo(() => {
    return widgets.filter((widget) => widget.category === category);
  }, [widgets, category]);

  const requiredCollections = useMemo(() => {
    const required = new Set(filteredWidgets.map((widget) => widget.collection));
    return required;
  }, [filteredWidgets]);
  const collections = useWidgetCollections({
    enabled: filteredWidgets.length > 0,
    requiredCollections,
  });

  useContactsWidgetAggregates(filteredWidgets);
  useStudentsWidgetAggregates(filteredWidgets);
  useTeachersWidgetAggregates(filteredWidgets);
  useSessionsWidgetAggregates(filteredWidgets);
  useEnrollmentsWidgetAggregates(filteredWidgets);

  const toggleSectionSetting = (key: string) => {
    const nextSectionSettings = { ...sectionSettings, [key]: !sectionSettings[key] };
    setSectionSettings(nextSectionSettings);
    saveObject("dashboard_section_settings", nextSectionSettings);
    window.dispatchEvent(new Event("local-database-update"));
  };

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

  const handleToggleBuilder = () => {
    if (isBuilderOpen) {
      setIsBuilderOpen(false);
      setEditingWidgetId(null);
    } else {
      handleOpenCreateBuilder();
    }
  };

  const handleCancelBuilder = () => {
    setIsBuilderOpen(false);
    setEditingWidgetId(null);
  };

  const handleSaveWidget = (savedWidget: CustomWidget) => {
    const widgetAlreadyExists = widgets.some((widget) => widget.id === savedWidget.id);
    const nextWidgets = widgetAlreadyExists
      ? widgets.map((widget) => widget.id === savedWidget.id ? savedWidget : widget)
      : [...widgets, savedWidget];
    updateCustomWidgets(nextWidgets);
    setIsBuilderOpen(false);
    setEditingWidgetId(null);
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
      } catch {
        notify.error(t("reports.widgets.errorToggleFailed"));
      }
    })();
  };

  return {
    t,
    widgets,
    filteredWidgets,
    collections,
    disabledCardIds,
    toggleCardVisibility,
    sectionSettings,
    toggleSectionSetting,
    isBuilderOpen,
    editingWidgetId,
    defaultCollection,
    handleToggleBuilder,
    handleCancelBuilder,
    handleSaveWidget,
    handleDeleteWidget,
    handleTogglePin,
    handleEditClick,
    handleToggleSwitchStateLocal,
  };
}
