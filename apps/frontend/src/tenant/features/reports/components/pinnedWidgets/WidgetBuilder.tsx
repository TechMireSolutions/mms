import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Search, Info } from "lucide-react";
import { capitalize, type AppTranslationKey } from "@mms/shared";
import { Session, Class } from "@/lib/data/sessionsData";
import { METADATA_FIELDS, COLLECTION_OPTIONS, getFieldLabel, getCollectionLabel } from "@/tenant/features/reports/components/reportMetadata";
import {
  CustomWidget,
  ICONS_LIST,
} from "@/tenant/features/reports/components/pinnedWidgets/types";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { getWidgetCollections } from "@/tenant/features/reports/components/pinnedWidgets/widgetDataUtils";
import { CustomWidgetRenderer } from "@/tenant/features/reports/components/pinnedWidgets/CustomWidgetRenderer";
import { isListSummaryWidgetType } from "@/components/dashboard-widgets/registry";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { resolveWidgetChartHex } from "@/lib/brandingChartPalette";

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
  const collections = useMemo(() => getWidgetCollections(), []);
  const palette = useBrandPalette();
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
  const [activeIconTab, setActiveIconTab] = useState<"all" | "academic" | "finance" | "status" | "general">("all");

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
  const dbRecordsList = useMemo(() => {
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
    builderIcon, subTextType, fixedSubText, trend, trendType, builderRole
  ]);

  const handleToggleSwitchStateLocal = () => {
    // Local Switch preview toggle handler (noop)
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-lg p-6 space-y-4 font-sans text-left">
      {/* Builder Header Warning banner detailing Single-Metric rule */}
      <div className="pb-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-foreground font-sans">{t("reports.widgets.builder.title")}</h4>
          <p className="text-[11px] text-muted-foreground">{t("reports.widgets.builder.subtitle")}</p>
        </div>
        <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 p-2.5 rounded-xl max-w-sm">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[9.5px] text-muted-foreground leading-normal">
            <span className="font-black text-primary uppercase block mb-0.5">{t("reports.widgets.builder.singleMetricRule")}</span>
            {t("reports.widgets.builder.singleMetricRuleDesc")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Architect Inputs Column */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Visualizer Type selectors */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-foreground/80 uppercase tracking-wider block">{t("reports.widgets.builder.focusType")}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(() => {
                const base = [
                  { id: "card", label: t("reports.widgets.builder.typeCard"), desc: t("reports.widgets.builder.typeCardDesc") },
                  { id: "kpi", label: t("reports.widgets.builder.typeKpi"), desc: t("reports.widgets.builder.typeKpiDesc") },
                  { id: "progress", label: t("reports.widgets.builder.typeProgress"), desc: t("reports.widgets.builder.typeProgressDesc") },
                  { id: "switch", label: t("reports.widgets.builder.typeSwitch"), desc: t("reports.widgets.builder.typeSwitchDesc") }
                ];
                if (builderCollection === "sessions") {
                  base.push({ id: "sessions-list", label: t("reports.widgets.builder.typeSessionsList"), desc: t("reports.widgets.builder.typeSessionsListDesc") });
                } else if (builderCollection === "attendance_records") {
                  base.push(
                    { id: "attendance-summary", label: t("reports.widgets.builder.typeAttendanceSummary"), desc: t("reports.widgets.builder.typeAttendanceSummaryDesc") },
                    { id: "attendance-rate", label: t("reports.widgets.builder.typeAttendanceRate"), desc: t("reports.widgets.builder.typeAttendanceRateDesc") }
                  );
                } else if (builderCollection === "finance_invoices") {
                  base.push(
                    { id: "fee-summary", label: t("reports.widgets.builder.typeFeeSummary"), desc: t("reports.widgets.builder.typeFeeSummaryDesc") },
                    { id: "outstanding-list", label: t("reports.widgets.builder.typeOutstandingList"), desc: t("reports.widgets.builder.typeOutstandingListDesc") },
                    { id: "overdue-obligations", label: t("reports.widgets.builder.typeOverdueObligations"), desc: t("reports.widgets.builder.typeOverdueObligationsDesc") },
                    { id: "revenue-expenses", label: t("reports.widgets.builder.typeRevenueExpenses"), desc: t("reports.widgets.builder.typeRevenueExpensesDesc") }
                  );
                } else if (builderCollection === "students") {
                  base.push({ id: "enrollment-trends", label: t("reports.widgets.builder.typeEnrollmentTrends"), desc: t("reports.widgets.builder.typeEnrollmentTrendsDesc") });
                } else if (builderCollection === "hasanat_distributions") {
                  base.push({ id: "hasanat-distribution", label: t("reports.widgets.builder.typeHasanatDistribution"), desc: t("reports.widgets.builder.typeHasanatDistributionDesc") });
                }
                return base;
              })().map((widgetTypeOption) => {
                const isSelectedType = widgetType === widgetTypeOption.id;
                return (
                  <button
                    key={widgetTypeOption.id}
                    onClick={() => {
                      setWidgetType(widgetTypeOption.id as CustomWidget["widgetType"]);
                      if (widgetTypeOption.id === "switch") {
                        setBuilderOperation("count");
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelectedType
                        ? "border-primary bg-primary/10 text-primary shadow-sm" 
                        : "border-border bg-card/30 text-muted-foreground hover:border-muted-foreground/20"
                    }`}
                    type="button"
                  >
                    <span className="text-xs font-black uppercase block">{widgetTypeOption.label}</span>
                    <span className="text-[9px] text-muted-foreground block mt-1 leading-none">{widgetTypeOption.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Title field */}
            <div className="space-y-1">
              <label className={FORM_LABEL}>{t("reports.widgets.builder.labelTitle")}</label>
              <Input
                type="text"
                value={builderTitle}
                onChange={(event) => setBuilderTitle(event.target.value)}
                placeholder={t("reports.widgets.builder.placeholderTitle")}
                className="bg-card/40 backdrop-blur-md font-semibold text-xs py-1.5 min-h-0"
              />
            </div>

            {widgetType === "card" && mode === "dashboard" && (
              <div className="space-y-1">
                <label className={`${FORM_LABEL} block`}>{t("reports.widgets.builder.dashboardRole")}</label>
                <FormSelect
                  value={builderRole}
                  onChange={setBuilderRole}
                  options={[
                    { value: "admin", label: t("reports.widgets.builder.roleAdmin") },
                    { value: "teacher", label: t("reports.widgets.builder.roleTeacher") },
                    { value: "accountant", label: t("reports.widgets.builder.roleAccountant") },
                  ]}
                />
              </div>
            )}

            {widgetType !== "switch" && !isListSummaryWidgetType(widgetType) ? (
              <>
                {/* Data collection select */}
                <div className="space-y-1">
                  <label className={FORM_LABEL}>{t("reports.widgets.builder.dataCollection")}</label>
                  <FormSelect
                    value={builderCollection}
                    onChange={(val) => setBuilderCollection(val as CustomWidget["collection"])}
                    options={COLLECTION_OPTIONS.map((collectionOption) => ({
                      value: collectionOption.value,
                      label: getCollectionLabel(collectionOption.value, collectionOption.label, t),
                    }))}
                  />
                </div>

                {/* Operation type */}
                <div className="space-y-1">
                  <label className={FORM_LABEL}>{t("reports.widgets.builder.calcFormula")}</label>
                  <FormSelect
                    value={builderOperation}
                    onChange={(val) => setBuilderOperation(val as CustomWidget["operation"])}
                    options={[
                      { value: "count", label: t("reports.widgets.builder.formulaCount") },
                      { value: "percentage", label: t("reports.widgets.builder.formulaPercentage") },
                      { value: "sum", label: t("reports.widgets.builder.formulaSum") },
                      { value: "avg", label: t("reports.widgets.builder.formulaAvg") },
                    ]}
                  />
                </div>

                {/* Target fields for numeric values */}
                <div className="space-y-1">
                  <label className={FORM_LABEL}>
                    {t("reports.widgets.builder.targetField")} {["count", "percentage"].includes(builderOperation) && t("reports.widgets.builder.deactivated")}
                  </label>
                  <FormSelect
                    disabled={["count", "percentage"].includes(builderOperation)}
                    value={builderTargetField}
                    onChange={setBuilderTargetField}
                    options={
                      METADATA_FIELDS[builderCollection].numericFields.length === 0
                        ? [{ value: "", label: t("reports.widgets.builder.noNumericFields") }]
                        : METADATA_FIELDS[builderCollection].numericFields.map((numericField) => ({
                            value: numericField.value,
                            label: getFieldLabel(numericField.value, numericField.label, t),
                          }))
                    }
                  />
                </div>

                {/* Filter fields options */}
                <div className="space-y-1">
                  <label className={FORM_LABEL}>{t("reports.widgets.builder.filterField")}</label>
                  <FormSelect
                    value={builderFilterField}
                    onChange={setBuilderFilterField}
                    options={[
                      { value: "", label: t("reports.widgets.builder.noFilter") },
                      ...METADATA_FIELDS[builderCollection].fields.map((metadataField) => ({
                        value: metadataField.value,
                        label: getFieldLabel(metadataField.value, metadataField.label, t),
                      })),
                    ]}
                  />
                </div>

                {/* Query filter condition inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className={FORM_LABEL}>{t("reports.widgets.builder.operator")}</label>
                    <FormSelect
                      disabled={!builderFilterField}
                      value={builderFilterOperator ?? ""}
                      onChange={(val) => setBuilderFilterOperator(val as CustomWidget["filterOperator"])}
                      options={[
                        { value: "equals", label: t("reports.widgets.builder.opEquals") },
                        { value: "contains", label: t("reports.widgets.builder.opContains") },
                        { value: "gt", label: `> ${t("reports.widgets.builder.opGt")}` },
                        { value: "lt", label: `< ${t("reports.widgets.builder.opLt")}` },
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={FORM_LABEL}>{t("reports.widgets.builder.matchValue")}</label>
                    <Input
                      type="text"
                      disabled={!builderFilterField}
                      value={builderFilterValue}
                      onChange={(event) => setBuilderFilterValue(event.target.value)}
                      placeholder={t("reports.widgets.builder.placeholderValue")}
                      className="bg-card/40 backdrop-blur-md font-semibold text-xs py-1.5 min-h-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {widgetType === "card" && (
                  <>
                    <div className="space-y-1">
                      <label className={`${FORM_LABEL} block`}>{t("reports.widgets.builder.subtextStyle")}</label>
                      <FormSelect
                        value={subTextType}
                        onChange={(val) => setSubTextType(val as "fixed" | "dynamic")}
                        options={[
                          { value: "dynamic", label: t("reports.widgets.builder.subtextDynamic") },
                          { value: "fixed", label: t("reports.widgets.builder.subtextFixed") },
                        ]}
                      />
                    </div>

                    {subTextType === "fixed" && (
                      <div className="space-y-1">
                        <label className={`${FORM_LABEL} block`}>{t("reports.widgets.builder.fixedSubtitle")}</label>
                        <Input
                          type="text"
                          value={fixedSubText}
                          onChange={(event) => setFixedSubText(event.target.value)}
                          placeholder={t("reports.widgets.builder.placeholderSubtitle")}
                          className="bg-card/40 backdrop-blur-md font-semibold text-xs py-1.5 min-h-0"
                        />
                      </div>
                    )}

                    <div className="space-y-1 col-span-1 sm:col-span-2 border-t border-border/40 pt-3">
                      <label className={`${FORM_LABEL} block`}>
                        {t("reports.widgets.builder.trendSource")}
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-card/20 border border-border/60 p-1 rounded-xl max-w-sm">
                        <button
                          type="button"
                          onClick={() => setTrendType("database")}
                          className={`py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                            trendType === "database"
                              ? "bg-primary text-primary-foreground shadow"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t("reports.widgets.builder.sourceDb")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrendType("manual")}
                          className={`py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                            trendType === "manual"
                              ? "bg-primary text-primary-foreground shadow"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t("reports.widgets.builder.sourceManual")}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-2">
                      {trendType === "database" ? (
                        <p className="text-[10px] text-muted-foreground italic leading-normal bg-primary/5 p-3 rounded-xl border border-primary/10">
                          ⚡ {t("reports.widgets.builder.dynamicModeDesc")}
                        </p>
                      ) : (
                        <>
                          <div className="flex justify-between items-center select-none">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.widgets.builder.manualTrend")}</label>
                            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                              trend > 0 ? "bg-success/20 text-success" : trend < 0 ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                            }`}>
                              {trend > 0 ? "+" : ""}{trend}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={trend}
                              onChange={(event) => setTrend(Number(event.target.value))}
                              className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <button
                              type="button"
                              onClick={() => setTrend(0)}
                              className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors cursor-pointer"
                              title={t("reports.widgets.builder.resetTrend")}
                            >
                              {t("reports.widgets.builder.reset")}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Switch options fields */}
                <div className="space-y-1">
                  <label className={FORM_LABEL}>{t("reports.widgets.builder.switchTarget")}</label>
                  <FormSelect
                    value={switchActionType}
                    onChange={(val) => setSwitchActionType(val as "app_setting" | "db_record")}
                    options={[
                      { value: "app_setting", label: t("reports.widgets.builder.switchTargetApp") },
                      { value: "db_record", label: t("reports.widgets.builder.switchTargetDb") },
                    ]}
                  />
                </div>

                {switchActionType === "app_setting" ? (
                  <div className="space-y-1">
                    <label className={FORM_LABEL}>{t("reports.widgets.builder.selectParameter")}</label>
                    <FormSelect
                      value={switchStateKey}
                      onChange={setSwitchStateKey}
                      options={[
                        { value: "section_enrollmentChart", label: t("reports.widgets.builder.paramEnrollmentChart") },
                        { value: "section_revenueChart", label: t("reports.widgets.builder.paramRevenueChart") },
                        { value: "section_attendanceChart", label: t("reports.widgets.builder.paramAttendanceChart") },
                        { value: "section_hasanatChart", label: t("reports.widgets.builder.paramHasanatChart") },
                        { value: "section_sessionsTable", label: t("reports.widgets.builder.paramSessionsTable") },
                        { value: "app_setting_attendance_lock", label: t("reports.widgets.builder.paramAttendanceLock") },
                        { value: "app_setting_mute_notifications", label: t("reports.widgets.builder.paramMuteNotifications") },
                      ]}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className={FORM_LABEL}>{t("reports.widgets.builder.recordCollection")}</label>
                      <FormSelect
                        value={switchCollection}
                        onChange={(val) => {
                          setSwitchCollection(val as CustomWidget["collection"]);
                          setSwitchRecordId("");
                        }}
                        options={COLLECTION_OPTIONS.map((collectionOption) => ({
                          value: collectionOption.value,
                          label: getCollectionLabel(collectionOption.value, collectionOption.label, t),
                        }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={FORM_LABEL}>{t("reports.widgets.builder.selectRecord")}</label>
                      <FormSelect
                        value={switchRecordId}
                        onChange={setSwitchRecordId}
                        options={
                          dbRecordsList.length === 0
                            ? [{ value: "", label: t("reports.widgets.builder.noRecordsLoaded") }]
                            : dbRecordsList.map((rec) => ({ value: rec.id, label: rec.label }))
                        }
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className={FORM_LABEL}>{t("reports.widgets.builder.labelOn")}</label>
                    <Input
                      type="text"
                      value={switchLabelOn}
                      onChange={(event) => setSwitchLabelOn(event.target.value)}
                      placeholder={t("reports.widgets.builder.placeholderActive")}
                      className="bg-card/40 backdrop-blur-md font-semibold text-xs py-1.5 min-h-0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={FORM_LABEL}>{t("reports.widgets.builder.labelOff")}</label>
                    <Input
                      type="text"
                      value={switchLabelOff}
                      onChange={(event) => setSwitchLabelOff(event.target.value)}
                      placeholder={t("reports.widgets.builder.placeholderInactive")}
                      className="bg-card/40 backdrop-blur-md font-semibold text-xs py-1.5 min-h-0"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Threshold alerts options for KPI/Progress */}
          {widgetType !== "switch" && !isListSummaryWidgetType(widgetType) && (
            <div className="p-4 rounded-2xl border border-border bg-card/20 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={thresholdEnabled}
                  onCheckedChange={(checked) => setThresholdEnabled(Boolean(checked))}
                />
                <span className="text-xs font-bold text-foreground">{t("reports.widgets.builder.enableThreshold")}</span>
              </label>

              {thresholdEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{t("reports.widgets.builder.triggerCondition")}</label>
                    <FormSelect
                      value={thresholdCondition}
                      onChange={(value) => setThresholdCondition(value as "lt" | "gt" | "equals")}
                      className="w-full text-xs"
                      options={[
                        { value: "lt", label: `< ${t("reports.widgets.builder.conditionLt")}` },
                        { value: "gt", label: `> ${t("reports.widgets.builder.conditionGt")}` },
                        { value: "equals", label: `= ${t("reports.widgets.builder.conditionEquals")}` }
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{t("reports.widgets.builder.thresholdValue")}</label>
                    <Input
                      type="number"
                      value={thresholdValue}
                      onChange={(event) => setThresholdValue(event.target.value)}
                      placeholder={t("reports.widgets.builder.placeholderThreshold")}
                      className="w-full text-xs rounded-lg bg-card/40 text-foreground min-h-0 py-1.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{t("reports.widgets.builder.alertColor")}</label>
                    <FormSelect
                      value={thresholdColor}
                      onChange={(value) => setThresholdColor(value as "red" | "amber" | "yellow")}
                      className="w-full text-xs"
                      options={[
                        { value: "red", label: t("reports.widgets.builder.colorRed") },
                        { value: "amber", label: t("reports.widgets.builder.colorAmber") },
                        { value: "yellow", label: t("reports.widgets.builder.colorYellow") }
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Palette selecting color */}
          <div className="space-y-1.5 text-left font-sans">
            <label className={`${FORM_LABEL} block`}>{t("reports.widgets.builder.defaultColor")}</label>
            <div className="flex flex-wrap gap-2">
              {([
                { id: "emerald", labelKey: "reports.widgets.builder.themeEmerald" },
                { id: "blue", labelKey: "reports.widgets.builder.themeBlue" },
                { id: "violet", labelKey: "reports.widgets.builder.themeViolet" },
                { id: "amber", labelKey: "reports.widgets.builder.themeAmber" },
                { id: "red", labelKey: "reports.widgets.builder.themeRed" },
              ] as const).map((colorOption) => {
                const isSelected = builderColor === colorOption.id;
                const cMap = resolveWidgetChartHex(colorOption.id, palette);
                return (
                  <button
                    key={colorOption.id}
                    type="button"
                    onClick={() => setBuilderColor(colorOption.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 scale-105"
                        : "border-border hover:border-muted-foreground/30 text-muted-foreground bg-card/25"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-black/5 flex-shrink-0" style={{ background: cMap }} />
                    {t(colorOption.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Searchable Icon Selection Grid */}
          {widgetType === "card" && (
            <div className="space-y-2 pt-3 border-t border-border/45 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {t("reports.widgets.builder.iconSelector")}
                </label>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" style={{ width: 14, height: 14 }} />
                  <Input
                    type="text"
                    placeholder={t("reports.widgets.builder.searchIcons")}
                    value={iconSearch}
                    onChange={(event) => setIconSearch(event.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-border bg-card/20 backdrop-blur-md text-foreground focus:ring-1 focus:ring-primary/20 transition-all font-semibold animate-fade-in min-h-0"
                  />
                </div>
              </div>
              {/* Icon Categories */}
              <div className="flex flex-wrap gap-1 mb-2 select-none">
                {(["all", "academic", "finance", "status", "general"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveIconTab(tab)}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                      activeIconTab === tab
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-card/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    {t(`reports.widgets.builder.cat${capitalize(tab)}` as AppTranslationKey) || tab}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 bg-card/20 border border-border/50 p-2.5 rounded-2xl max-h-[110px] overflow-y-auto pr-1">
                {(() => {
                  const ICON_CATEGORIES: Record<string, string[]> = {
                    academic: ["GraduationCap", "Users", "UserCheck", "Award", "ShieldCheck", "BookOpen"],
                    finance: ["DollarSign", "TrendingUp", "Receipt", "Target", "PieChart", "Activity", "Briefcase", "BarChart2"],
                    status: ["CalendarCheck", "AlertCircle", "Clock", "CheckCircle2", "Zap"],
                    general: ["Star", "Heart"]
                  };
                  const filteredIcons = Object.keys(ICONS_LIST).filter((name) => {
                    const matchesSearch = name.toLowerCase().includes(iconSearch.toLowerCase());
                    if (!matchesSearch) return false;
                    if (activeIconTab === "all") return true;
                    return ICON_CATEGORIES[activeIconTab]?.includes(name) || false;
                  });
                  if (filteredIcons.length === 0) {
                    return <p className="text-[10px] text-muted-foreground italic col-span-full py-2 text-center font-sans">{t("reports.widgets.builder.noIconsFound")}</p>;
                  }
                  return filteredIcons.map((iconName) => {
                    const Icon = ICONS_LIST[iconName];
                    const active = builderIcon === iconName;
                    if (!Icon) return null;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setBuilderIcon(iconName)}
                        className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer hover:scale-105 ${
                          active ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                        title={iconName}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          )}

        </div>

        {/* Scalability Testing Preview Column */}
        <div className="p-4 rounded-2xl border border-border bg-card/10 backdrop-blur-xl flex flex-col justify-between relative min-h-[350px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-left">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">{t("reports.widgets.builder.testerPreview")}</span>
              <span className="text-[9px] text-primary font-bold">{scalerSize}x{scalerSize}px</span>
            </div>

            {/* Size slider widget scalability demonstrator */}
            <div className="space-y-1 bg-card/30 p-2.5 rounded-xl border border-border/50">
              <label className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block">{t("reports.widgets.builder.dragToScale")}</label>
              <input
                type="range"
                min={100}
                max={250}
                value={scalerSize}
                onChange={(event) => setScalerSize(Number(event.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Centered sizing container */}
            <div className="flex items-center justify-center py-4 bg-muted/10 rounded-2xl border border-dashed border-border/60 min-h-[220px]">
              <div 
                className="overflow-hidden border border-border shadow-lg rounded-3xl transition-all duration-100 flex items-center justify-center bg-card/40 backdrop-blur-md animate-fade-in"
                style={{ width: scalerSize, height: scalerSize }}
              >
                <CustomWidgetRenderer
                  widget={previewWidget}
                  collections={collections}
                  isCompact={scalerSize < 140}
                  onSwitchToggle={handleToggleSwitchStateLocal}
                  onMetricClick={() => {}}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 py-2.5 rounded-xl border border-border bg-card/50 hover:bg-muted text-foreground font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer font-sans"
            >
              {t("reports.widgets.builder.cancel")}
            </button>
            <button
              type="button"
              disabled={!builderTitle}
              onClick={() => {
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
              }}
              className="flex-[2] py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[11px] uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/20 shadow-primary/10 cursor-pointer font-sans"
            >
              {editWidgetConfig ? t("reports.widgets.builder.updateWidget") : t("reports.widgets.builder.createWidget")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
