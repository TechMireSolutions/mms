import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { METADATA_FIELDS } from "@/tenant/features/reports/components/reportMetadata";
import type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import { useWidgetCollections } from "@/lib/reports/useReportCollections";
import { type WidgetBuilderIconTab } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderCardOptions";
import { WidgetBuilderPreview } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderPreview";
import { WidgetBuilderHeader } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderHeader";
import { WidgetBuilderOptionsPanel } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderOptionsPanel";
import { useWidgetBuilderRecordOptions } from "@/tenant/features/reports/components/pinnedWidgets/useWidgetBuilderRecordOptions";

interface WidgetBuilderProps {
  initialCollection: CustomWidget["collection"];
  editWidgetConfig: CustomWidget | null;
  onCancelEdit: () => void;
  onSaveWidget: (widget: CustomWidget) => void;
  category?: string;
  mode?: "dashboard" | "kpi";
  initialWidgetType?: CustomWidget["widgetType"];
}

/**
 * Reusable Widget Builder configuration panel conforming to best practices.
 */
export function WidgetBuilder({
  initialCollection,
  editWidgetConfig,
  onCancelEdit,
  onSaveWidget,
  category = "students",
  mode = "kpi",
  initialWidgetType = "kpi"
}: WidgetBuilderProps): React.JSX.Element {
  const collections = useWidgetCollections();
  const { t } = useTranslation();
  
  const [widgetType, setWidgetType] = useState<CustomWidget["widgetType"]>(() => {
    if (editWidgetConfig) return editWidgetConfig.widgetType || "kpi";
    return initialWidgetType || "kpi";
  });
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderCollection, setBuilderCollection] = useState<CustomWidget["collection"]>(initialCollection);
  const [builderOperation, setBuilderOperation] = useState<CustomWidget["operation"]>("count");
  const [builderTargetField, setBuilderTargetField] = useState("");
  const [builderFilterField, setBuilderFilterField] = useState("");
  const [builderFilterOperator, setBuilderFilterOperator] = useState<CustomWidget["filterOperator"]>("equals");
  const [builderFilterValue, setBuilderFilterValue] = useState("");
  const [builderColor, setBuilderColor] = useState("emerald");

  // Threshold alerts builder state
  const [thresholdEnabled, setThresholdEnabled] = useState(false);
  const [thresholdCondition, setThresholdCondition] = useState<"lt" | "gt" | "equals">("lt");
  const [thresholdValue, setThresholdValue] = useState("");
  const [thresholdColor, setThresholdColor] = useState<"red" | "amber" | "yellow">("red");

  // Switch utility builder state
  const [switchActionType, setSwitchActionType] = useState<"app_setting" | "db_record">("app_setting");
  const [switchStateKey, setSwitchStateKey] = useState("app_setting_attendance_lock");
  const [switchCollection, setSwitchCollection] = useState<CustomWidget["collection"]>("students");
  const [switchRecordId, setSwitchRecordId] = useState("");
  const [switchField, setSwitchField] = useState("status");
  const [switchLabelOn, setSwitchLabelOn] = useState("");
  const [switchLabelOff, setSwitchLabelOff] = useState("");

  // Card-specific builder state
  const [builderIcon, setBuilderIcon] = useState("GraduationCap");
  const [subTextType, setSubTextType] = useState<"fixed" | "dynamic">("dynamic");
  const [fixedSubText, setFixedSubText] = useState("");
  const [trend, setTrend] = useState<number>(0);
  const [trendType, setTrendType] = useState<"manual" | "database">("database");
  const [builderRole, setBuilderRole] = useState("admin");

  // Icon search & categories
  const [iconSearch, setIconSearch] = useState("");
  const [activeIconTab, setActiveIconTab] = useState<WidgetBuilderIconTab>("all");

  // Scalability Tester Slider size state
  const [scalerSize, setScalerSize] = useState(180);

  // Sync edits
  useEffect(() => {
    if (editWidgetConfig) {
      setWidgetType(editWidgetConfig.widgetType || "kpi");
      setBuilderTitle(editWidgetConfig.title);
      setBuilderCollection(editWidgetConfig.collection);
      setBuilderOperation(editWidgetConfig.operation);
      setBuilderTargetField(editWidgetConfig.targetField || "");
      setBuilderFilterField(editWidgetConfig.filterField || "");
      setBuilderFilterOperator(editWidgetConfig.filterOperator || "equals");
      setBuilderFilterValue(editWidgetConfig.filterValue || "");
      setBuilderColor(editWidgetConfig.color || "emerald");
      setThresholdEnabled(!!editWidgetConfig.thresholdEnabled);
      setThresholdCondition(editWidgetConfig.thresholdCondition || "lt");
      setThresholdValue(editWidgetConfig.thresholdValue !== undefined ? String(editWidgetConfig.thresholdValue) : "");
      setThresholdColor(editWidgetConfig.thresholdColor || "red");
      setSwitchActionType(editWidgetConfig.switchActionType || "app_setting");
      setSwitchStateKey(editWidgetConfig.switchStateKey || "app_setting_attendance_lock");
      setSwitchCollection(editWidgetConfig.switchCollection || initialCollection);
      setSwitchRecordId(editWidgetConfig.switchRecordId || "");
      setSwitchField(editWidgetConfig.switchField || "status");
      setSwitchLabelOn(editWidgetConfig.switchLabelOn || t("reports.widgets.statusOn"));
      setSwitchLabelOff(editWidgetConfig.switchLabelOff || t("reports.widgets.statusOff"));
      
      setBuilderIcon(editWidgetConfig.icon || "GraduationCap");
      setSubTextType(editWidgetConfig.subTextType || "dynamic");
      setFixedSubText(editWidgetConfig.fixedSubText || "");
      setTrend(editWidgetConfig.trend || 0);
      setTrendType(editWidgetConfig.trendType || "database");
      setBuilderRole(editWidgetConfig.role || "admin");
    } else {
      setWidgetType("kpi");
      setBuilderTitle("");
      setBuilderCollection(initialCollection);
      setBuilderOperation("count");
      setBuilderTargetField("");
      setBuilderFilterField("");
      setBuilderFilterOperator("equals");
      setBuilderFilterValue("");
      setBuilderColor("emerald");
      setThresholdEnabled(false);
      setThresholdValue("");
      setSwitchActionType("app_setting");
      setSwitchStateKey("app_setting_attendance_lock");
      setSwitchCollection(initialCollection);
      setSwitchRecordId("");
      setSwitchLabelOn(t("reports.widgets.statusOn"));
      setSwitchLabelOff(t("reports.widgets.statusOff"));
      
      setBuilderIcon("GraduationCap");
      setSubTextType("dynamic");
      setFixedSubText("");
      setTrend(0);
      setTrendType("database");
      setBuilderRole("admin");
    }
  }, [editWidgetConfig, initialCollection, t]);

  const dbRecordsList = useWidgetBuilderRecordOptions({ collections, switchCollection, switchRecordId, setSwitchRecordId });

  // Update builder fields when collection changes
  useEffect(() => {
    if (editWidgetConfig && editWidgetConfig.collection === builderCollection) {
      return;
    }
    const meta = METADATA_FIELDS[builderCollection];
    if (meta) {
      const fields = meta.fields;
      const firstField = fields[0];
      setBuilderFilterField(firstField ? firstField.value : "");
      const numFields = meta.numericFields;
      const firstNumField = numFields[0];
      setBuilderTargetField(firstNumField ? firstNumField.value : "");
    }
  }, [builderCollection, editWidgetConfig]);

  // Build temporary Preview Widget config dynamically
  const previewWidget = useMemo<CustomWidget>(() => {
    return {
      id: editWidgetConfig?.id || "preview",
      title: builderTitle || t("reports.widgets.customLiveWidget"),
      category: editWidgetConfig?.category || category,
      collection: builderCollection,
      widgetType,
      operation: builderOperation,
      targetField: builderTargetField,
      filterField: builderFilterField,
      filterOperator: builderFilterOperator,
      filterValue: builderFilterValue,
      color: builderColor,
      isPinnedToDashboard: editWidgetConfig?.isPinnedToDashboard || false,
      thresholdEnabled,
      thresholdCondition,
      thresholdValue: thresholdValue ? Number(thresholdValue) : undefined,
      thresholdColor,
      switchActionType,
      switchStateKey,
      switchCollection,
      switchRecordId,
      switchField,
      switchLabelOn,
      switchLabelOff,
      icon: builderIcon,
      subTextType,
      fixedSubText,
      trend,
      trendType,
      role: builderRole
    };
  }, [
    builderTitle, category, builderCollection, widgetType, builderOperation,
    builderTargetField, builderFilterField, builderFilterOperator, builderFilterValue,
    builderColor, thresholdEnabled, thresholdCondition, thresholdValue, thresholdColor,
    switchActionType, switchStateKey, switchCollection, switchRecordId, switchField,
    switchLabelOn, switchLabelOff, editWidgetConfig,
    builderIcon, subTextType, fixedSubText, trend, trendType, builderRole, t
  ]);

  const handleToggleSwitchStateLocal = () => {
    // Local Switch preview toggle handler (noop)
  };

  const handleSaveWidget = () => {
    onSaveWidget({
      id: editWidgetConfig?.id || "widget-" + Date.now(),
      title: builderTitle,
      category: editWidgetConfig?.category || category,
      collection: builderCollection,
      widgetType,
      operation: builderOperation,
      targetField: builderTargetField,
      filterField: builderFilterField,
      filterOperator: builderFilterOperator,
      filterValue: builderFilterValue,
      color: builderColor,
      isPinnedToDashboard: editWidgetConfig?.isPinnedToDashboard || false,
      thresholdEnabled,
      thresholdCondition,
      thresholdValue: thresholdValue ? Number(thresholdValue) : undefined,
      thresholdColor,
      switchActionType,
      switchStateKey,
      switchCollection,
      switchRecordId,
      switchField,
      switchLabelOn,
      switchLabelOff,
      icon: widgetType === "card" ? builderIcon : undefined,
      subTextType: widgetType === "card" ? subTextType : undefined,
      fixedSubText: (widgetType === "card" && subTextType === "fixed") ? fixedSubText : undefined,
      trend: widgetType === "card" ? trend : undefined,
      trendType: widgetType === "card" ? trendType : undefined,
      role: (widgetType === "card" && mode === "dashboard") ? builderRole : undefined
    });
  };

  const titleState = { builderTitle, setBuilderTitle };
  const metricState = { builderCollection, setBuilderCollection, builderOperation, setBuilderOperation, builderTargetField, setBuilderTargetField, builderFilterField, setBuilderFilterField, builderFilterOperator, setBuilderFilterOperator, builderFilterValue, setBuilderFilterValue, builderColor, setBuilderColor };
  const thresholdState = { thresholdEnabled, setThresholdEnabled, thresholdCondition, setThresholdCondition, thresholdValue, setThresholdValue, thresholdColor, setThresholdColor };
  const switchState = { switchActionType, setSwitchActionType, switchStateKey, setSwitchStateKey, switchCollection, setSwitchCollection, switchRecordId, setSwitchRecordId, switchLabelOn, setSwitchLabelOn, switchLabelOff, setSwitchLabelOff };
  const cardState = { builderIcon, setBuilderIcon, subTextType, setSubTextType, fixedSubText, setFixedSubText, trend, setTrend, trendType, setTrendType, builderRole, setBuilderRole };
  const iconState = { iconSearch, setIconSearch, activeIconTab, setActiveIconTab };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-lg p-6 space-y-4 font-sans text-start">
      <WidgetBuilderHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <WidgetBuilderOptionsPanel
          mode={mode}
          widgetType={widgetType}
          setWidgetType={setWidgetType}
          titleState={titleState}
          metricState={metricState}
          thresholdState={thresholdState}
          switchState={switchState}
          cardState={cardState}
          iconState={iconState}
          dbRecordsList={dbRecordsList}
        />

        <WidgetBuilderPreview
          previewWidget={previewWidget}
          collections={collections}
          scalerSize={scalerSize}
          setScalerSize={setScalerSize}
          onCancelEdit={onCancelEdit}
          onSave={handleSaveWidget}
          canSave={Boolean(builderTitle)}
          isEditing={Boolean(editWidgetConfig)}
          onSwitchToggle={handleToggleSwitchStateLocal}
        />
      </div>
    </div>
  );
}
