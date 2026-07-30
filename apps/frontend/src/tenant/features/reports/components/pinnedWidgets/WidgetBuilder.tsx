import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Info } from "lucide-react";
import { Session, Class } from "@/lib/data/sessionsData";
import { METADATA_FIELDS } from "@/tenant/features/reports/components/reportMetadata";
import type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { useWidgetCollections } from "@/lib/reports/useReportCollections";
import { isListSummaryWidgetType } from "@/components/dashboard-widgets/registry";
import {
  WidgetBuilderCardRoleOptions,
  WidgetBuilderCardTextOptions,
  WidgetBuilderIconPicker,
  type WidgetBuilderIconTab,
} from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderCardOptions";
import {
  WidgetBuilderSwitchOptions,
  type SwitchRecordOption,
} from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderSwitchOptions";
import { WidgetBuilderThresholdOptions } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderThresholdOptions";
import { WidgetBuilderPreview } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderPreview";
import { WidgetBuilderTypeSelector } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderTypeSelector";
import { WidgetBuilderMetricOptions } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderMetricOptions";
import { WidgetBuilderColorOptions } from "@/tenant/features/reports/components/pinnedWidgets/WidgetBuilderColorOptions";

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

  // Load record options for DB Record switch selector
  const dbRecordsList = useMemo<SwitchRecordOption[]>(() => {
    if (switchCollection === "sessions") {
      const sessionRecords = (collections.sessions || []) as Session[];
      return sessionRecords.flatMap((session: Session) => 
        (session.classes || []).map((sessionClass: Class) => ({ id: sessionClass.id, label: `${session.name} - ${sessionClass.name}` }))
      );
    }
    const collectionRecords = (collections[switchCollection] || []) as { id?: string | number; name?: string; studentName?: string; invoiceNo?: string }[];
    return collectionRecords.map((collectionRecord) => ({
      id: String(collectionRecord.id),
      label: String(collectionRecord.name || collectionRecord.studentName || collectionRecord.invoiceNo || collectionRecord.id)
    }));
  }, [switchCollection, collections]);

  useEffect(() => {
    if (dbRecordsList.length > 0 && !switchRecordId) {
      setSwitchRecordId(dbRecordsList[0].id);
    }
  }, [dbRecordsList, switchRecordId]);

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

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-lg p-6 space-y-4 font-sans text-start">
      {/* Builder Header Warning banner detailing Single-Metric rule */}
      <div className="pb-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-foreground font-sans">{t("reports.widgets.builder.title")}</h4>
          <p className="text-xs text-muted-foreground">{t("reports.widgets.builder.subtitle")}</p>
        </div>
        <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 p-2.5 rounded-xl max-w-sm">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-normal">
            <span className="font-black text-primary uppercase block mb-0.5">{t("reports.widgets.builder.singleMetricRule")}</span>
            {t("reports.widgets.builder.singleMetricRuleDesc")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Architect Inputs Column */}
        <div className="lg:col-span-2 space-y-4">
          
          <WidgetBuilderTypeSelector
            builderCollection={builderCollection}
            widgetType={widgetType}
            setWidgetType={setWidgetType}
            setBuilderOperation={setBuilderOperation}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Title field */}
            <div className="space-y-1">
              <label className={FORM_LABEL}>{t("reports.widgets.builder.labelTitle")}</label>
              <Input
                type="text"
                value={builderTitle}
                onChange={(event) => setBuilderTitle(event.target.value)}
                placeholder={t("reports.widgets.builder.placeholderTitle")}
                className="bg-card/40 backdrop-blur-md font-semibold text-xs py-1.5 min-h-11"
              />
            </div>

            {widgetType === "card" && mode === "dashboard" && (
              <WidgetBuilderCardRoleOptions
                builderRole={builderRole}
                setBuilderRole={setBuilderRole}
              />
            )}

            {widgetType !== "switch" && !isListSummaryWidgetType(widgetType) ? (
              <WidgetBuilderMetricOptions
                builderCollection={builderCollection}
                setBuilderCollection={setBuilderCollection}
                builderOperation={builderOperation}
                setBuilderOperation={setBuilderOperation}
                builderTargetField={builderTargetField}
                setBuilderTargetField={setBuilderTargetField}
                builderFilterField={builderFilterField}
                setBuilderFilterField={setBuilderFilterField}
                builderFilterOperator={builderFilterOperator}
                setBuilderFilterOperator={setBuilderFilterOperator}
                builderFilterValue={builderFilterValue}
                setBuilderFilterValue={setBuilderFilterValue}
              >
                {widgetType === "card" && (
                  <WidgetBuilderCardTextOptions
                    subTextType={subTextType}
                    setSubTextType={setSubTextType}
                    fixedSubText={fixedSubText}
                    setFixedSubText={setFixedSubText}
                    trend={trend}
                    setTrend={setTrend}
                    trendType={trendType}
                    setTrendType={setTrendType}
                  />
                )}
              </WidgetBuilderMetricOptions>
            ) : (
              <WidgetBuilderSwitchOptions
                switchActionType={switchActionType}
                setSwitchActionType={setSwitchActionType}
                switchStateKey={switchStateKey}
                setSwitchStateKey={setSwitchStateKey}
                switchCollection={switchCollection}
                setSwitchCollection={setSwitchCollection}
                switchRecordId={switchRecordId}
                setSwitchRecordId={setSwitchRecordId}
                switchLabelOn={switchLabelOn}
                setSwitchLabelOn={setSwitchLabelOn}
                switchLabelOff={switchLabelOff}
                setSwitchLabelOff={setSwitchLabelOff}
                dbRecordsList={dbRecordsList}
              />
            )}
          </div>

          {/* Threshold alerts options for KPI/Progress */}
          {widgetType !== "switch" && !isListSummaryWidgetType(widgetType) && (
            <WidgetBuilderThresholdOptions
              thresholdEnabled={thresholdEnabled}
              setThresholdEnabled={setThresholdEnabled}
              thresholdCondition={thresholdCondition}
              setThresholdCondition={setThresholdCondition}
              thresholdValue={thresholdValue}
              setThresholdValue={setThresholdValue}
              thresholdColor={thresholdColor}
              setThresholdColor={setThresholdColor}
            />
          )}

          <WidgetBuilderColorOptions
            builderColor={builderColor}
            setBuilderColor={setBuilderColor}
          />

          {widgetType === "card" && (
            <WidgetBuilderIconPicker
              builderIcon={builderIcon}
              setBuilderIcon={setBuilderIcon}
              iconSearch={iconSearch}
              setIconSearch={setIconSearch}
              activeIconTab={activeIconTab}
              setActiveIconTab={setActiveIconTab}
            />
          )}

        </div>

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
